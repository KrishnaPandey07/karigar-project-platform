/**
 * Notification Service
 * Reference: Blueprint Sections 12, 13
 */
const prisma = require('../../utils/prisma');
const { NotFoundError, ForbiddenError } = require('../../utils/errors');

const NOTIFICATION_TEMPLATES = {
  REQUEST_CREATED: {
    title: 'New Service Request',
    body: (p) => `You received a new service request from ${p.customerName || 'a customer'} for ${p.serviceName || 'service'}.`,
  },
  REQUEST_ACCEPTED: {
    title: 'Request Accepted',
    body: (p) => `${p.vendorName || 'The vendor'} accepted your service request!`,
  },
  REQUEST_REJECTED: {
    title: 'Request Declined',
    body: (p) => `${p.vendorName || 'The vendor'} was unable to accept your request: ${p.reason || 'No reason provided'}.`,
  },
  REQUEST_CANCELLED: {
    title: 'Request Cancelled',
    body: (p) => `Service request #${p.requestId?.substring(0, 8)} was cancelled by ${p.cancelledBy || 'party'}. Reason: ${p.reason || 'None provided'}.`,
  },
  REQUEST_IN_PROGRESS: {
    title: 'Work Started',
    body: (p) => `${p.vendorName || 'The vendor'} has started work on your service request.`,
  },
  REQUEST_COMPLETED: {
    title: 'Service Completed',
    body: (p) => `${p.vendorName || 'The vendor'} marked your service request as completed. Please leave a review!`,
  },
  REQUEST_EXPIRED: {
    title: 'Request Expired',
    body: (p) => `Your service request to ${p.vendorName || 'the vendor'} received no response and was automatically closed.`,
  },
  NEW_REVIEW: {
    title: 'New Review Received',
    body: (p) => `${p.customerName || 'A customer'} left a ${p.rating}-star review for request #${p.requestId?.substring(0, 8)}.`,
  },
  REVIEW_REPLIED: {
    title: 'Vendor Replied to Your Review',
    body: (p) => `${p.vendorName || 'The vendor'} replied to your review: "${p.reply ? (p.reply.length > 50 ? p.reply.substring(0, 50) + '...' : p.reply) : ''}"`,
  },
  VERIFICATION_APPROVED: {
    title: 'Profile Verification Approved',
    body: () => 'Congratulations! Your business verification documents have been approved. You now hold a verified vendor badge.',
  },
  VERIFICATION_REJECTED: {
    title: 'Verification Request Update',
    body: (p) => `Your verification request could not be approved at this time: ${p.reason || 'Please submit updated documents.'}`,
  },
  ACCOUNT_SUSPENDED: {
    title: 'Account Status Notice',
    body: (p) => `Your account has been suspended by administration. Reason: ${p.reason || 'Terms of service violation.'}`,
  },
  ACCOUNT_REACTIVATED: {
    title: 'Account Reactivated',
    body: () => 'Your account has been reactivated. You may resume accessing LocalLink services.',
  },
};

/**
 * Dispatches a notification to a specific user.
 */
async function notify(userId, type, payload = {}) {
  if (!userId) return null;

  try {
    const template = NOTIFICATION_TEMPLATES[type];
    const title = template ? template.title : type;
    const body = template ? template.body(payload) : (payload.message || 'You have a new update.');

    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        metadata: payload,
      },
    });
  } catch (err) {
    console.error(`[Notification Service] Failed to deliver notification (${type}) to ${userId}:`, err.message);
    return null;
  }
}

/**
 * Fetches user notifications with pagination and unreadCount.
 */
async function getUserNotifications({ userId, query = {} }) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const where = { userId };
  if (query.unread_only === 'true' || query.unreadOnly === 'true') {
    where.isRead = false;
  }

  const [total, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    notifications,
    unreadCount,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Marks a single notification as read.
 */
async function markAsRead({ notificationId, userId }) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new NotFoundError('Notification not found.');
  }

  if (notification.userId !== userId) {
    throw new ForbiddenError('You can only modify your own notifications.');
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  return updated;
}

/**
 * Marks all notifications for a user as read.
 */
async function markAllAsRead({ userId }) {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  return { updatedCount: result.count };
}

module.exports = {
  notify,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
