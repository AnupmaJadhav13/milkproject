const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const {
  addAdvance,
  addAmountToAdvance,
  getAdvances,
  getFarmerAdvanceDetails,
  updateAdvance,
  deleteAdvance
} = require('../controllers/advanceController');

router.post('/',                    protect, authorizeRoles('admin'), addAdvance);
router.post('/:id/add-amount',      protect, authorizeRoles('admin'), addAmountToAdvance);
router.get('/',                     protect, getAdvances);
router.get('/farmer/:farmerId',     protect, getFarmerAdvanceDetails);
router.put('/:id',                  protect, authorizeRoles('admin'), updateAdvance);
router.delete('/:id',               protect, authorizeRoles('admin'), deleteAdvance);

module.exports = router;
