const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  getUnreadCount,
  sendAdminNotification,
  getNotificationRecipients,
  getAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.use(protect);

// ── Farmer routes ─────────────────────────────────────────────────────────────
router.get('/my', authorizeRoles('farmer'), getMyNotifications);
router.get('/my/unread-count', authorizeRoles('farmer'), getUnreadCount);
// IMPORTANT: 'all' route must come BEFORE the :notificationId param route
router.put('/my/all/read', authorizeRoles('farmer'), markAsRead);
router.put('/my/:notificationId/read', authorizeRoles('farmer'), markAsRead);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.get('/admin/all', authorizeRoles('admin'), getAllNotifications);
router.get('/admin/recipients', authorizeRoles('admin'), getNotificationRecipients);
router.post('/admin/send', authorizeRoles('admin'), sendAdminNotification);

module.exports = router;
