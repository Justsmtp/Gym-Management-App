const crypto = require('crypto');

// ============================================
// INPUT VALIDATION & SANITIZATION
// ============================================

/**
 * Sanitize user input to prevent XSS attacks
 */
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters and patterns
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized = Array.isArray(input) ? [] : {};
    for (let key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  
  return input;
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Nigerian format)
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Strong password validation
 */
const isStrongPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Sanitize request body, query, and params
 */
const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
};

/**
 * Validate user registration input
 */
const validateRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body;
  const errors = [];

  if (!name || name.length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!phone || !isValidPhone(phone)) {
    errors.push('Invalid phone number format');
  }

  if (!password || !isStrongPassword(password)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      errors: errors 
    });
  }

  next();
};

/**
 * Validate login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (!password || password.length < 6) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ 
      success: false,
      errors: errors 
    });
  }

  next();
};

/**
 * Prevent timing attacks on password comparison
 */
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Generate secure random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash sensitive data (for logging, not passwords)
 */
const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

/**
 * Check for SQL injection patterns (even though using MongoDB)
 */
const detectSQLInjection = (req, res, next) => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi
  ];
  
  const checkString = JSON.stringify(req.body) + JSON.stringify(req.query);
  
  for (let pattern of sqlPatterns) {
    if (pattern.test(checkString)) {
      console.error('🚨 SQL Injection attempt detected from IP:', req.ip);
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Suspicious patterns detected'
      });
    }
  }
  
  next();
};

/**
 * Prevent NoSQL injection in query parameters
 */
const validateQueryParams = (req, res, next) => {
  const dangerousPatterns = [
    /\$where/i,
    /\$regex/i,
    /\$ne/i,
    /\$gt/i,
    /\$gte/i,
    /\$lt/i,
    /\$lte/i,
    /\$in/i,
    /\$nin/i
  ];
  
  const queryString = JSON.stringify(req.query);
  
  for (let pattern of dangerousPatterns) {
    if (pattern.test(queryString)) {
      console.error('🚨 NoSQL Injection attempt detected from IP:', req.ip);
      return res.status(400).json({ 
        error: 'Invalid query parameters'
      });
    }
  }
  
  next();
};

/**
 * Add security headers to response
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent caching of sensitive data
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  next();
};

/**
 * Log security events
 */
const logSecurityEvent = (event, details, req) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  
  console.log(`[SECURITY] [${timestamp}] ${event}`, {
    ip: hashData(ip),
    userAgent: hashData(userAgent),
    path: req.path,
    method: req.method,
    ...details
  });
};

/**
 * Detect brute force attempts
 */
const loginAttempts = new Map();

const detectBruteForce = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, []);
  }
  
  const attempts = loginAttempts.get(ip);
  
  // Remove old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
  
  if (recentAttempts.length >= 5) {
    logSecurityEvent('BRUTE_FORCE_DETECTED', { attempts: recentAttempts.length }, req);
    return res.status(429).json({
      error: 'Too many login attempts',
      message: 'Please try again after 15 minutes'
    });
  }
  
  recentAttempts.push(now);
  loginAttempts.set(ip, recentAttempts);
  
  next();
};

/**
 * Clean up old login attempts (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  
  for (let [ip, attempts] of loginAttempts.entries()) {
    const recentAttempts = attempts.filter(timestamp => now - timestamp < windowMs);
    if (recentAttempts.length === 0) {
      loginAttempts.delete(ip);
    } else {
      loginAttempts.set(ip, recentAttempts);
    }
  }
}, 60000); // Clean up every minute

module.exports = {
  // Sanitization
  sanitizeInput,
  sanitizeRequest,
  
  // Validation
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  isValidObjectId,
  validateRegistration,
  validateLogin,
  
  // Security
  constantTimeCompare,
  generateSecureToken,
  hashData,
  detectSQLInjection,
  validateQueryParams,
  securityHeaders,
  logSecurityEvent,
  detectBruteForce
};
