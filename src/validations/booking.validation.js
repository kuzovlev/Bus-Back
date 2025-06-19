const { z } = require('zod');

const createBookingSchema = z.object({
  userId: z.string().uuid(),
  date: z.string().datetime(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).default('PENDING'),
  notes: z.string().optional(),
});

const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
}; 