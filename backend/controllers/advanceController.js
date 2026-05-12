const asyncHandler = require('express-async-handler');
const Advance = require('../models/Advance');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const { normalizeIndianMobile } = require('../services/smsService');
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || 'FSTSMS';
const FAST2SMS_ROUTE = process.env.FAST2SMS_ROUTE || 'v3';

// ---------- helpers ----------
const sendAdvanceSMS = async (mobile, data) => {
  if (!FAST2SMS_API_KEY) return;
  const phone = normalizeIndianMobile(mobile);
  if (!phone) return;
  const message =
    `Dear Farmer,\nYou received advance payment of ₹${data.advanceAmount} on ${data.advanceDate}.\n\nRemaining Advance Balance: ₹${data.remainingAmount}\n\nCollection Center: ${data.centerName}`;
  try {
    await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: { Authorization: FAST2SMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        route: FAST2SMS_ROUTE,
        sender_id: FAST2SMS_SENDER_ID,
        message,
        language: 'english',
        flash: 0,
        numbers: phone
      })
    });
  } catch (e) {
    console.warn('Advance SMS failed:', e.message);
  }
};

// @desc  Add advance payment (Admin only)
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

  // Calculate running remaining = sum of previous active advances + this new one
  const existingActive = await Advance.aggregate([
    { $match: { farmerId: farmer._id, status: 'Active' } },
    { $group: { _id: null, total: { $sum: '$remainingAmount' } } }
  ]);
  const existingBalance = existingActive[0]?.total || 0;
  const remainingAmount = existingBalance + Number(advanceAmount);

  const advance = await Advance.create({
    farmerCode: farmer.farmerCode,
    farmerId: farmer._id,
    collectionCenterId: farmer.assignedCenter._id,
    advanceAmount: Number(advanceAmount),
    remainingAmount: Number(advanceAmount),
    advanceDate: new Date(advanceDate),
    paymentMethod,
    notes
  });

  // SMS
  const dateStr = new Date(advanceDate).toLocaleDateString('en-IN');
  await sendAdvanceSMS(farmer.mobileNumber, {
    advanceAmount: Number(advanceAmount),
    remainingAmount,
    advanceDate: dateStr,
    centerName: farmer.assignedCenter?.name || 'Collection Center'
  });

  res.status(201).json({ success: true, data: advance });
});

// @desc  Get advances (admin: all / by farmer / by center; head: own center only)
// @route GET /api/advances
const getAdvances = asyncHandler(async (req, res) => {
  const { farmerId, centerId, farmerCode, month, year } = req.query;
  const filter = {};

  if (req.user.role === 'collectionHead') {
    filter.collectionCenterId = req.user.centerId;
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

module.exports = { addAdvance, getAdvances, getFarmerAdvanceDetails, updateAdvance, deleteAdvance };
