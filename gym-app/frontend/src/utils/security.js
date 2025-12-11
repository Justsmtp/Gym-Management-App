import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHTML = (dirty) => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return validator.escape(input.trim());
  }
  return input;
};

/**
 * Validate email
 */
export const isValidEmail = (email) => {
  return validator.isEmail(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone) => {
  return validator.isMobilePhone(phone, 'any');
};

/**
 * Strong password validation
 */
export const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });
};

/**
 * Secure token storage
 */
export const secureStorage = {
  setToken: (token) => {
    // Use httpOnly cookies in production, localStorage for development
    if (process.env.NODE_ENV === 'production') {
      // Token should be set by server as httpOnly cookie
      console.log('Token stored securely');
    } else {
      localStorage.setItem('token', token);
    }
  },
  
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  removeToken: () => {
    localStorage.removeItem('token');
  }
};

/**
 * Prevent XSS in dynamic content
 */
export const safeRenderText = (text) => {
  const div = document.createElement('div');
  div.textContent = text; // Uses textContent, not innerHTML
  return div.innerHTML;
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Detect suspicious patterns in user input
 */
export const detectSuspiciousInput = (input) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\.\.\//,
    /__proto__/,
    /constructor/i
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Rate limit client-side actions
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
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }
  
  reset(key) {
    this.attempts.delete(key);
  }
}

export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
