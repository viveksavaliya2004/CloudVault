const User = require('../models/User');
const AppError = require('../utils/AppError');
const imagekit = require('../config/imagekit');

class UserService {
  async updateProfile(userId, name) {
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    const userJson = updatedUser.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return userJson;
  }

  async uploadAvatar(userId, file) {
    let uploadResponse;
    try {
      uploadResponse = await imagekit.files.upload({
        file: file.buffer.toString('base64'),
        fileName: `avatar-${userId}-${Date.now()}`,
        folder: '/cloudvault/avatars',
        useUniqueFileName: true,
      });
    } catch (err) {
      console.error('ImageKit avatar upload error:', err);
      throw new AppError('Failed to upload avatar to cloud storage: ' + err.message, 500);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResponse.url },
      { returnDocument: 'after', runValidators: true }
    );
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    const userJson = updatedUser.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return userJson;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Invalid current password', 400);
    }

    user.password = newPassword;
    await user.save(); // Triggers userSchema pre('save') to hash password

    return true;
  }
}

module.exports = new UserService();
