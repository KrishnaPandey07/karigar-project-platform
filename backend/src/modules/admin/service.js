/**
 * Admin Service Layer
 * Platform operations, metrics, verifications, moderation, and user management.
 * Reference: Blueprint Sections 7, 11, 13, 16
 */
const prisma = require('../../utils/prisma');
const {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} = require('../../utils/errors');
const { notify } = require('../notifications/service');

/**
 * Computes platform-wide aggregated metrics.
 */
async function getPlatformMetrics() {
  const [
    totalUsers,
    customerCount,
    vendorCount,
    adminCount,
    suspendedUsersCount,
    totalRequests,
    requestsByStatus,
    totalReviews,
    avgRatingAggregate,
    pendingVerifications,
    pendingReports,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count({ where: { status: { not: 'DELETED' } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', status: { not: 'DELETED' } } }),
    prisma.user.count({ where: { role: 'VENDOR', status: { not: 'DELETED' } } }),
    prisma.user.count({ where: { role: 'ADMIN', status: { not: 'DELETED' } } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
    prisma.serviceRequest.count(),
    prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    prisma.review.count(),
    prisma.review.aggregate({
      _avg: { rating: true },
    }),
    prisma.vendorVerification.count({ where: { status: 'PENDING' } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
    prisma.adminAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const requestStatusMap = {};
  requestsByStatus.forEach((item) => {
    requestStatusMap[item.status] = item._count.id;
  });

  return {
    users: {
      total: totalUsers,
      customers: customerCount,
      vendors: vendorCount,
      admins: adminCount,
      suspended: suspendedUsersCount,
    },
    requests: {
      total: totalRequests,
      byStatus: requestStatusMap,
    },
    reviews: {
      total: totalReviews,
      avgRating: avgRatingAggregate._avg.rating
        ? Math.round(avgRatingAggregate._avg.rating * 10) / 10
        : 0.0,
    },
    queues: {
      pendingVerifications,
      pendingReports,
    },
    recentAuditLogs,
  };
}

/**
 * Lists users with optional filters and pagination.
 */
async function listUsers({ q, role, status, page = 1, limit = 20 }) {
  const where = {};

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (status && status !== 'ALL') {
    where.status = status;
  } else {
    where.status = { not: 'DELETED' };
  }

  if (q && q.trim()) {
    const query = q.trim();
    where.OR = [
      { email: { contains: query, mode: 'insensitive' } },
      { customerProfile: { fullName: { contains: query, mode: 'insensitive' } } },
      { vendorProfile: { businessName: { contains: query, mode: 'insensitive' } } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        customerProfile: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        vendorProfile: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            isVerified: true,
            isSuspended: true,
            ratingAvg: true,
            reviewCount: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Updates a user's status (ACTIVE or SUSPENDED).
 * Safeguards: cannot suspend self; cannot suspend the last active admin.
 */
async function updateUserStatus({ adminId, targetUserId, status, reason, ipAddress }) {
  if (adminId === targetUserId) {
    throw new BadRequestError('Administrators cannot alter their own account status.');
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      vendorProfile: true,
    },
  });

  if (!targetUser) {
    throw new NotFoundError('Target user not found.');
  }

  // Prevent suspending the last remaining active admin
  if (targetUser.role === 'ADMIN' && status === 'SUSPENDED') {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: 'ADMIN',
        status: 'ACTIVE',
        isActive: true,
        id: { not: targetUserId },
      },
    });

    if (activeAdminCount === 0) {
      throw new ConflictError('Cannot suspend the only remaining active administrator on the platform.');
    }
  }

  const isSuspended = status === 'SUSPENDED';

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: targetUserId },
      data: {
        status,
        isActive: !isSuspended,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isActive: true,
      },
    });

    // If target user is a vendor, synchronize vendorProfile.isSuspended
    if (targetUser.vendorProfile) {
      await tx.vendorProfile.update({
        where: { id: targetUser.vendorProfile.id },
        data: {
          isSuspended,
        },
      });
    }

    // Write audit log
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: isSuspended ? 'USER_SUSPEND' : 'USER_UNSUSPEND',
        targetType: 'USER',
        targetId: targetUserId,
        details: {
          reason: reason || null,
          previousStatus: targetUser.status,
          newStatus: status,
        },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  // Non-blocking notification dispatch
  if (isSuspended) {
    await notify(targetUserId, 'ACCOUNT_SUSPENDED', { reason });
  } else {
    await notify(targetUserId, 'ACCOUNT_REACTIVATED', {});
  }

  return updatedUser;
}

/**
 * Lists vendor verification submissions.
 */
async function listVerifications({ status, page = 1, limit = 20 }) {
  const where = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [total, verifications] = await Promise.all([
    prisma.vendorVerification.count({ where }),
    prisma.vendorVerification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            address: true,
            isVerified: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            vendorServices: {
              select: {
                service: { select: { name: true } },
              },
            },
          },
        },
        documents: true,
        reviewedByUser: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    verifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Reviews a vendor verification (APPROVE or REJECT).
 */
async function reviewVerification({
  adminId,
  verificationId,
  action,
  rejectionReason,
  ipAddress,
}) {
  const verification = await prisma.vendorVerification.findUnique({
    where: { id: verificationId },
    include: {
      vendor: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!verification) {
    throw new NotFoundError('Verification request not found.');
  }

  const isApproval = action === 'APPROVE';

  const updatedVerification = await prisma.$transaction(async (tx) => {
    const updated = await tx.vendorVerification.update({
      where: { id: verificationId },
      data: {
        status: isApproval ? 'APPROVED' : 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: isApproval ? null : rejectionReason,
      },
      include: {
        documents: true,
      },
    });

    // Update vendor profile badge
    await tx.vendorProfile.update({
      where: { id: verification.vendorId },
      data: {
        isVerified: isApproval,
      },
    });

    // Update owner user badge
    if (verification.vendor?.userId) {
      await tx.user.update({
        where: { id: verification.vendor.userId },
        data: {
          isVerified: isApproval,
        },
      });
    }

    // Write audit log
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: isApproval ? 'VENDOR_VERIFY_APPROVE' : 'VENDOR_VERIFY_REJECT',
        targetType: 'VENDOR',
        targetId: verification.vendorId,
        details: {
          verificationId,
          action,
          rejectionReason: isApproval ? null : rejectionReason,
        },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  // Non-blocking notification dispatch
  if (verification.vendor?.userId) {
    if (isApproval) {
      await notify(verification.vendor.userId, 'VERIFICATION_APPROVED', {});
    } else {
      await notify(verification.vendor.userId, 'VERIFICATION_REJECTED', {
        reason: rejectionReason,
      });
    }
  }

  return updatedVerification;
}

/**
 * Lists user reports and moderation cases.
 */
async function listReports({ status, page = 1, limit = 20 }) {
  const where = {};
  if (status && status !== 'ALL') {
    where.status = status;
  }

  const skip = (page - 1) * limit;

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            role: true,
            customerProfile: { select: { fullName: true } },
            vendorProfile: { select: { businessName: true } },
          },
        },
        reportedUser: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            customerProfile: { select: { fullName: true } },
            vendorProfile: { select: { businessName: true, isSuspended: true } },
          },
        },
        request: {
          select: {
            id: true,
            status: true,
            service: { select: { name: true } },
            agreedPrice: true,
          },
        },
        resolver: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    reports,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Reviews a report (RESOLVED or DISMISSED) with optional admin action notes.
 */
async function reviewReport({
  adminId,
  reportId,
  status,
  resolutionNotes,
  actionTaken,
  ipAddress,
}) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new NotFoundError('Report not found.');
  }

  const updatedReport = await prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where: { id: reportId },
      data: {
        status,
        resolvedBy: adminId,
        resolutionNotes: resolutionNotes || null,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: status === 'RESOLVED' ? 'REPORT_RESOLVE' : 'REPORT_DISMISS',
        targetType: 'REPORT',
        targetId: reportId,
        details: {
          status,
          resolutionNotes: resolutionNotes || null,
          actionTaken: actionTaken || null,
        },
        ipAddress: ipAddress || null,
      },
    });

    return updated;
  });

  return updatedReport;
}

/**
 * Lists administrative audit logs.
 */
async function listAuditLogs({ page = 1, limit = 20, action }) {
  const where = {};
  if (action) {
    where.action = action;
  }

  const skip = (page - 1) * limit;

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    logs,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

module.exports = {
  getPlatformMetrics,
  listUsers,
  updateUserStatus,
  listVerifications,
  reviewVerification,
  listReports,
  reviewReport,
  listAuditLogs,
};
