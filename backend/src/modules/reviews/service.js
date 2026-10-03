/**
 * Reviews Business Logic & Aggregations
 * Reference: Blueprint Sections 7, 10, 11, 13
 */
const prisma = require('../../utils/prisma');
const { REQUEST_STATUS } = require('../requests/transitions');
const { notify } = require('../notifications/service');
const {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../utils/errors');

/**
 * Creates a new review for a completed service request.
 * Automatically transitions the request from COMPLETED to REVIEWED and updates vendor rating stats.
 */
async function createReview({ userId, data }) {
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customerProfile) {
    throw new ForbiddenError('Only registered customers can leave reviews.');
  }

  const requestId = data.request_id || data.requestId;

  // 1. Fetch request with vendor and existing review
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      customer: true,
      vendor: true,
      review: true,
    },
  });

  if (!serviceRequest) {
    throw new NotFoundError('Service request not found.');
  }

  // 2. Ownership check: Must be the customer who placed the request
  if (serviceRequest.customerId !== customerProfile.id) {
    throw new ForbiddenError('You can only review service requests that you requested.');
  }

  // 3. Status rule: Reviews only allowed on COMPLETED requests
  if (serviceRequest.status !== REQUEST_STATUS.COMPLETED) {
    throw new BadRequestError(
      `Reviews are only allowed on completed service requests. Current status: ${serviceRequest.status}`,
      [{ field: 'status', message: 'Request must be COMPLETED to review' }]
    );
  }

  // 4. Unique check: UNIQUE(request_id)
  if (serviceRequest.review) {
    throw new ConflictError('A review has already been submitted for this service request.');
  }

  const rating = Number(data.rating);
  const comment = data.comment ? data.comment.trim() : null;

  // 5. Execute in single atomic transaction
  const createdReview = await prisma.$transaction(async (tx) => {
    // 5a. Create review record
    const rev = await tx.review.create({
      data: {
        requestId,
        customerId: customerProfile.id,
        vendorId: serviceRequest.vendorId,
        rating,
        comment,
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    // 5b. Transition request COMPLETED -> REVIEWED
    await tx.serviceRequest.update({
      where: { id: requestId },
      data: { status: REQUEST_STATUS.REVIEWED },
    });

    // 5c. Audit status history
    await tx.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: REQUEST_STATUS.COMPLETED,
        toStatus: REQUEST_STATUS.REVIEWED,
        changedByUserId: userId,
        note: `Customer submitted a ${rating}-star review`,
      },
    });

    // 5d. Recalculate vendor rating aggregations
    if (serviceRequest.vendorId) {
      await recomputeVendorRatings(tx, serviceRequest.vendorId);
    }

    return rev;
  });

  // 6. Non-blocking vendor notification
  if (serviceRequest.vendor?.userId) {
    await notify(serviceRequest.vendor.userId, 'NEW_REVIEW', {
      requestId,
      rating,
      customerName: customerProfile.fullName,
      comment: comment ? (comment.length > 80 ? comment.substring(0, 80) + '...' : comment) : null,
    });
  }

  return createdReview;
}

/**
 * Recalculates avgRating and reviewCount on a vendor's profile.
 */
async function recomputeVendorRatings(tx, vendorId) {
  const allReviews = await tx.review.findMany({
    where: { vendorId },
    select: { rating: true },
  });

  const reviewCount = allReviews.length;
  let avgRating = 0.0;

  if (reviewCount > 0) {
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    avgRating = Math.round((sum / reviewCount) * 10) / 10;
  }

  await tx.vendorProfile.update({
    where: { id: vendorId },
    data: {
      avgRating,
      reviewCount,
    },
  });
}

/**
 * Lists public reviews for a specific vendor with sorting and pagination.
 */
async function getVendorReviews({ vendorId, query = {} }) {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: vendorId },
    select: { id: true, businessName: true, avgRating: true, reviewCount: true },
  });

  if (!vendor) {
    throw new NotFoundError('Vendor not found.');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: 'desc' };
  if (query.sort === 'highest') {
    orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
  } else if (query.sort === 'lowest') {
    orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
  }

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { vendorId } }),
    prisma.review.findMany({
      where: { vendorId },
      skip,
      take: limit,
      orderBy,
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        request: {
          select: {
            id: true,
            service: { select: { name: true } },
            completedAt: true,
          },
        },
      },
    }),
  ]);

  return {
    vendor,
    reviews,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Adds a vendor response to a review (one-time reply rule).
 */
async function addVendorReply({ reviewId, userId, reply }) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      vendor: {
        select: {
          id: true,
          userId: true,
          businessName: true,
        },
      },
      customer: {
        select: {
          id: true,
          userId: true,
        },
      },
    },
  });

  if (!review) {
    throw new NotFoundError('Review not found.');
  }

  // Ownership check: must be the reviewed vendor
  if (review.vendor.userId !== userId) {
    throw new ForbiddenError('You can only reply to reviews on your own vendor profile.');
  }

  // One-time reply rule
  if (review.vendorReply) {
    throw new BadRequestError('You have already replied to this review. Replies cannot be modified.');
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      vendorReply: reply.trim(),
      vendorRepliedAt: new Date(),
    },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  // Notify customer
  if (review.customer?.userId) {
    await notify(review.customer.userId, 'REVIEW_REPLIED', {
      reviewId,
      vendorName: review.vendor.businessName,
      reply: reply.trim(),
    });
  }

  return updatedReview;
}

/**
 * Returns pending reviews for the current customer (completed requests not yet reviewed).
 */
async function getPendingReviews({ userId }) {
  const customer = await prisma.customerProfile.findUnique({
    where: { userId },
  });

  if (!customer) return [];

  const completedRequests = await prisma.serviceRequest.findMany({
    where: {
      customerId: customer.id,
      status: REQUEST_STATUS.COMPLETED,
      review: null,
    },
    orderBy: { completedAt: 'desc' },
    include: {
      service: { select: { id: true, name: true } },
      vendor: {
        select: {
          id: true,
          businessName: true,
          avatarUrl: true,
        },
      },
    },
    take: 10,
  });

  return completedRequests;
}

module.exports = {
  createReview,
  getVendorReviews,
  addVendorReply,
  getPendingReviews,
};
