const { z } = require('zod');

const vendorParamSchema = z.object({
  vendorId: z.string().min(1, 'Valid vendor ID required'),
});

module.exports = {
  vendorParamSchema,
};
