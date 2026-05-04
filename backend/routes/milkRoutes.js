const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { createMilkEntry } = require('../controllers/milkController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const milkRules = [
  check('farmerId', 'Farmer is required').notEmpty(),
  check('amountInr', 'Amount is required').isFloat({ min: 0 })
];

router.post('/', authorizeRoles('admin', 'collection_head'), milkRules, validateRequest, createMilkEntry);

module.exports = router;
