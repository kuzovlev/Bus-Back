const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const boardingPointSchema = z.object({
  routeId: z.string().min(1, 'Route ID is required'),
  locationName: z.string().min(2, 'Location name must be at least 2 characters'),
  arrivalTime: z.string().datetime().optional(),
  sequenceNumber: z.number().int().min(1).optional(),
});

// Get all boarding points with pagination and search
const getAllBoardingPoints = async (req, res) => {
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
    const total = await prisma.boardingPoint.count({ where });

    // Get boarding points with pagination
    const boardingPoints = await prisma.boardingPoint.findMany({
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
      message: 'Boarding points retrieved successfully',
      data: {
        boardingPoints,
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
      message: error.message || 'Error retrieving boarding points',
    });
  }
};

// Get boarding point by ID
const getBoardingPointById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const boardingPoint = await prisma.boardingPoint.findUnique({
      where: { id },
      include: {
        route: true,
      },
    });
    
    if (!boardingPoint) {
      return res.status(404).json({
        success: false,
        message: 'Boarding point not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Boarding point retrieved successfully',
      data: boardingPoint,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving boarding point',
    });
  }
};

// Create boarding point
const createBoardingPoint = async (req, res) => {
  try {
    const validatedData = boardingPointSchema.parse(req.body);
    
    // Convert arrivalTime string to Date if provided
    if (validatedData.arrivalTime) {
      validatedData.arrivalTime = new Date(validatedData.arrivalTime);
    }
    
    const boardingPoint = await prisma.boardingPoint.create({
      data: validatedData,
      include: {
        route: true,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Boarding point created successfully',
      data: boardingPoint,
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
      message: error.message || 'Error creating boarding point',
    });
  }
};

// Update boarding point
const updateBoardingPoint = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = boardingPointSchema.parse(req.body);
    
    // Convert arrivalTime string to Date if provided
    if (validatedData.arrivalTime) {
      validatedData.arrivalTime = new Date(validatedData.arrivalTime);
    }
    
    const boardingPoint = await prisma.boardingPoint.update({
      where: { id },
      data: validatedData,
      include: {
        route: true,
      },
    });
    
    res.json({
      success: true,
      message: 'Boarding point updated successfully',
      data: boardingPoint,
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
      message: error.message || 'Error updating boarding point',
    });
  }
};

// Delete boarding point
const deleteBoardingPoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.boardingPoint.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Boarding point deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting boarding point',
    });
  }
};

module.exports = {
  getAllBoardingPoints,
  getBoardingPointById,
  createBoardingPoint,
  updateBoardingPoint,
  deleteBoardingPoint,
}; 