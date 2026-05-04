const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createCenter,
  updateCenter,
  deleteCenter,
  getCenters,
  getCenterById
} = require('../controllers/centerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

router.use(protect);

const centerValidationRules = [
  check('name', 'Collection center name is required').notEmpty(),
  check('fullAddress', 'Full address is required').notEmpty(),
  check('village', 'Village is required').notEmpty(),
  check('district', 'District is required').notEmpty(),
  check('state', 'State is required').notEmpty(),
  check('pincode', 'Pincode is required').notEmpty()
];

router.route('/').get(authorizeRoles('admin'), getCenters).post(authorizeRoles('admin'), centerValidationRules, validateRequest, createCenter);
router.route('/:id').get(authorizeRoles('admin'), getCenterById).put(authorizeRoles('admin'), centerValidationRules, validateRequest, updateCenter).delete(authorizeRoles('admin'), deleteCenter);

module.exports = router;
