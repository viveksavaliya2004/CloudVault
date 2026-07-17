const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'file-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Configure Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB general limit (strict type size checks will be performed in service)
  },
});

module.exports = upload;
