const asyncHandler = require('express-async-handler');
const MilkCollection = require('../models/MilkCollection');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const mongoose = require('mongoose');

// ─── helpers ────────────────────────────────────────────────────────────────

const parseDateRange = (fromDate, toDate) => {
  if (!fromDate || !toDate) throw new Error('fromDate and toDate are required');
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);
  if (isNaN(start) || isNaN(end)) throw new Error('Invalid date format. Use YYYY-MM-DD');
  if (start > end) throw new Error('fromDate must be before toDate');
  return { start, end };
};

// ─── Collection Center Wise Report ──────────────────────────────────────────

// @desc  Get collection-center-wise aggregated report
// @route GET /api/reports/center/:centerId?fromDate=&toDate=
const getCenterReport = asyncHandler(async (req, res) => {
  const { centerId } = req.params;
  const { fromDate, toDate } = req.query;

  let start, end;
  try {
    ({ start, end } = parseDateRange(fromDate, toDate));
  } catch (e) {
    res.status(400);
    throw new Error(e.message);
  }

  const centerObjId = new mongoose.Types.ObjectId(centerId);

  // Verify center exists
  const center = await CollectionCenter.findById(centerId).lean();
  if (!center) {
    res.status(404);
    throw new Error('Collection center not found');
  }

  // MongoDB aggregation for milk data
  const milkAgg = await MilkCollection.aggregate([
    {
      $match: {
        collectionCenterId: centerObjId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalMilkLiters: { $sum: '$quantityLiters' },
        totalCollectionAmount: { $sum: '$amountInr' },
        totalEntries: { $sum: 1 },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        avgMilkPerEntry: { $avg: '$quantityLiters' },
        uniqueFarmers: { $addToSet: '$farmerId' }
      }
    }
  ]);

  const milkStats = milkAgg[0] || {
    totalMilkLiters: 0,
    totalCollectionAmount: 0,
    totalEntries: 0,
    avgFat: 0,
    avgSnf: 0,
    avgMilkPerEntry: 0,
    uniqueFarmers: []
  };

  // Daily breakdown for the center
  const dailyBreakdown = await MilkCollection.aggregate([
    {
      $match: {
        collectionCenterId: centerObjId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          shift: '$shift'
        },
        totalLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        entryCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1, '_id.shift': 1 } }
  ]);

  // Farmer-wise summary within this center
  const farmerSummary = await MilkCollection.aggregate([
    {
      $match: {
        collectionCenterId: centerObjId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: '$farmerId',
        farmerCode: { $first: '$farmerCode' },
        totalLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        totalDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        entryCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'farmers',
        localField: '_id',
        foreignField: '_id',
        as: 'farmer'
      }
    },
    { $unwind: { path: '$farmer', preserveNullAndEmpty: true } },
    {
      $project: {
        farmerId: '$_id',
        farmerCode: 1,
        farmerName: '$farmer.fullName',
        totalLiters: { $round: ['$totalLiters', 2] },
        totalAmount: { $round: ['$totalAmount', 2] },
        avgFat: { $round: ['$avgFat', 2] },
        avgSnf: { $round: ['$avgSnf', 2] },
        totalDays: { $size: '$totalDays' },
        entryCount: 1
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.json({
    success: true,
    data: {
      center: {
        _id: center._id,
        name: center.name,
        centerCode: center.centerCode
      },
      dateRange: { fromDate, toDate },
      summary: {
        totalMilkLiters: Number((milkStats.totalMilkLiters || 0).toFixed(2)),
        totalCollectionAmount: Number((milkStats.totalCollectionAmount || 0).toFixed(2)),
        totalCollectionEntries: milkStats.totalEntries || 0,
        totalFarmers: (milkStats.uniqueFarmers || []).length,
        avgFat: Number((milkStats.avgFat || 0).toFixed(2)),
        avgSnf: Number((milkStats.avgSnf || 0).toFixed(2)),
        avgMilkPerEntry: Number((milkStats.avgMilkPerEntry || 0).toFixed(2))
      },
      dailyBreakdown,
      farmerSummary
    }
  });
});

// ─── Farmer Wise Report ──────────────────────────────────────────────────────

// @desc  Get farmer-wise daily milk report
// @route GET /api/reports/farmer/:farmerId?fromDate=&toDate=
const getFarmerReport = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const { fromDate, toDate } = req.query;

  let start, end;
  try {
    ({ start, end } = parseDateRange(fromDate, toDate));
  } catch (e) {
    res.status(400);
    throw new Error(e.message);
  }

  const farmerObjId = new mongoose.Types.ObjectId(farmerId);

  const farmer = await Farmer.findById(farmerId)
    .populate('assignedCenter', 'name centerCode')
    .lean();
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  // Daily entries — each row in the report table
  const dailyEntries = await MilkCollection.find({
    farmerId: farmerObjId,
    date: { $gte: start, $lte: end }
  })
    .populate('collectionCenterId', 'name centerCode')
    .sort({ date: 1, shift: 1 })
    .lean();

  // Aggregate summary
  const summaryAgg = await MilkCollection.aggregate([
    {
      $match: {
        farmerId: farmerObjId,
        date: { $gte: start, $lte: end }
      }
    },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        totalEntries: { $sum: 1 },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        morningEntries: { $sum: { $cond: [{ $eq: ['$shift', 'Morning'] }, 1, 0] } },
        eveningEntries: { $sum: { $cond: [{ $eq: ['$shift', 'Evening'] }, 1, 0] } },
        cowLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Cow'] }, '$quantityLiters', 0] } },
        buffaloLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, '$quantityLiters', 0] } }
      }
    }
  ]);

  const stats = summaryAgg[0] || {
    totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0,
    totalEntries: 0, uniqueDays: [], morningEntries: 0, eveningEntries: 0,
    cowLiters: 0, buffaloLiters: 0
  };

  // Format daily entries for the report table
  const reportRows = dailyEntries.map(e => ({
    date: new Date(e.date).toLocaleDateString('en-IN'),
    dateRaw: e.date,
    shift: e.shift,
    animalType: e.animalType,
    milkLiter: Number(e.quantityLiters.toFixed(2)),
    fat: Number(e.fat.toFixed(1)),
    snf: Number(e.snf.toFixed(1)),
    milkRate: Number(e.ratePerLiter.toFixed(2)),
    totalAmount: Number(e.amountInr.toFixed(2)),
    center: e.collectionCenterId?.name || ''
  }));

  res.json({
    success: true,
    data: {
      farmer: {
        _id: farmer._id,
        farmerCode: farmer.farmerCode,
        fullName: farmer.fullName,
        mobileNumber: farmer.mobileNumber,
        animalType: farmer.animalType,
        center: farmer.assignedCenter
      },
      dateRange: { fromDate, toDate },
      summary: {
        totalMilkLiters: Number((stats.totalLiters || 0).toFixed(2)),
        totalAmount: Number((stats.totalAmount || 0).toFixed(2)),
        avgFat: Number((stats.avgFat || 0).toFixed(2)),
        avgSnf: Number((stats.avgSnf || 0).toFixed(2)),
        totalMilkDays: (stats.uniqueDays || []).length,
        totalEntries: stats.totalEntries || 0,
        morningEntries: stats.morningEntries || 0,
        eveningEntries: stats.eveningEntries || 0,
        cowLiters: Number((stats.cowLiters || 0).toFixed(2)),
        buffaloLiters: Number((stats.buffaloLiters || 0).toFixed(2))
      },
      reportRows
    }
  });
});

// ─── All Centers Summary Report ──────────────────────────────────────────────

// @desc  Get all-centers summary for a date range (admin only)
// @route GET /api/reports/centers/summary?fromDate=&toDate=
const getAllCentersSummary = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;

  let start, end;
  try {
    ({ start, end } = parseDateRange(fromDate, toDate));
  } catch (e) {
    res.status(400);
    throw new Error(e.message);
  }

  const centerSummaries = await MilkCollection.aggregate([
    {
      $match: { date: { $gte: start, $lte: end } }
    },
    {
      $group: {
        _id: '$collectionCenterId',
        totalMilkLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        totalEntries: { $sum: 1 },
        uniqueFarmers: { $addToSet: '$farmerId' }
      }
    },
    {
      $lookup: {
        from: 'collectioncenters',
        localField: '_id',
        foreignField: '_id',
        as: 'center'
      }
    },
    { $unwind: { path: '$center', preserveNullAndEmpty: true } },
    {
      $project: {
        centerId: '$_id',
        centerName: '$center.name',
        centerCode: '$center.centerCode',
        totalMilkLiters: { $round: ['$totalMilkLiters', 2] },
        totalAmount: { $round: ['$totalAmount', 2] },
        avgFat: { $round: ['$avgFat', 2] },
        avgSnf: { $round: ['$avgSnf', 2] },
        totalEntries: 1,
        totalFarmers: { $size: '$uniqueFarmers' }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  const grandTotal = {
    totalMilkLiters: centerSummaries.reduce((s, c) => s + c.totalMilkLiters, 0),
    totalAmount: centerSummaries.reduce((s, c) => s + c.totalAmount, 0),
    totalEntries: centerSummaries.reduce((s, c) => s + c.totalEntries, 0),
    totalCenters: centerSummaries.length
  };

  res.json({
    success: true,
    data: {
      dateRange: { fromDate, toDate },
      centerSummaries,
      grandTotal
    }
  });
});

// ─── Farmer Analytics (daily history) ───────────────────────────────────────

// @desc  Get complete farmer analytics — total days, liters, avg fat/snf, history
// @route GET /api/reports/farmer/:farmerId/analytics
const getFarmerAnalytics = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;
  const farmerObjId = new mongoose.Types.ObjectId(farmerId);

  const farmer = await Farmer.findById(farmerId)
    .populate('assignedCenter', 'name centerCode')
    .lean();
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  // All-time analytics
  const allTimeAgg = await MilkCollection.aggregate([
    { $match: { farmerId: farmerObjId } },
    {
      $group: {
        _id: null,
        totalLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        totalEntries: { $sum: 1 },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
        firstEntry: { $min: '$date' },
        lastEntry: { $max: '$date' }
      }
    }
  ]);

  // Monthly breakdown
  const monthlyBreakdown = await MilkCollection.aggregate([
    { $match: { farmerId: farmerObjId } },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalLiters: { $sum: '$quantityLiters' },
        totalAmount: { $sum: '$amountInr' },
        avgFat: { $avg: '$fat' },
        avgSnf: { $avg: '$snf' },
        entryCount: { $sum: 1 },
        uniqueDays: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } }
      }
    },
    {
      $project: {
        year: '$_id.year',
        month: '$_id.month',
        totalLiters: { $round: ['$totalLiters', 2] },
        totalAmount: { $round: ['$totalAmount', 2] },
        avgFat: { $round: ['$avgFat', 2] },
        avgSnf: { $round: ['$avgSnf', 2] },
        entryCount: 1,
        totalDays: { $size: '$uniqueDays' }
      }
    },
    { $sort: { year: -1, month: -1 } }
  ]);

  const stats = allTimeAgg[0] || {
    totalLiters: 0, totalAmount: 0, avgFat: 0, avgSnf: 0,
    totalEntries: 0, uniqueDays: [], firstEntry: null, lastEntry: null
  };

  res.json({
    success: true,
    data: {
      farmer: {
        _id: farmer._id,
        farmerCode: farmer.farmerCode,
        fullName: farmer.fullName,
        animalType: farmer.animalType,
        center: farmer.assignedCenter
      },
      allTime: {
        totalMilkLiters: Number((stats.totalLiters || 0).toFixed(2)),
        totalAmount: Number((stats.totalAmount || 0).toFixed(2)),
        avgFat: Number((stats.avgFat || 0).toFixed(2)),
        avgSnf: Number((stats.avgSnf || 0).toFixed(2)),
        totalMilkDays: (stats.uniqueDays || []).length,
        totalEntries: stats.totalEntries || 0,
        firstEntry: stats.firstEntry,
        lastEntry: stats.lastEntry
      },
      monthlyBreakdown
    }
  });
});

module.exports = {
  getCenterReport,
  getFarmerReport,
  getAllCentersSummary,
  getFarmerAnalytics
};
