const asyncHandler = require('express-async-handler');
const MilkCollection = require('../models/MilkCollection');
const Farmer = require('../models/Farmer');

const createMilkEntry = asyncHandler(async (req, res) => {
  const { farmerId, date, amountInr, quantityLiters, notes } = req.body;
  const userRole = req.user.role;
  let collectionCenterId = req.body.collectionCenterId;

  if (userRole === 'collection_head') {
    collectionCenterId = req.user.assignedCenter || req.user._id;
  } else if (userRole === 'admin') {
    collectionCenterId = req.body.collectionCenterId || collectionCenterId;
    if (!collectionCenterId) {
      res.status(400);
      throw new Error('collectionCenterId is required for admin');
    }
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

  const day = date ? new Date(date) : new Date();
  day.setHours(0, 0, 0, 0);

  const entry = await MilkCollection.create({
    farmerId,
    collectionCenterId,
    date: day,
    amountInr: Number(amountInr),
    quantityLiters: quantityLiters != null ? Number(quantityLiters) : undefined,
    notes
  });

  const populated = await MilkCollection.findById(entry._id)
    .populate('farmerId', 'fullName mobileNumber farmerCode')
    .populate('collectionCenterId', 'name centerCode');

  res.status(201).json(populated);
});

module.exports = { createMilkEntry };
