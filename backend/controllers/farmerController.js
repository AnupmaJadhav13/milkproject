const asyncHandler = require('express-async-handler');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');
const { sendFarmerRegistrationNotification } = require('../services/notificationService');

const getNextFarmerCode = async () => {
  const latestFarmer = await Farmer.findOne({ farmerCode: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .select('farmerCode');

  const lastNumber = Number((latestFarmer?.farmerCode || '').replace('FARM-', '')) || 0;
  return `FARM-${String(lastNumber + 1).padStart(4, '0')}`;
};

const createFarmer = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    alternativeNumber,
    address,
    village,
    bankName,
    ifscCode,
    accountNumber,
    accountHolderName,
    assignedCenterCode,
    assignedCenter,
    animalType,
    status,
    photo
  } = req.body;

  let center = null;
  if (assignedCenterCode) {
    center = await CollectionCenter.findOne({ centerCode: assignedCenterCode });
  }
  if (!center && assignedCenter) {
    center = await CollectionCenter.findById(assignedCenter);
  }
  if (!center) {
    res.status(400);
    throw new Error('Assigned center is invalid');
  }

  const farmerCode = await getNextFarmerCode();

  const farmer = await Farmer.create({
    farmerCode,
    fullName,
    mobileNumber,
    alternativeNumber,
    address,
    village,
    bankName,
    ifscCode,
    accountNumber,
    accountHolderName,
    assignedCenterCode: center.centerCode,
    assignedCenter: center._id,
    animalType,
    status: status || 'Active',
    photo
  });

  // Send in-app registration notification asynchronously (non-blocking)
  sendFarmerRegistrationNotification(farmer._id, {
    farmerName: fullName,
    farmerCode,
    centerName: center.name
  });

  res.status(201).json(farmer);
});

const updateFarmer = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }

  const fields = [
    'farmerCode',
    'fullName',
    'mobileNumber',
    'alternativeNumber',
    'address',
    'village',
    'bankName',
    'ifscCode',
    'accountNumber',
    'accountHolderName',
    'assignedCenterCode',
    'assignedCenter',
    'animalType',
    'status',
    'photo'
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      farmer[field] = req.body[field];
    }
  });

  if (req.body.assignedCenterCode && !req.body.assignedCenter) {
    const center = await CollectionCenter.findOne({ centerCode: req.body.assignedCenterCode });
    if (!center) {
      res.status(400);
      throw new Error('Assigned center code is invalid');
    }
    farmer.assignedCenter = center._id;
    farmer.assignedCenterCode = center.centerCode;
  } else if (req.body.assignedCenter) {
    const center = await CollectionCenter.findById(req.body.assignedCenter);
    if (!center) {
      res.status(400);
      throw new Error('Assigned center is invalid');
    }
    farmer.assignedCenterCode = center.centerCode;
  }

  if (!farmer.farmerCode) {
    farmer.farmerCode = await getNextFarmerCode();
  }

  const updatedFarmer = await farmer.save();
  res.json(updatedFarmer);
});

const deleteFarmer = asyncHandler(async (req, res) => {
  const farmer = await Farmer.findById(req.params.id);
  if (!farmer) {
    res.status(404);
    throw new Error('Farmer not found');
  }
  await farmer.deleteOne();
  res.json({ message: 'Farmer removed' });
});

const getAllFarmers = asyncHandler(async (req, res) => {
  const { search, centerId } = req.query;
  const filters = {};

  if (centerId) {
    filters.assignedCenter = centerId;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filters.$or = [
      { farmerCode: searchRegex },
      { fullName: searchRegex },
      { mobileNumber: searchRegex },
      { village: searchRegex }
    ];
  }

  const farmers = await Farmer.find(filters)
    .populate('assignedCenter', 'name centerCode status')
    .sort({ createdAt: -1 });

  res.json(farmers);
});

const getFarmersByCenter = asyncHandler(async (req, res) => {
  const requestedCenterId = req.params.centerId || req.user.assignedCenter;
  if (req.user.role === 'collection_head' && String(requestedCenterId) !== String(req.user.assignedCenter)) {
    res.status(403);
    throw new Error('Not authorized to access farmers of another center');
  }
  const center = requestedCenterId;
  const farmers = await Farmer.find({ assignedCenter: center, status: 'Active' })
    .populate('assignedCenter', 'name centerCode status')
    .sort({ fullName: 1 });
  res.json(farmers);
});

module.exports = {
  createFarmer,
  updateFarmer,
  deleteFarmer,
  getAllFarmers,
  getFarmersByCenter
};
