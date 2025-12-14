import axios from 'axios';

// Get API URL from environment variable with fallback
const API_BASE = process.env.REACT_APP_API_URL || 'https://gym-management-app-backend-sevs.onrender.com';

console.log('🔧 API Configuration:');
console.log('📍 API_BASE:', API_BASE);
console.log('📍 Full API URL:', API_BASE + '/api');

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 
    'Content-Type': 'application/json'
  },
  withCredentials: true,
  timeout: 30000 // 30 second timeout
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    
    // Log request for debugging
    console.log(`🚀 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    // Log detailed error information
    if (error.response) {
      // Server responded with error status
      console.error('❌ API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url
      });
    } else if (error.request) {
      // Request made but no response received
      console.error('❌ API No Response:', {
        url: error.config?.url,
        message: 'Server did not respond. Check if backend is running.'
      });
    } else {
      // Error in request setup
      console.error('❌ API Request Setup Error:', error.message);
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing auth data');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('currentUser');
      sessionStorage.removeItem('userType');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
