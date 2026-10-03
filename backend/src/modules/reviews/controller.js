/**
 * Reviews HTTP Controller
 * Reference: Blueprint Section 13 Response Envelopes
 */
const reviewService = require('./service');
const { sendSuccess } = require('../../utils/responseEnvelope');

async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview({
      userId: req.user.id,
      data: req.body,
    });
    return sendSuccess(res, { review }, 'Review submitted successfully.', 201);
  } catch (err) {
    next(err);
  }
}

async function getVendorReviews(req, res, next) {
  try {
    const result = await reviewService.getVendorReviews({
      vendorId: req.params.vendorId,
      query: req.query,
    });
    return sendSuccess(
      res,
      { vendor: result.vendor, reviews: result.reviews },
      'Vendor reviews retrieved successfully.',
      200,
      result.meta
    );
  } catch (err) {
    next(err);
  }
}

async function addVendorReply(req, res, next) {
  try {
    const review = await reviewService.addVendorReply({
      reviewId: req.params.id,
      userId: req.user.id,
      reply: req.body.reply,
    });
    return sendSuccess(res, { review }, 'Vendor reply submitted successfully.', 200);
  } catch (err) {
    next(err);
  }
}

async function getPendingReviews(req, res, next) {
  try {
    const pending = await reviewService.getPendingReviews({
      userId: req.user.id,
    });
    return sendSuccess(res, { pending }, 'Pending reviews retrieved successfully.', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createReview,
  getVendorReviews,
  addVendorReply,
  getPendingReviews,
};
