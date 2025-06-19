const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  role: z.enum(['ADMIN', 'VENDOR', 'USER']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const userUpdateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  mobile: z.string().min(10, 'Mobile number must be at least 10 characters').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  role: z.enum(['ADMIN', 'VENDOR', 'USER']).optional(),
  active: z.boolean().optional(),
  loginAttempts: z.number().min(0).optional(),
  loginAttemptsDate: z.date().optional().nullable(),
  expiry: z.date().optional().nullable(),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  removeAvatar: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Register new user
const register = async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { mobile: validatedData.mobile }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile',
      });
    }

    // Set expiry date to 5 months from registration
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 5);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword,
        expiry: expiryDate,
        loginAttempts: 0,
        active: true
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        role: true,
        active: true,
        expiry: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user',
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        active: true,
        loginAttempts: true,
        loginAttemptsDate: true,
        expiry: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if account is active
    if (!user.active) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact administration.',
      });
    }

    // Check account expiry
    if (user.expiry && new Date() > user.expiry) {
      return res.status(403).json({
        success: false,
        message: 'Your account has expired. Please contact administration to renew.',
      });
    }

    // Check login attempts
    if (user.loginAttempts >= 5) {
      const lockoutDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
      const lastAttemptTime = user.loginAttemptsDate ? new Date(user.loginAttemptsDate).getTime() : 0;
      const currentTime = new Date().getTime();
      
      if (currentTime - lastAttemptTime < lockoutDuration) {
        const remainingTime = Math.ceil((lockoutDuration - (currentTime - lastAttemptTime)) / 60000);
        return res.status(429).json({
          success: false,
          message: `Account temporarily locked due to multiple failed attempts. Please try again in ${remainingTime} minutes.`,
        });
      } else {
        // Reset attempts if lockout period has passed
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            loginAttemptsDate: null
          }
        });
      }
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    if (!isPasswordValid) {
      // Increment login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: (user.loginAttempts || 0) + 1,
          loginAttemptsDate: new Date()
        }
      });

      const remainingAttempts = 5 - ((user.loginAttempts || 0) + 1);
      return res.status(401).json({
        success: false,
        message: `Invalid credentials. ${remainingAttempts} attempts remaining before account lockout.`,
      });
    }

    // Successful login - reset attempts and update expiry if needed
    const fiveMonthsFromNow = new Date();
    fiveMonthsFromNow.setMonth(fiveMonthsFromNow.getMonth() + 5);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        loginAttemptsDate: null,
        expiry: !user.expiry ? fiveMonthsFromNow : user.expiry
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id,user:user },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: userWithoutPassword,
        token,
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
    res.status(500).json({
      success: false,
      message: error.message || 'Error logging in',
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        avatar: true,
        role: true,
        active: true,
        expiry: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Transform avatar URL if exists
    // if (user.avatar) {
    //   user.avatar = `${process.env.NEXT_PUBLIC_ROOT_URL}${user.avatar}`;
    // }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving profile',
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const validatedData = changePasswordSchema.parse(req.body);
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password',
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const userId = req.user.id;

    // Get current user to check if avatar exists
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true }
    });

    // Handle avatar upload
    let avatarPath = undefined;
    if (req.file) {
      // If there's an existing avatar, delete it
      if (currentUser?.avatar) {
        const fs = require('fs');
        const path = require('path');
        const oldAvatarPath = path.join(__dirname, '../../../public', currentUser.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      // Set new avatar path
      avatarPath = `/uploads/${req.file.filename}`;
    } else if (validatedData.removeAvatar) {
      // Handle avatar removal
      if (currentUser?.avatar) {
        const fs = require('fs');
        const path = require('path');
        const oldAvatarPath = path.join(__dirname, '../../../public', currentUser.avatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }
      avatarPath = null;
    }

    // Update user data
    const updateData = {
      ...validatedData,
      ...(avatarPath !== undefined && { avatar: avatarPath })
    };

    // Remove removeAvatar from update data as it's not a field in the database
    delete updateData.removeAvatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        avatar: true,
        role: true,
        active: true,
        expiry: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    // If there was an error and a file was uploaded, delete it
    if (req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../../../public/uploads/avatars', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, active } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (active !== undefined) {
      where.active = active === 'true';
    }

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        loginAttempts: true,
        loginAttemptsDate: true,
        expiry: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            status: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving users',
    });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        loginAttempts: true,
        loginAttemptsDate: true,
        expiry: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            status: true,
          },
        },
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving user',
    });
  }
};

// Update user (Admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = userUpdateSchema.parse(req.body);
    
    // Check if email is being changed and if it's already taken
    if (validatedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id },
        },
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already taken',
        });
      }
    }
    
    // Check if mobile is being changed and if it's already taken
    if (validatedData.mobile) {
      const existingUser = await prisma.user.findFirst({
        where: {
          mobile: validatedData.mobile,
          NOT: { id },
        },
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Mobile number already taken',
        });
      }
    }
    
    // Hash password if provided
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        loginAttempts: true,
        loginAttemptsDate: true,
        expiry: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessEmail: true,
            status: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating user',
    });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        vendor: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    // Delete associated vendor if exists
    if (user.vendor) {
      await prisma.vendor.delete({
        where: { id: user.vendor.id },
      });
    }
    
    // Delete user
    await prisma.user.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'User and associated data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting user',
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
}; 