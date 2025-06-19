const { z } = require('zod');

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string(),
});

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

module.exports = {
  createUserSchema,
  loginSchema,
  updateUserSchema,
}; 