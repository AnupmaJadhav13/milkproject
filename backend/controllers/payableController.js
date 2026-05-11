const asyncHandler = require('express-async-handler');
const Payable = require('../models/Payable');
const Advance = require('../models/Advance');
const MilkCollection = require('../models/MilkCollection');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');

// ---------- helpers ----------
const getWeeklyBreakdown = (records) => {
  const weeks = {};
  records.forEach((r) => {
    const d = new Date(r.date);
    const dayOfMonth = d.getDate();
    const weekNum = Math.ceil(dayOfMonth / 7);
    if (!weeks[weekNum]) weeks[weekNum] = { week: weekNum, milkQuantity: 0, milkIncome: 0 };
    weeks[weekNum].milkQuantity += r.quantityLiters;
    weeks[weekNum].milkIncome += r.amountInr;
  });
  return Object.values(weeks);
};

// @desc  Auto-generate / refresh payable for a farmer for a given month+year
// @route POST /api/payable/generate
const generatePayable = asyncHandler(async (req, res) => {
  const { farmerId, centerId, month, year } = req.body;
  if (!farmerId || !month || !year) {
    res.status(400);
    throw new Error('farmerId, month and year are required');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // 1. Total milk income for the month
  const milkRecords = await MilkCollection.find({
    farmerId: new mongoose.Types.ObjectId(farmerId),
    date: { $gte: startDate, $lte: endDate }
  });
  const totalMilkIncome = milkRecords.reduce((s, r) => s + r.amountInr, 0);
  const totalMilkQuantity = milkRecords.reduce((s, r) => s + r.quantityLiters, 0);
  const weeklyBreakdown = getWeeklyBreakdown(milkRecords);

  // 2. Food expenses for the month
  const foodFilter = {
    farmerId: new mongoose.Types.ObjectId(farmerId),
    date: { $gte: startDate, $lte: endDate }
  };
  if (centerId) foodFilter.collectionCenterId = new mongoose.Types.ObjectId(centerId);
  const foodRecords = await FoodRecord.find(foodFilter);
  const totalFoodExpenses = foodRecords.reduce((s, r) => s + r.totalAmount, 0);

  // 3. Active advance balance for farmer (running total)
  const activeAdvances = await Advance.find({
    farmerId: new mongoose.Types.ObjectId(farmerId),
    status: 'Active'
  });
  const totalAdvanceBalance = activeAdvances.reduce((s, a) => s + a.remainingAmount, 0);

  // 4. Correct calculation logic: Deduct both advance AND food from milk income
  const totalDeductions = totalAdvanceBalance + totalFoodExpenses;
  let finalPayableAmount, remainingAdvanceBalance, totalAdvanceDeducted;

  if (totalMilkIncome >= totalDeductions) {
    // Milk income covers all deductions - pay remaining to farmer
    finalPayableAmount = totalMilkIncome - totalDeductions;
    remainingAdvanceBalance = 0;
    totalAdvanceDeducted = totalAdvanceBalance;
  } else if (totalMilkIncome >= totalFoodExpenses) {
    // Milk income covers food but not full advance
    finalPayableAmount = 0;
    const afterFood = totalMilkIncome - totalFoodExpenses;
    totalAdvanceDeducted = afterFood;
    remainingAdvanceBalance = totalAdvanceBalance - afterFood;
  } else {
    // Milk income doesn't even cover food expenses
    finalPayableAmount = 0;
    totalAdvanceDeducted = 0;
    remainingAdvanceBalance = totalAdvanceBalance + (totalFoodExpenses - totalMilkIncome);
  }

  let paymentStatus = 'Pending';
  if (remainingAdvanceBalance > 0) {
    paymentStatus = 'AdvanceRemaining';
  } else if (finalPayableAmount <= 0) {
    paymentStatus = 'Paid';
  }

  const collectionCenterId = centerId || farmer.assignedCenter;

  const payable = await Payable.findOneAndUpdate(
    { farmerId: new mongoose.Types.ObjectId(farmerId), collectionCenterId, month: Number(month), year: Number(year) },
    {
      farmerCode: farmer.farmerCode,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      collectionCenterId,
      month: Number(month),
      year: Number(year),
      totalMilkIncome,
      totalMilkQuantity,
      totalAdvanceDeducted,
      totalFoodExpenses,
      finalPayableAmount,
      remainingAdvanceBalance,
      paymentStatus,
      weeklyBreakdown
    },
    { upsert: true, new: true }
  );

  res.json({ success: true, data: payable });
});

// @desc  Get payable list (admin: filter center/farmer/month/year; head: own center)
// @route GET /api/payable
const getPayables = asyncHandler(async (req, res) => {
  const { centerId, farmerId, farmerCode, month, year, status } = req.query;
  const filter = {};

  if (req.user.role === 'collectionHead') {
    filter.collectionCenterId = req.user.centerId;
  } else {
    if (centerId) filter.collectionCenterId = centerId;
  }
  if (farmerId) filter.farmerId = farmerId;
  if (farmerCode) filter.farmerCode = farmerCode;
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);
  if (status) filter.paymentStatus = status;

  const payables = await Payable.find(filter)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode')
    .sort({ year: -1, month: -1 });

  res.json({ success: true, data: payables });
});

// @desc  Get single farmer payable details
// @route GET /api/payable/farmer/:farmerId
const getFarmerPayableDetails = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { farmerId: req.params.farmerId };
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  const payables = await Payable.find(filter)
    .populate('collectionCenterId', 'name centerCode')
    .sort({ year: -1, month: -1 });

  res.json({ success: true, data: payables });
});

// @desc  Get center-wise payable report
// @route GET /api/payable/center/:centerId/report
const getCenterPayableReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { collectionCenterId: req.params.centerId };
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  const payables = await Payable.find(filter)
    .populate('farmerId', 'fullName farmerCode mobileNumber')
    .sort({ year: -1, month: -1 });

  const summary = {
    totalFarmers: payables.length,
    totalMilkIncome: payables.reduce((s, p) => s + p.totalMilkIncome, 0),
    totalAdvanceDeducted: payables.reduce((s, p) => s + p.totalAdvanceDeducted, 0),
    totalFoodExpenses: payables.reduce((s, p) => s + p.totalFoodExpenses, 0),
    totalPayable: payables.filter(p => p.finalPayableAmount > 0).reduce((s, p) => s + p.finalPayableAmount, 0),
    pendingCount: payables.filter(p => p.paymentStatus === 'Pending').length,
    paidCount: payables.filter(p => p.paymentStatus === 'Paid').length,
    advanceRemainingCount: payables.filter(p => p.paymentStatus === 'AdvanceRemaining').length
  };

  res.json({ success: true, data: { payables, summary } });
});

// @desc  Mark payable as Paid
// @route PUT /api/payable/:id/mark-paid
const markPayableAsPaid = asyncHandler(async (req, res) => {
  const payable = await Payable.findById(req.params.id);
  if (!payable) {
    res.status(404);
    throw new Error('Payable record not found');
  }

  if (payable.paymentStatus !== 'Pending') {
    res.status(400);
    throw new Error('Only pending payables can be marked as paid');
  }

  payable.paymentStatus = 'Paid';
  await payable.save();

  // Handle advance adjustments based on the settlement
  const advances = await Advance.find({ farmerId: payable.farmerId, status: 'Active' }).sort({ createdAt: 1 });
  let totalToDeduct = payable.totalAdvanceDeducted;
  
  for (const adv of advances) {
    if (totalToDeduct <= 0) break;
    
    if (adv.remainingAmount <= totalToDeduct) {
      // Clear this advance completely
      totalToDeduct -= adv.remainingAmount;
      adv.remainingAmount = 0;
      adv.status = 'Settled';
    } else {
      // Partially deduct from this advance
      adv.remainingAmount -= totalToDeduct;
      totalToDeduct = 0;
    }
    await adv.save();
  }

  res.json({ success: true, data: payable });
});

// @desc  Delete payable (only if finalPayableAmount === 0)
// @route DELETE /api/payable/:id
const deletePayable = asyncHandler(async (req, res) => {
  const payable = await Payable.findById(req.params.id);
  if (!payable) {
    res.status(404);
    throw new Error('Payable record not found');
  }
  if (payable.finalPayableAmount !== 0) {
    res.status(400);
    throw new Error('Cannot delete payable with non-zero amount. Clear it first.');
  }
  await payable.deleteOne();
  res.json({ success: true, message: 'Payable record deleted' });
});

module.exports = { generatePayable, getPayables, getFarmerPayableDetails, getCenterPayableReport, markPayableAsPaid, deletePayable };
