const asyncHandler = require('express-async-handler');
const CollectionCenter = require('../models/CollectionCenter');

const getNextCenterCode = async () => {
  const latestCenter = await CollectionCenter.findOne({ centerCode: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .select('centerCode');
  const lastNumber = Number((latestCenter?.centerCode || '').replace('CTR-', '')) || 0;
  return `CTR-${String(lastNumber + 1).padStart(4, '0')}`;
};

const createCenter = asyncHandler(async (req, res) => {
  const {
    name,
    fullAddress,
    village,
    district,
    state,
    pincode,
    status,
    collectionHead
  } = req.body;

  const centerCode = await getNextCenterCode();

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
    district,
    state,
    pincode,
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
    'fullAddress',
    'village',
    'district',
    'state',
    'pincode',
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
