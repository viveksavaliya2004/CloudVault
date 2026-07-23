const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Storage configuration (In-Memory for direct upload to ImageKit)
const storage = multer.memoryStorage();

// File filter (images only)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed!', 400), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});

module.exports = upload;
