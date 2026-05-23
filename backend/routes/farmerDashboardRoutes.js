/**
 * farmerDashboardRoutes.js
 * Farmer-only API endpoints — all data is scoped to the authenticated farmer.
 * Farmers can NEVER access other farmers' data.
 */
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const { query, validationResult } = require('express-validator');
const MilkCollection = require('../models/MilkCollection');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorizeRoles('farmer'));

// ── Validation helper ─────────────────────────────────────────────────────────
const validateQuery = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((e) => e.msg).join(', '));
  }
  next();
};

// ── Helper: get farmer's own ID safely ───────────────────────────────────────
const getFarmerId = (req) => req.user.farmerId || req.user._id;

// ── Helper: build date range ──────────────────────────────────────────────────
const buildDateRange = (from, to, defaultToday = true) => {
  if (from && to) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  if (defaultToday) {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmer-dashboard/profile
// ─────────────────────────────────────────────────────────────────────────────
router.get('/profile', asyncHandler(async (req, res) => {
  const farmerId = getFarmerId(req);
  const farmer = await Farmer.findById(farmerId)
    .select('-loginPassword')
    .populate('assignedCenter', 'name centerCode fullAddress');

  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  res.json({ success: true, data: farmer });
}));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmer-dashboard/milk
// Query: from, to (default: today)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/milk', asyncHandler(async (req, res) => {
  const farmerId = getFarmerId(req);
  const { from, to, page = 1, limit = 50 } = req.query;

  const range = buildDateRange(from, to, true);
  const filter = { farmerId: new mongoose.Types.ObjectId(farmerId) };
  if (range) {
    filter.date = { $gte: range.start, $lte: range.end };
  }

  const pageNo = Math.max(1, Number(page));
  const pageSize = Math.min(100, Number(limit));

  const [entries, total, stats] = await Promise.all([
    MilkCollection.find(filter)
      .sort({ date: -1, shift: 1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MilkCollection.countDocuments(filter),
    MilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMilkLiters: { $sum: '$quantityLiters' },
          totalAmountInr: { $sum: '$amountInr' },
          avgFat: { $avg: '$fat' },
          avgSnf: { $avg: '$snf' },
          avgRatePerLiter: { $avg: '$ratePerLiter' },
          cowMilkLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Cow'] }, '$quantityLiters', 0] } },
          buffaloMilkLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, '$quantityLiters', 0] } },
          morningCount: { $sum: { $cond: [{ $eq: ['$shift', 'Morning'] }, 1, 0] } },
          eveningCount: { $sum: { $cond: [{ $eq: ['$shift', 'Evening'] }, 1, 0] } },
          totalEntries: { $sum: 1 }
        }
      }
    ])
  ]);

  const summary = stats[0] || {
    totalMilkLiters: 0, totalAmountInr: 0,
    avgFat: 0, avgSnf: 0, avgRatePerLiter: 0,
    cowMilkLiters: 0, buffaloMilkLiters: 0,
    morningCount: 0, eveningCount: 0, totalEntries: 0
  };

  // Round floats
  Object.keys(summary).forEach((k) => {
    if (typeof summary[k] === 'number') {
      summary[k] = Number(summary[k].toFixed(2));
    }
  });

  res.json({
    success: true,
    data: entries,
    summary,
    total,
    currentPage: pageNo,
    totalPages: Math.ceil(total / pageSize)
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmer-dashboard/food
// Query: from, to (default: today)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/food', asyncHandler(async (req, res) => {
  const farmerId = getFarmerId(req);
  const { from, to, page = 1, limit = 50 } = req.query;

  const range = buildDateRange(from, to, true);
  const filter = { farmerId: new mongoose.Types.ObjectId(farmerId) };
  if (range) {
    filter.date = { $gte: range.start, $lte: range.end };
  }

  const pageNo = Math.max(1, Number(page));
  const pageSize = Math.min(100, Number(limit));

  const [records, total] = await Promise.all([
    FoodRecord.find(filter)
      .sort({ date: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    FoodRecord.countDocuments(filter)
  ]);

  const totalAmount = records.reduce((s, r) => s + (r.totalAmount || 0), 0);

  res.json({
    success: true,
    data: records,
    summary: {
      totalAmount: Number(totalAmount.toFixed(2)),
      totalRecords: total
    },
    total,
    currentPage: pageNo,
    totalPages: Math.ceil(total / pageSize)
  });
}));

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/farmer-dashboard/report
// Query: from (required), to (required)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/report',
  [
    query('from').notEmpty().withMessage('From date is required').isISO8601().withMessage('Invalid from date'),
    query('to').notEmpty().withMessage('To date is required').isISO8601().withMessage('Invalid to date')
  ],
  validateQuery,
  asyncHandler(async (req, res) => {
  const farmerId = getFarmerId(req);
  const { from, to } = req.query;

  if (!from || !to) {
    res.status(400);
    throw new Error('from and to dates are required');
  }

  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400);
    throw new Error('Invalid date format');
  }

  if (start > end) {
    res.status(400);
    throw new Error('From date must be before to date');
  }

  const filter = {
    farmerId: new mongoose.Types.ObjectId(farmerId),
    date: { $gte: start, $lte: end }
  };

  const [entries, stats] = await Promise.all([
    MilkCollection.find(filter)
      .sort({ date: 1, shift: 1 })
      .lean(),
    MilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMilkLiters: { $sum: '$quantityLiters' },
          totalAmountInr: { $sum: '$amountInr' },
          avgFat: { $avg: '$fat' },
          avgSnf: { $avg: '$snf' },
          avgRatePerLiter: { $avg: '$ratePerLiter' },
          cowMilkLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Cow'] }, '$quantityLiters', 0] } },
          buffaloMilkLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, '$quantityLiters', 0] } },
          cowCount: { $sum: { $cond: [{ $eq: ['$animalType', 'Cow'] }, 1, 0] } },
          buffaloCount: { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, 1, 0] } },
          morningCount: { $sum: { $cond: [{ $eq: ['$shift', 'Morning'] }, 1, 0] } },
          eveningCount: { $sum: { $cond: [{ $eq: ['$shift', 'Evening'] }, 1, 0] } },
          totalEntries: { $sum: 1 }
        }
      }
    ])
  ]);

  const summary = stats[0] || {
    totalMilkLiters: 0, totalAmountInr: 0,
    avgFat: 0, avgSnf: 0, avgRatePerLiter: 0,
    cowMilkLiters: 0, buffaloMilkLiters: 0,
    cowCount: 0, buffaloCount: 0,
    morningCount: 0, eveningCount: 0, totalEntries: 0
  };

  Object.keys(summary).forEach((k) => {
    if (typeof summary[k] === 'number') {
      summary[k] = Number(summary[k].toFixed(2));
    }
  });

  // Count unique collection days
  const uniqueDays = new Set(entries.map((e) => new Date(e.date).toDateString())).size;
  summary.totalCollectionDays = uniqueDays;

  res.json({
    success: true,
    data: entries,
    summary,
    fromDate: from,
    toDate: to
  });
}));

module.exports = router;
