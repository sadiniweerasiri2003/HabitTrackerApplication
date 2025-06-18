const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  getProfile,
  updateProfile,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.use(protect); // Apply authentication middleware to all routes below
router.get('/me', getMe);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
