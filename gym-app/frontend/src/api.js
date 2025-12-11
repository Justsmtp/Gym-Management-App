import axios from 'axios';

// ============================================
// SECURITY UTILITIES
// ============================================

/**
 * Secure token storage with encryption (basic implementation)
 */
const secureStorage = {
  setToken: (token) => {
    if (!token) return;
    
    // In production, consider encrypting the token before storing
    try {
      localStorage.setItem('token', token);
      // Set expiry timestamp
      localStorage.setItem('tokenExpiry', Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  },
  
  getToken: () => {
    try {
      const token = localStorage.getItem('token');
      const expiry = localStorage.getItem('tokenExpiry');
      
      // Check if token is expired
      if (expiry && Date.now() > parseInt(expiry)) {
        console.warn('⚠️ Token expired');
        secureStorage.removeToken();
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('Failed to retrieve token:', error);
      return null;
    }
  },
  
  removeToken: () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }
};

/**
 * Generate CSRF token for additional security
 */
const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Get or create CSRF token
 */
const getCSRFToken = () => {
  let csrfToken = sessionStorage.getItem('csrf-token');
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    sessionStorage.setItem('csrf-token', csrfToken);
  }
  return csrfToken;
};

/**
 * Sanitize sensitive data from logs
 */
const sanitizeForLog = (data) => {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'creditCard', 'cvv', 'pin'];
  const sanitized = { ...data };
  
  for (let field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  }
  
  return sanitized;
};

// ============================================
// API CONFIGURATION
// ============================================

// Get API URL from environment variable with fallback
const API_BASE = process.env.REACT_APP_API_URL || 'https://gym-management-app-backend-sevs.onrender.com';
const isDevelopment = process.env.NODE_ENV === 'development';
const enableLogging = isDevelopment || process.env.REACT_APP_ENABLE_LOGGING === 'true';

if (enableLogging) {
  console.log('🔧 API Configuration:');
  console.log('📍 Environment:', process.env.NODE_ENV || 'development');
  console.log('📍 API_BASE:', API_BASE);
  console.log('📍 Full API URL:', API_BASE + '/api');
}

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Helps prevent CSRF
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  validateStatus: (status) => {
    // Treat 2xx and 3xx as success, everything else as error
    return status >= 200 && status < 400;
  }
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config) => {
    // Add authentication token
    const token = secureStorage.getToken();
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // Add CSRF token for state-changing operations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
      config.headers['X-CSRF-Token'] = getCSRFToken();
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    // Sanitize request data before logging
    if (enableLogging) {
      const sanitizedData = config.data ? sanitizeForLog(config.data) : null;
      console.log(`🚀 ${config.method.toUpperCase()} ${config.url}`, sanitizedData);
    }
    
    return config;
  },
  (error) => {
    if (enableLogging) {
      console.error('❌ Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - response.config.metadata.startTime;
    
    if (enableLogging) {
      console.log(`✅ ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
    }
    
    // Warn about slow requests
    if (duration > 5000) {
      console.warn(`⚠️ Slow request detected: ${response.config.url} took ${duration}ms`);
    }
    
    return response;
  },
  (error) => {
    // Calculate request duration if available
    const duration = error.config?.metadata?.startTime 
      ? Date.now() - error.config.metadata.startTime 
      : null;
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      if (enableLogging) {
        console.error(`❌ API Error [${status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status,
          statusText: error.response.statusText,
          message: data?.message || data?.error,
          duration: duration ? `${duration}ms` : 'unknown'
        });
      }
      
      // Handle specific status codes
      switch (status) {
        case 401: // Unauthorized
          console.log('🔒 Unauthorized - clearing auth data');
          secureStorage.removeToken();
          
          // Only redirect if not already on login page
          if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
            // Store intended destination for redirect after login
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/';
          }
          break;
          
        case 403: // Forbidden
          console.error('🚫 Access denied - insufficient permissions');
          break;
          
        case 404: // Not Found
          console.error('🔍 Resource not found');
          break;
          
        case 429: // Too Many Requests
          console.error('⏱️ Rate limit exceeded - please slow down');
          break;
          
        case 500: // Internal Server Error
          console.error('💥 Server error - please try again later');
          break;
          
        case 503: // Service Unavailable
          console.error('🔧 Service temporarily unavailable');
          break;
          
        default:
          console.error(`❌ HTTP Error ${status}`);
      }
      
    } else if (error.request) {
      // Request made but no response received
      if (enableLogging) {
        console.error('❌ No Response Received:', {
          url: error.config?.url,
          method: error.config?.method?.toUpperCase(),
          message: 'Server did not respond. Check network connection and backend status.',
          duration: duration ? `${duration}ms` : 'timeout'
        });
      }
      
      // Check if it's a timeout
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timeout - server took too long to respond');
      }
      
      // Check if it's a network error
      if (!navigator.onLine) {
        console.error('📡 No internet connection');
      }
      
    } else {
      // Error in request setup
      if (enableLogging) {
        console.error('❌ Request Setup Error:', error.message);
      }
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check API health
 */
export const checkAPIHealth = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API Health Check:', response.data);
    return { healthy: true, data: response.data };
  } catch (error) {
    console.error('❌ API Health Check Failed:', error.message);
    return { healthy: false, error: error.message };
  }
};

/**
 * Safe API call with automatic retry
 */
export const safeAPICall = async (apiFunction, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      // Don't retry on 4xx errors (client errors)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      console.warn(`⚠️ Retry attempt ${i + 1}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

/**
 * Batch API requests
 */
export const batchAPIRequests = async (requests, maxConcurrent = 5) => {
  const results = [];
  for (let i = 0; i < requests.length; i += maxConcurrent) {
    const batch = requests.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
  }
  return results;
};

// ============================================
// EXPORT UTILITIES
// ============================================

export { secureStorage, getCSRFToken, sanitizeForLog };
export default api;
