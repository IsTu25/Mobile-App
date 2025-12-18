const faceapi = require('face-api.js');
const { Canvas, Image, ImageData } = require('canvas');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Monkey patch for Node.js environment
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class RecognitionService {
    constructor() {
        this.modelsLoaded = false;
        this.labeledDescriptors = [];
        this.datasetPath = path.join(__dirname, '../../dataset');
        this.weightsPath = path.join(__dirname, '../utils/weights');
        this.datasetLoaded = false;
    }

    async loadModels() {
        if (this.modelsLoaded) return;

        console.log('Loading FaceAPI models...');
        try {
            await faceapi.nets.ssdMobilenetv1.loadFromDisk(this.weightsPath);
            await faceapi.nets.faceLandmark68Net.loadFromDisk(this.weightsPath);
            await faceapi.nets.faceRecognitionNet.loadFromDisk(this.weightsPath);
            this.modelsLoaded = true;
            console.log('FaceAPI models loaded successfully');
        } catch (error) {
            console.error('Failed to load FaceAPI models:', error);
            throw new Error('Model loading failed. Ensure weights are downloaded in src/utils/weights');
        }
    }

    async loadDataset() {
        if (this.datasetLoaded) return;
        console.log('Loading dataset for recognition...');
        if (!fs.existsSync(this.datasetPath)) {
            fs.mkdirSync(this.datasetPath, { recursive: true });
            console.log('Created dataset directory at', this.datasetPath);
            return;
        }

        const files = fs.readdirSync(this.datasetPath);
        this.labeledDescriptors = [];

        for (const file of files) {
            // Skip hidden files and non-images
            if (file.startsWith('.') || file === 'README.md' || file === 'data.json') continue;

            const filePath = path.join(this.datasetPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                // If it's a directory, assume directory name is the person's name 
                // and it contains multiple images of that person
                const personName = file;
                const personImages = fs.readdirSync(filePath)
                    .filter(f => !f.startsWith('.') && /\.(jpg|jpeg|png)$/i.test(f))
                    .map(f => path.join(filePath, f));

                const descriptors = [];
                for (const imgPath of personImages) {
                    try {
                        const img = await this.loadImage(imgPath);
                        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                        if (detection) descriptors.push(detection.descriptor);
                    } catch (err) {
                        console.warn(`Failed to process image ${imgPath}:`, err.message);
                    }
                }

                if (descriptors.length > 0) {
                    this.labeledDescriptors.push(new faceapi.LabeledFaceDescriptors(personName, descriptors));
                    console.log(`Loaded ${descriptors.length} faces for ${personName}`);
                }
            } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
                // Single file: filename is person's name
                const personName = path.parse(file).name;
                try {
                    const img = await this.loadImage(filePath);
                    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();

                    if (detection) {
                        this.labeledDescriptors.push(
                            new faceapi.LabeledFaceDescriptors(personName, [detection.descriptor])
                        );
                        console.log(`Loaded face for ${personName}`);
                    } else {
                        console.warn(`No face detected in ${file}`);
                    }
                } catch (err) {
                    console.warn(`Failed to process ${file}:`, err.message);
                }
            }
        }
        this.datasetLoaded = true;
    }

    // Helper to load image from disk
    async loadImage(source) {
        // Source can be path string or buffer
        const img = new Image();
        if (Buffer.isBuffer(source)) {
            img.src = source;
        } else {
            img.src = fs.readFileSync(source);
        }
        return img;
    }

    async processImage(imageBuffer) {
        if (!this.modelsLoaded) await this.loadModels();
        if (this.labeledDescriptors.length === 0) await this.loadDataset();

        const img = await this.loadImage(imageBuffer);
        const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

        const results = {
            recognized: [],
            unknown: [],
            totalFaces: detections.length
        };

        if (this.labeledDescriptors.length === 0) {
            // No known faces, all are unknown
            results.unknown = detections.map(() => ({ message: 'Face detected but no known faces in database' }));
            return results;
        }

        const faceMatcher = new faceapi.FaceMatcher(this.labeledDescriptors, 0.6);

        detections.forEach(detection => {
            const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

            if (bestMatch.label !== 'unknown') {
                results.recognized.push({
                    name: bestMatch.label,
                    confidence: 1 - bestMatch.distance,
                    box: detection.detection.box
                });
            } else {
                results.unknown.push({
                    message: 'Unknown person detected',
                    box: detection.detection.box
                });
            }
        });

        return results;
    }

    async processVideo(videoPath) {
        if (!this.modelsLoaded) await this.loadModels();
        if (this.labeledDescriptors.length === 0) await this.loadDataset();

        const tempDir = path.join(__dirname, '../../uploads/temp_frames_' + Date.now());
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        // If no known faces, we can still detect faces but they will all be unknown
        const faceMatcher = this.labeledDescriptors.length > 0
            ? new faceapi.FaceMatcher(this.labeledDescriptors, 0.6)
            : null;

        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .on('end', async () => {
                    try {
                        const result = await this.analyzeFrames(tempDir, faceMatcher);
                        fs.rm(tempDir, { recursive: true, force: true }, () => { });
                        resolve(result);
                    } catch (err) {
                        reject(err);
                    }
                })
                .on('error', (err) => {
                    reject(err);
                })
                .screenshots({
                    count: 5,
                    folder: tempDir,
                    filename: 'frame-%i.png',
                    size: '640x?'
                });
        });
    }

    async analyzeFrames(dir, faceMatcher) {
        const files = fs.readdirSync(dir);
        const uniqueMatches = new Map();
        let unknownFacesCount = 0;

        for (const file of files) {
            if (!file.endsWith('.png')) continue;

            const filePath = path.join(dir, file);
            const img = await this.loadImage(filePath);
            const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

            for (const detection of detections) {
                if (!faceMatcher) {
                    unknownFacesCount++;
                    continue;
                }

                const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

                if (bestMatch.label !== 'unknown') {
                    if (!uniqueMatches.has(bestMatch.label)) {
                        uniqueMatches.set(bestMatch.label, {
                            name: bestMatch.label,
                            confidence: 1 - bestMatch.distance,
                        });
                    }
                } else {
                    unknownFacesCount++;
                }
            }
        }

        return {
            matches: Array.from(uniqueMatches.values()),
            unknownCount: unknownFacesCount
        };
    }
}

module.exports = new RecognitionService();
