import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../api/api';

const AppContext = createContext();

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('currentUser');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        setUserType(user.isAdmin ? 'admin' : 'user');
        setIsAuthenticated(true);
        setCurrentScreen(user.isAdmin ? 'adminDashboard' : 'userDashboard');
      } catch (err) {
        console.error('Error parsing user from localStorage:', err);
        localStorage.clear();
      }
    }
  }, []);

  const handleLogin = async (email, password, isAdmin = false) => {
    try {
      console.log('🔐 Attempting login...', { email, isAdmin });
      
      // Make the API call
      const res = await API.post('/auth/login', { email, password, isAdmin });
      
      console.log('📦 Raw response:', res);
      console.log('📦 Response data:', res.data);
      
      // Extract token and user from response
      const { token, user } = res.data;

      if (!token || !user) {
        console.error('❌ Invalid response format:', res.data);
        return { 
          success: false, 
          message: 'Invalid server response. Please try again.' 
        };
      }

      // Ensure user has id field (handle both _id and id)
      const userWithId = {
        ...user,
        id: user.id || user._id,
      };

      console.log('✅ Login successful:', userWithId);

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(userWithId));
      localStorage.setItem('userType', userWithId.isAdmin ? 'admin' : 'user');

      // Update state
      setCurrentUser(userWithId);
      setUserType(userWithId.isAdmin ? 'admin' : 'user');
      setIsAuthenticated(true);
      setCurrentScreen(userWithId.isAdmin ? 'adminDashboard' : 'userDashboard');

      return { success: true };
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Handle network errors
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        console.error('🔌 Network Error - Cannot connect to backend');
        return { 
          success: false, 
          message: '⚠️ Cannot connect to server. Please ensure:\n1. Backend is running on http://localhost:5000\n2. MongoDB is connected\n3. Check terminal for errors' 
        };
      }
      
      // Handle timeout errors
      if (err.code === 'ECONNABORTED') {
        console.error('⏰ Request timeout');
        return { 
          success: false, 
          message: '⏰ Server is taking too long to respond. Please try again.' 
        };
      }
      
      // Handle HTTP error responses from backend
      if (err.response) {
        console.error('🚫 Backend error:', err.response.status, err.response.data);
        const message = err.response.data?.message || err.response.data?.error || 'Login failed';
        return { success: false, message };
      }
      
      // Handle request errors (before request was sent)
      if (err.request) {
        console.error('📡 No response received from server');
        return { 
          success: false, 
          message: '📡 No response from server. Backend may be down.' 
        };
      }
      
      // Unknown error
      console.error('❓ Unknown error:', err.message);
      return { 
        success: false, 
        message: err.message || 'An unexpected error occurred. Please try again.' 
      };
    }
  };

  const handleRegister = async (payload) => {
    try {
      console.log('📝 Attempting registration...', {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        membershipType: payload.membershipType,
        isAdmin: payload.isAdmin,
      });

      // Basic validation
      if (!payload.name || !payload.email || !payload.phone || !payload.password) {
        return { success: false, message: 'All fields are required' };
      }

      if (payload.password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
      }

      if (!/^[0-9]{11}$/.test(payload.phone)) {
        return { success: false, message: 'Phone must be exactly 11 digits' };
      }

      const res = await API.post('/auth/register', payload);
      
      console.log('✅ Registration successful:', res.data);
      
      return { 
        success: true, 
        user: res.data.user,
        message: res.data.message 
      };
    } catch (err) {
      console.error('❌ Registration error:', err);
      
      let message = 'Registration failed';
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        message = '⚠️ Cannot connect to server. Please ensure backend is running on http://localhost:5000';
      } else if (err.response) {
        message = err.response.data?.message || err.response.data?.error || message;
        console.error('Server error:', err.response.status, message);
      } else if (err.request) {
        message = '📡 No response from server. Backend may be down.';
        console.error('No response from server');
      } else {
        message = err.message || message;
        console.error('Request setup error:', message);
      }
      
      return { success: false, message };
    }
  };

  const resendVerification = async (email) => {
    try {
      console.log('📧 Resending verification email to:', email);
      
      if (!email) {
        return { success: false, message: 'Email is required' };
      }

      const res = await API.post('/auth/resend', { email });
      
      console.log('✅ Verification email sent');
      
      return { success: true, message: res.data.message || 'Verification email sent' };
    } catch (err) {
      console.error('❌ Resend error:', err);
      const message = err.response?.data?.message || 'Failed to resend verification email';
      return { success: false, message };
    }
  };

  const handleCheckIn = async (barcode) => {
    try {
      console.log('📍 Attempting check-in with barcode:', barcode);

      if (!barcode) {
        return { success: false, message: 'Barcode is required' };
      }

      const res = await API.post('/attendance/checkin', { barcode });
      
      console.log('✅ Check-in successful:', res.data);
      
      // Update current user if this is their check-in
      if (currentUser && currentUser.barcode === barcode) {
        const updatedUser = {
          ...currentUser,
          lastCheckIn: new Date().toISOString(),
          totalVisits: (currentUser.totalVisits || 0) + 1,
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }

      return { 
        success: true, 
        message: res.data.message || 'Check-in successful',
        data: res.data 
      };
    } catch (err) {
      console.error('❌ Check-in error:', err);
      const message = err.response?.data?.message || 'Check-in failed';
      return { success: false, message };
    }
  };

  const handlePayment = async (duration) => {
    try {
      console.log('💳 Processing payment for duration:', duration);

      // Update current user with new membership dates
      if (currentUser) {
        const now = new Date();
        const nextDueDate = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000);
        
        const updatedUser = {
          ...currentUser,
          status: 'active',
          paymentStatus: 'active',
          activationDate: now.toISOString(),
          lastPaymentDate: now.toISOString(),
          nextDueDate: nextDueDate.toISOString(),
        };

        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        console.log('✅ User updated with new payment info');
        return { success: true };
      }

      return { success: false, message: 'User not found' };
    } catch (err) {
      console.error('❌ Payment update error:', err);
      return { success: false, message: 'Failed to update payment status' };
    }
  };

  const handleSignOut = () => {
    console.log('👋 Signing out...');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userType');
    setCurrentUser(null);
    setUserType(null);
    setIsAuthenticated(false);
    setCurrentScreen('splash');
  };

  return (
    <AppContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        currentUser,
        setCurrentUser,
        userType,
        setUserType,
        isAuthenticated,
        handleLogin,
        handleRegister,
        resendVerification,
        handleCheckIn,
        handlePayment,
        handleSignOut,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

