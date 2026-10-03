/**
 * Zod Validation Schemas for Reports Module
 * Reference: Blueprint Sections 7, 13, 17
 */
const { z } = require('zod');

const createReportSchema = z.object({
  reported_user_id: z.string().min(1, 'Reported user ID is required').optional(),
  reportedUserId: z.string().min(1, 'Reported user ID is required').optional(),
  request_id: z.string().optional().nullable(),
  requestId: z.string().optional().nullable(),
  reason: z.string().min(2, 'Reason must be at least 2 characters').max(100, 'Reason cannot exceed 100 characters'),
  details: z.string().max(2000, 'Details cannot exceed 2000 characters').optional().nullable(),
}).refine(
  (data) => Boolean(data.reported_user_id || data.reportedUserId),
  {
    message: 'reported_user_id is required',
    path: ['reported_user_id'],
  }
);

module.exports = {
  createReportSchema,
};
