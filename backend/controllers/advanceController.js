const asyncHandler = require('express-async-handler');
const Advance = require('../models/Advance');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const { sendAdvanceNotification } = require('../services/notificationService');

// @desc  Add advance payment (Admin or Collection Head)
// @route POST /api/advances
const addAdvance = asyncHandler(async (req, res) => {
  const { farmerId, advanceAmount, advanceDate, paymentMethod, notes } = req.body;

  if (!farmerId || !advanceAmount || !advanceDate || !paymentMethod) {
    res.status(400);
    throw new Error('farmerId, advanceAmount, advanceDate and paymentMethod are required');
  }

  const farmer = await Farmer.findById(farmerId).populate('assignedCenter');
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  // Collection head can only add advances for farmers in their own center
  if (req.user.role === 'collection_head') {
    const farmerCenterId = farmer.assignedCenter?._id?.toString() || farmer.assignedCenter?.toString();
    const headCenterId   = req.user.assignedCenter?.toString();
    if (farmerCenterId !== headCenterId) {
      res.status(403);
      throw new Error('You can only add advances for farmers in your assigned center');
    }
  }

  // Each advance record tracks its own remainingAmount independently.
  // Total remaining for the farmer = sum of all active advance remainingAmounts.
  const newAmount = Number(advanceAmount);

  const advance = await Advance.create({
    farmerCode: farmer.farmerCode,
    farmerId: farmer._id,
    collectionCenterId: farmer.assignedCenter._id,
    advanceAmount: newAmount,
    remainingAmount: newAmount,   // starts equal to advanceAmount
    advanceDate: new Date(advanceDate),
    paymentMethod,
    notes
  });

  // Total remaining across all active advances (for SMS)
  const allActive = await Advance.aggregate([
    { $match: { farmerId: farmer._id, status: 'Active' } },
    { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
  ]);
  const totalRemaining = allActive[0]?.total || newAmount;

  // In-app notification — fire-and-forget with Marathi template
  const dateStr = new Date(advanceDate).toLocaleDateString('en-IN');
  sendAdvanceNotification(farmer._id, {
    farmerName:    farmer.fullName,
    advanceAmount: newAmount,
    remaining:     totalRemaining,
    date:          dateStr
  });

  res.status(201).json({ success: true, data: advance });
});

// @desc  Add extra amount to an existing advance record
// @route POST /api/advances/:id/add-amount
const addAmountToAdvance = asyncHandler(async (req, res) => {
  const advance = await Advance.findById(req.params.id).populate('farmerId');
  if (!advance) {
    res.status(404);
    throw new Error('Advance record not found');
  }
  if (advance.status === 'Settled') {
    res.status(400);
    throw new Error('Cannot add amount to a settled advance. Create a new advance instead.');
  }

  const { extraAmount, notes } = req.body;
  const extra = Number(extraAmount);
  if (!extra || extra <= 0) {
    res.status(400);
    throw new Error('extraAmount must be a positive number');
  }

  advance.advanceAmount   += extra;
  advance.remainingAmount += extra;
  if (notes) advance.notes = notes;
  await advance.save();

  // Total remaining across all active advances (for SMS)
  const allActive = await Advance.aggregate([
    { $match: { farmerId: advance.farmerId._id, status: 'Active' } },
    { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
  ]);
  const totalRemaining = allActive[0]?.total || advance.remainingAmount;

  // In-app notification — fire-and-forget with Marathi template
  const farmer = advance.farmerId;
  const dateStr = new Date().toLocaleDateString('en-IN');
  sendAdvanceNotification(farmer._id, {
    farmerName:    farmer.fullName,
    advanceAmount: extra,
    remaining:     totalRemaining,
    date:          dateStr
  });

  res.json({ success: true, data: advance });
});

// @desc  Get advances (admin: all / by farmer / by center; head: own center only)
// @route GET /api/advances
const getAdvances = asyncHandler(async (req, res) => {
  const { farmerId, centerId, farmerCode, month, year } = req.query;
  const filter = {};

  if (req.user.role === 'collection_head') {
    filter.collectionCenterId = req.user.assignedCenter;
  } else {
    if (centerId) filter.collectionCenterId = centerId;
  }
  if (farmerId) filter.farmerId = farmerId;
  if (farmerCode) filter.farmerCode = farmerCode;
  if (month && year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    filter.advanceDate = { $gte: start, $lte: end };
  }

  const advances = await Advance.find(filter)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode')
    .sort({ advanceDate: -1 });

  res.json({ success: true, data: advances });
});

// @desc  Get advance details for one farmer
// @route GET /api/advances/farmer/:farmerId
const getFarmerAdvanceDetails = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const advances = await Advance.find({ farmerId })
    .populate('collectionCenterId', 'name centerCode')
    .sort({ advanceDate: -1 });

  const totalGiven = advances.reduce((s, a) => s + a.advanceAmount, 0);
  const totalRemaining = advances.filter(a => a.status === 'Active').reduce((s, a) => s + a.remainingAmount, 0);

  res.json({ success: true, data: { advances, totalGiven, totalRemaining } });
});

// @desc  Update advance (Admin only)
// @route PUT /api/advances/:id
const updateAdvance = asyncHandler(async (req, res) => {
  const advance = await Advance.findById(req.params.id);
  if (!advance) {
    res.status(404);
    throw new Error('Advance record not found');
  }
  const { advanceAmount, advanceDate, paymentMethod, notes, remainingAmount, status } = req.body;
  if (advanceAmount !== undefined) advance.advanceAmount = Number(advanceAmount);
  if (advanceDate !== undefined) advance.advanceDate = new Date(advanceDate);
  if (paymentMethod !== undefined) advance.paymentMethod = paymentMethod;
  if (notes !== undefined) advance.notes = notes;
  if (remainingAmount !== undefined) advance.remainingAmount = Number(remainingAmount);
  if (status !== undefined) advance.status = status;
  await advance.save();
  res.json({ success: true, data: advance });
});

// @desc  Delete advance (Admin only)
// @route DELETE /api/advances/:id
const deleteAdvance = asyncHandler(async (req, res) => {
  const advance = await Advance.findById(req.params.id);
  if (!advance) {
    res.status(404);
    throw new Error('Advance record not found');
  }
  await advance.deleteOne();
  res.json({ success: true, message: 'Advance deleted' });
});

module.exports = { addAdvance, addAmountToAdvance, getAdvances, getFarmerAdvanceDetails, updateAdvance, deleteAdvance };
