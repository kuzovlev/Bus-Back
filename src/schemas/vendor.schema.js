const { z } = require('zod');

const vendorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  businessEmail: z
    .string()
    .email('Invalid email format')
    .min(1, 'Business email is required')
    .refine(async (email) => {
      // Check if email already exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { businessEmail: email }
      });
      return !existingVendor;
    }, 'Business email already exists'),
  businessMobile: z
    .string()
    .min(10, 'Business mobile must be at least 10 digits')
    .max(15, 'Business mobile must not exceed 15 digits')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/,
      'Invalid mobile number format'
    )
    .refine(async (mobile) => {
      // Check if mobile already exists
      const existingVendor = await prisma.vendor.findUnique({
        where: { businessMobile: mobile }
      });
      return !existingVendor;
    }, 'Business mobile number already exists'),
  businessAddress: z.string().min(5, 'Business address must be at least 5 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  isActive: z.boolean().default(true),
});

module.exports = {
  vendorSchema,
}; 