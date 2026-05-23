const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  createFoodRecord,
  updateFoodRecord,
  getAllFoodRecords,
  getFoodRecordsByCenter,
  getFoodRecordsByFarmer,
  getMonthlyReports,
  deleteFoodRecord
} = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const foodRules = [
  body('farmerId')
    .notEmpty().withMessage('Farmer is required'),

  body('animalType')
    .notEmpty().withMessage('Animal type is required')
    .isIn(['Cow', 'Buffalo']).withMessage('Animal type must be Cow or Buffalo'),

  body('foodType')
    .notEmpty().withMessage('Food type is required')
    .isIn(['Cattle Feed', 'Buffalo Feed', 'Mineral Mix', 'Dry Fodder', 'Green Fodder', 'Protein Mix', 'Other'])
    .withMessage('Select a valid food type'),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
    .custom((val) => {
      if (Number(val) > 10000) throw new Error('Quantity seems too high');
      return true;
    }),

  body('unit')
    .notEmpty().withMessage('Unit is required')
    .isIn(['Bag', 'KG', 'Packet', 'Liter']).withMessage('Unit must be Bag, KG, Packet, or Liter'),

  body('rate')
    .notEmpty().withMessage('Rate is required')
    .isFloat({ min: 0.01 }).withMessage('Rate must be greater than 0')
    .custom((val) => {
      if (Number(val) > 100000) throw new Error('Rate seems too high');
      return true;
    }),

  body('paymentStatus')
    .optional()
    .isIn(['Pending', 'Paid']).withMessage('Payment status must be Pending or Paid'),

  body('date')
    .optional()
    .isISO8601().withMessage('Invalid date format'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters')
];

// Collection Head routes
router.post('/', authorizeRoles('collection_head'), foodRules, validateRequest, createFoodRecord);
router.put('/:id', authorizeRoles('collection_head', 'admin'), foodRules, validateRequest, updateFoodRecord);

// Admin routes
router.get('/', authorizeRoles('admin'), getAllFoodRecords);
router.get('/reports/monthly', authorizeRoles('admin'), getMonthlyReports);
router.delete('/:id', authorizeRoles('admin'), deleteFoodRecord);

// Shared routes
router.get('/center/:centerId', authorizeRoles('collection_head', 'admin'), getFoodRecordsByCenter);
router.get('/farmer/:farmerId', authorizeRoles('collection_head', 'admin'), getFoodRecordsByFarmer);

module.exports = router;
