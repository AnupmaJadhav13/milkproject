const express = require('express');
const router = express.Router();
const { getAnnualBonusEligible, notifyAnnualBonus } = require('../controllers/annualBonusController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/', authorizeRoles('admin'), getAnnualBonusEligible);
router.post('/notify', authorizeRoles('admin'), notifyAnnualBonus);

module.exports = router;
