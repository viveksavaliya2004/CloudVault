const User = require('../models/User');
const AppError = require('../utils/AppError');

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

  async uploadAvatar(userId, filename) {
    const avatarPath = `/uploads/${filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
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
