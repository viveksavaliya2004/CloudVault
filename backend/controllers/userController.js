const userService = require('../services/userService');
const AppError = require('../utils/AppError');

class UserController {
  async getProfile(req, res, next) {
    try {
      const userJson = req.user.toObject();
      delete userJson.password;
      delete userJson.refreshToken;

      res.status(200).json({
        status: 'success',
        data: {
          user: userJson,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name } = req.body;

      // Inline validation
      if (name !== undefined && (!name || !name.trim())) {
        return next(new AppError('Name cannot be empty', 400));
      }

      const updatedUser = await userService.updateProfile(req.user._id, name);

      res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return next(new AppError('Please upload an image file', 400));
      }

      const updatedUser = await userService.uploadAvatar(req.user._id, req.file.filename);

      res.status(200).json({
        status: 'success',
        message: 'Avatar uploaded successfully',
        data: {
          user: updatedUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Inline validation
      if (!currentPassword) {
        return next(new AppError('Current password is required', 400));
      }

      if (!newPassword || newPassword.length < 6) {
        return next(new AppError('New password must be at least 6 characters long', 400));
      }

      await userService.changePassword(req.user._id, currentPassword, newPassword);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
