require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { initializeFirebase } = require('./src/config/firebase');
const config = require('./src/config/env');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize Firebase (optional)
    initializeFirebase();

    // Start HTTP server - bind to 0.0.0.0 to accept connections from mobile devices
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      console.log('\n🚀 ====================================');
      console.log(`   Community Safety System Backend`);
      console.log('   ====================================');
      console.log(`   🌍 Server running on port ${config.PORT}`);
      console.log(`   🏠 Local access: http://localhost:${config.PORT}`);
      console.log(`   📱 LAN access:   http://192.168.0.104:${config.PORT}`);
      console.log(`   🔧 Environment: ${config.NODE_ENV}`);
      console.log(`   📡 API Version: ${config.API_VERSION}`);
      console.log(`   🏥 Health check: http://192.168.0.104:${config.PORT}/health`);
      console.log('   ====================================\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n⚠️  ${signal} received. Closing server gracefully...`);

      server.close(async () => {
        console.log('✅ HTTP server closed');

        // Close database connection
        await require('mongoose').connection.close();
        console.log('✅ Database connection closed');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Error starting server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Start the server
startServer();
