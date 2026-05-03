const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const CollectionHead = require('../models/CollectionHead');
const generateToken = require('../utils/generateToken');

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  let user = await Admin.findOne({ username });
  let role = 'admin';

  if (!user) {
    user = await CollectionHead.findOne({ username });
    role = 'collection_head';
  }

  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user._id,
      name: user.name || user.fullName,
      username: user.username,
      role: user.role,
      assignedCenter: user.assignedCenter,
      token: generateToken(user._id, user.role)
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

module.exports = { login, createAdmin };
