const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(
        new AppError('You are not logged in. Please log in to get access.', 401)
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return next(new AppError('Not authorized, invalid or expired token', 401));
    }

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    if (currentUser.isBlocked) {
      return next(
        new AppError('Your account has been suspended. Please contact support.', 403)
      );
    }

    // Dynamic self-healing: calculate total storage used from files in database
    try {
      const File = require('../models/File');
      const result = await File.aggregate([
        { $match: { owner: currentUser._id, isDeleted: false } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]);
      const actualStorageUsed = result[0]?.totalSize || 0;

      if (currentUser.storageUsed !== actualStorageUsed) {
        currentUser.storageUsed = actualStorageUsed;
        await currentUser.save({ validateBeforeSave: false });
      }
    } catch (err) {
      console.error('Error syncing user storageUsed in protect middleware:', err);
    }

    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

// RBAC Role Restrictions (Admin vs User)
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

const restrictToAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'Admin')) {
    return next(new AppError('You do not have permission to access this resource.', 403));
  }
  next();
};

// File Management RBAC Check: Admin manages all files; User manages only their own
const canUserManageFile = (user, file) => {
  if (!user || !file) return false;
  if (user.role === 'admin' || user.role === 'Admin') return true;
  const ownerId = file.owner?._id ? file.owner._id.toString() : file.owner?.toString();
  return ownerId === user._id.toString();
};

module.exports = {
  protect,
  restrictTo,
  restrictToAdmin,
  canUserManageFile,
};
