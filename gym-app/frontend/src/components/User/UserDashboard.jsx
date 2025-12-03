/* eslint-disable no-unused-vars */
// frontend/src/components/User/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { User, CheckCircle, XCircle, QrCode, Clock, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';
import UserSidebar from './UserSidebar';
import UserSettingsPanel from './UserSettingsPanel';

const UserDashboard = () => {
  const { currentUser, setCurrentUser, setCurrentScreen } = useApp();
  const [activeTab, setActiveTab] = useState('home');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Initial fetch and auto-refresh every 30 seconds
  useEffect(() => {
    // Fetch current attendance status
    const fetchAttendanceStatus = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching attendance status...');
        const response = await API.get('/attendance/my-status');
        console.log('📥 Attendance response:', response.data);
        
        // Check if there's actual attendance data
        if (response.data && response.data.success) {
          setAttendanceStatus(response.data);
          console.log('✅ Attendance status set:', response.data);
        } else {
          setAttendanceStatus(null);
          console.log('ℹ️ No check-in today');
        }
        
        setLastRefresh(new Date());
      } catch (error) {
        console.error('❌ Error fetching attendance:', error);
        setAttendanceStatus(null);
      } finally {
        setLoading(false);
      }
    };

    // Fetch updated user data
    const refreshUserData = async () => {
      try {
        const response = await API.get('/auth/me');
        setCurrentUser(response.data);
        console.log('✅ User data refreshed');
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    };

    // Initial fetch
    const initialFetch = async () => {
      await fetchAttendanceStatus();
      await refreshUserData();
    };
    
    initialFetch();
    
    // Set up interval for auto-refresh
    const interval = setInterval(() => {
      fetchAttendanceStatus();
      refreshUserData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [setCurrentUser]); // Empty dependency array - runs once on mount

    // Manual refresh function
  const handleManualRefresh = async () => {
    try {
      setLoading(true);
      console.log('🔄 Manual refresh triggered...');
      
      const [attendanceRes, userRes] = await Promise.all([
        API.get('/attendance/my-status'),
        API.get('/auth/me')
      ]);
      
      console.log('📥 Attendance response:', attendanceRes.data);
      console.log('📥 User response:', userRes.data);
      
      // Set attendance status
      if (attendanceRes.data && attendanceRes.data.success) {
        setAttendanceStatus(attendanceRes.data);
      } else {
        setAttendanceStatus(null);
      }
      
      // Set user data
      if (userRes.data) {
        setCurrentUser(userRes.data);
      }
      
      setLastRefresh(new Date());
      console.log('✅ Manual refresh completed');
    } catch (error) {
      console.error('❌ Error during manual refresh:', error);
      setAttendanceStatus(null);
    } finally {
      setLoading(false);
    }
  };

  // Home Tab Content
  const HomeTab = () => (
    <div className="space-y-6">
      {/* User Info Card with Profile Picture */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {currentUser?.profilePicture ? (
              <img 
                src={currentUser.profilePicture} 
                alt={currentUser.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200">
                <span className="text-white text-2xl font-bold">
                  {currentUser?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${
              currentUser?.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black">{currentUser?.name}</h2>
            <p className="text-gray-600">{currentUser?.membershipType} Member</p>
            <p className="text-xs text-gray-500 mt-1">
              Total Visits: <span className="font-bold text-black">{currentUser?.totalVisits || 0}</span>
            </p>
          </div>
        </div>

        {/* Membership Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Membership Status</p>
            <div className="flex items-center gap-2">
              {currentUser?.status === 'active' ? (
                <>
                  <CheckCircle size={24} className="text-green-500" />
                  <span className="text-lg font-bold text-green-600">Active</span>
                </>
              ) : (
                <>
                  <XCircle size={24} className="text-red-500" />
                  <span className="text-lg font-bold text-red-600">{currentUser?.status}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Next Due Date</p>
            <p className="text-lg font-bold text-black">
              {currentUser?.nextDueDate 
                ? new Date(currentUser.nextDueDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Check-in Status */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-black">Today's Check-in Status</h3>
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="text-gray-600 hover:text-black transition disabled:opacity-50"
            title="Refresh status"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && !attendanceStatus ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-black mx-auto mb-4"></div>
            <p className="text-gray-500">Loading status...</p>
          </div>
        ) : attendanceStatus && attendanceStatus.success && attendanceStatus.checkInTime ? (
          <div className="space-y-4">
            {/* Checked In - Show if not checked out yet */}
            {!attendanceStatus.checkOutTime ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <LogIn size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-lg">Currently Checked In</p>
                    <p className="text-sm text-green-600">You're at the gym! 💪</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Check-in Time</p>
                    <p className="font-bold text-green-700">
                      {new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="font-bold text-green-700">
                      {calculateDuration(attendanceStatus.checkInTime)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Show completed session if checked out */
              <div className="space-y-3">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <LogIn size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-green-800">Checked In</p>
                      <p className="text-sm text-green-600">
                        {new Date(attendanceStatus.checkInTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                      <LogOut size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-red-800">Checked Out</p>
                      <p className="text-sm text-red-600">
                        {new Date(attendanceStatus.checkOutTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                  <p className="text-sm text-blue-700">
                    Session Duration: <span className="font-bold">
                      {calculateSessionDuration(attendanceStatus.checkInTime, attendanceStatus.checkOutTime)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold">No check-in today</p>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Visits</p>
          <p className="text-3xl font-bold text-black">{currentUser?.totalVisits || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Last Check-in</p>
          <p className="text-sm font-bold text-black">
            {currentUser?.lastCheckIn 
              ? new Date(currentUser.lastCheckIn).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setActiveTab('barcode')}
            className="bg-black text-white py-4 px-6 rounded-xl font-semibold hover:bg-gray-800 transition shadow-lg flex items-center justify-center gap-2"
          >
            <QrCode size={20} />
            Show Barcode
          </button>
          <button
            onClick={() => setCurrentScreen('payment')}
            className="bg-white text-black border-2 border-black py-4 px-6 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
          >
            Renew Membership
          </button>
        </div>
      </div>
    </div>
  );

  // Calculate duration since check-in
  const calculateDuration = (checkInTime) => {
    const now = new Date();
    const checkIn = new Date(checkInTime);
    const diff = Math.floor((now - checkIn) / 1000 / 60); // minutes
    
    if (diff < 60) {
      return `${diff} min`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return `${hours}h ${mins}m`;
    }
  };

  // Calculate session duration (between check-in and check-out)
  const calculateSessionDuration = (checkInTime, checkOutTime) => {
    const checkIn = new Date(checkInTime);
    const checkOut = new Date(checkOutTime);
    const diff = Math.floor((checkOut - checkIn) / 1000 / 60); // minutes
    
    if (diff < 60) {
      return `${diff} minutes`;
    } else {
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  // Barcode Tab Content
  const BarcodeTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200 text-center">
        <h3 className="text-2xl font-bold text-black mb-4">Your Membership Barcode</h3>
        
        {/* Profile Picture */}
        <div className="mb-6">
          {currentUser?.profilePicture ? (
            <img 
              src={currentUser.profilePicture} 
              alt={currentUser.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 mx-auto"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200 mx-auto">
              <span className="text-white text-3xl font-bold">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <p className="mt-3 font-bold text-xl">{currentUser?.name}</p>
          <p className="text-sm text-gray-600">{currentUser?.membershipType}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-8 mb-4">
          <div className="w-64 h-64 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
            <QrCode size={200} className="text-gray-400" />
          </div>
          <p className="mt-4 font-mono text-xl font-bold text-black">{currentUser?.barcode || 'N/A'}</p>
        </div>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            Show this barcode at the front desk to check in
          </p>
        </div>
      </div>
    </div>
  );

  // Membership Tab Content
  const MembershipTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Current Membership</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-600">Plan Type</span>
            <span className="font-bold text-black">{currentUser?.membershipType || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentUser?.status === 'active' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentUser?.status || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-gray-200">
            <span className="text-gray-600">Start Date</span>
            <span className="font-semibold text-black">
              {currentUser?.membershipStartDate ? new Date(currentUser.membershipStartDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-gray-600">Expiry Date</span>
            <span className="font-semibold text-black">
              {currentUser?.membershipEndDate ? new Date(currentUser.membershipEndDate).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setCurrentScreen('payment')}
          className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Renew Membership
        </button>
      </div>
    </div>
  );

  // Payment History Tab Content
  const PaymentHistoryTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Payment History</h3>
        <div className="text-center py-12">
          <p className="text-gray-500">No payment history available</p>
          <button
            onClick={() => setCurrentScreen('paymentHistory')}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            View Full History
          </button>
        </div>
      </div>
    </div>
  );

  // Profile Tab Content
  const ProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Profile Information</h3>
        
        {/* Profile Picture */}
        <div className="mb-6 text-center">
          {currentUser?.profilePicture ? (
            <img 
              src={currentUser.profilePicture} 
              alt={currentUser.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mx-auto"
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200 mx-auto">
              <span className="text-white text-4xl font-bold">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Full Name</label>
            <p className="text-lg font-semibold text-black">{currentUser?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Email</label>
            <p className="text-lg font-semibold text-black">{currentUser?.email || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Phone</label>
            <p className="text-lg font-semibold text-black">{currentUser?.phone || 'N/A'}</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Member Since</label>
            <p className="text-lg font-semibold text-black">
              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full mt-4 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content - with left margin to account for fixed sidebar */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-black text-white p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold">
              {activeTab === 'home' ? 'Dashboard' : 
               activeTab === 'barcode' ? 'My Barcode' :
               activeTab === 'membership' ? 'Membership' :
               activeTab === 'history' ? 'Payment History' :
               activeTab === 'profile' ? 'Profile' :
               activeTab === 'settings' ? 'Settings' : activeTab}
            </h1>
            <p className="text-sm text-gray-300">Welcome back, {currentUser?.name}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === 'home' && <HomeTab />}
          {activeTab === 'barcode' && <BarcodeTab />}
          {activeTab === 'membership' && <MembershipTab />}
          {activeTab === 'history' && <PaymentHistoryTab />}
          {activeTab === 'profile' && <ProfileTab />}
          {activeTab === 'settings' && <UserSettingsPanel />}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;