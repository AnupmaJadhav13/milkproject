const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422);
    throw new Error(errors.array().map((err) => `${err.param}: ${err.msg}`).join(', '));
  }
  next();
};

module.exports = { validateRequest };
