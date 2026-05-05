const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { createMilkEntry, getMilkEntries } = require('../controllers/milkController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const milkRules = [
  check('farmerId', 'Farmer is required').notEmpty(),
  check('shift', 'Shift is required').isIn(['Morning', 'Evening']),
  check('animalType', 'Animal type is required').isIn(['Cow', 'Buffalo']),
  check('quantityLiters', 'Quantity is required').isFloat({ min: 0.1 }),
  check('fat', 'FAT is required').isFloat({ min: 0 }),
  check('snf', 'SNF is required').isFloat({ min: 0 })
];

router.post('/', authorizeRoles('collection_head'), milkRules, validateRequest, createMilkEntry);
router.get('/', authorizeRoles('admin', 'collection_head'), getMilkEntries);

module.exports = router;
