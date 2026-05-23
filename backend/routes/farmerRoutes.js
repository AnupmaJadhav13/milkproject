const express = require('express');
const { check, body } = require('express-validator');
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

// ── Validation rules ──────────────────────────────────────────────────────────
const farmerValidationRules = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Farmer full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('mobileNumber')
    .trim()
    .notEmpty().withMessage('Mobile number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('alternativeNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Alternative number must be a valid 10-digit Indian mobile number'),

  body('address')
    .trim()
    .notEmpty().withMessage('Address is required')
    .isLength({ min: 3, max: 300 }).withMessage('Address must be 3–300 characters'),

  body('village')
    .trim()
    .notEmpty().withMessage('Village is required')
    .isLength({ min: 2, max: 100 }).withMessage('Village must be 2–100 characters'),

  body('bankName')
    .trim()
    .notEmpty().withMessage('Bank name is required'),

  body('ifscCode')
    .trim()
    .notEmpty().withMessage('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i).withMessage('Enter a valid IFSC code (e.g. SBIN0001234)')
    .toUpperCase(),

  body('accountNumber')
    .trim()
    .notEmpty().withMessage('Account number is required')
    .matches(/^\d{9,18}$/).withMessage('Account number must be 9–18 digits'),

  body('accountHolderName')
    .trim()
    .notEmpty().withMessage('Account holder name is required'),

  body('animalType')
    .notEmpty().withMessage('Animal type is required')
    .isIn(['Cow', 'Buffalo', 'Both']).withMessage('Animal type must be Cow, Buffalo, or Both'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive'),

  body().custom((_, { req }) => {
    if (!req.body.assignedCenter && !req.body.assignedCenterCode) {
      throw new Error('Assigned center is required');
    }
    return true;
  })
];

// Relaxed rules for update (all fields optional)
const farmerUpdateRules = [
  body('mobileNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),

  body('alternativeNumber')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9]\d{9}$/).withMessage('Alternative number must be a valid 10-digit Indian mobile number'),

  body('ifscCode')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/i).withMessage('Enter a valid IFSC code')
    .toUpperCase(),

  body('accountNumber')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^\d{9,18}$/).withMessage('Account number must be 9–18 digits'),

  body('animalType')
    .optional()
    .isIn(['Cow', 'Buffalo', 'Both']).withMessage('Animal type must be Cow, Buffalo, or Both'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive']).withMessage('Status must be Active or Inactive')
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.route('/')
  .get(authorizeRoles('admin'), getAllFarmers)
  .post(authorizeRoles('admin'), farmerValidationRules, validateRequest, createFarmer);

router.route('/:id')
  .put(authorizeRoles('admin'), farmerUpdateRules, validateRequest, updateFarmer)
  .delete(authorizeRoles('admin'), deleteFarmer);

router.route('/center/:centerId')
  .get(authorizeRoles('admin', 'collection_head'), getFarmersByCenter);

module.exports = router;
