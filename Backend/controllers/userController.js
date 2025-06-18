const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  if (user) {
    res.status(201).json({
      _id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const { _id, username, email } = req.user;
  res.status(200).json({
    id: _id,
    username,
    email,
  });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const user = await User.findById(req.user.id)
    .select('-password -__v')
    .lean();

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Add additional user stats
  const profile = {
    ...user,
    lastLogin: req.user.lastLogin || user.createdAt,
    // Add any additional profile information here
  };

  res.status(200).json(profile);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  console.log('Update Profile Request Body:', req.body); // Add logging

  if (!req.user || !req.user.id) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { username, email, currentPassword, newPassword } = req.body;
  console.log('Extracted fields:', { username, email }); // Add logging

  // Validate required fields
  if (!username && !email && !newPassword) {
    res.status(400);
    throw new Error('No fields to update');
  }

  // Validate email format if provided
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  // Check if email is already in use by another user
  if (email && email !== user.email) {
    const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
    if (emailExists) {
      res.status(400);
      throw new Error('Email already in use');
    }
  }

  // Check if username is already in use by another user
  if (username && username !== user.username) {
    const usernameExists = await User.findOne({ username, _id: { $ne: user._id } });
    if (usernameExists) {
      res.status(400);
      throw new Error('Username already in use');
    }
  }

  // Handle password change
  if (newPassword) {
    // Require current password for security
    if (!currentPassword) {
      res.status(400);
      throw new Error('Please provide current password to set new password');
    }

    // Validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
  }

  // Update user fields
  if (username) {
    console.log('Updating username to:', username); // Add logging
    user.username = username;
  }
  if (email) {
    console.log('Updating email to:', email); // Add logging
    user.email = email;
  }
  try {
    // Save changes
    const updatedUser = await user.save();
    console.log('User updated successfully:', updatedUser); // Add logging

    // Return updated user data
    res.status(200).json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500);
    throw new Error('Failed to update profile: ' + error.message);
  }

  // Return updated profile without sensitive information
  res.status(200).json({
    _id: updatedUser._id,
    username: updatedUser.username,
    email: updatedUser.email,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
  });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getProfile,
  updateProfile,
};
