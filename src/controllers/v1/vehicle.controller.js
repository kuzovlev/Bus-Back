const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schema
const vehicleSchema = z.object({
  vehicleName: z.string().min(2, 'Vehicle name must be at least 2 characters'),
  vehicleNumber: z.string().min(2, 'Vehicle number must be at least 2 characters'),
  vehicleImage: z.string().optional().nullable(),
  vehicleStatus: z.enum(['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
  vehicleRating: z.number().min(0).max(5).optional().nullable(),
  totalSeats: z.number().min(1, 'Total seats must be at least 1'),
  startDate: z.string()
    .transform((date) => date ? new Date(date).toISOString() : null)
    .optional()
    .nullable(),
  hasAc: z.boolean().default(false),
  driverName: z.string().optional().nullable(),
  driverMobile: z.string().optional().nullable(),
  gearSystem: z.enum(['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC']).optional().nullable(),
  amenities: z.object({
    ids: z.array(z.string())
  }).optional().nullable(),
  vehicleType: z.string(),
  vehicleBrand: z.string().optional().nullable(),
  availableCity: z.string().optional().nullable(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG']).optional().nullable(),
  routeId: z.string().optional().nullable(),
  layoutId: z.string().optional().nullable(),
});

// Get all vehicles with pagination and filters
const getAllVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, vehicleType } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    // Filter by user role
    if (req.user.role === 'VENDOR') {
      where.userId = req.user.id;
    }
    
    if (search) {
      where.OR = [
        { vehicleName: { contains: search, mode: 'insensitive' } },
        { vehicleNumber: { contains: search, mode: 'insensitive' } },
        { vehicleType: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.vehicleStatus = status;
    }

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    // Get total count for pagination
    const total = await prisma.vehicle.count({ where });

    // Get vehicles with pagination
    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
      skip,
      take: parseInt(limit),
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get routes and layouts for dropdowns
    const routes = await prisma.route.findMany({
      select: {
        id: true,
        sourceCity: true,
        destinationCity: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        sourceCity: 'asc',
      },
    });

    const layouts = await prisma.busLayout.findMany({
      select: {
        id: true,
        layoutName: true,
        totalSeats: true,
      },
      where: {
        isActive: true,
      },
      orderBy: {
        layoutName: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        routes,
        layouts,
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
      message: error.message || 'Error retrieving vehicles',
    });
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to this vehicle
    if (req.user.role === 'VENDOR' && vehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving vehicle',
    });
  }
};

// Create vehicle
const createVehicle = async (req, res) => {
  try {
    // Pre-process the data before validation
    console.log(req.body);
    const dataToValidate = {
      ...req.body,
      totalSeats: Number(req.body.totalSeats),
      vehicleRating: req.body.vehicleRating ? Number(req.body.vehicleRating) : null,
      hasAc: req.body.hasAc === 'true' || req.body.hasAc === true,
      // Handle amenities array
      amenities: Array.isArray(req.body.amenities) ? 
        { ids: req.body.amenities } : 
        req.body.amenities ? 
          { ids: [req.body.amenities] } : 
          null,
      // Clean up the date format if present
      startDate: req.body.startDate || null
    };

    const validatedData = vehicleSchema.parse(dataToValidate);

    // Create vehicle with validated data
    const vehicle = await prisma.vehicle.create({
      data: {
        ...validatedData,
        userId: req.user.id,
        amenities: validatedData.amenities,
        // startDate is already properly formatted by the schema
        startDate: validatedData.startDate,
        vehicleImage: req.file?.filename || null,
      },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle,
    });
  } catch (error) {
    console.error('Vehicle creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating vehicle',
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = vehicleSchema.parse(req.body);

    // Check if vehicle exists and user has access
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to update this vehicle
    if (req.user.role === 'VENDOR' && existingVehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...validatedData,
        amenities: validatedData.amenities ? JSON.parse(validatedData.amenities) : null,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
      },
      include: {
        route: {
          select: {
            id: true,
            sourceCity: true,
            destinationCity: true,
          },
        },
        layout: {
          select: {
            id: true,
            layoutName: true,
            totalSeats: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle,
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
      message: error.message || 'Error updating vehicle',
    });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if vehicle exists and user has access
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!existingVehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
      });
    }

    // Check if user has access to delete this vehicle
    if (req.user.role === 'VENDOR' && existingVehicle.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }
    
    await prisma.vehicle.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting vehicle',
    });
  }
};

// Get all layouts for dropdown
const getLayoutsList = async (req, res) => {
  try {
    const layouts = await prisma.busLayout.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        layoutName: true,
        totalSeats: true,
        sleeperSeats: true,
        seaterSeats: true,
        hasUpperDeck: true,
        upperDeckSeats: true,
        sleeperPrice: true,
        seaterPrice: true,
        rowCount: true,
        columnCount: true,
      },
      orderBy: {
        layoutName: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Bus layouts retrieved successfully',
      data: layouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving bus layouts',
    });
  }
};

// Get all routes for dropdown
const getRoutesList = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        sourceCity: true,
        destinationCity: true,
        distance: true,
        boardingPoints: {
          select: {
            id: true,
            locationName: true,
            arrivalTime: true,
            sequenceNumber: true,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
        droppingPoints: {
          select: {
            id: true,
            locationName: true,
            arrivalTime: true,
            sequenceNumber: true,
          },
          orderBy: {
            sequenceNumber: 'asc',
          },
        },
      },
      orderBy: {
        sourceCity: 'asc',
      },
    });
    
    res.json({
      success: true,
      message: 'Routes retrieved successfully',
      data: routes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving routes',
    });
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getLayoutsList,
  getRoutesList,
}; 