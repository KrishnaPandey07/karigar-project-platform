/**
 * Reviews Express Routes
 * Mount path: /api/v1/reviews
 */
const { Router } = require('express');
const reviewController = require('./controller');
const validate = require('../../middleware/validate');
const { authenticate, requireRole } = require('../../middleware/auth');
const {
  createReviewSchema,
  vendorReplySchema,
  listReviewsQuerySchema,
} = require('./schema');

const router = Router();

// Public: List reviews for a vendor
router.get(
  '/vendor/:vendorId',
  validate(listReviewsQuerySchema, 'query'),
  reviewController.getVendorReviews
);

// Protected routes
router.use(authenticate);

// Customer pending reviews
router.get(
  '/pending',
  requireRole('CUSTOMER'),
  reviewController.getPendingReviews
);

// Customer submit review
router.post(
  '/',
  requireRole('CUSTOMER'),
  validate(createReviewSchema),
  reviewController.createReview
);

// Vendor reply to review
router.post(
  '/:id/reply',
  requireRole('VENDOR'),
  validate(vendorReplySchema),
  reviewController.addVendorReply
);

module.exports = router;
