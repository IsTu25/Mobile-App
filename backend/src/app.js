const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { generalLimiter } = require('./middleware/rate-limit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/error.middleware');

// Import routes
const authRoutes = require('./routes/auth.routes');
const emergencyRoutes = require('./routes/emergency.routes');

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? ['https://yourdomain.com'] // Replace with actual frontend URL
    : '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Debug log for all requests
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// Rate limiting
app.use('/api', generalLimiter);

// Static files (for uploaded media)
app.use('/uploads', express.static(config.UPLOAD_PATH));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/recognition', require('./routes/recognition.routes'));
app.use('/api/danger', require('./routes/danger-prediction.routes')); // NEW: Danger prediction AI

// Welcome route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Community Safety Reporting System API',
    version: config.API_VERSION,
    endpoints: {
      auth: '/api/auth',
      emergency: '/api/emergency',
      health: '/health'
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

module.exports = app;
