const asyncHandler = require('express-async-handler');
const Farmer = require('../models/Farmer');
const CollectionCenter = require('../models/CollectionCenter');

const createFarmer = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobileNumber,
    alternativeNumber,
    address,
    village,
    aadhaarNumber,
    gender,
    bankName,
    ifscCode,
    accountNumber,
    accountHolderName,
    branchName,
    assignedCenter,
    animalType,
    status,
    photo,
    notes
  } = req.body;

  const center = await CollectionCenter.findById(assignedCenter);
  if (!center) {
    res.status(400);
    throw new Error('Assigned center is invalid');
  }

  const farmer = await Farmer.create({
    fullName,
    mobileNumber,
    alternativeNumber,
    address,
    village,
    aadhaarNumber,
    gender,
    bankName,
    ifscCode,
    accountNumber,
    accountHolderName,
    branchName,
    assignedCenter,
    animalType,
    status: status || 'Active',
    photo,
    notes
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
    'fullName',
    'mobileNumber',
    'alternativeNumber',
    'address',
    'village',
    'aadhaarNumber',
    'gender',
    'bankName',
    'ifscCode',
    'accountNumber',
    'accountHolderName',
    'branchName',
    'assignedCenter',
    'animalType',
    'status',
    'photo',
    'notes'
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      farmer[field] = req.body[field];
    }
  });

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
      { fullName: searchRegex },
      { mobileNumber: searchRegex },
      { village: searchRegex },
      { aadhaarNumber: searchRegex }
    ];
  }

  const farmers = await Farmer.find(filters)
    .populate('assignedCenter', 'name centerCode status')
    .sort({ createdAt: -1 });

  res.json(farmers);
});

const getFarmersByCenter = asyncHandler(async (req, res) => {
  const center = req.params.centerId || req.user.assignedCenter;
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
