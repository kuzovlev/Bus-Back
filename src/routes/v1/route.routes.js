const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getAllRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
} = require('../../controllers/v1/route.controller');

const router = express.Router();

// Public routes
router.get('/', getAllRoutes);
router.get('/:id', getRouteById);

// Protected routes (Admin only)
router.post('/', isAuthenticated, isAdmin, createRoute);
router.put('/:id', isAuthenticated, isAdmin, updateRoute);
router.delete('/:id', isAuthenticated, isAdmin, deleteRoute);

module.exports = router; 