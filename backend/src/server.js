require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start HTTP server
const startServer = async () => {
  try {
    await connectDB();

    // Start background cron jobs for overdue alerts
    initCronJobs();

    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 Smart Task Manager Server running on port ${PORT}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received. Shutting down gracefully.');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

