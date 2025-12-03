import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});


// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userType');
      window.location.href = '/';
    }
    
    // Log error for debugging
    console.error('API Error:', error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);

export default api;
