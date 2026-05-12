const asyncHandler = require('express-async-handler');
const PaymentSettlement = require('../models/PaymentSettlement');
const Advance = require('../models/Advance');
const MilkCollection = require('../models/MilkCollection');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');

// @desc  Calculate payable amounts for all farmers in a date range
// @route GET /api/payments/payable?start=YYYY-MM-DD&end=YYYY-MM-DD
const getPayableCalculations = asyncHandler(async (req, res) => {
  const { start, end, centerId } = req.query;
  
  if (!start || !end) {
    res.status(400);
    throw new Error('Start date and end date are required');
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);

  // Build filter based on user role
  const farmerFilter = {};
  if (req.user.role === 'collectionHead') {
    farmerFilter.assignedCenter = req.user.centerId;
  } else if (centerId) {
    farmerFilter.assignedCenter = centerId;
  }

  // Get all farmers
  const farmers = await Farmer.find(farmerFilter);
  const results = [];

  for (const farmer of farmers) {
    // 1. Get milk data for the period
    const milkRecords = await MilkCollection.find({
      farmerId: farmer._id,
      date: { $gte: startDate, $lte: endDate }
    });
    
    const totalMilkLitres = milkRecords.reduce((s, r) => s + r.quantityLiters, 0);
    const totalMilkAmount = milkRecords.reduce((s, r) => s + r.amountInr, 0);

    // 2. Get food purchases for the period
    const foodRecords = await FoodRecord.find({
      farmerId: farmer._id,
      date: { $gte: startDate, $lte: endDate }
    });
    const totalFoodAmount = foodRecords.reduce((s, r) => s + r.totalAmount, 0);

    // 3. Get active advance balance
    const activeAdvances = await Advance.find({
      farmerId: farmer._id,
      status: 'Active'
    });
    const totalAdvanceBalance = activeAdvances.reduce((s, a) => s + a.remainingAmount, 0);

    // 4. Apply calculation formula
    const totalDeductions = totalAdvanceBalance + totalFoodAmount;
    const finalPayable = totalMilkAmount - totalDeductions;

    let paymentStatus, displayAmount, advanceUsed;

    if (finalPayable < 0) {
      // Case A: Farmer still owes advance
      paymentStatus = 'AdvanceRemaining';
      displayAmount = Math.abs(finalPayable);
      advanceUsed = totalMilkAmount - totalFoodAmount; // Only milk amount above food can be used for advance
      if (advanceUsed < 0) advanceUsed = 0;
    } else {
      // Case B: Admin pays farmer
      paymentStatus = 'Pending';
      displayAmount = finalPayable;
      advanceUsed = totalAdvanceBalance;
    }

    results.push({
      farmerId: farmer._id,
      farmerCode: farmer.farmerCode,
      farmerName: farmer.fullName,
      collectionCenterId: farmer.assignedCenter,
      totalMilkLitres,
      totalMilkAmount,
      totalFoodAmount,
      totalAdvanceTaken: totalAdvanceBalance,
      finalPayableAmount: finalPayable,
      paymentStatus,
      displayAmount,
      advanceUsed,
      calculation: `Milk ₹${totalMilkAmount.toFixed(2)} − (Advance ₹${totalAdvanceBalance.toFixed(2)} + Food ₹${totalFoodAmount.toFixed(2)}) = ₹${finalPayable.toFixed(2)}`
    });
  }

  // Calculate summary
  const summary = {
    totalFarmers: results.length,
    totalMilkAmount: results.reduce((s, r) => s + r.totalMilkAmount, 0),
    totalDeductions: results.reduce((s, r) => s + r.totalAdvanceTaken + r.totalFoodAmount, 0),
    netPayout: results.filter(r => r.finalPayableAmount > 0).reduce((s, r) => s + r.finalPayableAmount, 0),
    pendingCount: results.filter(r => r.paymentStatus === 'Pending').length,
    advanceRemainingCount: results.filter(r => r.paymentStatus === 'AdvanceRemaining').length
  };

  res.json({ 
    success: true, 
    data: {
      cycleStartDate: startDate,
      cycleEndDate: endDate,
      results,
      summary
    }
  });
});

// @desc  Process settlement for a farmer
// @route POST /api/payments/settle
const processSettlement = asyncHandler(async (req, res) => {
  const { farmerId, cycleStartDate, cycleEndDate } = req.body;

  if (!farmerId || !cycleStartDate || !cycleEndDate) {
    res.status(400);
    throw new Error('farmerId, cycleStartDate, and cycleEndDate are required');
  }

  // Check if settlement already exists
  const existingSettlement = await PaymentSettlement.findOne({
    farmerId,
    cycleStartDate: new Date(cycleStartDate),
    cycleEndDate: new Date(cycleEndDate)
  });

  if (existingSettlement) {
    res.status(400);
    throw new Error('Settlement already exists for this farmer and cycle');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  const startDate = new Date(cycleStartDate);
  const endDate = new Date(cycleEndDate);
  endDate.setHours(23, 59, 59, 999);

  // Get data for calculation
  const milkRecords = await MilkCollection.find({
    farmerId,
    date: { $gte: startDate, $lte: endDate }
  });
  const totalMilkLitres = milkRecords.reduce((s, r) => s + r.quantityLiters, 0);
  const totalMilkAmount = milkRecords.reduce((s, r) => s + r.amountInr, 0);

  const foodRecords = await FoodRecord.find({
    farmerId,
    date: { $gte: startDate, $lte: endDate }
  });
  const totalFoodAmount = foodRecords.reduce((s, r) => s + r.totalAmount, 0);

  const activeAdvances = await Advance.find({
    farmerId,
    status: 'Active'
  });
  const totalAdvanceBalance = activeAdvances.reduce((s, a) => s + a.remainingAmount, 0);

  // Apply calculation formula
  const totalDeductions = totalAdvanceBalance + totalFoodAmount;
  const finalPayable = totalMilkAmount - totalDeductions;

  let paymentStatus, advanceUsed, newAdvanceBalance;

  if (finalPayable < 0) {
    // Case A: Farmer still owes advance
    paymentStatus = 'AdvanceRemaining';
    advanceUsed = Math.max(0, totalMilkAmount - totalFoodAmount);
    newAdvanceBalance = totalAdvanceBalance - advanceUsed;
    
    // Update advance balances
    let remainingToDeduct = advanceUsed;
    for (const advance of activeAdvances.sort({ createdAt: 1 })) {
      if (remainingToDeduct <= 0) break;
      
      if (advance.remainingAmount <= remainingToDeduct) {
        remainingToDeduct -= advance.remainingAmount;
        advance.remainingAmount = 0;
        advance.status = 'Settled';
      } else {
        advance.remainingAmount -= remainingToDeduct;
        remainingToDeduct = 0;
      }
      await advance.save();
    }
  } else {
    // Case B: Admin pays farmer
    paymentStatus = 'Pending';
    advanceUsed = totalAdvanceBalance;
    newAdvanceBalance = 0;
    
    // Settle all advances
    await Advance.updateMany(
      { farmerId, status: 'Active' },
      { remainingAmount: 0, status: 'Settled' }
    );
  }

  // Create settlement record
  const settlement = await PaymentSettlement.create({
    farmerCode: farmer.farmerCode,
    farmerId,
    collectionCenterId: farmer.assignedCenter,
    cycleStartDate: startDate,
    cycleEndDate: endDate,
    totalMilkLitres,
    totalMilkAmount,
    totalFoodAmount,
    totalAdvanceUsed: advanceUsed,
    finalPayableAmount: finalPayable,
    paymentStatus
  });

  res.json({ success: true, data: settlement });
});

// @desc  Mark settlement as paid
// @route PUT /api/payments/settle/:id/mark-paid
const markSettlementAsPaid = asyncHandler(async (req, res) => {
  const settlement = await PaymentSettlement.findById(req.params.id);
  
  if (!settlement) {
    res.status(404);
    throw new Error('Settlement not found');
  }

  if (settlement.paymentStatus !== 'Pending') {
    res.status(400);
    throw new Error('Only pending settlements can be marked as paid');
  }

  settlement.paymentStatus = 'Paid';
  settlement.settledAt = new Date();
  await settlement.save();

  res.json({ success: true, data: settlement });
});

// @desc  Get all active advances
// @route GET /api/payments/advances
const getActiveAdvances = asyncHandler(async (req, res) => {
  const { centerId } = req.query;
  const filter = { status: 'Active' };

  if (req.user.role === 'collectionHead') {
    filter.collectionCenterId = req.user.centerId;
  } else if (centerId) {
    filter.collectionCenterId = centerId;
  }

  const advances = await Advance.find(filter)
    .populate('farmerId', 'fullName farmerCode mobileNumber')
    .populate('collectionCenterId', 'name centerCode')
    .sort({ advanceDate: -1 });

  const summary = {
    totalActiveAdvances: advances.length,
    totalAmountGiven: advances.reduce((s, a) => s + a.advanceAmount, 0),
    totalRemaining: advances.reduce((s, a) => s + a.remainingAmount, 0)
  };

  res.json({ success: true, data: { advances, summary } });
});

// @desc  Create new advance
// @route POST /api/payments/advances
const createAdvance = asyncHandler(async (req, res) => {
  const { farmerId, amount, date, notes } = req.body;

  if (!farmerId || !amount || !date) {
    res.status(400);
    throw new Error('farmerId, amount, and date are required');
  }

  if (amount <= 0) {
    res.status(400);
    throw new Error('Amount must be greater than 0');
  }

  const farmer = await Farmer.findById(farmerId).populate('assignedCenter');
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  const advance = await Advance.create({
    farmerCode: farmer.farmerCode,
    farmerId,
    collectionCenterId: farmer.assignedCenter._id,
    advanceAmount: Number(amount),
    remainingAmount: Number(amount),
    advanceDate: new Date(date),
    paymentMethod: 'Cash', // Default, can be updated
    notes,
    status: 'Active'
  });

  const populatedAdvance = await Advance.findById(advance._id)
    .populate('farmerId', 'fullName farmerCode')
    .populate('collectionCenterId', 'name centerCode');

  res.status(201).json({ success: true, data: populatedAdvance });
});

// @desc  Get settlement history
// @route GET /api/payments/settlements
const getSettlementHistory = asyncHandler(async (req, res) => {
  const { centerId, farmerId, startDate, endDate } = req.query;
  const filter = {};

  if (req.user.role === 'collectionHead') {
    filter.collectionCenterId = req.user.centerId;
  } else if (centerId) {
    filter.collectionCenterId = centerId;
  }

  if (farmerId) filter.farmerId = farmerId;
  if (startDate && endDate) {
    filter.cycleStartDate = { $gte: new Date(startDate) };
    filter.cycleEndDate = { $lte: new Date(endDate) };
  }

  const settlements = await PaymentSettlement.find(filter)
    .populate('farmerId', 'fullName farmerCode')
    .populate('collectionCenterId', 'name centerCode')
    .sort({ cycleStartDate: -1 });

  res.json({ success: true, data: settlements });
});

module.exports = {
  getPayableCalculations,
  processSettlement,
  markSettlementAsPaid,
  getActiveAdvances,
  createAdvance,
  getSettlementHistory
};
