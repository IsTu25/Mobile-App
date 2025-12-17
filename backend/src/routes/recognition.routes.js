const express = require('express');
const router = express.Router();
const recognitionController = require('../controllers/recognition.controller');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/temp_recognition');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for video (store to disk because ffmpeg needs a file path)
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `video-${Date.now()}${path.extname(file.originalname)}`)
});

// Multer config for images (memory for speed, as we process buffer directly)
const imageStorage = multer.memoryStorage();

const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/image', uploadImage.single('image'), recognitionController.analyzeImage);
router.post('/video', uploadVideo.single('video'), recognitionController.analyzeVideo);

module.exports = router;
