/**
 * Zod Validation Schemas for Reviews Module
 * Reference: Blueprint Sections 7, 11, 13
 */
const { z } = require('zod');

const createReviewSchema = z.object({
  request_id: z.string().min(1, 'Request ID is required').optional(),
  requestId: z.string().min(1, 'Request ID is required').optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().max(2000, 'Comment cannot exceed 2000 characters').optional().nullable(),
}).refine(
  (data) => Boolean(data.request_id || data.requestId),
  {
    message: 'request_id is required',
    path: ['request_id'],
  }
);

const vendorReplySchema = z.object({
  reply: z.string().min(1, 'Reply cannot be empty').max(1000, 'Reply cannot exceed 1000 characters'),
});

const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(['recent', 'highest', 'lowest']).default('recent'),
});

module.exports = {
  createReviewSchema,
  vendorReplySchema,
  listReviewsQuerySchema,
};
