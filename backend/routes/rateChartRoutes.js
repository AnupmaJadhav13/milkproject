const express = require('express');
const router = express.Router();
const { getRateChart, updateRateChart } = require('../controllers/rateChartController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.route('/').get(authorizeRoles('admin'), getRateChart).put(authorizeRoles('admin'), updateRateChart);

module.exports = router;
