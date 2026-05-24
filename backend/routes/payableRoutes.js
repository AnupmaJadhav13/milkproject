const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  generatePayable,
  getPayables,
  getFarmerPayableDetails,
  getCenterPayableReport,
  markPayableAsPaid,
  deletePayable
} = require('../controllers/payableController');

router.post('/generate', protect, authorizeRoles('admin', 'collection_head'), generatePayable);
router.get('/', protect, getPayables);
router.get('/farmer/:farmerId', protect, getFarmerPayableDetails);
router.get('/center/:centerId/report', protect, getCenterPayableReport);
// Support both /mark-paid and /clear for backward compatibility
router.put('/:id/mark-paid', protect, authorizeRoles('admin', 'collection_head'), markPayableAsPaid);
router.put('/:id/clear', protect, authorizeRoles('admin', 'collection_head'), markPayableAsPaid);
router.delete('/:id', protect, authorizeRoles('admin', 'collection_head'), deletePayable);

module.exports = router;
