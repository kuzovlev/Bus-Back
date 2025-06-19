const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const routeSchema = z.object({
  sourceCity: z.string().min(2, 'Source city must be at least 2 characters'),
  destinationCity: z.string().min(2, 'Destination city must be at least 2 characters'),
  distance: z.number().positive('Distance must be a positive number').optional(),
  isActive: z.boolean().optional().default(true),
  boardingPoints: z.array(z.object({
    locationName: z.string().min(2),
    arrivalTime: z.string().optional(),
    sequenceNumber: z.number().int().min(1).optional(),
  })).optional(),
  droppingPoints: z.array(z.object({
    locationName: z.string().min(2),
    arrivalTime: z.string().optional(),
    sequenceNumber: z.number().int().min(1).optional(),
  })).optional(),
});

// Get all routes
const getAllRoutes = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, sourceCity, destinationCity, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { sourceCity: { contains: search, mode: 'insensitive' } },
        { destinationCity: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sourceCity) {
      where.sourceCity = { contains: sourceCity, mode: 'insensitive' };
    }

    if (destinationCity) {
      where.destinationCity = { contains: destinationCity, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count for pagination
    const total = await prisma.route.count({ where });

    // Get routes with pagination
    const routes = await prisma.route.findMany({
      where,
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({
      success: true,
      message: 'Routes retrieved successfully',
      data: {
        routes,
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
      message: error.message || 'Error retrieving routes',
    });
  }
};

// Get route by ID
const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Route retrieved successfully',
      data: route,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving route',
    });
  }
};

// Create route
const createRoute = async (req, res) => {
  try {
    const validatedData = routeSchema.parse(req.body);
    
    // Extract boarding and dropping points data
    const { boardingPoints, droppingPoints, ...routeData } = validatedData;
    
    // Create route with nested creates for boarding and dropping points
    const route = await prisma.route.create({
      data: {
        ...routeData,
        boardingPoints: boardingPoints ? {
          create: boardingPoints.map(point => ({
            ...point,
            arrivalTime: point.arrivalTime ? new Date(point.arrivalTime).toISOString() : undefined,
          })),
        } : undefined,
        droppingPoints: droppingPoints ? {
          create: droppingPoints.map(point => ({
            ...point,
            arrivalTime: point.arrivalTime ? new Date(point.arrivalTime).toISOString() : undefined,
          })),
        } : undefined,
      },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route,
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
      message: error.message || 'Error creating route',
    });
  }
};

// Update route
const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = routeSchema.parse(req.body);
    
    // Extract boarding and dropping points data
    const { boardingPoints, droppingPoints, ...routeData } = validatedData;
    
    // Update route with nested updates for boarding and dropping points
    const route = await prisma.route.update({
      where: { id },
      data: {
        ...routeData,
        boardingPoints: boardingPoints ? {
          deleteMany: {},  // Delete existing points
          create: boardingPoints.map(point => ({
            ...point,
            arrivalTime: point.arrivalTime ? new Date(point.arrivalTime) : undefined,
          })),
        } : undefined,
        droppingPoints: droppingPoints ? {
          deleteMany: {},  // Delete existing points
          create: droppingPoints.map(point => ({
            ...point,
            arrivalTime: point.arrivalTime ? new Date(point.arrivalTime) : undefined,
          })),
        } : undefined,
      },
      include: {
        boardingPoints: true,
        droppingPoints: true,
      },
    });
    
    res.json({
      success: true,
      message: 'Route updated successfully',
      data: route,
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
      message: error.message || 'Error updating route',
    });
  }
};

// Delete route
const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated boarding and dropping points first
    await prisma.$transaction([
      prisma.boardingPoint.deleteMany({ where: { routeId: id } }),
      prisma.droppingPoint.deleteMany({ where: { routeId: id } }),
      prisma.route.delete({ where: { id } }),
    ]);
    
    res.json({
      success: true,
      message: 'Route and associated points deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting route',
    });
  }
};

module.exports = {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
}; 