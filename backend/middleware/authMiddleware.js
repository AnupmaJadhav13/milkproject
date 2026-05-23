const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const CollectionCenter = require('../models/CollectionCenter');
const Farmer = require('../models/Farmer');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role === 'admin') {
        req.user = await Admin.findById(decoded.id).select('-password');
        if (req.user) req.user.role = 'admin';

      } else if (decoded.role === 'collection_head') {
        const collectionCenter = await CollectionCenter.findById(decoded.id);
        if (collectionCenter) {
          req.user = collectionCenter;
          req.user.role = 'collection_head';
          req.user.assignedCenter = collectionCenter._id;
          req.user.name = collectionCenter.collectionHead?.fullName || collectionCenter.name;
          req.user.username = collectionCenter.collectionHead?.username;
          if (req.user.collectionHead) {
            req.user.collectionHead.password = undefined;
          }
        }

      } else if (decoded.role === 'farmer') {
        const farmer = await Farmer.findById(decoded.id)
          .select('-loginPassword')
          .populate('assignedCenter', 'name centerCode');
        if (farmer) {
          req.user = farmer;
          req.user.role = 'farmer';
          req.user.farmerId = farmer._id;
          req.user.assignedCenter = farmer.assignedCenter?._id || farmer.assignedCenter;
        }
      }

      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  } else {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
