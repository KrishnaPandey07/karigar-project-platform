/**
 * Service Requests Express Routes
 * Mount path: /api/v1/requests
 */
const { Router } = require('express');
const requestController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const {
  createRequestSchema,
  updateStatusSchema,
  addCommentSchema,
  listRequestsQuerySchema,
} = require('./schema');

const router = Router();

// All request endpoints require authenticated session
router.use(authenticate);

// 1. Create request (Customer only)
router.post(
  '/',
  requireRole('CUSTOMER'),
  validate(createRequestSchema),
  requestController.createRequest
);

// 2. List own requests (Customer or Vendor, with filters and pagination)
router.get(
  '/',
  validate(listRequestsQuerySchema, 'query'),
  requestController.listRequests
);

// 3. Get single request details, timeline & comments
router.get('/:id', requestController.getRequestById);

// 4. State transition update (Optimistic locking)
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  requestController.updateStatus
);

// 5. Comments thread
router.get('/:id/comments', requestController.getComments);
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  requestController.addComment
);

module.exports = router;
