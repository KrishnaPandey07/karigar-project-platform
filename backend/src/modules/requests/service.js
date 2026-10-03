/**
 * Service Requests Business Logic & Concurrency State Machine
 * Reference: Blueprint Sections 6, 10, 12, and 13
 */
const prisma = require('../../utils/prisma');
const {
  REQUEST_STATUS,
  isTerminalStatus,
  isValidTransition,
  isRoleAllowedForTransition,
  doesTransitionRequireReason,
  getAvailableTransitions,
} = require('./transitions');
const { notify } = require('../notifications/service');

/**
 * Creates a new service request from a customer to an active, available vendor.
 */
async function createRequest({ userId, data }) {
  // 1. Verify customer profile
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    const err = new Error('Only registered customers can create service requests.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const vendorServiceId = data.vendor_service_id || data.vendorServiceId;

  // 2. Verify vendor service
  const vendorService = await prisma.vendorService.findUnique({
    where: { id: vendorServiceId },
    include: {
      vendor: true,
      service: true,
    },
  });

  if (!vendorService) {
    const err = new Error('Specified vendor service was not found.');
    err.statusCode = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const vendor = vendorService.vendor;

  // 3. Verify vendor status (available and not suspended)
  if (vendor.isSuspended) {
    const err = new Error('This vendor is currently suspended and cannot accept requests.');
    err.statusCode = 400;
    err.code = 'VENDOR_UNAVAILABLE';
    throw err;
  }

  if (!vendor.isAvailable) {
    const err = new Error('This vendor is currently offline or unavailable for new bookings.');
    err.statusCode = 400;
    err.code = 'VENDOR_UNAVAILABLE';
    throw err;
  }

  // 4. Duplicate open request check (Requested, Accepted, In Progress, Submitted)
  const existingOpenRequest = await prisma.serviceRequest.findFirst({
    where: {
      customerId: customerProfile.id,
      vendorId: vendor.id,
      serviceId: vendorService.serviceId,
      status: {
        in: [
          REQUEST_STATUS.REQUESTED,
          REQUEST_STATUS.ACCEPTED,
          REQUEST_STATUS.IN_PROGRESS,
          'SUBMITTED', // Backward compatibility with seed data
        ],
      },
    },
  });

  if (existingOpenRequest) {
    const err = new Error('You already have an active service request with this vendor for this service.');
    err.statusCode = 409;
    err.code = 'DUPLICATE_REQUEST';
    err.details = [{ existingRequestId: existingOpenRequest.id }];
    throw err;
  }

  // 5. Compute expiration (24h standard, 12h urgent)
  const isUrgent = Boolean(data.is_urgent || data.isUrgent);
  const expiryHours = isUrgent ? 12 : 24;
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  // 6. Execute in single transaction: insert request + first status history row
  const newRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.serviceRequest.create({
      data: {
        customerId: customerProfile.id,
        vendorId: vendor.id,
        serviceId: vendorService.serviceId,
        vendorServiceId: vendorService.id,
        status: REQUEST_STATUS.REQUESTED,
        description: data.description.trim(),
        address: data.address.trim(),
        lat: data.lat !== undefined && data.lat !== null ? Number(data.lat) : null,
        lng: data.lng !== undefined && data.lng !== null ? Number(data.lng) : null,
        preferredDate: data.preferred_date || data.preferredDate || null,
        preferredTimeSlot: data.preferred_time_slot || data.preferredTimeSlot || null,
        isUrgent,
        expiresAt,
      },
      include: {
        service: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            avatarUrl: true,
            userId: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            userId: true,
          },
        },
      },
    });

    await tx.requestStatusHistory.create({
      data: {
        requestId: created.id,
        fromStatus: null,
        toStatus: REQUEST_STATUS.REQUESTED,
        changedByUserId: userId,
        note: 'Service request created by customer',
      },
    });

    return created;
  });

  // 7. Non-blocking vendor notification
  await notify(vendor.userId, 'REQUEST_CREATED', {
    requestId: newRequest.id,
    customerName: customerProfile.fullName,
    serviceName: vendorService.service.name,
    isUrgent,
  });

  return newRequest;
}

/**
 * Lists user's own requests (filtered by customer or vendor profile).
 */
async function listRequests({ userId, role, query = {} }) {
  const where = {};

  if (role === 'CUSTOMER') {
    const customer = await prisma.customerProfile.findUnique({ where: { userId } });
    if (!customer) return { requests: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    where.customerId = customer.id;
  } else if (role === 'VENDOR') {
    const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) return { requests: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } };
    where.vendorId = vendor.id;
  }

  // Status / tab filtering
  if (query.tab) {
    switch (query.tab) {
      case 'active':
        where.status = { in: [REQUEST_STATUS.REQUESTED, REQUEST_STATUS.ACCEPTED, REQUEST_STATUS.IN_PROGRESS, 'SUBMITTED'] };
        break;
      case 'completed':
        where.status = { in: [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.REVIEWED] };
        break;
      case 'closed':
        where.status = { in: [REQUEST_STATUS.CANCELLED, REQUEST_STATUS.REJECTED] };
        break;
      case 'new':
        where.status = REQUEST_STATUS.REQUESTED;
        break;
      case 'in_progress':
        where.status = REQUEST_STATUS.IN_PROGRESS;
        break;
      default:
        break;
    }
  } else if (query.status) {
    where.status = query.status;
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [total, requests] = await Promise.all([
    prisma.serviceRequest.count({ where }),
    prisma.serviceRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            avatarUrl: true,
            address: true,
            isVerified: true,
          },
        },
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  return {
    requests,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Retrieves a single request with timeline, comments, and parties details.
 */
async function getRequestById({ requestId, userId, role }) {
  const req = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      service: true,
      vendorService: true,
      vendor: {
        include: {
          user: { select: { email: true, phone: true } },
        },
      },
      customer: {
        include: {
          user: { select: { email: true, phone: true } },
        },
      },
      statusHistory: {
        orderBy: { createdAt: 'asc' },
        include: {
          changedByUser: {
            select: { id: true, email: true, role: true },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              role: true,
              customerProfile: { select: { fullName: true } },
              vendorProfile: { select: { businessName: true } },
            },
          },
        },
      },
      review: true,
    },
  });

  if (!req) {
    const err = new Error('Service request not found.');
    err.statusCode = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  // Party authorization check: user must be customer, vendor, or admin
  const isCustomerParty = req.customer?.userId === userId;
  const isVendorParty = req.vendor?.userId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isCustomerParty && !isVendorParty && !isAdmin) {
    const err = new Error('You do not have permission to view this service request.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const effectiveRole = isCustomerParty ? 'CUSTOMER' : isVendorParty ? 'VENDOR' : 'ADMIN';
  const availableTransitions = getAvailableTransitions(req.status, effectiveRole);

  return {
    ...req,
    availableTransitions,
  };
}

/**
 * Executes a state machine transition with optimistic locking and concurrency safety.
 */
async function updateRequestStatus({ requestId, userId, role, data }) {
  const existingRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      customer: { select: { userId: true, fullName: true } },
      vendor: { select: { id: true, userId: true, businessName: true } },
    },
  });

  if (!existingRequest) {
    const err = new Error('Service request not found.');
    err.statusCode = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const isCustomerParty = existingRequest.customer?.userId === userId;
  const isVendorParty = existingRequest.vendor?.userId === userId;

  if (!isCustomerParty && !isVendorParty && role !== 'ADMIN') {
    const err = new Error('You do not have permission to modify this service request.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Determine effective party role on this specific request
  const effectiveRole = isCustomerParty ? 'CUSTOMER' : isVendorParty ? 'VENDOR' : role;

  const fromStatus = existingRequest.status;
  const toStatus = data.to;

  // 1. Transition valid in state machine
  if (!isValidTransition(fromStatus, toStatus)) {
    const err = new Error(`Cannot transition service request from '${fromStatus}' to '${toStatus}'.`);
    err.statusCode = 409;
    err.code = 'INVALID_TRANSITION';
    throw err;
  }

  // 2. Role allowed for transition
  if (!isRoleAllowedForTransition(fromStatus, toStatus, effectiveRole) && role !== 'ADMIN') {
    const err = new Error(`Role '${effectiveRole}' is not authorized to transition request from '${fromStatus}' to '${toStatus}'.`);
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // 3. Reason requirement check
  const reason = data.reason ? data.reason.trim() : '';
  if (doesTransitionRequireReason(fromStatus, toStatus) && !reason) {
    const err = new Error(`A non-empty reason is strictly required when transitioning to '${toStatus}'.`);
    err.statusCode = 422;
    err.code = 'VALIDATION_ERROR';
    err.details = [{ field: 'reason', message: 'Reason is required' }];
    throw err;
  }

  // Prepare updated fields
  const updateData = {
    status: toStatus,
  };

  const now = new Date();

  if (toStatus === REQUEST_STATUS.ACCEPTED) {
    updateData.respondedAt = now;
    if (data.agreed_price !== undefined || data.agreedPrice !== undefined) {
      updateData.agreedPrice = data.agreed_price || data.agreedPrice;
    }
  } else if (toStatus === REQUEST_STATUS.REJECTED) {
    updateData.respondedAt = now;
    updateData.rejectionReason = reason;
  } else if (toStatus === REQUEST_STATUS.CANCELLED) {
    updateData.cancelledAt = now;
    updateData.cancelledBy = effectiveRole;
    updateData.cancellationReason = reason || null;
  } else if (toStatus === REQUEST_STATUS.COMPLETED) {
    updateData.completedAt = now;
    if (data.agreed_price !== undefined || data.agreedPrice !== undefined) {
      updateData.agreedPrice = data.agreed_price || data.agreedPrice;
    }
  }

  // 4. Execute atomic transaction with Optimistic Locking
  const updated = await prisma.$transaction(async (tx) => {
    // Condition: status must match expected fromStatus
    const updateResult = await tx.serviceRequest.updateMany({
      where: {
        id: requestId,
        status: fromStatus, // Optimistic condition
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      // Race condition occurred: another concurrent request changed the status
      const conflictErr = new Error('This request was already updated. Please refresh.');
      conflictErr.statusCode = 409;
      conflictErr.code = 'INVALID_TRANSITION';
      throw conflictErr;
    }

    // Write audit status history
    await tx.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus,
        toStatus,
        changedByUserId: userId,
        reason: reason || null,
        note: `Transitioned to ${toStatus} by ${effectiveRole}`,
      },
    });

    // Recompute vendor stats if vendor responded (ACCEPTED or REJECTED from REQUESTED)
    if (effectiveRole === 'VENDOR' && fromStatus === REQUEST_STATUS.REQUESTED) {
      await recomputeVendorResponseRate(tx, existingRequest.vendorId);
    }

    // Track repeated cancellations after acceptance as vendor penalty
    if (effectiveRole === 'VENDOR' && fromStatus === REQUEST_STATUS.ACCEPTED && toStatus === REQUEST_STATUS.CANCELLED) {
      await tx.vendorProfile.update({
        where: { id: existingRequest.vendorId },
        data: { cancellationCount: { increment: 1 } },
      });
    }

    return tx.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        service: true,
        vendor: { select: { id: true, businessName: true, phone: true } },
        customer: { select: { id: true, fullName: true, phone: true } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });
  });

  // 5. Fire notifications (non-blocking)
  if (toStatus === REQUEST_STATUS.ACCEPTED) {
    await notify(existingRequest.customer.userId, 'REQUEST_ACCEPTED', {
      requestId,
      vendorName: existingRequest.vendor?.businessName,
    });
  } else if (toStatus === REQUEST_STATUS.REJECTED) {
    await notify(existingRequest.customer.userId, 'REQUEST_REJECTED', {
      requestId,
      vendorName: existingRequest.vendor?.businessName,
      reason,
    });
  } else if (toStatus === REQUEST_STATUS.CANCELLED) {
    const recipientUserId = isCustomerParty ? existingRequest.vendor?.userId : existingRequest.customer.userId;
    await notify(recipientUserId, 'REQUEST_CANCELLED', {
      requestId,
      cancelledBy: effectiveRole,
      reason,
    });
  } else if (toStatus === REQUEST_STATUS.IN_PROGRESS) {
    await notify(existingRequest.customer.userId, 'REQUEST_IN_PROGRESS', {
      requestId,
      vendorName: existingRequest.vendor?.businessName,
    });
  } else if (toStatus === REQUEST_STATUS.COMPLETED) {
    await notify(existingRequest.customer.userId, 'REQUEST_COMPLETED', {
      requestId,
      vendorName: existingRequest.vendor?.businessName,
    });
  }

  return updated;
}

/**
 * Recomputes a vendor's historical response rate within 24h.
 */
async function recomputeVendorResponseRate(tx, vendorId) {
  if (!vendorId) return;

  const allRequests = await tx.serviceRequest.findMany({
    where: { vendorId },
    select: { createdAt: true, respondedAt: true, status: true },
  });

  if (!allRequests || allRequests.length === 0) return;

  let answeredWithin24h = 0;
  for (const r of allRequests) {
    if (r.respondedAt) {
      const diffHours = (new Date(r.respondedAt) - new Date(r.createdAt)) / (1000 * 60 * 60);
      if (diffHours <= 24) {
        answeredWithin24h++;
      }
    }
  }

  const rate = Math.round((answeredWithin24h / allRequests.length) * 100) / 100;
  await tx.vendorProfile.update({
    where: { id: vendorId },
    data: { responseRate: rate },
  });
}

/**
 * Retrieves comments thread for a request.
 */
async function getComments({ requestId, userId, role }) {
  const req = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      customer: { select: { userId: true } },
      vendor: { select: { userId: true } },
    },
  });

  if (!req) {
    const err = new Error('Service request not found.');
    err.statusCode = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const isCustomerParty = req.customer?.userId === userId;
  const isVendorParty = req.vendor?.userId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isCustomerParty && !isVendorParty && !isAdmin) {
    const err = new Error('You do not have permission to view comments for this request.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const comments = await prisma.requestComment.findMany({
    where: { requestId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          customerProfile: { select: { fullName: true } },
          vendorProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return comments;
}

/**
 * Adds a new comment to a request message thread.
 */
async function addComment({ requestId, userId, role, message }) {
  const req = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      customer: { select: { userId: true } },
      vendor: { select: { userId: true } },
    },
  });

  if (!req) {
    const err = new Error('Service request not found.');
    err.statusCode = 404;
    err.code = 'RESOURCE_NOT_FOUND';
    throw err;
  }

  const isCustomerParty = req.customer?.userId === userId;
  const isVendorParty = req.vendor?.userId === userId;
  const isAdmin = role === 'ADMIN';

  if (!isCustomerParty && !isVendorParty && !isAdmin) {
    const err = new Error('You do not have permission to post comments on this request.');
    err.statusCode = 403;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // Comments are disabled once the request is closed or completed
  if (isTerminalStatus(req.status) || req.status === REQUEST_STATUS.COMPLETED) {
    const err = new Error('Comments are disabled for completed or closed service requests.');
    err.statusCode = 400;
    err.code = 'REQUEST_CLOSED';
    throw err;
  }

  // Basic sanitization
  const cleanMessage = message.trim();

  const comment = await prisma.requestComment.create({
    data: {
      requestId,
      userId,
      message: cleanMessage,
    },
    include: {
      user: {
        select: {
          id: true,
          role: true,
          customerProfile: { select: { fullName: true } },
          vendorProfile: { select: { businessName: true } },
        },
      },
    },
  });

  return comment;
}

module.exports = {
  createRequest,
  listRequests,
  getRequestById,
  updateRequestStatus,
  getComments,
  addComment,
};
