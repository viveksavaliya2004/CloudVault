const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const parseUserAgent = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  let os = 'Unknown OS';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  let browser = 'Unknown Browser';
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edg')) browser = 'Edge';
  
  return `${os} • ${browser}`;
};

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password } = req.body;

      // Inline validation
      if (!name || !name.trim()) {
        return next(new AppError('Name is required', 400));
      }

      if (!email || !email.trim()) {
        return next(new AppError('Email is required', 400));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return next(new AppError('Please provide a valid email address', 400));
      }

      if (!password || password.length < 6) {
        return next(new AppError('Password must be at least 6 characters long', 400));
      }

      const user = await authService.register(name, email, password);

      res.status(201).json({
        status: 'success',
        message: 'Registration successful',
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Inline validation
      if (!email || !email.trim()) {
        return next(new AppError('Email is required', 400));
      }

      if (!password) {
        return next(new AppError('Password is required', 400));
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';
      const userAgent = req.headers['user-agent'];
      const device = parseUserAgent(userAgent);

      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password,
        ipAddress,
        device
      );

      setRefreshCookie(res, refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
          await authService.logout(decoded.id, token);
        } catch (err) {
          // Token verification failed or user doesn't exist, ignore and proceed to clear cookie
        }
      }

      res.clearCookie('refreshToken');

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  async refresh(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      const { user, accessToken, refreshToken: newRefreshToken } =
        await authService.refresh(token);

      setRefreshCookie(res, newRefreshToken);

      res.status(200).json({
        status: 'success',
        data: {
          user,
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  getMe(req, res, next) {
    const userJson = req.user.toObject();
    delete userJson.password;
    delete userJson.refreshToken;

    res.status(200).json({
      status: 'success',
      data: {
        user: userJson,
      },
    });
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email || !email.trim()) {
        return next(new AppError('Email is required', 400));
      }

      const result = await authService.forgotPassword(email.trim().toLowerCase());

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !email.trim()) {
        return next(new AppError('Email is required', 400));
      }
      if (!otp || !otp.trim()) {
        return next(new AppError('OTP is required', 400));
      }
      if (!newPassword || newPassword.length < 6) {
        return next(new AppError('New password must be at least 6 characters', 400));
      }

      const result = await authService.resetPassword(
        email.trim().toLowerCase(),
        otp.trim(),
        newPassword
      );

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
