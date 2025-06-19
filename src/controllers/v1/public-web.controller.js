const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { z } = require("zod");

// Get all unique source and destination cities
const getCities = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      select: {
        sourceCity: true,
        destinationCity: true,
        id: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      data: routes,
    });
  } catch (error) {
    console.error("Error in getCities:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching cities",
      error: error.message,
    });
  }
};

// Get vehicle information by routeId
const getVehiclesByRouteId = async (req, res) => {
  try {
    // Validate route ID
    const routeIdSchema = z.object({
      routeId: z.string().min(1, "Route ID is required"),
    });

    // Validate query parameters
    const querySchema = z.object({
      page: z.string().optional().transform(val => parseInt(val) || 1),
      sort: z.enum(['LOW_TO_HIGH', 'HIGH_TO_LOW']).optional().default('LOW_TO_HIGH'),
    });

    const { routeId } = routeIdSchema.parse(req.params);
    const { page, sort } = querySchema.parse(req.query);

    const limit = 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({
        where: {
          routeId,
          vehicleStatus: "AVAILABLE",
        },
      }),
      prisma.vehicle.findMany({
        where: {
          routeId,
          vehicleStatus: "AVAILABLE",
        },
        include: {
          route: {
            include: {
              boardingPoints: true,
              droppingPoints: true,
            },
          },
          layout: true,
          schedules: {
            where: {
              status: "ACTIVE",
            },
          },
          user: {
            include: {
              vendor: true,
            },
          },
          bookings: true,
        },
        orderBy: {
          layout: {
            seaterPrice: sort === 'LOW_TO_HIGH' ? 'asc' : 'desc',
          },
        },
        skip,
        take: limit,
      }),
    ]);

    if (!vehicles.length) {
      return res.status(404).json({
        success: false,
        message: "No vehicles found for this route",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      data: vehicles,
      pagination: {
        total,
        page,
        limit,
        hasMore: total > skip + vehicles.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error in getVehiclesByRouteId:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Search routes by source and destination
const searchRoutes = async (req, res) => {
  try {
    const searchSchema = z.object({
      sourceCity: z.string().min(1, "Source city is required"),
      destinationCity: z.string().min(1, "Destination city is required"),
      date: z.string().optional(),
    });

    const validatedData = searchSchema.parse(req.query);
    const { sourceCity, destinationCity, date } = validatedData;

    const routes = await prisma.route.findMany({
      where: {
        sourceCity: {
          contains: sourceCity,
          mode: 'insensitive'
        },
        destinationCity: {
          contains: destinationCity,
          mode: 'insensitive'
        },
        isActive: true,
      },
      include: {
        boardingPoints: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        droppingPoints: {
          select: {
            id: true,
            name: true,
            time: true,
          },
        },
        busSchedules: {
          where: date ? {
            departureDate: {
              gte: new Date(date),
              lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
            },
            isActive: true,
          } : {
            isActive: true,
          },
          include: {
            vehicles: {
              select: {
                id: true,
                registrationNumber: true,
                layout: {
                  select: {
                    id: true,
                    layoutName: true,
                    totalSeats: true,
                    sleeperSeats: true,
                    seaterSeats: true,
                    sleeperPrice: true,
                    seaterPrice: true,
                  },
                },
                user: {
                  select: {
                    id: true,
                    name: true,
                    vendor: {
                      select: {
                        id: true,
                        companyName: true,
                        companyLogo: true,
                        rating: true,
                        totalTrips: true,
                      }
                    }
                  }
                }
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully",
      data: routes,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.errors,
      });
    }

    console.error("Error in searchRoutes:", error);
    return res.status(500).json({
      success: false,
      message: "Error searching routes",
      error: error.message,
    });
  }
};

module.exports = {
  getCities,
  searchRoutes,
  getVehiclesByRouteId,
};
