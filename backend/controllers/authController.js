const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const CollectionCenter = require('../models/CollectionCenter');
const generateToken = require('../utils/generateToken');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  let user = await Admin.findOne({ username });
  let role = 'admin';

  if (!user) {
    user = await CollectionCenter.findOne({ 'collectionHead.username': username });
    role = 'collection_head';
  }

  if (user) {
    if (role === 'admin') {
      if (!(await user.matchPassword(password))) {
        res.status(401);
        throw new Error('Invalid credentials');
      }
    } else {
      const collectionHead = user.collectionHead;
      if (!collectionHead?.username || !collectionHead?.password) {
        res.status(401);
        throw new Error('Invalid credentials');
      }
      if (collectionHead.status !== 'Active') {
        res.status(403);
        throw new Error('Collection head account is inactive');
      }
      const storedPassword = collectionHead.password;
      if (!storedPassword || !(await bcrypt.compare(password, storedPassword))) {
        res.status(401);
        throw new Error('Invalid credentials');
      }
    }

    res.json({
      id: user._id,
      name: role === 'admin' ? user.name : user.collectionHead?.fullName || user.name,
      username: role === 'admin' ? user.username : user.collectionHead?.username,
      phoneNumber: role === 'admin' ? user.phoneNumber : user.collectionHead?.mobileNumber,
      role,
      assignedCenter: role === 'admin' ? undefined : user._id,
      token: generateToken(user._id, role)
    });
  } else {
    res.status(401);
    throw new Error('Invalid credentials');
  }
});

const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, username, password } = req.body;
  const existing = await Admin.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(400);
    throw new Error('Admin with this email or username already exists');
  }
  const admin = await Admin.create({ name, email, username, password });
  res.status(201).json({
    id: admin._id,
    name: admin.name,
    email: admin.email,
    username: admin.username,
    role: admin.role
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  let user;
  if (userRole === 'admin') {
    user = await Admin.findById(userId);
  } else if (userRole === 'collection_head') {
    user = await CollectionCenter.findById(userId);
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, phoneNumber } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  let user;
  if (userRole === 'admin') {
    user = await Admin.findById(userId);
  } else if (userRole === 'collection_head') {
    user = await CollectionCenter.findById(userId);
  }

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (username) user.username = username;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

  await user.save();

  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user._id,
      name: user.name,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: user.role
    }
  });
});

module.exports = { login, createAdmin, changePassword, updateProfile };
