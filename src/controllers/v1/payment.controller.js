const getStripeInstance = require('../../config/stripe');
const prisma = require('../../lib/prisma');
const { ApiError } = require('../../utils/ApiError');
const { ApiResponse } = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// Create payment intent
const createPaymentIntent = asyncHandler(async (req, res) => {
  const bookingData = req.body;

  if (!bookingData || !bookingData.finalAmount) {
    throw new ApiError(400, 'Invalid booking data');
  }

  try {
    const stripe = await getStripeInstance(); // Get Stripe instance dynamically
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(bookingData.finalAmount * 100), // Convert to cents
      currency: 'bdt',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        bookingData: JSON.stringify(bookingData),
      },
    });

    return res.json(
      new ApiResponse(200, {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    );
  } catch (error) {
    console.error('Stripe payment intent creation error:', error);
    throw new ApiError(500, 'Failed to create payment intent');
  }
});

// Create booking after successful payment
const createBookingAfterPayment = asyncHandler(async (req, res) => {
  const bookingData = req.body;
  const { paymentIntentId } = bookingData;

  if (!paymentIntentId) {
    throw new ApiError(400, 'Payment intent ID is required');
  }

  try {
    const stripe = await getStripeInstance(); // Get Stripe instance dynamically
    // Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new ApiError(400, 'Payment has not been completed');
    }

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        vehicleId: bookingData.vehicleId,
        vendorId: bookingData.vendorId,
        routeId: bookingData.routeId,
        userId: req.user.id,
        boardingPointId: bookingData.boardingPointId,
        droppingPointId: bookingData.droppingPointId,
        bookingDate: new Date(bookingData.bookingDate),
        seatNumbers: bookingData.seatNumbers,
        totalAmount: bookingData.totalAmount,
        discountAmount: bookingData.discountAmount || 0,
        finalAmount: bookingData.finalAmount,
        paymentMethod: 'STRIPE',
        paymentStatus: 'PAID',
        status: 'CONFIRMED',
        paymentIntentId,
      },
    });

    return res.json(
      new ApiResponse(200, { success: true, booking }, 'Booking created successfully')
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    throw new ApiError(500, 'Failed to create booking');
  }
});

module.exports = {
  createPaymentIntent,
  createBookingAfterPayment,
}; 