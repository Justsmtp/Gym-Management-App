import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';

const UserSettingsPanel = () => {
  const { currentUser } = useApp();
  
  const [notifications, setNotifications] = useState([
    { 
      id: 'email',
      title: 'Email Notifications', 
      desc: 'Receive payment reminders via email', 
      enabled: true 
    },
    { 
      id: 'push',
      title: 'Push Notifications', 
      desc: 'Get notified about class schedules', 
      enabled: true 
    },
    { 
      id: 'renewal',
      title: 'Renewal Reminders', 
      desc: 'Remind me before membership expires', 
      enabled: true 
    },
    { 
      id: 'promotional',
      title: 'Promotional Updates', 
      desc: 'Receive news about special offers', 
      enabled: false 
    },
  ]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const response = await API.get('/user/notification-preferences').catch(() => ({
          data: { notifications }
        }));
        
        if (response.data.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
      }
    };

    if (currentUser) {
      setFormData({
        fullName: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
      });
      
      // Fetch user notification preferences
      fetchNotificationPreferences();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const toggleNotification = async (index) => {
    try {
      const updatedNotifications = notifications.map((item, i) => 
        i === index ? { ...item, enabled: !item.enabled } : item
      );
      
      setNotifications(updatedNotifications);

      // Save to API
      await API.put('/user/notification-preferences', {
        notifications: updatedNotifications
      }).catch(() => {
        console.log('API not available, using local state only');
      });

      setSuccess('Notification preferences updated');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating notifications:', err);
      setError('Failed to update notification settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await API.put('/user/profile', formData);

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      console.log('Profile updated:', response.data);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    // This would typically open a modal or navigate to change password page
    alert('Change Password\n\nThis would open a change password form in a production app.');
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <p className="text-green-800 font-semibold">✅ {success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-800 font-semibold">⚠️ {error}</p>
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Account Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-black"
              placeholder="+234 800 000 0000"
            />
          </div>
          <button 
            onClick={handleUpdateProfile}
            disabled={saving}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {notifications.map((item, index) => (
            <div
              key={item.id}
              className={`flex justify-between items-center py-3 ${
                index !== notifications.length - 1 ? 'border-b border-gray-200' : ''
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
                  checked={item.enabled}
                  onChange={() => toggleNotification(index)}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black disabled:opacity-50"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Security</h3>
        <button 
          onClick={handleChangePassword}
          className="w-full bg-gray-100 text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition border-2 border-gray-200"
        >
          Change Password
        </button>
      </div>

      {/* Membership Info */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4">Membership Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Membership Type</span>
            <span className="font-semibold text-black">{currentUser?.membershipType || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Status</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              currentUser?.status === 'active' ? 'bg-green-100 text-green-800' :
              currentUser?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentUser?.status || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">Member Since</span>
            <span className="font-semibold text-black">
              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Barcode ID</span>
            <span className="font-mono text-sm font-semibold text-black">{currentUser?.barcode || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPanel;
