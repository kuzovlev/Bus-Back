const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const droppingPointSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  locationName: z.string().min(2, 'Location name must be at least 2 characters'),
  arrivalTime: z.string().datetime().optional(),
  sequenceNumber: z.number().int().min(1).optional(),
});

// Get all dropping points with pagination and search
const getAllDroppingPoints = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, routeId } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { locationName: { contains: search, mode: 'insensitive' } },
        // { route: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (routeId) {
      where.routeId = routeId;
    }

    // Get total count for pagination
    const total = await prisma.droppingPoint.count({ where });

    // Get dropping points with pagination
    const droppingPoints = await prisma.droppingPoint.findMany({
      where,
      include: {
        route: true,
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        sequenceNumber: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Dropping points retrieved successfully',
      data: {
        droppingPoints,
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
      message: error.message || 'Error retrieving dropping points',
    });
  }
};

// Get dropping point by ID
const getDroppingPointById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const droppingPoint = await prisma.droppingPoint.findUnique({
      where: { id },
      include: {
        route: true,
      },
    });
    
    if (!droppingPoint) {
      return res.status(404).json({
        success: false,
        message: 'Dropping point not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Dropping point retrieved successfully',
      data: droppingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving dropping point',
    });
  }
};

// Create dropping point
const createDroppingPoint = async (req, res) => {
  try {
    const validatedData = droppingPointSchema.parse(req.body);
    
    // Convert arrivalTime string to Date if provided
    if (validatedData.arrivalTime) {
      validatedData.arrivalTime = new Date(validatedData.arrivalTime);
    }
    
    const droppingPoint = await prisma.droppingPoint.create({
      data: validatedData,
      include: {
        route: true,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Dropping point created successfully',
      data: droppingPoint,
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
      message: error.message || 'Error creating dropping point',
    });
  }
};

// Update dropping point
const updateDroppingPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = droppingPointSchema.parse(req.body);
    
    // Convert arrivalTime string to Date if provided
    if (validatedData.arrivalTime) {
      validatedData.arrivalTime = new Date(validatedData.arrivalTime);
    }
    
    const droppingPoint = await prisma.droppingPoint.update({
      where: { id },
      data: validatedData,
      include: {
        route: true,
      },
    });
    
    res.json({
      success: true,
      message: 'Dropping point updated successfully',
      data: droppingPoint,
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
      message: error.message || 'Error updating dropping point',
    });
  }
};

// Delete dropping point
const deleteDroppingPoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.droppingPoint.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Dropping point deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting dropping point',
    });
  }
};

module.exports = {
  getAllDroppingPoints,
  getDroppingPointById,
  createDroppingPoint,
  updateDroppingPoint,
  deleteDroppingPoint,
}; 