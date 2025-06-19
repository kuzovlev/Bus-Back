const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getAllBusLayouts,
  getBusLayoutById,
  createBusLayout,
  updateBusLayout,
  deleteBusLayout,
} = require('../../controllers/v1/bus-layout.controller');

// Public routes
router.get('/', getAllBusLayouts);
router.get('/:id', getBusLayoutById);

// Protected routes (Admin only)
router.use(isAuthenticated, isAdmin);
router.post('/', createBusLayout);
router.put('/:id', updateBusLayout);
router.delete('/:id', deleteBusLayout);

module.exports = router; 