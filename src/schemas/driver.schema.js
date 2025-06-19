const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .refine(
      async (email) => {
        if (!email) return true;
        const existingDriver = await prisma.driver.findFirst({
          where: { email }
        });
        return !existingDriver;
      },
      { message: 'Email already exists' }
    ),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must not exceed 15 characters')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/,
      'Invalid phone number format'
    )
    .refine(
      async (phone) => {
        const existingDriver = await prisma.driver.findFirst({
          where: { phone }
        });
        return !existingDriver;
      },
      { message: 'Phone number already exists' }
    ),
  licenseNumber: z.string()
    .min(1, 'License number is required')
    .refine(
      async (licenseNumber) => {
        const existingDriver = await prisma.driver.findFirst({
          where: { licenseNumber }
        });
        return !existingDriver;
      },
      { message: 'License number already exists' }
    ),
  licenseExpiryDate: z.string()
    .min(1, 'License expiry date is required')
    .transform((date) => {
      // Convert date string to ISO format
      const isoDate = new Date(date).toISOString();
      return isoDate;
    })
    .refine(
      (date) => !isNaN(new Date(date).getTime()),
      { message: 'Invalid date format' }
    ),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  drivingStatus: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY']).default('AVAILABLE'),
  vendorId: z.string().optional(),
});

// Schema for updates that excludes unique checks
const driverUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional()
    .refine(
      async (email, ctx) => {
        if (!email) return true;
        const existingDriver = await prisma.driver.findFirst({
          where: {
            email,
            NOT: { id: ctx.driverId }
          }
        });
        return !existingDriver;
      },
      { message: 'Email already exists' }
    ),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 characters')
    .max(15, 'Phone number must not exceed 15 characters')
    .regex(
      /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{4,6}$/,
      'Invalid phone number format'
    )
    .refine(
      async (phone, ctx) => {
        const existingDriver = await prisma.driver.findFirst({
          where: {
            phone,
            NOT: { id: ctx.driverId }
          }
        });
        return !existingDriver;
      },
      { message: 'Phone number already exists' }
    ),
  licenseNumber: z.string()
    .min(1, 'License number is required')
    .refine(
      async (licenseNumber, ctx) => {
        const existingDriver = await prisma.driver.findFirst({
          where: {
            licenseNumber,
            NOT: { id: ctx.driverId }
          }
        });
        return !existingDriver;
      },
      { message: 'License number already exists' }
    ),
  licenseExpiryDate: z.string()
    .min(1, 'License expiry date is required')
    .transform((date) => {
      // Convert date string to ISO format
      const isoDate = new Date(date).toISOString();
      return isoDate;
    })
    .refine(
      (date) => !isNaN(new Date(date).getTime()),
      { message: 'Invalid date format' }
    ),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  drivingStatus: z.enum(['AVAILABLE', 'ON_TRIP', 'OFF_DUTY']).default('AVAILABLE'),
  vendorId: z.string().optional(),
});

module.exports = {
  driverSchema,
  driverUpdateSchema,
}; 