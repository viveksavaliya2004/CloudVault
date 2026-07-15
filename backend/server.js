require('dotenv').config();
const app = require('./app');
const connectDB = async () => {
  // Try connecting to database. If MONGO_URI is missing or fails, log it but let the app run or exit depending on config.
  // In many dev environments, they might not have local MongoDB running right away.
  try {
    const dbConfig = require('./config/db');
    await dbConfig();
  } catch (error) {
    console.warn('Warning: Database connection failed. Running server without database connection check.');
    console.error(error);
  }
};

const PORT = process.env.PORT || 5000;

// Connect to Database first
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`CloudVault server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception Error: ${err.message}`);
  process.exit(1);
});
