const asyncHandler = require('express-async-handler');
const MilkCollection = require('../models/MilkCollection');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const RateChartSettings = require('../models/RateChartSettings');
const { sendMilkCollectionNotification } = require('../services/notificationService');

const asDayRange = (dateValue) => {
  const d = new Date(dateValue || new Date());
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// Default fallback rates used when no center-specific chart exists
const DEFAULT_RATES = {
  cow: {
    baseRate: 30,
    fatSteps: [{ fromValue: 3.0, stepRate: 0.3 }],
    snfSteps: [{ fromValue: 7.5, stepRate: 0.5 }],
    fatMin: 3.0, fatMax: 5.5, snfMin: 7.5, snfMax: 9.0
  },
  buffalo: {
    baseRate: 35,
    fatSteps: [{ fromValue: 5.0, stepRate: 0.5 }],
    snfSteps: [{ fromValue: 8.0, stepRate: 0.6 }],
    fatMin: 5.0, fatMax: 7.0, snfMin: 8.0, snfMax: 9.5
  }
};

/**
 * Calculate tiered step bonus for a given value using step ranges.
 * @param {number} value - The actual FAT or SNF value
 * @param {Array} steps - Array of {fromValue, stepRate} objects, sorted by fromValue
 * @param {number} minValue - Minimum allowed value
 * @param {number} maxValue - Maximum allowed value
 * @returns {number} Total bonus amount
 */
const calculateTieredBonus = (value, steps, minValue, maxValue) => {
  const clampedValue = clamp(Number(value), Number(minValue), Number(maxValue));
  
  // Sort steps by fromValue to ensure correct order
  const sortedSteps = [...steps].sort((a, b) => a.fromValue - b.fromValue);
  
  let totalBonus = 0;
  let currentValue = Number(minValue);
  
  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];
    const stepStart = Number(step.fromValue);
    const stepRate = Number(step.stepRate);
    
    // Determine where this step ends (next step's start or max value)
    const stepEnd = i < sortedSteps.length - 1 
      ? Number(sortedSteps[i + 1].fromValue)
      : Number(maxValue);
    
    // If clampedValue is less than this step's start, we're done
    if (clampedValue <= stepStart) {
      break;
    }
    
    // Calculate how much of this step range to apply
    const rangeStart = Math.max(currentValue, stepStart);
    const rangeEnd = Math.min(clampedValue, stepEnd);
    
    if (rangeEnd > rangeStart) {
      const stepsInRange = Math.round((rangeEnd - rangeStart) * 10);
      totalBonus += stepsInRange * stepRate;
    }
    
    currentValue = rangeEnd;
    
    // If we've reached the clampedValue, we're done
    if (currentValue >= clampedValue) {
      break;
    }
  }
  
  return Number(totalBonus.toFixed(2));
};

/**
 * Calculate rate per liter for a given fat/snf using the center's rate chart.
 * Falls back to defaults if no chart is configured for the center.
 * @param {number} fat
 * @param {number} snf
 * @param {string|ObjectId} centerId  — the collection center's _id
 * @param {string} animalType - 'Cow' or 'Buffalo'
 */
const calculateRate = async (fat, snf, centerId, animalType = 'Cow') => {
  let settings = null;
  let animalSettings = null;

  if (centerId) {
    settings = await RateChartSettings.findOne({ centerId }).lean();
  }

  // Determine which animal type settings to use
  const animalKey = animalType.toLowerCase(); // 'cow' or 'buffalo'
  
  if (settings && settings[animalKey]) {
    animalSettings = settings[animalKey];
  } else {
    // Fall back to defaults
    animalSettings = DEFAULT_RATES[animalKey] || DEFAULT_RATES.cow;
  }

  // Migrate old format to new format on-the-fly if needed (for backward compatibility)
  if (!animalSettings.fatSteps || animalSettings.fatSteps.length === 0) {
    animalSettings.fatSteps = [{ 
      fromValue: animalSettings.fatMin || (animalKey === 'buffalo' ? 5.0 : 3.0), 
      stepRate: settings?.fatStepInr || 0.3 
    }];
  }
  if (!animalSettings.snfSteps || animalSettings.snfSteps.length === 0) {
    animalSettings.snfSteps = [{ 
      fromValue: animalSettings.snfMin || (animalKey === 'buffalo' ? 8.0 : 7.5), 
      stepRate: settings?.snfStepInr || 0.5 
    }];
  }

  const fatBonus = calculateTieredBonus(
    fat, 
    animalSettings.fatSteps, 
    animalSettings.fatMin, 
    animalSettings.fatMax
  );
  
  const snfBonus = calculateTieredBonus(
    snf, 
    animalSettings.snfSteps, 
    animalSettings.snfMin, 
    animalSettings.snfMax
  );

  const computed = Number(animalSettings.baseRate) + fatBonus + snfBonus;
  return Number(computed.toFixed(2));
};

const createMilkEntry = asyncHandler(async (req, res) => {
  const { farmerId, date, shift, animalType, quantityLiters, fat, snf, notes } = req.body;
  const userRole = req.user.role;
  let collectionCenterId = req.body.collectionCenterId || req.user.assignedCenter || req.user._id;

  if (userRole === 'collection_head') {
    collectionCenterId = req.user.assignedCenter || req.user._id;
  } else {
    res.status(403);
    throw new Error('Only collection head can add milk entries');
  }

  if (!collectionCenterId) {
    res.status(400);
    throw new Error('Collection center is required');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer || String(farmer.assignedCenter) !== String(collectionCenterId)) {
    res.status(403);
    throw new Error('Farmer is not assigned to this center');
  }

  const { start, end } = asDayRange(date);
  const ratePerLiter = await calculateRate(fat, snf, collectionCenterId, animalType);
  const totalAmount = Number((Number(quantityLiters) * ratePerLiter).toFixed(2));
  const center = await CollectionCenter.findById(collectionCenterId).select('name collectionHead.fullName').lean();

  const existing = await MilkCollection.findOne({
    farmerId,
    collectionCenterId,
    date: { $gte: start, $lt: end },
    shift
  });
  if (existing) {
    res.status(409);
    throw new Error('Entry already exists for this farmer, date and shift');
  }

  const entry = await MilkCollection.create({
    farmerCode: farmer.farmerCode,
    farmerId,
    collectionCenterId,
    collectionHeadName: center?.collectionHead?.fullName || '',
    date: start,
    shift,
    animalType,
    quantityLiters: Number(quantityLiters),
    fat: Number(fat),
    snf: Number(snf),
    ratePerLiter,
    amountInr: totalAmount,
    notes
  });

  const populated = await MilkCollection.findById(entry._id)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode');

  try {
    sendMilkCollectionNotification(farmer._id, {
      farmerName:  farmer.fullName,
      date:        new Date(start).toLocaleDateString('en-IN'),
      shift,
      animalType,
      liters:      Number(quantityLiters).toFixed(2),
      fat:         Number(fat).toFixed(1),
      snf:         Number(snf).toFixed(1),
      rate:        ratePerLiter.toFixed(2),
      amount:      totalAmount.toFixed(2)
    });
  } catch (error) {
    console.warn('Milk collection notification dispatch failed:', error.message);
  }

  res.status(201).json(populated);
});

const getMilkEntries = asyncHandler(async (req, res) => {
  const {
    centerId,
    farmerId,
    farmerCode,
    search,          // NEW: search by farmer name OR code
    date,
    shift,
    animalType,
    collectionHeadName,
    page = 1,
    limit = 50
  } = req.query;
  const userRole = req.user.role;
  const mongoose = require('mongoose');
  const filter = {};

  if (userRole === 'collection_head') {
    filter.collectionCenterId = req.user.assignedCenter || req.user._id;
  } else if (centerId) {
    filter.collectionCenterId = new mongoose.Types.ObjectId(centerId);
  }

  if (farmerId) {
    filter.farmerId = new mongoose.Types.ObjectId(farmerId);
  }

  // farmerCode exact/partial match
  if (farmerCode) {
    filter.farmerCode = new RegExp(String(farmerCode).trim(), 'i');
  }

  // Generic search: match farmerCode OR farmer name via lookup
  // We handle name search by first finding matching farmer IDs
  if (search && search.trim()) {
    const term = String(search).trim();
    const matchingFarmers = await Farmer.find({
      $or: [
        { fullName:   new RegExp(term, 'i') },
        { farmerCode: new RegExp(term, 'i') }
      ]
    }).select('_id').lean();

    const farmerIds = matchingFarmers.map(f => f._id);

    if (farmerIds.length > 0) {
      filter.$or = [
        { farmerId:   { $in: farmerIds } },
        { farmerCode: new RegExp(term, 'i') }
      ];
    } else {
      // No matching farmers — return empty
      filter.farmerId = new mongoose.Types.ObjectId('000000000000000000000000');
    }
  }

  if (shift)       filter.shift      = shift;
  if (animalType)  filter.animalType = animalType;
  if (collectionHeadName) filter.collectionHeadName = new RegExp(String(collectionHeadName).trim(), 'i');

  if (date) {
    const { start, end } = asDayRange(date);
    filter.date = { $gte: start, $lt: end };
  }

  const pageNo   = Math.max(1, Number(page)  || 1);
  const pageSize = Math.min(100, Number(limit) || 50);

  // Run all queries in parallel
  const [entries, total, stats] = await Promise.all([
    MilkCollection.find(filter)
      .populate('farmerId',          'fullName mobileNumber farmerCode')
      .populate('collectionCenterId','name centerCode')
      .sort({ date: -1, createdAt: -1 })
      .skip((pageNo - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    MilkCollection.countDocuments(filter),
    MilkCollection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalMilkLiters:   { $sum: '$quantityLiters' },
          totalAmountInr:    { $sum: '$amountInr' },
          avgFat:            { $avg: '$fat' },
          avgSnf:            { $avg: '$snf' },
          avgRatePerLiter:   { $avg: '$ratePerLiter' },
          cowMilkLiters:     { $sum: { $cond: [{ $eq: ['$animalType', 'Cow']     }, '$quantityLiters', 0] } },
          buffaloMilkLiters: { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, '$quantityLiters', 0] } },
          morningMilkLiters: { $sum: { $cond: [{ $eq: ['$shift', 'Morning']      }, '$quantityLiters', 0] } },
          eveningMilkLiters: { $sum: { $cond: [{ $eq: ['$shift', 'Evening']      }, '$quantityLiters', 0] } },
          morningAmount:     { $sum: { $cond: [{ $eq: ['$shift', 'Morning']      }, '$amountInr',      0] } },
          eveningAmount:     { $sum: { $cond: [{ $eq: ['$shift', 'Evening']      }, '$amountInr',      0] } },
          cowAmount:         { $sum: { $cond: [{ $eq: ['$animalType', 'Cow']     }, '$amountInr',      0] } },
          buffaloAmount:     { $sum: { $cond: [{ $eq: ['$animalType', 'Buffalo'] }, '$amountInr',      0] } },
          totalEntries:      { $sum: 1 }
        }
      }
    ])
  ]);

  const summary = stats[0] || {
    totalMilkLiters: 0, totalAmountInr: 0,
    avgFat: 0, avgSnf: 0, avgRatePerLiter: 0,
    cowMilkLiters: 0, buffaloMilkLiters: 0,
    morningMilkLiters: 0, eveningMilkLiters: 0,
    morningAmount: 0, eveningAmount: 0,
    cowAmount: 0, buffaloAmount: 0,
    totalEntries: 0
  };

  // Round floats for clean response
  summary.totalMilkLiters   = Number((summary.totalMilkLiters   || 0).toFixed(2));
  summary.totalAmountInr    = Number((summary.totalAmountInr    || 0).toFixed(2));
  summary.avgFat            = Number((summary.avgFat            || 0).toFixed(2));
  summary.avgSnf            = Number((summary.avgSnf            || 0).toFixed(2));
  summary.avgRatePerLiter   = Number((summary.avgRatePerLiter   || 0).toFixed(2));
  summary.cowMilkLiters     = Number((summary.cowMilkLiters     || 0).toFixed(2));
  summary.buffaloMilkLiters = Number((summary.buffaloMilkLiters || 0).toFixed(2));
  summary.morningMilkLiters = Number((summary.morningMilkLiters || 0).toFixed(2));
  summary.eveningMilkLiters = Number((summary.eveningMilkLiters || 0).toFixed(2));

  res.json({
    entries,
    total,
    currentPage: pageNo,
    totalPages: Math.ceil(total / pageSize),
    summary
  });
});

module.exports = { createMilkEntry, getMilkEntries, calculateRate };
