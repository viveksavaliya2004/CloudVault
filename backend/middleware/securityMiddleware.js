const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// 1. Helmet HTTP Security Headers Configuration
const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Allows static assets and inline Vite dev tools
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows /uploads static files to render in browser
  crossOriginEmbedderPolicy: false,
});

// 2. Rate Limiting Middleware (Max 100 requests per 15 minutes per IP)
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    status: 'fail',
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// 3. CORS Configuration (Allowed frontend URL with credentials)
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

const corsMiddleware = cors(corsOptions);

module.exports = {
  helmetMiddleware,
  rateLimiter,
  corsMiddleware,
  corsOptions,
};
