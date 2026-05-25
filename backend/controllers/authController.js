const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const CollectionCenter = require('../models/CollectionCenter');
const Farmer = require('../models/Farmer');
const generateToken = require('../utils/generateToken');

// ── Validation helpers ────────────────────────────────────────────────────────

const isValidIndianMobile = (num) => /^[6-9]\d{9}$/.test(String(num || '').trim());

// ── Login ─────────────────────────────────────────────────────────────────────

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error('Username and password are required');
  }

  const usernameClean = String(username).trim();
  const passwordClean = String(password).trim();

  // 1. Try Admin
  let user = await Admin.findOne({ username: usernameClean });
  if (user) {
    if (!(await user.matchPassword(passwordClean))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    return res.json({
      id: user._id,
      name: user.name,
      username: user.username,
      phoneNumber: user.phoneNumber,
      role: 'admin',
      token: generateToken(user._id, 'admin')
    });
  }

  // 2. Try Collection Head
  const center = await CollectionCenter.findOne({ 'collectionHead.username': usernameClean });
  if (center) {
    const collectionHead = center.collectionHead;
    if (!collectionHead?.username || !collectionHead?.password) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    if (collectionHead.status !== 'Active') {
      res.status(403);
      throw new Error('Collection head account is inactive');
    }
    if (!(await bcrypt.compare(passwordClean, collectionHead.password))) {
      res.status(401);
      throw new Error('Invalid credentials');
    }
    return res.json({
      id: center._id,
      name: collectionHead.fullName || center.name,
      username: collectionHead.username,
      phoneNumber: collectionHead.mobileNumber,
      role: 'collection_head',
      assignedCenter: center._id,
      token: generateToken(center._id, 'collection_head')
    });
  }

  // 3. Try Farmer (username = mobile number)
  if (isValidIndianMobile(usernameClean)) {
    const farmer = await Farmer.findOne({ mobileNumber: usernameClean })
      .populate('assignedCenter', 'name centerCode');

    if (farmer) {
      if (!farmer.loginEnabled) {
        res.status(403);
        throw new Error('Farmer login is not enabled. Please contact admin.');
      }
      if (farmer.status !== 'Active') {
        res.status(403);
        throw new Error('Your account is inactive. Please contact admin.');
      }
      if (!farmer.loginPassword) {
        res.status(403);
        throw new Error('Password not set. Please contact admin.');
      }
      if (!(await farmer.matchPassword(passwordClean))) {
        res.status(401);
        throw new Error('Invalid credentials');
      }
      return res.json({
        id: farmer._id,
        name: farmer.fullName,
        username: farmer.mobileNumber,
        phoneNumber: farmer.mobileNumber,
        role: 'farmer',
        farmerId: farmer._id,
        farmerCode: farmer.farmerCode,
        assignedCenter: farmer.assignedCenter?._id,
        centerName: farmer.assignedCenter?.name,
        animalType: farmer.animalType,
        token: generateToken(farmer._id, 'farmer')
      });
    }
  }

  res.status(401);
  throw new Error('Invalid credentials');
});

// ── Create Admin ──────────────────────────────────────────────────────────────

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

// ── Change Password (Admin / Collection Head only) ────────────────────────────

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Farmers cannot change their own password
  if (userRole === 'farmer') {
    res.status(403);
    throw new Error('Farmers cannot change their own password. Please contact admin.');
  }

  let user;
  if (userRole === 'admin') {
    user = await Admin.findById(userId);
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
  } else if (userRole === 'collection_head') {
    user = await CollectionCenter.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    user.collectionHead.password = newPassword;
    await user.save();
  }

  res.json({ message: 'Password changed successfully' });
});

// ── Update Profile ────────────────────────────────────────────────────────────

const updateProfile = asyncHandler(async (req, res) => {
  const { name, username, phoneNumber } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Farmers cannot update profile via this endpoint
  if (userRole === 'farmer') {
    res.status(403);
    throw new Error('Farmers cannot update profile via this endpoint.');
  }

  let user;
  if (userRole === 'admin') {
    user = await Admin.findById(userId);
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
  } else if (userRole === 'collection_head') {
    user = await CollectionCenter.findById(userId);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (name) user.collectionHead.fullName = name;
    if (username) user.collectionHead.username = username;
    if (phoneNumber !== undefined) user.collectionHead.mobileNumber = phoneNumber;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.collectionHead.fullName,
        username: user.collectionHead.username,
        phoneNumber: user.collectionHead.mobileNumber,
        role: 'collection_head'
      }
    });
  }
});

// ── Admin: Set / Update Common Farmer Password ────────────────────────────────

const setFarmerPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || String(password).trim().length < 4) {
    res.status(400);
    throw new Error('Password must be at least 4 characters');
  }

  const plainPassword = String(password).trim();

  // Hash once and apply to ALL farmers
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  const result = await Farmer.updateMany(
    {},
    { $set: { loginPassword: hashedPassword } }
  );

  res.json({
    message: `Common farmer password updated successfully for ${result.modifiedCount} farmers`,
    modifiedCount: result.modifiedCount
  });
});

// ── Admin: Toggle Farmer Login ────────────────────────────────────────────────

const toggleFarmerLogin = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { loginEnabled } = req.body;

  if (typeof loginEnabled !== 'boolean') {
    res.status(400);
    throw new Error('loginEnabled must be a boolean');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  farmer.loginEnabled = loginEnabled;
  // Set loginUsername to mobileNumber for clarity
  if (loginEnabled) {
    farmer.loginUsername = farmer.mobileNumber;
  }
  await farmer.save();

  res.json({
    message: `Farmer login ${loginEnabled ? 'enabled' : 'disabled'} successfully`,
    farmerId: farmer._id,
    loginEnabled: farmer.loginEnabled
  });
});

// ── Admin: Enable All Farmers Login ──────────────────────────────────────────

const enableAllFarmersLogin = asyncHandler(async (req, res) => {
  const result = await Farmer.updateMany(
    {},
    { $set: { loginEnabled: true } }
  );

  // Also set loginUsername = mobileNumber for all
  const farmers = await Farmer.find({}, 'mobileNumber');
  const bulkOps = farmers.map((f) => ({
    updateOne: {
      filter: { _id: f._id },
      update: { $set: { loginUsername: f.mobileNumber } }
    }
  }));
  if (bulkOps.length > 0) {
    await Farmer.bulkWrite(bulkOps);
  }

  res.json({
    message: `Login enabled for ${result.modifiedCount} farmers`,
    modifiedCount: result.modifiedCount
  });
});

// ── Save Push Notification Token (All Users) ─────────────────────────────────

const savePushToken = asyncHandler(async (req, res) => {
  const { expoPushToken } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  if (!expoPushToken || !String(expoPushToken).startsWith('ExponentPushToken[')) {
    res.status(400);
    throw new Error('Invalid Expo push token format');
  }

  if (userRole === 'farmer') {
    const farmer = await Farmer.findById(userId);
    if (!farmer) {
      res.status(404);
      throw new Error('Farmer not found');
    }

    farmer.expoPushToken = expoPushToken;
    farmer.pushTokenUpdatedAt = new Date();
    await farmer.save();

    console.log(`✅ Push token saved for farmer: ${farmer.fullName}`);
  } else if (userRole === 'collection_head') {
    const center = await CollectionCenter.findById(userId);
    if (!center) {
      res.status(404);
      throw new Error('Collection center not found');
    }

    center.collectionHead.expoPushToken = expoPushToken;
    center.collectionHead.pushTokenUpdatedAt = new Date();
    await center.save();

    console.log(`✅ Push token saved for collection head: ${center.collectionHead.fullName}`);
  } else if (userRole === 'admin') {
    const admin = await Admin.findById(userId);
    if (!admin) {
      res.status(404);
      throw new Error('Admin not found');
    }

    admin.expoPushToken = expoPushToken;
    admin.pushTokenUpdatedAt = new Date();
    await admin.save();

    console.log(`✅ Push token saved for admin: ${admin.name}`);
  } else {
    res.status(400);
    throw new Error('Invalid user role');
  }

  res.json({
    success: true,
    message: 'Push token saved successfully'
  });
});

module.exports = {
  login,
  createAdmin,
  changePassword,
  updateProfile,
  setFarmerPassword,
  toggleFarmerLogin,
  enableAllFarmersLogin,
  savePushToken
};
