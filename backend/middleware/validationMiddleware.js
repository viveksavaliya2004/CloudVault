const AppError = require('../utils/AppError');

// Generic helper to validate presence & types of fields
const validateRequestBody = (requiredFields = []) => {
  return (req, res, next) => {
    if (!req.body || typeof req.body !== 'object') {
      return next(new AppError('Invalid or missing request body', 400));
    }

    const missingFields = [];

    for (const field of requiredFields) {
      const val = req.body[field];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return next(
        new AppError(`Validation Error: Missing required fields: ${missingFields.join(', ')}`, 400)
      );
    }

    next();
  };
};

// Specific Body Field Validators
const validateRegister = validateRequestBody(['name', 'email', 'password']);
const validateLogin = validateRequestBody(['email', 'password']);
const validateFolderCreate = validateRequestBody(['name']);
const validateFileRename = validateRequestBody(['name']);

module.exports = {
  validateRequestBody,
  validateRegister,
  validateLogin,
  validateFolderCreate,
  validateFileRename,
};
