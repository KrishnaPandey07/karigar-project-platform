/**
 * Notifications HTTP Controller
 * Reference: Blueprint Section 13 Response Envelopes
 */
const notificationService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

async function getNotifications(req, res, next) {
  try {
    const result = await notificationService.getUserNotifications({
      userId: req.user.id,
      query: req.query,
    });
    return sendSuccess(
      res,
      { notifications: result.notifications, unreadCount: result.unreadCount },
      'Notifications retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead({
      notificationId: req.params.id,
      userId: req.user.id,
    });
    return sendSuccess(res, { notification }, 'Notification marked as read.', 200);
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const result = await notificationService.markAllAsRead({
      userId: req.user.id,
    });
    return sendSuccess(res, result, 'All notifications marked as read.', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
