// backend/src/controllers/v1/mobile-auth.controller.js
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const getTwilioInstance = require('../../config/twilio');
const { generateOTP, hashPassword, formatPhoneNumber } = require('../../utils/helpers');

const prisma = new PrismaClient();

// Validation schemas
const mobileRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  mobile: z.string().min(11, 'Mobile number must be at least 11 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

const mobileLoginSchema = z.object({
  mobile: z.string().min(11, 'Mobile number must be at least 11 characters'),
  otp: z.string().length(6, 'OTP must be 6 characters'),
});

const checkMobileSchema = z.object({
  mobile: z.string().min(11, 'Mobile number must be at least 11 characters'),
});

// Update the sendSMS function to use dynamic Twilio instance
const sendSMS = async (to, message) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Development mode: SMS not sent');
    return true;
  }

  try {
    const { client, twilioPhoneNumber } = await getTwilioInstance();
    const formattedNumber = formatPhoneNumber(to);
    
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedNumber,
    });
    return true;
  } catch (error) {
    console.error('Twilio SMS Error:', error);
    return false;
  }
};

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Controller methods
const mobileRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile, gender } = mobileRegisterSchema.parse(req.body);

    // Check existing user by email or mobile
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { mobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? "Email already registered" 
          : "Mobile number already registered"
      });
    }

    // Generate default password and OTP
    const defaultPassword = await bcrypt.hash('12345', 10);
    const otp = generateOTP();

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        gender,
        password: defaultPassword,
        mobileOtp: otp,
        role: 'USER',
      },
    });

    // Send OTP via SMS using updated sendSMS function
    const message = `Your ${process.env.APP_NAME || 'Bus Broker'} verification code is: ${otp}. Valid for 15 minutes.`;
    const smsSent = await sendSMS(mobile, message);

    return res.status(201).json({
      success: true,
      message: smsSent ? 'Registration successful and OTP sent' : 'Registration successful but failed to send OTP',
      data: {
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error in mobileRegister:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error during registration',
    });
  }
};

const mobileLogin = async (req, res) => {
  try {
    const { mobile, otp } = mobileLoginSchema.parse(req.body);

    // Find user and verify OTP
    const user = await prisma.user.findUnique({
      where: { mobile },
    });

    if (!user || user.mobileOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number or OTP',
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.',
      });
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        mobileOtp: null,
        loginAttempts: 0,
        loginAttemptsDate: null,
      },
    });

    // Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
          gender: user.gender,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error in mobileLogin:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error during login',
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { mobile } = checkMobileSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { mobile },
    });


    console.log(user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Mobile number not registered',
      });
    }

    // Check login attempts
    if (user.loginAttempts >= 3) {
      const lastAttempt = new Date(user.loginAttemptsDate);
      const now = new Date();
      const diffInMinutes = Math.floor((now - lastAttempt) / 1000 / 60);

      if (diffInMinutes < 15) {
        return res.status(429).json({
          success: false,
          message: 'Too many attempts. Please try again after 15 minutes',
          data: {
            remainingMinutes: 15 - diffInMinutes,
          },
        });
      }
    }

    // Generate and save new OTP
    const otp = generateOTP();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mobileOtp: otp,
        loginAttempts: {
          increment: 1,
        },
        loginAttemptsDate: new Date(),
      },
    });

    // Send OTP via SMS using updated sendSMS function
    const message = `Your ${process.env.APP_NAME || 'Bus Broker'} verification code is: ${otp}. Valid for 15 minutes.`;
    console.log(mobile);
    const smsSent = await sendSMS(mobile, message);
    console.log(smsSent);
    return res.status(200).json({
      success: true,
      message: smsSent ? 'OTP sent successfully' : 'Failed to send OTP via SMS',
      data: {
        otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }

    console.error('Error in sendOtp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error sending OTP',
    });
  }
};

module.exports = {
  mobileRegister,
  mobileLogin,
  sendOtp,
};