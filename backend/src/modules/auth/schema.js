const { z } = require('zod');

const registerSchema = z
  .object({
    email: z.string().email('Valid email address is required').toLowerCase().trim().optional().or(z.literal('')),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    role: z.enum(['CUSTOMER', 'VENDOR'], {
      errorMap: () => ({ message: 'Role must be either CUSTOMER or VENDOR' }),
    }),
    
    // Customer profile fields
    fullName: z.string().min(2, 'Full name is required for customers').optional(),
    
    // Vendor profile fields
    businessName: z.string().min(2, 'Business name is required for vendors').optional(),
    bio: z.string().max(1000).optional(),
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),

    // Shared contact fields
    phone: z.string().min(5, 'Valid phone number is required').optional(),
    address: z.string().min(3, 'Address is required').optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Either phone number or email address is required',
      });
    }
    if (data.role === 'CUSTOMER') {
      if (!data.fullName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['fullName'],
          message: 'Full name is required for customer registration',
        });
      }
    }
    if (data.role === 'VENDOR') {
      if (!data.businessName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['businessName'],
          message: 'Business name is required for vendor registration',
        });
      }
      if (!data.phone) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['phone'],
          message: 'Phone number is required for vendor registration',
        });
      }
      if (!data.address) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['address'],
          message: 'Physical address is required for vendor registration',
        });
      }
      if (data.lat === undefined || data.lng === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['lat'],
          message: 'Coordinates (lat, lng) are required for vendor hyperlocal matching',
        });
      }
    }
  });

const loginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: z.string().min(1, 'Password is required'),
  })
  .superRefine((data, ctx) => {
    const loginId = data.identifier || data.email || data.phone;
    if (!loginId || loginId.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['identifier'],
        message: 'Mobile number or email is required',
      });
    }
  });

const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required').toLowerCase().trim(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
