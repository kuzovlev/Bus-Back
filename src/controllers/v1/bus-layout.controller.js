const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schema
const busLayoutSchema = z.object({
  layoutName: z.string().min(2, 'Layout name must be at least 2 characters'),
  totalSeats: z.number().int().min(1, 'Total seats must be at least 1'),
  sleeperSeats: z.number().int().min(0, 'Sleeper seats cannot be negative'),
  seaterSeats: z.number().int().min(0, 'Seater seats cannot be negative'),
  hasUpperDeck: z.boolean().default(false),
  upperDeckSeats: z.number().int().min(0, 'Upper deck seats cannot be negative').default(0),
  sleeperPrice: z.number().positive('Sleeper price must be positive'),
  seaterPrice: z.number().positive('Seater price must be positive'),
  rowCount: z.number().int().min(1, 'Row count must be at least 1'),
  columnCount: z.number().int().min(1, 'Column count must be at least 1'),

  isActive: z.boolean().optional().default(true),
  layoutJson: z.object({
    rows: z.array(z.array(z.string().nullable())),
    seats: z.record(z.object({
      type: z.enum(['SEAT', 'SLEEPER']),
      number: z.string(),
      deck: z.enum(['LOWER', 'UPPER'])
    }))
  })
});

// Get all bus layouts with pagination and search
const getAllBusLayouts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { layoutName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get total count for pagination
    const total = await prisma.busLayout.count({ where });

    // Get bus layouts with pagination
    const busLayouts = await prisma.busLayout.findMany({
      where,
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
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
      message: 'Bus layouts retrieved successfully',
      data: {
        busLayouts,
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
      message: error.message || 'Error retrieving bus layouts',
    });
  }
};

// Get bus layout by ID
const getBusLayoutById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const busLayout = await prisma.busLayout.findUnique({
      where: { id },
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
          },
        },
      },
    });
    
    if (!busLayout) {
      return res.status(404).json({
        success: false,
        message: 'Bus layout not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Bus layout retrieved successfully',
      data: busLayout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving bus layout',
    });
  }
};

// Create bus layout
const createBusLayout = async (req, res) => {
  try {
    const validatedData = busLayoutSchema.parse(req.body);
    
    // Count seats from layoutJson
    const layoutSeats = validatedData.layoutJson.seats;
    let actualSeaterCount = 0;
    let actualSleeperCount = 0;
    let actualUpperDeckCount = 0;

    Object.values(layoutSeats).forEach(seat => {
      if (seat.deck === 'UPPER') {
        actualUpperDeckCount++;
        if (seat.type === 'SEAT') actualSeaterCount++;
        if (seat.type === 'SLEEPER') actualSleeperCount++;
      } else {
        if (seat.type === 'SEAT') actualSeaterCount++;
        if (seat.type === 'SLEEPER') actualSleeperCount++;
      }
    });

    // Validate seat counts
    if (actualSeaterCount !== validatedData.seaterSeats) {
      return res.status(400).json({
        success: false,
        message: `Seater count mismatch. Layout has ${actualSeaterCount} seats but specified ${validatedData.seaterSeats}`,
      });
    }

    if (actualSleeperCount !== validatedData.sleeperSeats) {
      return res.status(400).json({
        success: false,
        message: `Sleeper count mismatch. Layout has ${actualSleeperCount} sleepers but specified ${validatedData.sleeperSeats}`,
      });
    }

    if (validatedData.hasUpperDeck && actualUpperDeckCount !== validatedData.upperDeckSeats) {
      return res.status(400).json({
        success: false,
        message: `Upper deck count mismatch. Layout has ${actualUpperDeckCount} seats but specified ${validatedData.upperDeckSeats}`,
      });
    }

    const totalSeats = actualSeaterCount + actualSleeperCount;
    if (totalSeats !== validatedData.totalSeats) {
      return res.status(400).json({
        success: false,
        message: `Total seats mismatch. Layout has ${totalSeats} seats but specified ${validatedData.totalSeats}`,
      });
    }

    // Create bus layout with validated data
    const busLayout = await prisma.busLayout.create({
      data: {
        layoutName: validatedData.layoutName,
        totalSeats: validatedData.totalSeats,
        sleeperSeats: validatedData.sleeperSeats,
        seaterSeats: validatedData.seaterSeats,
        hasUpperDeck: validatedData.hasUpperDeck,
        upperDeckSeats: validatedData.upperDeckSeats,
        sleeperPrice: validatedData.sleeperPrice,
        seaterPrice: validatedData.seaterPrice,
        rowCount: validatedData.rowCount,
        columnCount: validatedData.columnCount,
        layoutJson: validatedData.layoutJson,
        isActive: validatedData.isActive ?? true,
        userId: req.user.id,
      },
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
          },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      message: 'Bus layout created successfully',
      data: busLayout,
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
      message: error.message || 'Error creating bus layout',
    });
  }
};

// Update bus layout
const updateBusLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = busLayoutSchema.parse(req.body);
    
    // Calculate total seats if not matching
    const calculatedTotalSeats = validatedData.seaterSeats + validatedData.sleeperSeats + 
      (validatedData.hasUpperDeck ? validatedData.upperDeckSeats : 0);
    
    if (calculatedTotalSeats !== validatedData.totalSeats) {
      return res.status(400).json({
        success: false,
        message: 'Total seats must match sum of seater, sleeper, and upper deck seats',
      });
    }
    
    const busLayout = await prisma.busLayout.update({
      where: { id },
      data: validatedData,
      include: {
        vehicles: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
          },
        },
      },
    });
    
    res.json({
      success: true,
      message: 'Bus layout updated successfully',
      data: busLayout,
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
      message: error.message || 'Error updating bus layout',
    });
  }
};

// Delete bus layout
const deleteBusLayout = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if layout is being used by any vehicles
    const vehiclesUsingLayout = await prisma.vehicle.count({
      where: { busLayoutId: id },
    });

    if (vehiclesUsingLayout > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bus layout as it is being used by vehicles',
      });
    }
    
    await prisma.busLayout.delete({
      where: { id },
    });
    
    res.json({
      success: true,
      message: 'Bus layout deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting bus layout',
    });
  }
};

module.exports = {
  getAllBusLayouts,
  getBusLayoutById,
  createBusLayout,
  updateBusLayout,
  deleteBusLayout,
}; 