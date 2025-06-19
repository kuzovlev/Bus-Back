// backend/src/routes/v1/mobile-auth.routes.js
const express = require('express');
const router = express.Router();
const {
  mobileRegister,
  mobileLogin,
  sendOtp,
} = require('../../controllers/v1/mobile-auth.controller');

// Mobile auth routes
router.post('/register', mobileRegister);
router.post('/login', mobileLogin);
router.post('/send-otp', sendOtp);

module.exports = router;