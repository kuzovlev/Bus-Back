const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');
const {
  getAllSettings,
  getSettingById,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
} = require('../../controllers/v1/settings.controller');

// Public routes
router.get('/key/:keyName', getSettingByKey);

// Protected routes (Admin only)
router.use(isAuthenticated, isAdmin);
router.get('/', getAllSettings);
router.post('/', upload.single('file'), createSetting);
router.get('/:id', getSettingById);
router.put('/:id', upload.single('file'), updateSetting);
router.delete('/:id', deleteSetting);

module.exports = router; 