/**
 * Zod Validation Schemas for Service Requests Module
 * Reference: Blueprint Sections 10 & 13
 */
const { z } = require('zod');
const { REQUEST_STATUS } = require('./transitions');

const createRequestSchema = z.object({
  vendor_service_id: z.string().min(1).optional(),
  vendorServiceId: z.string().min(1).optional(),
  description: z.string().min(1, 'Description is required').max(2000, 'Description cannot exceed 2000 characters'),
  address: z.string().min(1, 'Address is required').max(300, 'Address cannot exceed 300 characters'),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  preferred_date: z.string().optional().nullable(),
  preferredDate: z.string().optional().nullable(),
  preferred_time_slot: z.string().optional().nullable(),
  preferredTimeSlot: z.string().optional().nullable(),
  is_urgent: z.boolean().optional().default(false),
  isUrgent: z.boolean().optional().default(false),
}).refine(
  (data) => Boolean(data.vendor_service_id || data.vendorServiceId),
  {
    message: 'vendor_service_id is required',
    path: ['vendor_service_id'],
  }
);

const updateStatusSchema = z.object({
  to: z.nativeEnum(REQUEST_STATUS, {
    errorMap: () => ({ message: 'Invalid target status provided' }),
  }),
  reason: z.string().max(1000, 'Reason cannot exceed 1000 characters').optional().nullable(),
  agreed_price: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional().nullable(),
  agreedPrice: z.union([z.number().positive(), z.string().regex(/^\d+(\.\d{1,2})?$/)]).optional().nullable(),
});

const addCommentSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message cannot exceed 1000 characters'),
});

const listRequestsQuerySchema = z.object({
  status: z.string().optional(),
  tab: z.enum(['active', 'completed', 'closed', 'new', 'in_progress', 'all']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

module.exports = {
  createRequestSchema,
  updateStatusSchema,
  addCommentSchema,
  listRequestsQuerySchema,
};
