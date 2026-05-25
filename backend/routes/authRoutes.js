const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  login,
  createAdmin,
  changePassword,
  updateProfile,
  setFarmerPassword,
  toggleFarmerLogin,
  enableAllFarmersLogin,
  savePushToken
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

// ── Public ────────────────────────────────────────────────────────────────────

router.post(
  '/login',
  [
    check('username', 'Username is required').notEmpty().trim(),
    check('password', 'Password is required').notEmpty()
  ],
  validateRequest,
  login
);

// ── Admin only ────────────────────────────────────────────────────────────────

router.post(
  '/admin',
  protect,
  authorizeRoles('admin'),
  [
    check('name', 'Name is required').notEmpty().trim(),
    check('email', 'Valid email is required').isEmail(),
    check('username', 'Username is required').notEmpty().trim(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  validateRequest,
  createAdmin
);

// Set / update common farmer password (Admin only)
router.post(
  '/farmer-password',
  protect,
  authorizeRoles('admin'),
  [
    check('password', 'Password must be at least 4 characters').isLength({ min: 4 }).trim()
  ],
  validateRequest,
  setFarmerPassword
);

// Toggle individual farmer login (Admin only)
router.put(
  '/farmer-login/:farmerId',
  protect,
  authorizeRoles('admin'),
  [
    check('loginEnabled', 'loginEnabled must be a boolean').isBoolean()
  ],
  validateRequest,
  toggleFarmerLogin
);

// Enable login for ALL farmers at once (Admin only)
router.post(
  '/farmer-login/enable-all',
  protect,
  authorizeRoles('admin'),
  enableAllFarmersLogin
);

// ── Authenticated (Admin / Collection Head) ───────────────────────────────────

router.post(
  '/change-password',
  protect,
  authorizeRoles('admin', 'collection_head'),
  [
    check('currentPassword', 'Current password is required').notEmpty(),
    check('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
  ],
  validateRequest,
  changePassword
);

router.put(
  '/profile',
  protect,
  authorizeRoles('admin', 'collection_head'),
  [
    check('name', 'Name is required').optional().notEmpty().trim(),
    check('username', 'Username is required').optional().notEmpty().trim()
  ],
  validateRequest,
  updateProfile
);

// ── Save Push Token (Farmer & Collection Head) ───────────────────────────────

router.post(
  '/push-token',
  protect,
  authorizeRoles('farmer', 'collection_head'),
  [
    check('expoPushToken', 'Valid Expo push token is required').notEmpty().trim()
  ],
  validateRequest,
  savePushToken
);

module.exports = router;
