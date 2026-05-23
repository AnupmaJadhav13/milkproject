const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { createMilkEntry, getMilkEntries } = require('../controllers/milkController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const milkRules = [
  body('farmerId')
    .notEmpty().withMessage('Farmer is required'),

  body('shift')
    .notEmpty().withMessage('Shift is required')
    .isIn(['Morning', 'Evening']).withMessage('Shift must be Morning or Evening'),

  body('animalType')
    .notEmpty().withMessage('Animal type is required')
    .isIn(['Cow', 'Buffalo']).withMessage('Animal type must be Cow or Buffalo'),

  body('quantityLiters')
    .notEmpty().withMessage('Milk quantity is required')
    .isFloat({ min: 0.1, max: 500 }).withMessage('Quantity must be between 0.1 and 500 liters'),

  body('fat')
    .notEmpty().withMessage('FAT value is required')
    .isFloat({ min: 2.0, max: 10.0 }).withMessage('FAT must be between 2.0 and 10.0'),

  body('snf')
    .notEmpty().withMessage('SNF value is required')
    .isFloat({ min: 6.0, max: 12.0 }).withMessage('SNF must be between 6.0 and 12.0'),

  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((val) => {
      if (new Date(val) > new Date()) throw new Error('Date cannot be in the future');
      return true;
    }),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

router.post('/', authorizeRoles('collection_head'), milkRules, validateRequest, createMilkEntry);
router.get('/', authorizeRoles('admin', 'collection_head'), getMilkEntries);

module.exports = router;
