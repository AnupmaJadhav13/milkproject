const asyncHandler = require('express-async-handler');
const FoodRecord = require('../models/FoodRecord');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const CollectionHead = require('../models/CollectionHead');
const { sendSMS } = require('../services/smsService');

// @desc    Create a new food record
// @route   POST /api/food
// @access  Private (Collection Head)
const createFoodRecord = asyncHandler(async (req, res) => {
  const {
    farmerId,
    animalType,
    foodType,
    brandName,
    quantity,
    unit,
    rate,
    paymentStatus,
    notes,
    date
  } = req.body;

  const collectionHeadId = req.user.id;
  const collectionHead = await CollectionHead.findById(collectionHeadId);
  if (!collectionHead) {
    res.status(404);
    throw new Error('Collection Head not found');
  }

  const farmer = await Farmer.findById(farmerId);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  // Check if farmer is assigned to the collection head's center
  if (farmer.assignedCenter.toString() !== collectionHead.assignedCenter.toString()) {
    res.status(403);
    throw new Error('Farmer not assigned to your collection center');
  }

  const totalAmount = quantity * rate;

  const foodRecord = await FoodRecord.create({
    collectionCenterId: collectionHead.assignedCenter,
    collectionHeadId,
    farmerId,
    animalType,
    foodType,
    brandName,
    quantity,
    unit,
    rate,
    totalAmount,
    paymentStatus: paymentStatus || 'Pending',
    notes,
    date: date || new Date()
  });

  // Send SMS notification
  try {
    await sendSMS(farmer.mobileNumber, {
      farmerName: farmer.fullName,
      quantity,
      unit,
      foodType,
      rate,
      totalAmount,
      centerName: collectionHead.centerName || 'Your Collection Center'
    });
  } catch (smsError) {
    console.error('SMS sending failed:', smsError);
    // Don't fail the request if SMS fails
  }

  res.status(201).json(foodRecord);
});

// @desc    Update a food record
// @route   PUT /api/food/:id
// @access  Private (Collection Head - same day only, Admin)
const updateFoodRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const foodRecord = await FoodRecord.findById(id);
  if (!foodRecord) {
    res.status(404);
    throw new Error('Food record not found');
  }

  const userRole = req.user.role;
  const userId = req.user.id;

  // Collection Head can only update same-day records
  if (userRole === 'collection_head') {
    if (foodRecord.collectionHeadId.toString() !== userId) {
      res.status(403);
      throw new Error('Not authorized to update this record');
    }
    const recordDate = new Date(foodRecord.createdAt).toDateString();
    const today = new Date().toDateString();
    if (recordDate !== today) {
      res.status(403);
      throw new Error('Can only edit same-day records');
    }
  }

  // Recalculate total if quantity or rate changed
  if (updates.quantity || updates.rate) {
    const quantity = updates.quantity || foodRecord.quantity;
    const rate = updates.rate || foodRecord.rate;
    updates.totalAmount = quantity * rate;
  }

  const updatedRecord = await FoodRecord.findByIdAndUpdate(id, updates, { new: true });

  res.json(updatedRecord);
});

// @desc    Get all food records
// @route   GET /api/food
// @access  Private (Admin)
const getAllFoodRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, center, farmer, date, animalType, foodType } = req.query;

  const filter = {};
  if (center) filter.collectionCenterId = center;
  if (farmer) filter.farmerId = farmer;
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    filter.date = { $gte: startDate, $lt: endDate };
  }
  if (animalType) filter.animalType = animalType;
  if (foodType) filter.foodType = foodType;

  const foodRecords = await FoodRecord.find(filter)
    .populate('collectionCenterId', 'name')
    .populate('collectionHeadId', 'name')
    .populate('farmerId', 'fullName mobileNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await FoodRecord.countDocuments(filter);

  res.json({
    foodRecords,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// @desc    Get food records by center
// @route   GET /api/food/center/:centerId
// @access  Private (Collection Head, Admin)
const getFoodRecordsByCenter = asyncHandler(async (req, res) => {
  const { centerId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const userRole = req.user.role;
  const userId = req.user.id;

  if (userRole === 'collection_head') {
    const collectionHead = await CollectionHead.findById(userId);
    if (collectionHead.assignedCenter.toString() !== centerId) {
      res.status(403);
      throw new Error('Not authorized to view this center\'s records');
    }
  }

  const foodRecords = await FoodRecord.find({ collectionCenterId: centerId })
    .populate('farmerId', 'fullName mobileNumber')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await FoodRecord.countDocuments({ collectionCenterId: centerId });

  res.json({
    foodRecords,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total
  });
});

// @desc    Get food records by farmer
// @route   GET /api/food/farmer/:farmerId
// @access  Private (Collection Head, Admin)
const getFoodRecordsByFarmer = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  const foodRecords = await FoodRecord.find({ farmerId })
    .populate('collectionCenterId', 'name')
    .populate('collectionHeadId', 'name')
    .sort({ createdAt: -1 });

  res.json(foodRecords);
});

// @desc    Get monthly reports
// @route   GET /api/food/reports/monthly
// @access  Private (Admin)
const getMonthlyReports = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const reports = await FoodRecord.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: '$collectionCenterId',
        totalAmount: { $sum: '$totalAmount' },
        totalQuantity: { $sum: '$quantity' },
        recordCount: { $sum: 1 }
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
    {
      $unwind: '$center'
    },
    {
      $project: {
        centerName: '$center.name',
        totalAmount: 1,
        totalQuantity: 1,
        recordCount: 1
      }
    }
  ]);

  res.json(reports);
});

// @desc    Delete a food record
// @route   DELETE /api/food/:id
// @access  Private (Admin)
const deleteFoodRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foodRecord = await FoodRecord.findById(id);
  if (!foodRecord) {
    res.status(404);
    throw new Error('Food record not found');
  }

  await FoodRecord.findByIdAndDelete(id);

  res.json({ message: 'Food record deleted successfully' });
});

module.exports = {
  createFoodRecord,
  updateFoodRecord,
  getAllFoodRecords,
  getFoodRecordsByCenter,
  getFoodRecordsByFarmer,
  getMonthlyReports,
  deleteFoodRecord
};