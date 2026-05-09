const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  generatePayable,
  getPayables,
  getFarmerPayableDetails,
  getCenterPayableReport,
  clearPayable,
  deletePayable
} = require('../controllers/payableController');

router.post('/generate', protect, authorizeRoles('admin'), generatePayable);
router.get('/', protect, getPayables);
router.get('/farmer/:farmerId', protect, getFarmerPayableDetails);
router.get('/center/:centerId/report', protect, getCenterPayableReport);
router.put('/:id/clear', protect, authorizeRoles('admin'), clearPayable);
router.delete('/:id', protect, authorizeRoles('admin'), deletePayable);

module.exports = router;
