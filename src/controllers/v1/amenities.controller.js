const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schema
const amenitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Get all amenities with pagination and search
const getAllAmenities = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const total = await prisma.amenities.count({ where });

    // Get amenities with pagination
    const amenities = await prisma.amenities.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: {
        name: 'asc',
      },
    });
    
    // Add full URL to icons
    const amenitiesWithFullUrls = amenities.map(amenity => ({
      ...amenity,
      icon: `/uploads/${amenity.icon}`,
    }));
    
    res.json({
      success: true,
      message: 'Amenities retrieved successfully',
      data: {
        amenities: amenitiesWithFullUrls,
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
      message: error.message || 'Error retrieving amenities',
    });
  }
};

// Get amenity by ID
const getAmenityById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const amenity = await prisma.amenities.findUnique({
      where: { id },
    });
    
    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found',
      });
    }
    
    // Add full URL to icon
    amenity.icon = `/uploads/${amenity.icon}`;
    
    res.json({
      success: true,
      message: 'Amenity retrieved successfully',
      data: amenity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving amenity',
    });
  }
};

// Create amenity
const createAmenity = async (req, res) => {
  try {
    const validatedData = amenitySchema.parse(req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Icon image is required',
      });
    }
    
    const amenity = await prisma.amenities.create({
      data: {
        ...validatedData,
        icon: req.file.filename,
      },
    });
    
    // Add full URL to icon
    amenity.icon = `${process.env.BACKEND_URL}/uploads/${amenity.icon}`;
    
    res.status(201).json({
      success: true,
      message: 'Amenity created successfully',
      data: amenity,
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
      message: error.message || 'Error creating amenity',
    });
  }
};

// Update amenity
const updateAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = amenitySchema.parse(req.body);
    
    const updateData = {
      ...validatedData,
    };

    // If new icon is uploaded, update the icon field
    if (req.file) {
      updateData.icon = req.file.filename;
    }
    
    const amenity = await prisma.amenities.update({
      where: { id },
      data: updateData,
    });
    
    // Add full URL to icon
    amenity.icon = `${process.env.BACKEND_URL}/uploads/${amenity.icon}`;
    
    res.json({
      success: true,
      message: 'Amenity updated successfully',
      data: amenity,
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
      message: error.message || 'Error updating amenity',
    });
  }
};

// Delete amenity
const deleteAmenity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the amenity to get the icon filename
    const amenity = await prisma.amenities.findUnique({
      where: { id },
    });

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: 'Amenity not found',
      });
    }

    // Delete the amenity from database
    await prisma.amenities.delete({
      where: { id },
    });

    // Delete the icon file
    const fs = require('fs');
    const path = require('path');
    const iconPath = path.join(__dirname, '../../../../public/uploads', amenity.icon);
    
    if (fs.existsSync(iconPath)) {
      fs.unlinkSync(iconPath);
    }
    
    res.json({
      success: true,
      message: 'Amenity deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting amenity',
    });
  }
};

module.exports = {
  getAllAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
}; 