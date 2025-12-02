require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import reminder scheduler
const { startReminderScheduler } = require('./services/reminderScheduler');

const app = express();

// CORS
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: FRONTEND, credentials: true }));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/gymdb';
mongoose
  .connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    
    // Start reminder scheduler after DB connection
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Import Routes
const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const remindersRoutes = require('./routes/reminders');
const plansRoutes = require('./routes/plans'); // NEW

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/plans', plansRoutes); // NEW

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    reminders: 'active',
  });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🏋️  Gym Management System Server         ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 API URL: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend URL: ${FRONTEND}`);
  console.log('');
  console.log('📧 Email Reminders: ACTIVE');
  console.log('⏰ Schedule: Daily at 9:00 AM');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
