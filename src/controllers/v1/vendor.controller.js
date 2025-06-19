const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

// Validation schemas
const vendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessEmail: z.string().email('Invalid business email address'),
  businessMobile: z.string().min(10, 'Business mobile must be at least 10 characters'),
  businessAddress: z.string().min(5, 'Business address must be at least 5 characters'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
  userId: z.string().min(1, 'User ID is required')
});

// Get all vendors with pagination and search
const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { businessEmail: { contains: search, mode: 'insensitive' } },
        { businessMobile: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Get total count for pagination
    const total = await prisma.vendor.count({ where });

    // Get vendors with pagination
    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            role: true,
            active: true,
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
      message: 'Vendors retrieved successfully',
      data: {
        vendors,
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
      message: error.message || 'Error retrieving vendors',
    });
  }
};

// Get vendor by ID
const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            mobile: true,
            role: true,
            active: true,
          },
        },
      },
    });
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Vendor retrieved successfully',
      data: vendor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving vendor',
    });
  }
};

// Create vendor
const createVendor = async (req, res) => {
  try {
    console.log('File upload info:', {
      file: req.file,
      logoPath: req.file ? `/uploads/${req.file.filename}` : null,
      body: req.body
    });

    // Validate input data first
    const validatedData = vendorSchema.parse(req.body);
    const { userId, ...vendorData } = validatedData;

    try {
      // Create vendor with user connection
      const vendor = await prisma.vendor.create({
        data: {
          ...vendorData,
          businessLogo: req.file ? `/uploads/${req.file.filename}` : null,
          user: {
            connect: {
              id: userId
            }
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              role: true,
              active: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: 'Vendor created successfully',
        data: vendor,
      });
    } catch (prismaError) {
      // Clean up uploaded file if exists
      if (req.file) {
        const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      // Handle Prisma unique constraint errors
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        let message = 'This field already exists';
        
        switch (field) {
          case 'businessEmail':
            message = 'Business email already exists';
            break;
          case 'businessMobile':
            message = 'Business mobile number already exists';
            break;
          case 'userId':
            message = 'This user is already associated with a vendor';
            break;
        }
        
        return res.status(400).json({
          success: false,
          message,
        });
      }

      throw prismaError;
    }
  } catch (error) {
    console.error('Vendor creation error:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
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
      message: error.message || 'Error creating vendor',
    });
  }
};

// Update vendor
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = vendorSchema.parse(req.body);
    
    // Get existing vendor
    const existingVendor = await prisma.vendor.findUnique({
      where: { id },
      select: { businessLogo: true },
    });

    if (!existingVendor) {
      // Clean up uploaded file if exists
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Handle logo upload
    let logoPath = existingVendor.businessLogo;
    if (req.file) {
      // Delete old logo if exists
      if (existingVendor.businessLogo) {
        const oldPath = path.join(process.cwd(), 'public', existingVendor.businessLogo);
        await fs.unlink(oldPath).catch(console.error);
      }
      logoPath = `/uploads/${req.file.filename}`;
    }

    try {    
      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          ...validatedData,
          businessLogo: logoPath,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              mobile: true,
              role: true,
              active: true,
            },
          },
        },
      });
      
      res.json({
        success: true,
        message: 'Vendor updated successfully',
        data: vendor,
      });
    } catch (prismaError) {
      // Clean up newly uploaded file if exists
      if (req.file) {
        const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }

      // Handle Prisma unique constraint errors
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0];
        let message = 'This field already exists';
        
        switch (field) {
          case 'businessEmail':
            message = 'Business email already exists';
            break;
          case 'businessMobile':
            message = 'Business mobile number already exists';
            break;
          case 'userId':
            message = 'This user is already associated with a vendor';
            break;
        }
        
        return res.status(400).json({
          success: false,
          message,
        });
      }

      throw prismaError;
    }
  } catch (error) {
    console.error('Vendor update error:', error);

    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../../public/uploads', req.file.filename);
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
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
      message: error.message || 'Error updating vendor',
    });
  }
};

// Delete vendor
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get vendor to delete logo
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      select: { businessLogo: true },
    });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found',
      });
    }

    // Delete logo file if exists
    if (vendor.businessLogo) {
      const logoPath = path.join(process.cwd(), 'public', vendor.businessLogo);
      await fs.unlink(logoPath).catch(console.error);
    }

    // Delete vendor
    await prisma.vendor.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vendor',
    });
  }
};

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
}; 