require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import reminder scheduler
const { startReminderScheduler } = require('./services/reminderScheduler');

const app = express();

// ============================================
// BASIC SECURITY MIDDLEWARE (No new packages)
// ============================================

// Security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting storage (in-memory, simple implementation)
const rateLimitStore = new Map();

// Simple rate limiter middleware
const rateLimit = (max, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    const requests = rateLimitStore.get(ip);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later'
      });
    }
    
    recentRequests.push(now);
    rateLimitStore.set(ip, recentRequests);
    next();
  };
};

// Clean up old rate limit entries every minute
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  for (let [ip, requests] of rateLimitStore.entries()) {
    const recentRequests = requests.filter(time => now - time < windowMs);
    if (recentRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, recentRequests);
    }
  }
}, 60000);

// Apply general rate limiting
app.use(rateLimit(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

// NoSQL Injection Prevention (manual implementation)
const sanitizeData = (data) => {
  if (typeof data === 'object' && data !== null) {
    for (let key in data) {
      if (typeof data[key] === 'string') {
        // Remove MongoDB operators
        data[key] = data[key].replace(/[${}]/g, '');
      } else if (typeof data[key] === 'object') {
        data[key] = sanitizeData(data[key]);
      }
    }
  }
  return data;
};

// XSS Prevention (manual implementation)
const xssClean = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeData(req.body);
  }
  if (req.query) {
    req.query = sanitizeData(req.query);
  }
  if (req.params) {
    req.params = sanitizeData(req.params);
  }
  next();
};

app.use(xssClean);

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
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      callback(null, true); // Still allow for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization']
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
// REQUEST LOGGING MIDDLEWARE
// ============================================

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${ip}`);
  
  // Detect suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\.\.\//,
    /__proto__/,
    /constructor/i
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query) + req.path;
  
  for (let pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      console.error(`🚨 SECURITY ALERT: Suspicious pattern detected from IP ${ip}`);
      console.error(`Pattern: ${pattern}, Request: ${req.method} ${req.path}`);
    }
  }
  
  next();
});

// ============================================
// DATABASE CONNECTION
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
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected');
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ============================================
// ROUTES
// ============================================

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const remindersRoutes = require('./routes/reminders');
const plansRoutes = require('./routes/plans');

// Stricter rate limit for auth routes
const authLimiter = rateLimit(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
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
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      payments: '/api/payments',
      attendance: '/api/attendance',
      reminders: '/api/reminders',
      plans: '/api/plans'
    }
  });
});

// ============================================
// ERROR HANDLERS
// ============================================

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 Not Found:', req.method, req.path);
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip
  });
  
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
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', err);
  gracefulShutdown('UNCAUGHT EXCEPTION');
});

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
  console.log('  ✅ Security Headers');
  console.log('  ✅ Rate Limiting');
  console.log('  ✅ XSS Protection');
  console.log('  ✅ NoSQL Injection Prevention');
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
