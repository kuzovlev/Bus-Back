const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  changePassword,
} = require('../../controllers/v1/user.controller');
const { isAuthenticated } = require('../../middleware/auth.middleware');
const { isAdmin } = require('../../middleware/role.middleware');
const upload = require('../../config/multer');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', isAuthenticated, getProfile);
router.put('/profile', isAuthenticated, upload.single('avatar'), updateProfile);
router.post('/change-password', isAuthenticated, changePassword);

// Admin routes
router.get('/', isAuthenticated, isAdmin, getAllUsers);
router.get('/:id', isAuthenticated, isAdmin, getUserById);
router.put('/:id', isAuthenticated, isAdmin, updateUser);
router.delete('/:id', isAuthenticated, isAdmin, deleteUser);

module.exports = router; 