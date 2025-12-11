// utils/security.js - Frontend Security Utilities

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
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
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

/**
 * Validate phone number (Nigerian format)
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
  return phoneRegex.test(cleanPhone);
};

/**
 * Strong password validation
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * Get password strength level
 */
export const getPasswordStrength = (password) => {
  if (!password) return { level: 0, text: 'No password', color: 'gray' };
  
  let strength = 0;
  
  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character types
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[@$!%*?&#]/.test(password)) strength++;
  
  if (strength <= 2) return { level: 1, text: 'Weak', color: 'red' };
  if (strength <= 4) return { level: 2, text: 'Medium', color: 'orange' };
  return { level: 3, text: 'Strong', color: 'green' };
};

/**
 * Validate name (no special characters except spaces, hyphens, apostrophes)
 */
export const isValidName = (name) => {
  if (!name || typeof name !== 'string') return false;
  
  const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate amount (positive number with up to 2 decimal places)
 */
export const isValidAmount = (amount) => {
  if (typeof amount === 'number') {
    return amount > 0 && Number.isFinite(amount);
  }
  
  if (typeof amount === 'string') {
    const numAmount = parseFloat(amount);
    return !isNaN(numAmount) && numAmount > 0 && /^\d+(\.\d{1,2})?$/.test(amount);
  }
  
  return false;
};

/**
 * Detect suspicious patterns in input
 */
export const detectSuspiciousInput = (input) => {
  if (!input || typeof input !== 'string') return false;
  
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers
    /\.\.\//,     // Directory traversal
    /__proto__/,  // Prototype pollution
    /constructor/i,
    /eval\(/i,
    /window\./i,
    /document\./i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Safe render text (prevent XSS)
 */
export const safeRenderText = (text) => {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text; // Uses textContent, not innerHTML
  return div.innerHTML;
};

/**
 * Escape HTML entities
 */
export const escapeHTML = (text) => {
  if (!text) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Rate limiter class for client-side actions
 */
class RateLimiter {
  constructor(maxAttempts, windowMs) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.attempts = new Map();
  }
  
  canProceed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const timeUntilReset = Math.ceil((this.windowMs - (now - oldestAttempt)) / 1000);
      
      return { 
        allowed: false, 
        remainingTime: timeUntilReset,
        attempts: recentAttempts.length 
      };
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return { 
      allowed: true, 
      remainingAttempts: this.maxAttempts - recentAttempts.length 
    };
  }
  
  reset(key) {
    this.attempts.delete(key);
  }
  
  getRemainingAttempts(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    return this.maxAttempts - recentAttempts.length;
  }
}

// Create rate limiter instances
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
export const paymentRateLimiter = new RateLimiter(3, 5 * 60 * 1000); // 3 attempts per 5 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000); // 100 requests per minute

/**
 * Mask sensitive data for display
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone) => {
  if (!phone) return phone;
  
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 4) return phone;
  
  return '*'.repeat(cleanPhone.length - 4) + cleanPhone.slice(-4);
};

export const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return cardNumber;
  
  const cleanCard = cardNumber.replace(/\D/g, '');
  if (cleanCard.length < 4) return cardNumber;
  
  return '*'.repeat(cleanCard.length - 4) + cleanCard.slice(-4);
};

/**
 * Generate a secure random string
 */
export const generateSecureRandom = (length = 32) => {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Check if running in secure context (HTTPS)
 */
export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

/**
 * Validate file upload (prevent malicious files)
 */
export const isValidFileUpload = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'], maxSizeMB = 5) => {
  if (!file) return { valid: false, error: 'No file provided' };
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` 
    };
  }
  
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${maxSizeMB}MB` 
    };
  }
  
  // Check file extension matches MIME type
  const extension = file.name.split('.').pop().toLowerCase();
  const mimeExtensions = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif']
  };
  
  const validExtensions = mimeExtensions[file.type] || [];
  if (!validExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: 'File extension does not match file type' 
    };
  }
  
  return { valid: true };
};

/**
 * Debounce function to prevent rapid-fire requests
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit execution rate
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Log security event (for monitoring)
 */
export const logSecurityEvent = (eventType, details = {}) => {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
    ...details
  };
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔒 Security Event:', event);
  }
  
  // You can send to your backend or logging service
  // api.post('/security/log', event).catch(() => {});
};

export default {
  sanitizeInput,
  isValidEmail,
  isValidPhone,
  isStrongPassword,
  getPasswordStrength,
  isValidName,
  isValidAmount,
  detectSuspiciousInput,
  safeRenderText,
  escapeHTML,
  loginRateLimiter,
  paymentRateLimiter,
  apiRateLimiter,
  maskEmail,
  maskPhone,
  maskCardNumber,
  generateSecureRandom,
  isSecureContext,
  isValidFileUpload,
  debounce,
  throttle,
  logSecurityEvent
};
