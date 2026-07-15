const User = require('../models/User');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRE }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE }
  );
};

class AuthService {
  async register(name, email, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const newUser = await User.create({
      name,
      email,
      password, // Password hashing is handled by pre-save hook in User model
    });

    const userJson = newUser.toObject();
    delete userJson.password;
    delete userJson.refreshToken;
    return userJson;
  }

  async login(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to database
    await User.findByIdAndUpdate(user._id, { refreshToken });

    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return {
      user: userJson,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }

  async refresh(token) {
    if (!token) {
      throw new AppError('No refresh token provided', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      throw new AppError('Invalid refresh token session', 401);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    return {
      user: userJson,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}

module.exports = new AuthService();
