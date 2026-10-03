const { z } = require('zod');

const searchVendorsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  service: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  area_id: z.string().optional(),
  radius: z.coerce.number().min(0).max(500).optional().default(15),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  verified: z
    .preprocess((val) => (val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined), z.boolean())
    .optional(),
  available_now: z
    .preprocess((val) => (val === 'true' || val === true ? true : val === 'false' || val === false ? false : undefined), z.boolean())
    .optional(),
  sort: z
    .enum(['best_match', 'nearest', 'highest_rated', 'lowest_price', 'most_reviewed'])
    .optional()
    .default('best_match'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

const searchSuggestionsSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
});

module.exports = {
  searchVendorsSchema,
  searchSuggestionsSchema,
};
