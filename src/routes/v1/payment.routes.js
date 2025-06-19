const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { createPaymentIntent, createBookingAfterPayment } = require('../../controllers/v1/payment.controller');

// Create payment intent
router.post('/create-intent', isAuthenticated, createPaymentIntent);

// Create booking after successful payment
router.post('/create-booking', isAuthenticated, createBookingAfterPayment);

module.exports = router; 