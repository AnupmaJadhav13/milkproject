const express = require('express');
const router = express.Router();
const {
  getPayableCalculations,
  processSettlement,
  markSettlementAsPaid,
  getActiveAdvances,
  createAdvance,
  getSettlementHistory
} = require('../controllers/paymentController');

const { protect } = require('../middleware/authMiddleware');

// Apply protection to all routes
router.use(protect);

// Payable calculations
router.get('/payable', getPayableCalculations);

// Settlement operations
router.post('/settle', processSettlement);
router.put('/settle/:id/mark-paid', markSettlementAsPaid);
router.get('/settlements', getSettlementHistory);

// Advance operations
router.get('/advances', getActiveAdvances);
router.post('/advances', createAdvance);

module.exports = router;
