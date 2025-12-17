const recognitionService = require('../services/recognition.service');

class RecognitionController {
    /**
     * Analyze a single image frame
     * POST /api/recognition/image
     * Consumes: multipart/form-data (field: image)
     */
    async analyzeImage(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No image file provided' });
            }

            // If multer memoryStorage is used, req.file.buffer is available
            const result = await recognitionService.processImage(req.file.buffer);

            res.status(200).json({
                success: true,
                message: 'Image analysis complete',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Analyze a video file
     * POST /api/recognition/video
     * Consumes: multipart/form-data (field: video)
     */
    async analyzeVideo(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No video file provided' });
            }

            // If multer diskStorage is used, req.file.path is available
            const result = await recognitionService.processVideo(req.file.path);

            // Clean up the uploaded video after processing
            const fs = require('fs');
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete temp video', err);
            });

            res.status(200).json({
                success: true,
                message: 'Video analysis complete',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new RecognitionController();
