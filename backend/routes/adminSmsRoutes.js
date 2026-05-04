const express = require('express');
const router = express.Router();
const { getSmsRecipients, sendAdminSms } = require('../controllers/adminSmsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);
router.get('/recipients', authorizeRoles('admin'), getSmsRecipients);
router.post('/send', authorizeRoles('admin'), sendAdminSms);

module.exports = router;
