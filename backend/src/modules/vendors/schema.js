const { z } = require('zod');

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

const updateProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100).optional(),
  bio: z.string().max(1500, 'Bio cannot exceed 1500 characters').optional().nullable(),
  phone: z.string().min(5, 'Valid phone number is required').max(20).optional(),
  address: z.string().min(3, 'Address must be at least 3 characters').max(255).optional(),
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90').optional(),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180').optional(),
  responseTimeAvg: z.number().int().min(1).max(1440).optional(),
  serviceRadiusKm: z.number().min(1).max(100).optional(),
});

const toggleAvailabilitySchema = z
  .object({
    isAvailable: z.boolean().optional(),
    dutyStatus: z.enum(['AVAILABLE', 'BUSY', 'OFF_DUTY']).optional(),
  })
  .refine((data) => data.isAvailable !== undefined || data.dutyStatus !== undefined, {
    message: 'Either isAvailable boolean or dutyStatus is required',
  });

const servicePricingSchema = z
  .object({
    serviceId: z.string().uuid('Valid service ID is required'),
    priceType: z.enum(['FIXED', 'HOURLY', 'RANGE', 'QUOTE_ONLY']).default('RANGE'),
    priceMin: z.number().min(0, 'Minimum price cannot be negative'),
    priceMax: z.number().min(0, 'Maximum price cannot be negative'),
    description: z.string().max(500).optional().nullable(),
    isAvailable: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.priceMax < data.priceMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['priceMax'],
        message: 'Maximum price must be greater than or equal to minimum price (CHECK: price_max >= price_min)',
      });
    }
  });

const availabilityIntervalSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6, 'dayOfWeek must be 0 (Sunday) to 6 (Saturday)'),
    startTime: z.string().regex(timeRegex, 'startTime must be in HH:MM 24-hour format'),
    endTime: z.string().regex(timeRegex, 'endTime must be in HH:MM 24-hour format'),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.isActive && data.startTime >= data.endTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'endTime must be later than startTime',
      });
    }
  });

const weeklyAvailabilitySchema = z
  .object({
    schedule: z.array(availabilityIntervalSchema),
  })
  .superRefine((data, ctx) => {
    // Overlap validation: Ensure no two active intervals for the same day overlap
    const activeByDay = {};
    for (const item of data.schedule) {
      if (!item.isActive) continue;
      if (!activeByDay[item.dayOfWeek]) {
        activeByDay[item.dayOfWeek] = [];
      }
      activeByDay[item.dayOfWeek].push(item);
    }

    for (const [day, intervals] of Object.entries(activeByDay)) {
      // Sort intervals by startTime
      intervals.sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < intervals.length - 1; i++) {
        const current = intervals[i];
        const next = intervals[i + 1];
        // If current endTime > next startTime => overlap!
        if (current.endTime > next.startTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['schedule'],
            message: `Overlapping schedule intervals detected on day ${day} between ${current.startTime}-${current.endTime} and ${next.startTime}-${next.endTime}`,
          });
        }
      }
    }
  });

const timeOffSchema = z
  .object({
    startDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    endDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
    reason: z.string().max(255).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'Invalid start date format',
      });
    }
    if (isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Invalid end date format',
      });
    }
    if (start > end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be on or after start date',
      });
    }
  });

module.exports = {
  updateProfileSchema,
  toggleAvailabilitySchema,
  servicePricingSchema,
  weeklyAvailabilitySchema,
  timeOffSchema,
};
