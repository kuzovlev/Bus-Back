const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const {
  getAllAmenities,
  getAmenityById,
  createAmenity,
  updateAmenity,
  deleteAmenity,
} = require('../../controllers/v1/amenities.controller');

// Public routes
router.get('/', getAllAmenities);
router.get('/:id', getAmenityById);

// Protected routes (Admin only)
router.use(isAuthenticated, isAdmin);
router.post('/', upload.single('icon'), createAmenity);
router.put('/:id', upload.single('icon'), updateAmenity);
router.delete('/:id', deleteAmenity);

module.exports = router; 