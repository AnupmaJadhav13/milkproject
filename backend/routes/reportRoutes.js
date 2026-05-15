const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  getCenterReport,
  getFarmerReport,
  getAllCentersSummary,
  getFarmerAnalytics
} = require('../controllers/reportController');

router.use(protect);
router.use(authorizeRoles('admin'));

// Collection center wise report
router.get('/center/:centerId', getCenterReport);

// All centers summary
router.get('/centers/summary', getAllCentersSummary);

// Farmer wise daily report
router.get('/farmer/:farmerId', getFarmerReport);

// Farmer all-time analytics
router.get('/farmer/:farmerId/analytics', getFarmerAnalytics);

module.exports = router;
