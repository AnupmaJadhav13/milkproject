const asyncHandler = require('express-async-handler');
const CollectionCenter = require('../models/CollectionCenter');

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

  if (collectionHead?.username) {
    const headExists = await CollectionCenter.findOne({ 'collectionHead.username': collectionHead.username });
    if (headExists) {
      res.status(400);
      throw new Error('Collection head username already exists');
    }
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
    status: status || 'Active',
    collectionHead: collectionHead || undefined
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

  if (req.body.collectionHead?.username && req.body.collectionHead.username !== center.collectionHead?.username) {
    const headExists = await CollectionCenter.findOne({ 'collectionHead.username': req.body.collectionHead.username });
    if (headExists) {
      res.status(400);
      throw new Error('Collection head username already exists');
    }
  }

  if (req.body.collectionHead !== undefined) {
    center.collectionHead = {
      ...center.collectionHead?.toObject(),
      ...req.body.collectionHead
    };
  }

  const updatedCenter = await center.save();
  res.json(updatedCenter);
});

const deleteCenter = asyncHandler(async (req, res) => {
  const center = await CollectionCenter.findById(req.params.id);
  if (!center) {
    res.status(404);
    throw new Error('Center not found');
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
