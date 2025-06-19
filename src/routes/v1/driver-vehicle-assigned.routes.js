// backend/src/routes/v1/driver-vehicle-assigned.routes.js
const express = require('express');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const {
  getAllAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getDriversForVendor,
  getVehiclesForUser,
} = require('../../controllers/v1/driver-vehicle-assigned.controller');

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Routes
router.get('/', getAllAssignments);
router.post('/', createAssignment);
router.put('/:id', updateAssignment);
router.delete('/:id', deleteAssignment);

// New routes for fetching drivers and vehicles
router.get('/drivers', getDriversForVendor);
router.get('/vehicles', getVehiclesForUser);

module.exports = router;