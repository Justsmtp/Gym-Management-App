require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const compression = require('compression');

// Import reminder scheduler
const { startReminderScheduler } = require('./services/reminderScheduler');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// 1. Helmet - Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
}));

// 2. Rate Limiting - Prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// 3. Data Sanitization against NoSQL Injection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️ Sanitized key: ${key} in request from ${req.ip}`);
  },
}));

// 4. Data Sanitization against XSS
app.use(xss());

// 5. Prevent HTTP Parameter Pollution
app.use(hpp({
  whitelist: ['membershipType', 'status', 'sort'] // Allow specific params to be duplicated
}));

// 6. Compression
app.use(compression());

// ============================================
// CORS CONFIGURATION
// ============================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.) only in development
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// ============================================
// BODY PARSERS WITH SIZE LIMITS
// ============================================

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch(e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// ============================================
// SECURITY LOGGING MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  // Log all requests with IP and user agent
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  
  // Detect suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /\.\.\//,     // Directory traversal
    /union.*select/i, // SQL injection attempt
    /__proto__/,  // Prototype pollution
    /constructor/i
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.path;
  
  for (let pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.error(`🚨 SECURITY ALERT: Suspicious pattern detected from IP ${ip}`);
      console.error(`Pattern: ${pattern}, Request: ${req.method} ${req.path}`);
      // In production, you might want to block the request or trigger alerts
    }
  }
  
  next();
});

// ============================================
// DATABASE CONNECTION WITH SECURITY
// ============================================

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/gymdb';

mongoose.connection.on('error', err => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose
  .connect(MONGO, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    // Security options
    autoIndex: process.env.NODE_ENV !== 'production', // Disable auto-indexing in production
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected securely');
    
    // Start reminder scheduler after DB connection
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ============================================
// ROUTES WITH SECURITY
// ============================================

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payment');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const remindersRoutes = require('./routes/reminders');
const plansRoutes = require('./routes/plans');

// Apply stricter rate limit to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/plans', plansRoutes);

// ============================================
// HEALTH CHECK & ROOT ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    reminders: 'active',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Gym Management API',
    status: 'running',
    version: '2.0.0',
    security: 'enabled'
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.path, 'IP:', req.ip);
  res.status(404).json({ 
    error: 'Not Found',
    message: 'The requested resource does not exist'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  // Log error details
  console.error('🚨 Server error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({ 
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  gracefulShutdown('UNCAUGHT EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED REJECTION');
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     🏋️  Gym Management System Server         ║');
  console.log('║          🔒 SECURED VERSION 2.0              ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed Origins:`, allowedOrigins);
  console.log('');
  console.log('🔒 Security Features Enabled:');
  console.log('  ✅ Helmet (HTTP Headers)');
  console.log('  ✅ Rate Limiting');
  console.log('  ✅ XSS Protection');
  console.log('  ✅ NoSQL Injection Prevention');
  console.log('  ✅ HPP Protection');
  console.log('  ✅ CORS Policy');
  console.log('  ✅ Request Size Limits');
  console.log('  ✅ Security Logging');
  console.log('');
  console.log('📧 Email Reminders: ACTIVE');
  console.log('⏰ Schedule: Daily at 9:00 AM');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});
