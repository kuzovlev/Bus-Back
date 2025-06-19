const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password'
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema
}; 