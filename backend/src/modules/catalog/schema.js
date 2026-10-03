const { z } = require('zod');

const getServicesSchema = z.object({
  category_id: z.string().uuid('Valid category ID required').optional(),
  category_slug: z.string().optional(),
});

const getLocationsSchema = z.object({
  q: z.string().optional(),
  query: z.string().optional(),
});

const getVendorsSchema = z.object({
  category_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
});

module.exports = {
  getServicesSchema,
  getLocationsSchema,
  getVendorsSchema,
};
