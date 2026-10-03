/**
 * Notifications Express Routes
 * Mount path: /api/v1/notifications
 */
const { Router } = require('express');
const notificationController = require('./controller');
const { authenticate } = require('../../middleware/auth');

const router = Router();

router.use(authenticate);

// Get user notifications + unreadCount
router.get('/', notificationController.getNotifications);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Mark single as read
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
