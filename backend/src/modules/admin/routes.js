/**
 * Admin Express Routes
 * Mount path: /api/v1/admin
 * All routes require authenticated user with Role.ADMIN.
 */
const { Router } = require('express');
const adminController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const {
  updateUserStatusSchema,
  reviewVerificationSchema,
  reviewReportSchema,
  listUsersQuerySchema,
  listVerificationsQuerySchema,
  listReportsQuerySchema,
  listAuditLogsQuerySchema,
} = require('./schema');

const router = Router();

// Protect all admin routes with authentication and ADMIN role requirement
router.use(authenticate, requireRole('ADMIN'));

// 1. Platform Metrics
router.get('/metrics', adminController.getMetrics);

// 2. User Management
router.get('/users', validate(listUsersQuerySchema, 'query'), adminController.getUsers);
router.patch(
  '/users/:id/status',
  validate(updateUserStatusSchema),
  adminController.updateUserStatus
);

// 3. Vendor Verification Queue
router.get(
  '/verifications',
  validate(listVerificationsQuerySchema, 'query'),
  adminController.getVerifications
);
router.patch(
  '/verifications/:id',
  validate(reviewVerificationSchema),
  adminController.reviewVerification
);

// 4. Reports & Dispute Moderation
router.get('/reports', validate(listReportsQuerySchema, 'query'), adminController.getReports);
router.patch(
  '/reports/:id',
  validate(reviewReportSchema),
  adminController.reviewReport
);

// 5. Admin Audit Logs
router.get(
  '/audit-logs',
  validate(listAuditLogsQuerySchema, 'query'),
  adminController.getAuditLogs
);

module.exports = router;
