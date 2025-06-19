const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const {
  getAllCustomFields,
  getCustomFieldById,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  getCustomFieldByName,
} = require('../../controllers/v1/custom-fields.controller');

// Public routes
router.get('/', getAllCustomFields);
router.get('/name/:name', getCustomFieldByName);

// Protected routes (Admin only)
router.use(isAuthenticated, isAdmin);
router.post('/', createCustomField);
router.get('/:id', getCustomFieldById);
router.put('/:id', updateCustomField);
router.delete('/:id', deleteCustomField);

module.exports = router; 