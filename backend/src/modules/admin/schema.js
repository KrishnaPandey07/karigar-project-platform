const { z } = require('zod');

const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED'], {
    errorMap: () => ({ message: 'Status must be either ACTIVE or SUSPENDED' }),
  }),
  reason: z.string().max(500, 'Reason cannot exceed 500 characters').optional(),
});

const reviewVerificationSchema = z
  .object({
    action: z.enum(['APPROVE', 'REJECT'], {
      errorMap: () => ({ message: 'Action must be either APPROVE or REJECT' }),
    }),
    rejectionReason: z
      .string()
      .max(500, 'Rejection reason cannot exceed 500 characters')
      .optional(),
  })
  .refine(
    (data) => data.action !== 'REJECT' || (data.rejectionReason && data.rejectionReason.trim().length > 0),
    {
      message: 'Rejection reason is required when rejecting verification',
      path: ['rejectionReason'],
    }
  );

const reviewReportSchema = z.object({
  status: z.enum(['RESOLVED', 'DISMISSED'], {
    errorMap: () => ({ message: 'Status must be either RESOLVED or DISMISSED' }),
  }),
  resolutionNotes: z
    .string()
    .max(1000, 'Resolution notes cannot exceed 1000 characters')
    .optional(),
  actionTaken: z
    .string()
    .max(200, 'Action taken cannot exceed 200 characters')
    .optional(),
});

const listUsersQuerySchema = z.object({
  q: z.string().optional(),
  role: z.enum(['CUSTOMER', 'VENDOR', 'ADMIN', 'ALL']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED', 'ALL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const listVerificationsQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const listReportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED', 'ALL']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const listAuditLogsQuerySchema = z.object({
  action: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = {
  updateUserStatusSchema,
  reviewVerificationSchema,
  reviewReportSchema,
  listUsersQuerySchema,
  listVerificationsQuerySchema,
  listReportsQuerySchema,
  listAuditLogsQuerySchema,
};
