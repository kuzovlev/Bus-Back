const express = require('express');
const router = express.Router();
const {
  getCities,
  searchRoutes,
  getVehiclesByRouteId,
} = require('../../controllers/v1/public-web.controller');

// Public routes for web
router.get('/cities', getCities);
router.get('/search-routes', searchRoutes);
router.get('/vehicles/:routeId', getVehiclesByRouteId);

module.exports = router;
