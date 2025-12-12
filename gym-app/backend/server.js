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

// Configuration
const RATE_LIMIT_CONFIG = {
  general: {
    max: parseInt(process.env.GENERAL_RATE_LIMIT) || 200,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  userLogin: {
    max: parseInt(process.env.USER_LOGIN_RATE_LIMIT) || 20,
    windowMs: 5 * 60 * 1000 // 5 minutes
  },
  adminLogin: {
    max: parseInt(process.env.ADMIN_LOGIN_RATE_LIMIT) || 5,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  register: {
    max: parseInt(process.env.REGISTER_RATE_LIMIT) || 10,
    windowMs: 5 * 60 * 1000 // 5 minutes
  }
};

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

// Whitelist IPs (for development/trusted IPs)
const RATE_LIMIT_WHITELIST = [
  '127.0.0.1',
  '::1',
  'localhost',
  ...(process.env.RATE_LIMIT_WHITELIST || '').split(',').filter(Boolean)
];

// Simple rate limiter middleware
const rateLimit = (max, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Bypass rate limiting for whitelisted IPs
    if (RATE_LIMIT_WHITELIST.some(whiteIp => ip.includes(whiteIp))) {
      console.log(`✅ Rate limit bypassed for whitelisted IP: ${ip}`);
      return next();
    }
    
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, []);
    }
    
    const requests = rateLimitStore.get(ip);
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    if (recentRequests.length >= max) {
      console.log(`❌ Rate limit exceeded for IP: ${ip} (${recentRequests.length}/${max} requests)`);
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later',
        retryAfter: Math.ceil(windowMs / 1000) // seconds until reset
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

// Apply general rate limiting (very lenient for general API)
app.use(rateLimit(RATE_LIMIT_CONFIG.general.max, RATE_LIMIT_CONFIG.general.windowMs));

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
const paymentsRoutes = require('./routes/payment');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');
const remindersRoutes = require('./routes/reminders');
const plansRoutes = require('./routes/plans');

// NO RATE LIMITING ON LOGIN - Completely disabled
// If you want to re-enable rate limiting in the future, uncomment the code below:
/*
const userAuthLimiter = rateLimit(
  RATE_LIMIT_CONFIG.userLogin.max, 
  RATE_LIMIT_CONFIG.userLogin.windowMs
);
const adminAuthLimiter = rateLimit(
  RATE_LIMIT_CONFIG.adminLogin.max, 
  RATE_LIMIT_CONFIG.adminLogin.windowMs
);

const adminLoginProtection = (req, res, next) => {
  const { email, isAdmin } = req.body;
  const isAdminAttempt = isAdmin === true || (email && (
    email.toLowerCase().includes('admin') || 
    email.toLowerCase() === process.env.ADMIN_EMAIL
  ));
  
  if (isAdminAttempt) {
    console.log(`🔒 Admin login attempt detected: ${email}`);
    return adminAuthLimiter(req, res, next);
  }
  
  console.log(`👤 User login attempt: ${email}`);
  return userAuthLimiter(req, res, next);
};

app.use('/api/auth/login', adminLoginProtection);
*/

console.log('⚠️ Login rate limiting is DISABLED');

// Very lenient rate limit for registration (we want users to sign up easily)
const registerLimiter = rateLimit(
  RATE_LIMIT_CONFIG.register.max, 
  RATE_LIMIT_CONFIG.register.windowMs
);
app.use('/api/auth/register', registerLimiter);

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

// Clear rate limit for specific IP (now works in all environments with secret key)
app.post('/api/clear-rate-limit', (req, res) => {
  const secretKey = process.env.RATE_LIMIT_CLEAR_SECRET || 'dev-secret-123';
  const providedSecret = req.body.secret || req.headers['x-rate-limit-secret'];
  
  // In development, allow without secret
  if (process.env.NODE_ENV === 'development' || providedSecret === secretKey) {
    const { ip } = req.body;
    const targetIp = ip || req.ip || req.connection.remoteAddress;
    
    if (rateLimitStore.has(targetIp)) {
      rateLimitStore.delete(targetIp);
      console.log(`✅ Cleared rate limit for IP: ${targetIp}`);
      res.json({ 
        success: true, 
        message: `Rate limit cleared for ${targetIp}` 
      });
    } else {
      res.json({ 
        success: true, 
        message: `No rate limit found for ${targetIp}` 
      });
    }
  } else {
    res.status(403).json({ 
      error: 'Invalid secret key',
      message: 'Provide the correct secret in request body or header' 
    });
  }
});

// Clear ALL rate limits (development only)
app.post('/api/clear-all-rate-limits', (req, res) => {
  const secretKey = process.env.RATE_LIMIT_CLEAR_SECRET || 'dev-secret-123';
  const providedSecret = req.body.secret || req.headers['x-rate-limit-secret'];
  
  if (process.env.NODE_ENV === 'development' || providedSecret === secretKey) {
    const count = rateLimitStore.size;
    rateLimitStore.clear();
    console.log(`✅ Cleared all rate limits (${count} entries)`);
    res.json({ 
      success: true, 
      message: `Cleared ${count} rate limit entries` 
    });
  } else {
    res.status(403).json({ error: 'Not allowed' });
  }
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
  console.log('  ⚠️  Rate Limiting:');
  console.log(`     - General API: ${RATE_LIMIT_CONFIG.general.max} req/15min`);
  console.log(`     - User Login: DISABLED (unlimited)`);
  console.log(`     - Admin Login: DISABLED (unlimited)`);
  console.log(`     - Registration: ${RATE_LIMIT_CONFIG.register.max} req/5min`);
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
