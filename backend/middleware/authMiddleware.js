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

module.exports = {
  protect,
};
