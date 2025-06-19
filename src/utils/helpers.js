const bcrypt = require('bcryptjs');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Format phone number for Twilio
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number with country code
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // If number starts with '0', replace it with country code
  if (digits.startsWith('0')) {
    return '+880' + digits.slice(1); // Bangladesh country code
  }
  
  // If number doesn't start with '+', add it
  if (!phoneNumber.startsWith('+')) {
    return '+' + digits;
  }
  
  return phoneNumber;
};

module.exports = {
  generateOTP,
  hashPassword,
  formatPhoneNumber,
}; 