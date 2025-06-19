const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
} = require('../../controllers/v1/vendor.controller');

// All routes require authentication and admin role
router.use(isAuthenticated, isAdmin);

// Get all vendors with pagination
router.get('/', getAllVendors);

// Get vendor by ID
router.get('/:id', getVendorById);

// Create new vendor with logo upload
router.post('/', upload.single('businessLogo'), createVendor);

// Update vendor with logo upload
router.put('/:id', upload.single('businessLogo'), updateVendor);

// Delete vendor
router.delete('/:id', deleteVendor);

module.exports = router; 