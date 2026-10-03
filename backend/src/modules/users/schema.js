const { z } = require('zod');

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  name: z.string().min(2).max(100).optional(), // alias
  phone: z.string().min(5, 'Valid phone number is required').max(20).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  defaultLocationId: z.string().uuid('Valid location ID required').optional().nullable(),
  defaultLat: z.number().min(-90).max(90).optional().nullable(),
  defaultLng: z.number().min(-180).max(180).optional().nullable(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number'),
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};
