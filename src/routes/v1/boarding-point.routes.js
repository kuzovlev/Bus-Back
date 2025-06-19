const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getAllBoardingPoints,
  getBoardingPointById,
  createBoardingPoint,
  updateBoardingPoint,
  deleteBoardingPoint,
} = require('../../controllers/v1/boarding-point.controller');

const router = express.Router();

// Public routes
router.get('/', getAllBoardingPoints);
router.get('/:id', getBoardingPointById);

// Protected routes (Admin only)
router.post('/', isAuthenticated, isAdmin, createBoardingPoint);
router.put('/:id', isAuthenticated, isAdmin, updateBoardingPoint);
router.delete('/:id', isAuthenticated, isAdmin, deleteBoardingPoint);

module.exports = router; 