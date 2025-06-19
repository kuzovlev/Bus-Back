const prisma = require('../../lib/prisma');
const { ApiError } = require('../../utils/ApiError');
const { ApiResponse } = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// Get dashboard statistics based on user role
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const { role, id } = req.user;
    let stats = {};

    // Base query conditions for role-based filtering
    let baseConditions = {};
    
    if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findFirst({
        where: { userId: id }
      });
      
      if (!vendor) {
        throw new ApiError(404, "Vendor not found");
      }
      
      baseConditions = {
        vendorId: id  // Using the user's id directly since vendorId in bookings references User table
      };
    } else if (role === 'USER') {
      baseConditions = {
        userId: id
      };
    }

    // Get total bookings with proper conditions
    const totalBookings = await prisma.booking.count({
      where: baseConditions
    });

    // Get total revenue with proper conditions
    const revenue = await prisma.booking.aggregate({
      where: {
        ...baseConditions,
        paymentStatus: 'PAID'
      },
      _sum: {
        finalAmount: true
      }
    });

    // Get upcoming trips for users
    let upcomingTrips = 0;
    if (role === 'USER') {
      upcomingTrips = await prisma.booking.count({
        where: {
          userId: id,
          bookingDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // next 30 days
          }
        }
      });
    }

    // Get recent bookings with proper includes
    const recentBookings = await prisma.booking.findMany({
      where: baseConditions,
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        vehicle: {
          select: {
            id: true,
            vehicleName: true,
            vehicleNumber: true,
            vehicleType: true,
            hasAc: true,
            route: {
              select: {
                id: true,
                sourceCity: true,
                destinationCity: true
              }
            }
          }
        }
      }
    });

    // Role-specific statistics
    if (role === 'ADMIN') {
      const [totalUsers, totalVendors, totalVehicles, totalRoutes] = await Promise.all([
        prisma.user.count(),
        prisma.vendor.count(),
        prisma.vehicle.count(),
        prisma.route.count()
      ]);

      stats = {
        ...stats,
        totalUsers,
        totalVendors,
        totalVehicles,
        totalRoutes
      };
    } else if (role === 'VENDOR') {
      const [totalVehicles, totalDrivers] = await Promise.all([
        prisma.vehicle.count({
          where: { userId: id }  // Changed from vendorId to userId
        }),
        prisma.driver.count({
          where: { vendorId: id }  // This is correct as it references the user's id
        })
      ]);

      stats = {
        ...stats,
        totalVehicles,
        totalDrivers
      };
    }

    // Common statistics
    stats = {
      ...stats,
      totalBookings,
      totalRevenue: revenue._sum.finalAmount || 0,
      recentBookings,
      upcomingTrips
    };

    return res.json(
      new ApiResponse(200, stats, "Dashboard statistics retrieved successfully")
    );
  } catch (error) {
    console.error('Dashboard Error:', error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error retrieving dashboard statistics"
    );
  }
});

module.exports = {
  getDashboardStats
}; 