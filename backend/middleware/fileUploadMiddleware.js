const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// Storage configuration (In-Memory for direct upload to ImageKit)
const storage = multer.memoryStorage();

// Strict Allowed File Extensions (pdf, jpg, jpeg, png, mp4, zip, docx)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.mp4', '.zip', '.docx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `File type not allowed. Allowed file types: ${ALLOWED_EXTENSIONS.map(e => e.replace('.', '')).join(', ')}`,
        400
      ),
      false
    );
  }
};

// Configure Multer with 50MB Limit & Strict File Filter
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

module.exports = upload;
