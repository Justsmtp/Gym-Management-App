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
      
      const res = await API.post('/auth/login', { email, password, isAdmin });
      
      console.log('📦 Response data:', res.data);
      
      const { token, user } = res.data;

      if (!token || !user) {
        console.error('❌ Invalid response format:', res.data);
        return { 
          success: false, 
          message: 'Invalid server response. Please try again.' 
        };
      }

      const userWithId = {
        ...user,
        id: user.id || user._id,
      };

      console.log('✅ Login successful:', userWithId);

      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(userWithId));
      localStorage.setItem('userType', userWithId.isAdmin ? 'admin' : 'user');

      setCurrentUser(userWithId);
      setUserType(userWithId.isAdmin ? 'admin' : 'user');
      setIsAuthenticated(true);
      setCurrentScreen(userWithId.isAdmin ? 'adminDashboard' : 'userDashboard');

      return { success: true };
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        return { 
          success: false, 
          message: '⚠️ Cannot connect to server. Please ensure backend is running.' 
        };
      }
      
      if (err.code === 'ECONNABORTED') {
        return { 
          success: false, 
          message: '⏰ Server timeout. Please try again.' 
        };
      }
      
      if (err.response) {
        const message = err.response.data?.message || err.response.data?.error || 'Login failed';
        return { success: false, message };
      }
      
      if (err.request) {
        return { 
          success: false, 
          message: '📡 No response from server. Backend may be down.' 
        };
      }
      
      return { 
        success: false, 
        message: err.message || 'An unexpected error occurred.' 
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

      // Validation
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
      
      console.log('✅ Registration response:', res.data);
      
      // Extract email sending status from backend
      const emailSent = res.data.emailSent !== false; // Default to true if not specified
      const emailError = res.data.emailError;
      const emailId = res.data.emailId;
      
      // Log email status
      if (emailSent && emailId) {
        console.log('📧 Verification email sent successfully!');
        console.log('📧 Email ID:', emailId);
        console.log('📊 Check delivery: https://resend.com/emails/' + emailId);
      } else if (emailError) {
        console.error('❌ Email failed to send:', emailError);
      }
      
      // Build comprehensive message
      let message = res.data.message || 'Registration successful!';
      
      if (emailSent) {
        message = `✅ ${message}\n\n📧 IMPORTANT: Check your email inbox AND spam/junk folder for the verification link.\n\n🔍 Search for "1st Impression Fitness" if you can't find it.`;
      } else {
        message = `⚠️ Registration successful but email failed to send.\n\nPlease use the "Resend Verification Email" option or contact support.`;
      }
      
      return { 
        success: true, 
        user: res.data.user,
        message,
        emailSent,
        emailError,
        emailId,
        // Include debug info for troubleshooting
        debug: {
          emailAttempted: payload.email,
          emailSent,
          emailId,
          timestamp: new Date().toISOString()
        }
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
      } else {
        message = err.message || message;
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
      
      console.log('✅ Resend response:', res.data);
      
      // Check if email was actually sent
      const emailSent = res.data.emailSent !== false;
      const emailError = res.data.emailError;
      const emailId = res.data.emailId;
      
      if (emailSent && emailId) {
        console.log('📧 Verification email resent successfully!');
        console.log('📧 Email ID:', emailId);
        console.log('📊 Check delivery: https://resend.com/emails/' + emailId);
      }
      
      let message = res.data.message || 'Verification email sent';
      
      if (emailSent) {
        message = `✅ ${message}\n\n📧 Check your inbox AND spam/junk folder.\n🔍 Search for "1st Impression Fitness"`;
      } else {
        message = `❌ Failed to send email: ${emailError || 'Unknown error'}`;
      }
      
      return { 
        success: emailSent, 
        message,
        emailId,
        emailSent,
        debug: {
          emailId,
          timestamp: new Date().toISOString()
        }
      };
      
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
