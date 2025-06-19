// backend/src/controllers/v1/driver-vehicle-assigned.controller.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require('zod');

// Validation schema
const assignmentSchema = z.object({
  driverId: z.string(),
  vehicleId: z.string(),
  assignedFrom: z.string().transform((str) => new Date(str)),
  assignedTo: z.string().optional().transform((str) => str ? new Date(str) : null),
  status: z.enum(['ACTIVE', 'INACTIVE', 'COMPLETED']).default('ACTIVE'),
});

const getAllAssignments = async (req, res) => {
  const { page = 1, limit = 10, search = '' } = req.query;
  const vendorId = req.user.id;

  try {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = {
      vendorId,
      ...(search && {
        OR: [
          { driver: { name: { contains: search, mode: 'insensitive' } } },
          { vehicle: { vehicleName: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [assignments, totalCount] = await Promise.all([
      prisma.driverVehicleAssigned.findMany({
        where,
        skip,
        take,
        include: {
          driver: {
            select: {
              id: true,
              name: true,
              phone: true,
              licenseNumber: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              vehicleName: true,
              vehicleNumber: true,
              vehicleType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.driverVehicleAssigned.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          totalCount,
          totalPages: Math.ceil(totalCount / take),
          currentPage: Number(page),
          limit: take,
        },
      },
    });
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments',
      error: error.message,
    });
  }
};

const createAssignment = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const validatedData = assignmentSchema.parse(req.body);

    // Check if driver is already assigned
    const existingAssignment = await prisma.driverVehicleAssigned.findFirst({
      where: {
        driverId: validatedData.driverId,
        status: 'ACTIVE',
      },
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Driver is already assigned to a vehicle',
      });
    }

    // Check if vehicle is already assigned
    const existingVehicleAssignment = await prisma.driverVehicleAssigned.findFirst({
      where: {
        vehicleId: validatedData.vehicleId,
        status: 'ACTIVE',
      },
    });

    if (existingVehicleAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is already assigned to a driver',
      });
    }

    const assignment = await prisma.driverVehicleAssigned.create({
      data: {
        ...validatedData,
        vendorId,
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleType: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error in createAssignment:', error);
    return res.status(400).json({
      success: false,
      message: 'Failed to create assignment',
      error: error.message,
    });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const validatedData = assignmentSchema.parse(req.body);

    // Check if assignment exists and belongs to vendor
    const existingAssignment = await prisma.driverVehicleAssigned.findFirst({
      where: { id, vendorId },
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    const assignment = await prisma.driverVehicleAssigned.update({
      where: { id },
      data: validatedData,
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            licenseNumber: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleType: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    console.error('Error in updateAssignment:', error);
    return res.status(400).json({
      success: false,
      message: 'Failed to update assignment',
      error: error.message,
    });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    // Check if assignment exists and belongs to vendor
    const existingAssignment = await prisma.driverVehicleAssigned.findFirst({
      where: { id, vendorId },
    });

    if (!existingAssignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    await prisma.driverVehicleAssigned.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteAssignment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete assignment',
      error: error.message,
    });
  }
};

const getDriversForVendor = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const drivers = await prisma.driver.findMany({
      where: {
        vendorId,
        status: 'ACTIVE',
        NOT: {
          DriverVehicleAssigned: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        licenseNumber: true,
      },
    });

    return res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error('Error in getDriversForVendor:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch drivers',
      error: error.message,
    });
  }
};

const getVehiclesForUser = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const vehicles = await prisma.vehicle.findMany({
      where: {
        userId: vendorId,
        vehicleStatus: 'AVAILABLE',
        NOT: {
          DriverVehicleAssigned: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
      },
      select: {
        id: true,
        vehicleName: true,
        vehicleNumber: true,
        vehicleType: true,
      },
    });

    return res.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error('Error in getVehiclesForUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message,
    });
  }
};

module.exports = {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getDriversForVendor,
  getVehiclesForUser,
};