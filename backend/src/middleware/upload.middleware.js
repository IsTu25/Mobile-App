const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Ensure upload directory exists
const uploadDir = config.UPLOAD_PATH;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Check extension
  const allowedExtensions = /jpeg|jpg|png|gif|mp4|mov|avi|mkv/;
  const hasValidExtension = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  // Check mimetype (Allow any image or video type, plus octet-stream for safety)
  const hasValidMimeType = file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('video/') ||
    file.mimetype === 'application/octet-stream';

  if (hasValidExtension && hasValidMimeType) {
    cb(null, true);
  } else {
    console.log(`[Upload] Rejected file: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Only image and video files are allowed'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

module.exports = upload;
