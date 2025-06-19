const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  getBookingsByVehicleAndDate
} = require('../../controllers/v1/booking.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');

// Public route for checking vehicle bookings
router.get('/vehicle/:vehicleId', getBookingsByVehicleAndDate);

// All other routes are protected
router.use(isAuthenticated);

// Booking routes
router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/:id', getBookingById);
router.patch('/:id', updateBooking);
router.delete('/:id', deleteBooking);

module.exports = router; 