const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getAllDroppingPoints,
  getDroppingPointById,
  createDroppingPoint,
  updateDroppingPoint,
  deleteDroppingPoint,
} = require('../../controllers/v1/dropping-point.controller');

const router = express.Router();

// Public routes
router.get('/', getAllDroppingPoints);
router.get('/:id', getDroppingPointById);

// Protected routes (Admin only)
router.post('/', isAuthenticated, isAdmin, createDroppingPoint);
router.put('/:id', isAuthenticated, isAdmin, updateDroppingPoint);
router.delete('/:id', isAuthenticated, isAdmin, deleteDroppingPoint);

module.exports = router; 