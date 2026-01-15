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
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/crime-reports', require('./routes/crime-report.routes'));
app.use('/api/emergency', emergencyRoutes);
app.use('/api/recognition', require('./routes/recognition.routes'));
app.use('/api/danger', require('./routes/danger-prediction.routes'));
app.use('/track', require('./routes/tracking.routes')); // Mounts /track (Web View) AND /track/api (JSON) at base level for cleaner URLs if configured or as sub-route? 
// Wait, my routes definitions are:
// router.post('/start') -> /track/start
// router.get('/api/:sessionId') -> /track/api/:sessionId
// router.get('/:sessionId') -> /track/:sessionId (HTML)
// So mounting at '/track' is correct but I also need '/api/tracking' for mobile app consistency? 
// Let's keep it simple. Access HTML via /track/:id. Access API via /api/tracking/...
// I will split the router or just use two mounts? 
// Actually I defined the router to carry both. 
// Let's use two mounts for the SAME router file to expose it at different prefixes for clarity?
// Or just mount it at `/api/tracking` for API and `/track` for HTML?
// My router definition mixes them. 
// Let's mount at /api/tracking AND /track (Express allows this).
const trackingRouter = require('./routes/tracking.routes');
app.use('/api/tracking', trackingRouter); // For Mobile App API calls
app.use('/track', trackingRouter); // For Public Web Link (HTML)

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
