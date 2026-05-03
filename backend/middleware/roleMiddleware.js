const asyncHandler = require('express-async-handler');

const authorizeRoles = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: insufficient permissions');
    }
    next();
  });
};

module.exports = { authorizeRoles };
