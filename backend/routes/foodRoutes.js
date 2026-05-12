const express = require('express');
const { check } = require('express-validator');
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

const foodRecordValidationRules = [
  check('farmerId', 'Farmer ID is required').notEmpty(),
  check('animalType', 'Animal type is required').isIn(['Cow', 'Buffalo']),
  check('foodType', 'Food type is required').isIn(['Cattle Feed', 'Buffalo Feed', 'Mineral Mix', 'Dry Fodder', 'Green Fodder', 'Protein Mix', 'Other']),
  check('quantity', 'Quantity is required').isNumeric().isFloat({ min: 0 }),
  check('unit', 'Unit is required').isIn(['Bag', 'KG', 'Packet', 'Liter']),
  check('rate', 'Rate is required').isNumeric().isFloat({ min: 0 }),
  check('paymentStatus', 'Payment status is required').optional().isIn(['Pending', 'Paid'])
];

// Collection Head routes
router.post('/', authorizeRoles('collection_head'), foodRecordValidationRules, validateRequest, createFoodRecord);
router.put('/:id', authorizeRoles('collection_head'), foodRecordValidationRules, validateRequest, updateFoodRecord);

// Admin routes
router.get('/', authorizeRoles('admin'), getAllFoodRecords);
router.get('/reports/monthly', authorizeRoles('admin'), getMonthlyReports);

// Shared routes (Collection Head and Admin)
router.get('/center/:centerId', authorizeRoles('collection_head', 'admin'), getFoodRecordsByCenter);
router.get('/farmer/:farmerId', authorizeRoles('collection_head', 'admin'), getFoodRecordsByFarmer);

module.exports = router;