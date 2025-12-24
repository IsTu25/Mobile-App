import { Accelerometer, Gyroscope } from 'expo-sensors';
import axios from 'axios';

// Configuration
const SAMPLE_RATE = 20; // ms (approx 50Hz)
const WINDOW_SIZE = 128; // samples needed for 1 inference
const API_URL = 'http://192.168.0.104:5001/predict'; // Python AI Server

class GutFeelingService {
    constructor() {
        this.dataBuffer = []; // Holds arrays of [ax, ay, az, gx, gy, gz]
        this.subscriptionAcc = null;
        this.subscriptionGyro = null;
        this.gravity = { x: 0, y: 0, z: 0 };
        this.alpha = 0.8; // Filter constant for gravity
        this.latestGyro = { x: 0, y: 0, z: 0 };
        this.isMonitoring = false;
        this.onRiskUpdate = null; // Callback
    }

    setCallback(callback) {
        this.onRiskUpdate = callback;
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        this.isMonitoring = true;
        this.dataBuffer = [];

        // Set update intervals (~50Hz)
        Accelerometer.setUpdateInterval(SAMPLE_RATE);
        Gyroscope.setUpdateInterval(SAMPLE_RATE);

        // Listen to Gyroscope
        this.subscriptionGyro = Gyroscope.addListener(data => {
            this.latestGyro = data;
        });

        // Listen to Accelerometer (Driver of the loop)
        this.subscriptionAcc = Accelerometer.addListener(data => {
            if (!this.isMonitoring) return;

            // 1. Remove Gravity (High-pass filter)
            this.gravity.x = this.alpha * this.gravity.x + (1 - this.alpha) * data.x;
            this.gravity.y = this.alpha * this.gravity.y + (1 - this.alpha) * data.y;
            this.gravity.z = this.alpha * this.gravity.z + (1 - this.alpha) * data.z;

            const bodyAccX = data.x - this.gravity.x;
            const bodyAccY = data.y - this.gravity.y;
            const bodyAccZ = data.z - this.gravity.z;

            // 2. Prepare Feature Vector [ax, ay, az, gx, gy, gz]
            // Note: UCI HAR might use different units (g vs m/s^2). 
            // Expo gives g. UCI uses g. So we are good.
            const feature = [
                bodyAccX, bodyAccY, bodyAccZ,
                this.latestGyro.x, this.latestGyro.y, this.latestGyro.z
            ];

            this.dataBuffer.push(feature);

            // 3. Check if window is full
            if (this.dataBuffer.length >= WINDOW_SIZE) {
                this.analyzeBuffer([...this.dataBuffer]); // Copy to avoid race conditions
                this.dataBuffer = []; // Reset buffer (or we could simple slide it)
            }
        });

        console.log("[GutFeeling] Service Started");
    }

    stopMonitoring() {
        this.isMonitoring = false;
        if (this.subscriptionAcc) this.subscriptionAcc.remove();
        if (this.subscriptionGyro) this.subscriptionGyro.remove();
        console.log("[GutFeeling] Service Stopped");
    }

    async analyzeBuffer(buffer) {
        try {
            console.log("[GutFeeling] Sending data for inference...");
            const response = await axios.post(API_URL, {
                sensor_data: buffer
            });

            const { risk_score, status } = response.data;
            console.log(`[GutFeeling] AI Result: ${status} (${risk_score.toFixed(4)})`);

            if (this.onRiskUpdate) {
                this.onRiskUpdate(risk_score);
            }

        } catch (error) {
            console.error("[GutFeeling] Inference Error:", error.message);
        }
    }
}

export default new GutFeelingService();
