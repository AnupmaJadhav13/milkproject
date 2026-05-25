const asyncHandler = require('express-async-handler');
const Payable = require('../models/Payable');
const Advance = require('../models/Advance');
const MilkCollection = require('../models/MilkCollection');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const mongoose = require('mongoose');
const { sendPaymentDoneNotification } = require('../services/notificationService');

// ---------- helpers ----------
const round2 = (value) => Number((Number(value || 0)).toFixed(2));

const getFoodPendingAmount = (record) => Math.max(
  0,
  round2((record.totalAmount || 0) - (record.paidAmount || 0))
);

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

// @desc  Auto-generate / refresh payable for a farmer for a given date range
//        deductAdvance and deductFood are optional booleans (default false)
// @route POST /api/payable/generate
const generatePayable = asyncHandler(async (req, res) => {
  const {
    farmerId,
    centerId,
    fromDate,
    toDate,
    // legacy month/year support
    month,
    year,
    deductAdvance = false,
    deductFood = false
  } = req.body;

  if (!farmerId) {
    res.status(400);
    throw new Error('farmerId is required');
  }

  // Resolve date range — prefer fromDate/toDate, fall back to month/year
  let startDate, endDate, cycleLabel;
  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
    cycleLabel = `${fromDate} to ${toDate}`;
  } else if (month && year) {
    startDate = new Date(year, month - 1, 1);
    endDate   = new Date(year, month, 0, 23, 59, 59);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    cycleLabel = `${monthNames[month - 1]} ${year}`;
  } else {
    res.status(400);
    throw new Error('Either (fromDate + toDate) or (month + year) are required');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  // Collection head can only generate payables for farmers in their own center
  if (req.user.role === 'collection_head') {
    const farmerCenterId = farmer.assignedCenter?.toString();
    const headCenterId   = req.user.assignedCenter?.toString();
    if (farmerCenterId !== headCenterId) {
      res.status(403);
      throw new Error('You can only manage payables for farmers in your assigned center');
    }
  }

  // 1. Milk income for the date range
  const milkRecords = await MilkCollection.find({
    farmerId: new mongoose.Types.ObjectId(farmerId),
    date: { $gte: startDate, $lte: endDate }
  });
  const totalMilkIncome   = milkRecords.reduce((s, r) => s + r.amountInr, 0);
  const totalMilkQuantity = milkRecords.reduce((s, r) => s + r.quantityLiters, 0);
  const totalMilkDays     = new Set(milkRecords.map(r => new Date(r.date).toDateString())).size;
  const weeklyBreakdown   = getWeeklyBreakdown(milkRecords);

  // 2. Food pending (all-time pending, not date-filtered — food debt carries over)
  const foodFilter = {
    farmerId: new mongoose.Types.ObjectId(farmerId),
    paymentStatus: 'Pending'
  };
  if (centerId) foodFilter.collectionCenterId = new mongoose.Types.ObjectId(centerId);
  const pendingFoodRecords  = await FoodRecord.find(foodFilter);
  const totalFoodPending    = round2(pendingFoodRecords.reduce((s, r) => s + getFoodPendingAmount(r), 0));

  // 3. Active advance remaining balance (all-time active)
  const activeAdvances = await Advance.find({
    farmerId: new mongoose.Types.ObjectId(farmerId),
    status: 'Active'
  }).sort({ createdAt: 1 });
  const totalAdvanceRemaining = round2(activeAdvances.reduce((s, a) => s + a.remainingAmount, 0));

  // 4. Toggle-based deduction — CORRECT LOGIC
  //    Milk income is the ceiling. You can never deduct more than what milk earned.
  //
  //    Step 1: deduct food first (if toggle ON)
  //    Step 2: whatever milk is left after food → use for advance (if toggle ON)
  //    Step 3: final payable = milk - food_deducted - advance_deducted  (always >= 0)
  //    Step 4: advance_recovered = min(advance_remaining, milk_after_food)
  //    Step 5: advance_still_remaining = advance_remaining - advance_recovered

  const foodDeducted = round2(deductFood ? Math.min(totalFoodPending, totalMilkIncome) : 0);

  const milkAfterFood = round2(Math.max(0, totalMilkIncome - foodDeducted));

  // How much of the advance can actually be recovered from this milk cycle
  const advanceRecovered = round2(deductAdvance ? Math.min(totalAdvanceRemaining, milkAfterFood) : 0);

  // What admin "deducted" = what was actually recovered from milk (not the full balance)
  const advanceDeducted = advanceRecovered;

  const finalPayableAmount = round2(Math.max(0, milkAfterFood - advanceDeducted));

  // Advance still outstanding after this payment cycle
  const remainingAdvanceBalance = round2(Math.max(0, totalAdvanceRemaining - advanceRecovered));

  const collectionCenterId = centerId || farmer.assignedCenter;

  // Use month/year for the unique index — derive from startDate if not provided
  const recordMonth = month || (startDate.getMonth() + 1);
  const recordYear  = year  || startDate.getFullYear();

  // ── Guard: never overwrite a Paid record ──
  // Check if a Paid record already exists for this exact cycle
  const existing = await Payable.findOne({
    farmerId: new mongoose.Types.ObjectId(farmerId),
    collectionCenterId,
    month: Number(recordMonth),
    year:  Number(recordYear)
  });

  if (existing && existing.paymentStatus === 'Paid') {
    // Return the paid record as-is — do not overwrite
    return res.json({
      success: true,
      data: existing,
      alreadyPaid: true,
      message: 'This cycle is already marked as Paid. No changes made.'
    });
  }

  const payable = await Payable.findOneAndUpdate(
    {
      farmerId: new mongoose.Types.ObjectId(farmerId),
      collectionCenterId,
      month: Number(recordMonth),
      year:  Number(recordYear)
    },
    {
      farmerCode: farmer.farmerCode,
      farmerId: new mongoose.Types.ObjectId(farmerId),
      collectionCenterId,
      month: Number(recordMonth),
      year:  Number(recordYear),
      fromDate: startDate,
      toDate:   endDate,
      totalMilkIncome,
      totalMilkQuantity,
      totalMilkDays,
      totalAdvanceDeducted: advanceDeducted,
      totalFoodExpenses:    foodDeducted,
      totalFoodPending,
      totalAdvanceRemaining,
      finalPayableAmount,
      remainingAdvanceBalance,
      paymentCycle: cycleLabel,
      deductAdvance: Boolean(deductAdvance),
      deductFood:    Boolean(deductFood),
      paymentStatus: 'Pending',   // only set on NEW records; existing Paid records are blocked above
      adminApprovalStatus: existing?.adminApprovalStatus || 'Draft',
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

  if (req.user.role === 'collection_head') {
    filter.collectionCenterId = req.user.assignedCenter;
  } else {
    filter.adminApprovalStatus = 'Forwarded';
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

  // Collection head can only view their own center's report
  let targetCenterId = req.params.centerId;
  if (req.user.role === 'collection_head') {
    targetCenterId = req.user.assignedCenter?.toString();
  }

  const filter = { collectionCenterId: targetCenterId };
  if (req.user.role === 'admin') filter.adminApprovalStatus = 'Forwarded';
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
    totalPayable: payables.reduce((s, p) => s + p.finalPayableAmount, 0),
    pendingCount: payables.filter(p => p.paymentStatus === 'Pending').length,
    paidCount: payables.filter(p => p.paymentStatus === 'Paid').length
  };

  res.json({ success: true, data: { payables, summary } });
});

// @desc  Forward collection-head finalized payable to Admin
// @route PUT /api/payable/:id/forward
const forwardPayableToAdmin = asyncHandler(async (req, res) => {
  const payable = await Payable.findById(req.params.id).populate('collectionCenterId', '_id');
  if (!payable) {
    res.status(404);
    throw new Error('Payable record not found');
  }

  const payableCenterId = payable.collectionCenterId?._id?.toString() || payable.collectionCenterId?.toString();
  const headCenterId = req.user.assignedCenter?.toString();
  if (payableCenterId !== headCenterId) {
    res.status(403);
    throw new Error('You can only forward payables for your assigned center');
  }

  if (payable.paymentStatus === 'Paid') {
    res.status(400);
    throw new Error('Paid payable records cannot be forwarded again');
  }

  payable.adminApprovalStatus = 'Forwarded';
  payable.forwardedToAdminAt = new Date();
  payable.forwardedBy = req.user.assignedCenter;
  await payable.save();

  const updated = await Payable.findById(payable._id)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode');

  res.json({ success: true, data: updated });
});

// @desc  Mark payable as Paid
//        Settles advance records FIFO by the ACTUAL recovered amount (not full balance)
//        Marks food records as Paid only if food toggle was ON
// @route PUT /api/payable/:id/mark-paid
const markPayableAsPaid = asyncHandler(async (req, res) => {
  const payable = await Payable.findById(req.params.id).populate('collectionCenterId', '_id');
  if (!payable) {
    res.status(404);
    throw new Error('Payable record not found');
  }

  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only Admin can mark payables as Paid');
  }

  if (payable.adminApprovalStatus !== 'Forwarded') {
    res.status(400);
    throw new Error('Only payables forwarded by Collection Head can be marked as Paid');
  }

  if (payable.paymentStatus === 'Paid') {
    res.status(400);
    throw new Error('This payable is already marked as Paid');
  }

  payable.paymentStatus = 'Paid';
  await payable.save();

  // ── Advance settlement ──
  // Only deduct the amount that was ACTUALLY recovered from milk income.
  // totalAdvanceDeducted = min(advance_remaining, milk_after_food)  ← set correctly in generatePayable
  if (payable.deductAdvance && payable.totalAdvanceDeducted > 0) {
    const advances = await Advance.find({
      farmerId: payable.farmerId,
      status: 'Active'
    }).sort({ createdAt: 1 }); // FIFO — oldest advance first

    let toDeduct = payable.totalAdvanceDeducted; // e.g. ₹870 (not ₹5500)

    for (const adv of advances) {
      if (toDeduct <= 0) break;

      if (adv.remainingAmount <= toDeduct) {
        // This advance is fully recovered
        toDeduct -= adv.remainingAmount;
        adv.remainingAmount = 0;
        adv.status = 'Settled';
      } else {
        // Partially recovered — reduce remaining
        adv.remainingAmount = Number((adv.remainingAmount - toDeduct).toFixed(2));
        toDeduct = 0;
      }
      await adv.save();
    }
  }

  // ── Food settlement ──
  if (payable.deductFood && payable.totalFoodExpenses > 0) {
    const foodRecords = await FoodRecord.find({
      farmerId: payable.farmerId,
      paymentStatus: 'Pending'
    }).sort({ date: 1, createdAt: 1 });

    let foodToSettle = payable.totalFoodExpenses;

    for (const food of foodRecords) {
      if (foodToSettle <= 0) break;

      const pendingAmount = getFoodPendingAmount(food);
      if (pendingAmount <= 0) {
        food.paymentStatus = 'Paid';
        await food.save();
        continue;
      }

      const applied = Math.min(pendingAmount, foodToSettle);
      food.paidAmount = round2((food.paidAmount || 0) + applied);
      foodToSettle = round2(foodToSettle - applied);

      if (getFoodPendingAmount(food) <= 0) {
        food.paymentStatus = 'Paid';
      }
      await food.save();
    }
  }

  // Return populated payable
  const updated = await Payable.findById(payable._id)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode');

  // Send payment confirmation in-app notification (async, non-blocking)
  const farmerDoc = updated.farmerId;
  if (farmerDoc?._id) {
    sendPaymentDoneNotification(farmerDoc._id, {
      farmerName: farmerDoc.fullName,
      amount:     round2(payable.finalPayableAmount),
      advanceDeducted: payable.totalAdvanceDeducted || 0,
      date:       new Date().toLocaleDateString('en-IN'),
      cycle:      payable.paymentCycle || `${payable.month}/${payable.year}`
    });
  }

  res.json({ success: true, data: updated });
});

// @desc  Delete payable
// @route DELETE /api/payable/:id
const deletePayable = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only Admin can delete payable records');
  }

  const payable = await Payable.findById(req.params.id);
  if (!payable) {
    res.status(404);
    throw new Error('Payable record not found');
  }
  await payable.deleteOne();
  res.json({ success: true, message: 'Payable record deleted' });
});

module.exports = {
  generatePayable,
  getPayables,
  getFarmerPayableDetails,
  getCenterPayableReport,
  forwardPayableToAdmin,
  markPayableAsPaid,
  deletePayable
};
