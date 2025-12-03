import axios from 'axios';

// Use the deployed backend URL from environment variable
const API_BASE = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_BASE + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token if available
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers['x-auth-token'] = token;
  return cfg;
});

export default api;
