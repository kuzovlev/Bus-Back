const express = require('express');
const router = express.Router();
const {
    createDriver,
    getAllDrivers,
    updateDriver,
    deleteDriver,
    getVehiclesForDropdown,
} = require('../../controllers/v1/driver.controller');

const { isAdmin, isVendor } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdminOrVendor } = require('../../middleware/role.middleware');

router.use(isAuthenticated, isAdminOrVendor);

// Protected routes for Driver
router.post('/', upload.fields([
    { name: 'driverPhoto', maxCount: 1 },
    { name: 'driverLicenseBack', maxCount: 1 },
    { name: 'driverLicenseFront', maxCount: 1 }
]), createDriver);
router.get('/',  getAllDrivers);
router.patch('/:id', updateDriver);
router.delete('/:id', deleteDriver);

// Route to get vehicles for dropdown
router.get('/vehicles');

module.exports = router; 