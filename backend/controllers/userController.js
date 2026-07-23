const userService = require('../services/userService');
const cacheService = require('../services/cacheService');
const AppError = require('../utils/AppError');

class UserController {
  async getProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const cachedProfile = await cacheService.getProfile(userId);

      if (cachedProfile) {
        console.log(`⚡ [CACHE HIT] Serving Profile for user ${userId} from Cache (MongoDB Query Skipped)`);
        return res.status(200).json({
          status: 'success',
          data: {
            user: cachedProfile,
          },
        });
      }

      console.log(`📦 [CACHE MISS] Fetching Profile for user ${userId} from MongoDB & Caching`);
      const userJson = req.user.toObject();
      delete userJson.password;
      delete userJson.refreshToken;

      await cacheService.setProfile(userId, userJson);

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
      await cacheService.invalidateProfile(req.user._id);

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

      const updatedUser = await userService.uploadAvatar(req.user._id, req.file);
      await cacheService.invalidateProfile(req.user._id);

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
      await cacheService.invalidateProfile(req.user._id);

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully',
      });
    } catch (err) {
      next(err);
    }
  }
  async getSessions(req, res, next) {
    try {
      const currentToken = req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1] || ''; // Since the frontend only sends accessToken in auth header, we check cookie
      
      const mappedSessions = (req.user.sessions || []).map(s => ({
        id: s._id,
        device: s.device || 'Unknown Device',
        location: s.ipAddress || 'Unknown IP',
        isCurrent: s.token === req.cookies?.refreshToken,
        lastActive: s.lastActive
      })).sort((a, b) => b.lastActive - a.lastActive); // sort most recent first

      res.status(200).json({
        status: 'success',
        data: mappedSessions,
      });
    } catch (err) {
      next(err);
    }
  }

  async revokeSession(req, res, next) {
    try {
      const sessionId = req.params.id;
      
      const user = req.user;
      user.sessions = user.sessions.filter(s => s._id.toString() !== sessionId);
      await user.save();

      const mappedSessions = (user.sessions || []).map(s => ({
        id: s._id,
        device: s.device || 'Unknown Device',
        location: s.ipAddress || 'Unknown IP',
        isCurrent: s.token === req.cookies?.refreshToken,
        lastActive: s.lastActive
      })).sort((a, b) => b.lastActive - a.lastActive);

      res.status(200).json({
        status: 'success',
        message: 'Session revoked successfully',
        data: mappedSessions,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
