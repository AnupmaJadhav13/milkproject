const asyncHandler = require('express-async-handler');
const CollectionCenter = require('../models/CollectionCenter');
const CollectionHead = require('../models/CollectionHead');

const createCenter = asyncHandler(async (req, res) => {
  const {
    name,
    centerCode,
    fullAddress,
    village,
    taluka,
    district,
    state,
    pincode,
    gpsLocation,
    latitude,
    longitude,
    status,
    collectionHead
  } = req.body;

  const existing = await CollectionCenter.findOne({ centerCode });
  if (existing) {
    res.status(400);
    throw new Error('Center code already exists');
  }

  const center = await CollectionCenter.create({
    name,
    centerCode,
    fullAddress,
    village,
    taluka,
    district,
    state,
    pincode,
    gpsLocation,
    latitude,
    longitude,
    status: status || 'Active'
  });

  res.status(201).json(center);
});

const updateCenter = asyncHandler(async (req, res) => {
  const center = await CollectionCenter.findById(req.params.id);
  if (!center) {
    res.status(404);
    throw new Error('Center not found');
  }

  const updateFields = [
    'name',
    'centerCode',
    'fullAddress',
    'village',
    'taluka',
    'district',
    'state',
    'pincode',
    'gpsLocation',
    'latitude',
    'longitude',
    'status'
  ];

  updateFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      center[field] = req.body[field];
    }
  });

  const updatedCenter = await center.save();
  res.json(updatedCenter);
});

const deleteCenter = asyncHandler(async (req, res) => {
  const center = await CollectionCenter.findById(req.params.id);
  if (!center) {
    res.status(404);
    throw new Error('Center not found');
  }

  const linkedHead = await CollectionHead.countDocuments({ assignedCenter: center._id });
  if (linkedHead > 0) {
    res.status(400);
    throw new Error('Remove or reassign collection head before deleting center');
  }

  await center.deleteOne();
  res.json({ message: 'Collection center deleted' });
});

const getCenters = asyncHandler(async (req, res) => {
  const centers = await CollectionCenter.find().sort({ createdAt: -1 });
  res.json(centers);
});

const getCenterById = asyncHandler(async (req, res) => {
  const center = await CollectionCenter.findById(req.params.id);
  if (!center) {
    res.status(404);
    throw new Error('Center not found');
  }
  res.json(center);
});

module.exports = {
  createCenter,
  updateCenter,
  deleteCenter,
  getCenters,
  getCenterById
};
