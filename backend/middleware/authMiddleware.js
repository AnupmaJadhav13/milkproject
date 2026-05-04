const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Admin = require('../models/Admin');
const CollectionCenter = require('../models/CollectionCenter');

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
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };
