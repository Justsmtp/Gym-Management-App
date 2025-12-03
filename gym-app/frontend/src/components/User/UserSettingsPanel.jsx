// frontend/src/components/User/SettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, CreditCard, Mail, Phone, Save, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';

const UserSettingsPanel = () => {
  const { currentUser, setCurrentUser, handleSignOut } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    paymentDue: true,
    checkInConfirmation: false,
    promotions: false,
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await API.put('/auth/update-profile', profileData);
      
      const updatedUser = { ...currentUser, ...response.data.user };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);

    try {
      await API.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    // In production, save to backend
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="text-gray-600">✕</button>
          </div>
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <User className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Profile Information</h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline mr-2" size={16} />
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline mr-2" size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              pattern="[0-9]{11}"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be 11 digits</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save className="inline mr-2" size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <Lock className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              minLength={6}
              required
            />
            <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <Bell className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Notification Preferences</h3>
        </div>

        <div className="space-y-4">
          {[
            {
              key: 'emailReminders',
              title: 'Email Reminders',
              desc: 'Receive payment reminders via email',
            },
            {
              key: 'paymentDue',
              title: 'Payment Due Alerts',
              desc: 'Get notified when payment is due',
            },
            {
              key: 'checkInConfirmation',
              title: 'Check-in Confirmations',
              desc: 'Receive confirmation after gym check-in',
            },
            {
              key: 'promotions',
              title: 'Promotions & Updates',
              desc: 'Stay informed about special offers',
            },
          ].map((item, index) => (
            <div
              key={item.key}
              className={`flex justify-between items-center py-3 ${
                index !== 3 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div>
                <p className="font-semibold text-black">{item.title}</p>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notifications[item.key]}
                  onChange={() => handleNotificationToggle(item.key)}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Membership Info */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <div className="flex items-center mb-6">
          <CreditCard className="mr-3" size={24} />
          <h3 className="text-xl font-bold text-black">Membership Information</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Membership Type:</span>
            <span className="font-semibold">{currentUser?.membershipType}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Status:</span>
            <span className={`font-semibold ${
              currentUser?.status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentUser?.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Next Due Date:</span>
            <span className="font-semibold">
              {currentUser?.nextDueDate 
                ? new Date(currentUser.nextDueDate).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Visits:</span>
            <span className="font-semibold">{currentUser?.totalVisits || 0}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
        <h3 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h3>
        <p className="text-sm text-red-700 mb-4">
          Once you sign out, you'll need to log in again to access your account.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserSettingsPanel;