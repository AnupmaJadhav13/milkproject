const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { login, createAdmin, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.post(
  '/login',
  [check('username', 'Username is required').notEmpty(), check('password', 'Password is required').notEmpty()],
  validateRequest,
  login
);
router.post(
  '/admin',
  protect,
  authorizeRoles('admin'),
  [
    check('name', 'Name is required').notEmpty(),
    check('email', 'Valid email is required').isEmail(),
    check('username', 'Username is required').notEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  validateRequest,
  createAdmin
);

router.post(
  '/change-password',
  protect,
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
  [
    check('name', 'Name is required').optional().notEmpty(),
    check('username', 'Username is required').optional().notEmpty()
  ],
  validateRequest,
  updateProfile
);

module.exports = router;
