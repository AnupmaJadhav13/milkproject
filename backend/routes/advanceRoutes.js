const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');
const {
  addAdvance,
  addAmountToAdvance,
  getAdvances,
  getFarmerAdvanceDetails,
  updateAdvance,
  deleteAdvance
} = require('../controllers/advanceController');

const advanceRules = [
  body('farmerId')
    .if((value, { req }) => req.user?.role === 'collection_head')
    .notEmpty().withMessage('Farmer is required'),

  body('centerId')
    .if((value, { req }) => req.user?.role === 'admin')
    .notEmpty().withMessage('Collection center is required'),

  body('advanceAmount')
    .notEmpty().withMessage('Advance amount is required')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
    .custom((val) => {
      if (Number(val) > 1000000) throw new Error('Amount seems too high (max ₹10,00,000)');
      return true;
    }),

  body('advanceDate')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((val) => {
      if (new Date(val) > new Date()) throw new Error('Date cannot be in the future');
      return true;
    }),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['Cash', 'Bank Transfer', 'UPI']).withMessage('Payment method must be Cash, Bank Transfer, or UPI'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

const addAmountRules = [
  body('extraAmount')
    .notEmpty().withMessage('Amount to add is required')
    .isFloat({ min: 1 }).withMessage('Amount must be greater than 0')
    .custom((val) => {
      if (Number(val) > 1000000) throw new Error('Amount seems too high');
      return true;
    }),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

router.post('/',                protect, authorizeRoles('admin', 'collection_head'), advanceRules, validateRequest, addAdvance);
router.post('/:id/add-amount', protect, authorizeRoles('collection_head'), addAmountRules, validateRequest, addAmountToAdvance);
router.get('/',                 protect, getAdvances);
router.get('/farmer/:farmerId', protect, getFarmerAdvanceDetails);
router.put('/:id',              protect, authorizeRoles('collection_head'), updateAdvance);
router.delete('/:id',           protect, authorizeRoles('collection_head'), deleteAdvance);

module.exports = router;
