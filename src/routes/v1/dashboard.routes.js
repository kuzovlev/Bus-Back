const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../../controllers/v1/dashboard.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');

router.use(isAuthenticated);

router.route('/stats').get(getDashboardStats);

module.exports = router; 