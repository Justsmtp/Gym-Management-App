/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// frontend/src/components/User/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, QrCode, Clock, LogIn, LogOut, RefreshCw, Menu, X, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';
import UserSidebar from './UserSidebar';
import UserSettingsPanel from './UserSettingsPanel';

const UserDashboard = () => {
  const { currentUser, setCurrentUser, setCurrentScreen } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Profile Picture Component with Persistent Error Handling
  const ProfilePicture = ({ user, size = 'md', className = '' }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    
    // Key that changes when user or profilePicture changes
    const imageKey = `${user?._id}-${user?.profilePicture}`;
    
    // Reset state when user or profile picture changes
    useEffect(() => {
      setImageError(false);
      setImageLoaded(false);
    }, [imageKey]);

    const sizeClasses = {
      sm: 'w-10 h-10 text-sm',
      md: 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl',
      lg: 'w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl',
      xl: 'w-24 h-24 md:w-32 md:h-32 text-3xl md:text-4xl'
    };

    const handleImageError = (e) => {
      console.warn('Image load failed for user:', user?.name, 'URL:', user?.profilePicture);
      setImageError(true);
      e.target.style.display = 'none';
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
    };

    // Show avatar if: no picture, error loading, or invalid URL
    const shouldShowAvatar = !user?.profilePicture || imageError || !user.profilePicture.startsWith('http');

    if (shouldShowAvatar) {
      return (
        <div 
          className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200 flex-shrink-0 ${className}`}
          title={user?.name || 'User'}
        >
          <span className="text-white font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse border-4 border-gray-200 flex-shrink-0 ${className}`} />
        )}
        <img 
          key={imageKey}
          src={user.profilePicture}
          alt={user?.name || 'User'}
          className={`${sizeClasses[size]} rounded-full object-cover border-4 border-gray-200 flex-shrink-0 ${className} ${imageLoaded ? '' : 'hidden'}`}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </>
    );
  };

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    const fetchAttendanceStatus = async () => {
      try {
        setLoading(true);
        const response = await API.get('/attendance/my-status');
        
        if (response.data && response.data.success) {
          setAttendanceStatus(response.data);
        } else {
          setAttendanceStatus(null);
        }
        
        setLastRefresh(new Date());
      } catch (error) {
        console.error('❌ Error fetching attendance:', error);
        setAttendanceStatus(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchPaymentHistory = async () => {
      try {
        if (!currentUser?._id) return;
        
        // Try the new endpoint first, fallback to old endpoint
        let response;
        try {
          response = await API.get('/payments/my-history');
          if (response.data && response.data.payments) {
            setPaymentHistory(response.data.payments);
          }
        } catch (err) {
          // Fallback to old endpoint if new one doesn't exist
          if (err.response?.status === 404) {
            response = await API.get(`/payments/user/${currentUser._id}`);
            if (response.data) {
              setPaymentHistory(Array.isArray(response.data) ? response.data : []);
            }
          } else {
            throw err;
          }
        }
      } catch (error) {
        console.error('❌ Error fetching payment history:', error);
        setPaymentHistory([]);
      }
    };

    const refreshUserData = async () => {
      try {
        const response = await API.get('/auth/me');
        setCurrentUser(response.data);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    const initialFetch = async () => {
      await Promise.all([
        fetchAttendanceStatus(),
        refreshUserData(),
        fetchPaymentHistory()
      ]);
    };
    
    initialFetch();
    
    const interval = setInterval(() => {
      fetchAttendanceStatus();
      refreshUserData();
      fetchPaymentHistory();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [setCurrentUser]);

  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      
      const attendanceRes = await API.get('/attendance/my-status');
      const userRes = await API.get('/auth/me');
      
      if (attendanceRes.data && attendanceRes.data.success) {
        setAttendanceStatus(attendanceRes.data);
      } else {
        setAttendanceStatus(null);
      }
      
      if (userRes.data) {
        setCurrentUser(userRes.data);
      }

      // Fetch payments with fallback
      if (userRes.data?._id) {
        try {
          const paymentsRes = await API.get('/payments/my-history');
          if (paymentsRes.data && paymentsRes.data.payments) {
            setPaymentHistory(paymentsRes.data.payments);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            const paymentsRes = await API.get(`/payments/user/${userRes.data._id}`);
            if (paymentsRes.data) {
              setPaymentHistory(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
            }
          }
        }
      }
      
      setLastRefresh(new Date());
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      setAttendanceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (checkInTime) => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const diff = Math.floor((now - checkIn) / 1000 / 60);
    
    if (diff < 60) {
      return `${diff} min`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const calculateSessionDuration = (checkInTime, checkOutTime) => {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diff = Math.floor((checkOut - checkIn) / 1000 / 60);
    
    if (diff < 60) {
      return `${diff} minutes`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  // Get actual membership dates from currentUser
  const getMembershipStartDate = () => {
    return currentUser?.membershipStartDate || currentUser?.startDate || currentUser?.activationDate || currentUser?.createdAt;
  };

  const getMembershipEndDate = () => {
    return currentUser?.membershipEndDate || currentUser?.expiryDate || currentUser?.nextDueDate;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Home Tab Content
  const HomeTab = () => (
    <div className="space-y-4 md:space-y-6">
      {/* User Info Card with Profile Picture */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="relative">
            <ProfilePicture user={currentUser} size="md" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-white ${
              currentUser?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-black">{currentUser?.name}</h2>
            <p className="text-sm md:text-base text-gray-600">{currentUser?.membershipType} Member</p>
            <p className="text-xs text-gray-500 mt-1">
              Total Visits: <span className="font-bold text-black">{currentUser?.totalVisits || 0}</span>
            </p>
          </div>
        </div>

        {/* Membership Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-gray-50 rounded-xl p-3 md:p-4 border-2 border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Membership Status</p>
            <div className="flex items-center gap-2">
              {currentUser?.status === 'active' ? (
                <>
                  <CheckCircle size={20} className="text-green-500 md:w-6 md:h-6" />
                  <span className="text-base md:text-lg font-bold text-green-600">Active</span>
                </>
              ) : (
                <>
                  <XCircle size={20} className="text-red-500 md:w-6 md:h-6" />
                  <span className="text-base md:text-lg font-bold text-red-600">{currentUser?.status}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 md:p-4 border-2 border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Membership Expires</p>
            <p className="text-base md:text-lg font-bold text-black">
              {formatDate(getMembershipEndDate())}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Check-in Status */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-bold text-black">Today's Check-in Status</h3>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="text-gray-600 hover:text-black transition disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={18} className={`md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading && !attendanceStatus ? (
          <div className="text-center py-6 md:py-8">
            <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
            <p className="text-sm md:text-base text-gray-500">Loading status...</p>
          </div>
        ) : attendanceStatus && attendanceStatus.success && attendanceStatus.checkInTime ? (
          <div className="space-y-3 md:space-y-4">
            {!attendanceStatus.checkOutTime ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 md:p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse flex-shrink-0">
                    <LogIn size={20} className="text-white md:w-6 md:h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-base md:text-lg">Currently Checked In</p>
                    <p className="text-xs md:text-sm text-green-600">You're at the gym! 💪</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Check-in Time</p>
                    <p className="font-bold text-sm md:text-base text-green-700">
                      {new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-bold text-sm md:text-base text-green-700">
                      {calculateDuration(attendanceStatus.checkInTime)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <LogIn size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base text-green-800">Checked In</p>
                      <p className="text-xs md:text-sm text-green-600">
                        {new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <LogOut size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm md:text-base text-red-800">Checked Out</p>
                      <p className="text-xs md:text-sm text-red-600">
                        {new Date(attendanceStatus.checkOutTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-xs md:text-sm text-blue-700">
                    Session Duration: <span className="font-bold">
                      {calculateSessionDuration(attendanceStatus.checkInTime, attendanceStatus.checkOutTime)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8">
            <Clock size={40} className="text-gray-400 mx-auto mb-4 md:w-12 md:h-12" />
            <p className="text-sm md:text-base text-gray-500 font-semibold">No check-in today</p>
            <p className="text-xs text-gray-400 mt-2">
              Show your barcode at the front desk to check in
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 border-2 border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Total Visits</p>
          <p className="text-2xl md:text-3xl font-bold text-black">{currentUser?.totalVisits || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-3 md:p-4 border-2 border-gray-200">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Last Check-in</p>
          <p className="text-xs md:text-sm font-bold text-black">
            {currentUser?.lastCheckIn 
              ? new Date(currentUser.lastCheckIn).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <h3 className="text-lg md:text-xl font-bold text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <button
            onClick={() => setActiveTab('barcode')}
            className="bg-black text-white py-3 md:py-4 px-4 md:px-6 rounded-xl font-semibold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2"
          >
            <QrCode size={18} className="md:w-5 md:h-5" />
            <span className="text-sm md:text-base">Show Barcode</span>
          </button>
          <button
            onClick={() => setCurrentScreen('payment')}
            className="bg-white text-black border-2 border-black py-3 md:py-4 px-4 md:px-6 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            <span className="text-sm md:text-base">Renew Membership</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Barcode Tab Content
  const BarcodeTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 border-2 border-gray-200 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-black mb-4">Your Membership Barcode</h3>
        
        <div className="mb-4 md:mb-6">
          <ProfilePicture user={currentUser} size="lg" className="mx-auto" />
          <p className="mt-3 font-bold text-lg md:text-xl">{currentUser?.name}</p>
          <p className="text-xs md:text-sm text-gray-600">{currentUser?.membershipType}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 md:p-8 mb-4">
          <div className="w-48 h-48 md:w-64 md:h-64 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
            <QrCode size={150} className="text-gray-400 md:w-52 md:h-52" />
          </div>
          <p className="mt-4 font-mono text-lg md:text-xl font-bold text-black">{currentUser?.barcode || 'N/A'}</p>
        </div>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 md:p-4">
          <p className="text-xs md:text-sm text-blue-800">
            Show this barcode at the front desk to check in
          </p>
        </div>
      </div>
    </div>
  );

  // Membership Tab
  const MembershipTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <h3 className="text-lg md:text-xl font-bold text-black mb-4">Current Membership</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-sm md:text-base text-gray-600">Plan Type</span>
            <span className="font-bold text-sm md:text-base text-black">{currentUser?.membershipType || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-sm md:text-base text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentUser?.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentUser?.status || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-sm md:text-base text-gray-600">Start Date</span>
            <span className="font-semibold text-sm md:text-base text-black">
              {formatDate(getMembershipStartDate())}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm md:text-base text-gray-600">Expiry Date</span>
            <span className="font-semibold text-sm md:text-base text-black">
              {formatDate(getMembershipEndDate())}
            </span>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen('payment')}
          className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition text-sm md:text-base"
        >
          Renew Membership
        </button>
      </div>
    </div>
  );

  // Payment History Tab
  const PaymentHistoryTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg md:text-xl font-bold text-black">Payment History</h3>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="text-gray-600 hover:text-black transition disabled:opacity-50"
            title="Refresh payments"
          >
            <RefreshCw size={18} className={`${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        {loading && paymentHistory.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Loading payment history...</p>
          </div>
        ) : paymentHistory.length > 0 ? (
          <div className="space-y-3">
            {paymentHistory.slice(0, 5).map((payment, index) => (
              <div key={payment._id || index} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard size={20} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base text-black">
                        {payment.membershipType || 'Membership Payment'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(payment.createdAt || payment.date)}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Method: <span className="font-medium">{payment.paymentMethod || 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm md:text-base text-green-600">
                      ₦{payment.amount?.toLocaleString() || '0'}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      payment.status === 'completed' || payment.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : payment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {payment.status || 'completed'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {paymentHistory.length > 5 && (
              <button
                onClick={() => setCurrentScreen('paymentHistory')}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-black rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
              >
                View All {paymentHistory.length} Payments
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 md:py-12">
            <CreditCard size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-sm md:text-base text-gray-500">No payment history available</p>
            <p className="text-xs text-gray-400 mt-2">Your payments will appear here once made</p>
          </div>
        )}
      </div>
    </div>
  );

  // Profile Tab
  const ProfileTab = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <h3 className="text-lg md:text-xl font-bold text-black mb-4">Profile Information</h3>
        
        <div className="mb-4 md:mb-6 text-center">
          <ProfilePicture user={currentUser} size="xl" className="mx-auto" />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Full Name</label>
            <p className="text-base md:text-lg font-semibold text-black">{currentUser?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Email</label>
            <p className="text-base md:text-lg font-semibold text-black break-all">{currentUser?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Phone</label>
            <p className="text-base md:text-lg font-semibold text-black">{currentUser?.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-semibold text-gray-600 mb-1">Member Since</label>
            <p className="text-base md:text-lg font-semibold text-black">
              {formatDate(currentUser?.createdAt)}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full mt-4 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition text-sm md:text-base"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Desktop: always visible, Mobile: hidden by default */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-64 z-40
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <UserSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
      </aside>

      {/* Overlay - only visible on mobile when sidebar is open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-64">
        {/* Header */}
        <header className="bg-black text-white p-4 md:p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {/* Title */}
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold">
                  {activeTab === 'home' ? 'Dashboard' : 
                   activeTab === 'barcode' ? 'My Barcode' :
                   activeTab === 'membership' ? 'Membership' :
                   activeTab === 'history' ? 'Payment History' :
                   activeTab === 'profile' ? 'Profile' :
                   activeTab === 'settings' ? 'Settings' : activeTab}
                </h1>
                <p className="text-xs md:text-sm text-gray-300">Welcome back, {currentUser?.name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'barcode' && <BarcodeTab />}
          {activeTab === 'membership' && <MembershipTab />}
          {activeTab === 'history' && <PaymentHistoryTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'settings' && <UserSettingsPanel />}
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
