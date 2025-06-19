const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./user.routes');
const routeRoutes = require('./route.routes');
const boardingPointRoutes = require('./boarding-point.routes');
const droppingPointRoutes = require('./dropping-point.routes');
const vendorRoutes = require('./vendor.routes');
const busLayoutRoutes = require('./bus-layout.routes');
const busScheduleRoutes = require('./bus-schedule.routes');
const vehicleRoutes = require('./vehicle.routes');
const amenitiesRoutes = require('./amenities.routes');
const categoryRoutes = require('./category.routes');
const incomeExpenseRoutes = require('./income-expense.routes');
const driverRoutes = require('./driver.routes');
const driverVehicleAssignedRoutes = require('./driver-vehicle-assigned.routes');
const publicWebRoutes = require('./public-web.routes');
const bookingRoutes = require('./booking.routes');
const mobileAuthRoutes = require('./mobile-auth.routes');
const paymentRoutes = require('./payment.routes');
const dashboardRoutes = require('./dashboard.routes');
const customFieldsRoutes = require('./custom-fields.routes');
const settingsRoutes = require('./settings.routes');

// Public routes (no authentication required)
router.use('/public', publicWebRoutes);

// Protected routes (require authentication)
router.use('/auth', userRoutes);
router.use('/routes', routeRoutes);
router.use('/boarding-points', boardingPointRoutes);
router.use('/dropping-points', droppingPointRoutes);
router.use('/vendors', vendorRoutes);
router.use('/bus-layouts', busLayoutRoutes);
router.use('/bus-schedules', busScheduleRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/amenities', amenitiesRoutes);
router.use('/categories', categoryRoutes);
router.use('/income-expenses', incomeExpenseRoutes);
router.use('/drivers', driverRoutes);
router.use('/driver-vehicle-assigned', driverVehicleAssignedRoutes);
router.use('/bookings', bookingRoutes);
router.use('/mobile-auth', mobileAuthRoutes);
router.use('/payments', paymentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/custom-fields', customFieldsRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;