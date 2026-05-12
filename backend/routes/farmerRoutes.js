const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createFarmer,
  updateFarmer,
  deleteFarmer,
  getAllFarmers,
  getFarmersByCenter
} = require('../controllers/farmerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const farmerValidationRules = [
  check('fullName', 'Farmer full name is required').notEmpty(),
  check('mobileNumber', 'Mobile number is required').notEmpty(),
  check('address', 'Address is required').notEmpty(),
  check('village', 'Village is required').notEmpty(),
  check('bankName', 'Bank name is required').notEmpty(),
  check('ifscCode', 'IFSC code is required').notEmpty(),
  check('accountNumber', 'Account number is required').notEmpty(),
  check('accountHolderName', 'Account holder name is required').notEmpty(),
  check('assignedCenterCode', 'Assigned center or center code is required').custom((value, { req }) => {
    return Boolean(req.body.assignedCenter || value);
  }),
  check('animalType', 'Animal type is required').notEmpty()
];

router.route('/').get(authorizeRoles('admin'), getAllFarmers).post(authorizeRoles('admin'), farmerValidationRules, validateRequest, createFarmer);
router.route('/:id').put(authorizeRoles('admin'), farmerValidationRules, validateRequest, updateFarmer).delete(authorizeRoles('admin'), deleteFarmer);
router.route('/center/:centerId').get(authorizeRoles('admin', 'collection_head'), getFarmersByCenter);

module.exports = router;
