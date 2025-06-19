const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdminOrVendor } = require('../../middleware/role.middleware');
const {
  getAllBusSchedules,
  getBusScheduleById,
  createBusSchedule,
  updateBusSchedule,
  deleteBusSchedule,
} = require('../../controllers/v1/bus-schedule.controller');


router.use(isAuthenticated, isAdminOrVendor);
// Public routes
router.get('/', getAllBusSchedules);
router.get('/:id', getBusScheduleById);

// Protected routes (Admin or Vendor only)

router.post('/', createBusSchedule);
router.put('/:id', updateBusSchedule);
router.delete('/:id', deleteBusSchedule);

module.exports = router; 