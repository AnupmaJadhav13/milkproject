const express = require('express');
const router = express.Router();
const { getRateChart, updateRateChart } = require('../controllers/rateChartController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

// GET  /api/admin/rate-chart?centerId=<id>  — admin + collection_head (own center)
// PUT  /api/admin/rate-chart?centerId=<id>  — admin only
router.route('/')
  .get(authorizeRoles('admin', 'collection_head'), getRateChart)
  .put(authorizeRoles('admin'), updateRateChart);

module.exports = router;
