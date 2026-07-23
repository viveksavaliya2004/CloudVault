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
      isVerified: true, // Automatically set isVerified to true upon successful registration
    });

    const userJson = newUser.toObject();
    delete userJson.password;
    delete userJson.sessions;
    return userJson;
  }

  async login(email, password, ipAddress = 'Unknown', device = 'Unknown Device') {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const newSession = {
      token: refreshToken,
      ipAddress,
      device,
      createdAt: new Date(),
      lastActive: new Date()
    };

    user.sessions = user.sessions || [];
    user.sessions.push(newSession);
    
    // Keep max 10 sessions to prevent array from growing indefinitely
    if (user.sessions.length > 10) {
      user.sessions.shift();
    }
    
    user.isVerified = true;
    await user.save();

    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.sessions;

    return {
      user: userJson,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId, tokenToRemove) {
    if (!tokenToRemove) return;
    await User.findByIdAndUpdate(userId, { 
      $pull: { sessions: { token: tokenToRemove } } 
    });
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
    if (!user) {
      throw new AppError('User not found', 401);
    }

    const sessionIndex = user.sessions.findIndex(s => s.token === token);
    if (sessionIndex === -1) {
      throw new AppError('Invalid refresh token session', 401);
    }

    if (user.isBlocked) {
      throw new AppError('Your account has been suspended. Please contact support.', 403);
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.sessions[sessionIndex].token = newRefreshToken;
    user.sessions[sessionIndex].lastActive = new Date();
    await user.save();

    const userJson = user.toObject();
    delete userJson.password;
    delete userJson.sessions;

    return {
      user: userJson,
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No account found with this email address', 404);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expires;
    await user.save();

    const emailService = require('./emailService');
    await emailService.sendPasswordResetOtp(email, otp);

    return { message: 'OTP sent successfully to email' };
  }

  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw new AppError('Email, OTP, and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No account found with this email address', 404);
    }

    if (!user.resetPasswordOtp || user.resetPasswordOtp !== otp) {
      throw new AppError('Invalid OTP code. Please check and try again.', 400);
    }

    if (new Date() > new Date(user.resetPasswordExpires)) {
      throw new AppError('OTP has expired. Please request a new one.', 400);
    }

    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    return { message: 'Password reset successfully' };
  }
}

module.exports = new AuthService();
