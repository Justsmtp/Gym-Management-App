// frontend/src/components/User/UserSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { User, Bell, Lock, CreditCard, Mail, Phone, Save, Eye, EyeOff, Camera, Upload, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import API from '../../api/api';

const UserSettingsPanel = () => {
  const { currentUser, setCurrentUser, handleSignOut } = useApp();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Profile Picture Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    paymentDue: true,
    checkInConfirmation: false,
    promotions: false,
  });

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

  // Profile Picture Upload Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const response = await API.post('/users/upload-profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadSuccess(true);
        
        // Update current user with new profile picture
        const updatedUser = {
          ...currentUser,
          profilePicture: response.data.profilePicture
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        console.log('✅ Profile picture uploaded:', response.data.profilePicture);

        setTimeout(() => {
          setUploadSuccess(false);
          setSelectedFile(null);
          setPreviewUrl(null);
        }, 2000);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleDeletePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    try {
      setUploading(true);
      const response = await API.delete('/users/delete-profile-picture');
      
      if (response.data.success) {
        const updatedUser = {
          ...currentUser,
          profilePicture: null
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 2000);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to delete picture');
    } finally {
      setUploading(false);
    }
  };

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
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`p-3 md:p-4 rounded-xl border-2 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm md:text-base font-semibold ${
              message.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </p>
            <button onClick={() => setMessage(null)} className="text-gray-600 text-lg">✕</button>
          </div>
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Camera className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Profile Picture</h3>
        </div>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="relative inline-block">
              {previewUrl || currentUser?.profilePicture ? (
                <img
                  src={previewUrl || currentUser.profilePicture}
                  alt="Profile"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-gray-200"
                  onError={(e) => {
                    console.error('Image load error');
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-4 border-gray-200">
                  <span className="text-white text-4xl md:text-5xl font-bold">
                    {currentUser?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <label
                htmlFor="profile-picture-input"
                className="absolute bottom-0 right-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition shadow-lg"
              >
                <Camera size={20} />
              </label>
              
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Click the camera icon to upload a new photo
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, PNG or GIF. Max size 5MB
            </p>
          </div>

          {/* Upload Error Message */}
          {uploadError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2">
              <X size={18} className="text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Upload Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Check size={18} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">Profile picture updated successfully!</p>
            </div>
          )}

          {/* Upload Actions */}
          {selectedFile && !uploadSuccess && (
            <div className="space-y-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-semibold mb-1">
                  Selected: {selectedFile.name}
                </p>
                <p className="text-xs text-blue-600">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-black text-white py-3 px-4 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>Upload Photo</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={uploading}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Delete Picture Button */}
          {currentUser?.profilePicture && !selectedFile && (
            <button
              onClick={handleDeletePicture}
              disabled={uploading}
              className="w-full mt-4 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
            >
              {uploading ? 'Removing...' : 'Remove Profile Picture'}
            </button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <User className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Profile Information</h3>
        </div>

        <form onSubmit={handleProfileUpdate} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
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
              className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
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
              className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Must be 11 digits</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 text-sm md:text-base"
          >
            <Save className="inline mr-2" size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Lock className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none pr-12 text-sm md:text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
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
              className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
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
              className="w-full p-2.5 md:p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm md:text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 text-sm md:text-base"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <Bell className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Notification Preferences</h3>
        </div>

        <div className="space-y-3 md:space-y-4">
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
              className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 py-3 ${
                index !== 3 ? 'border-b border-gray-200' : ''
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-sm md:text-base text-black">{item.title}</p>
                <p className="text-xs md:text-sm text-gray-600">{item.desc}</p>
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
      <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border-2 border-gray-200">
        <div className="flex items-center mb-4 md:mb-6">
          <CreditCard className="mr-2 md:mr-3" size={20} />
          <h3 className="text-lg md:text-xl font-bold text-black">Membership Information</h3>
        </div>

        <div className="space-y-2 md:space-y-3">
          <div className="flex justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600">Membership Type:</span>
            <span className="font-semibold text-xs md:text-sm">{currentUser?.membershipType}</span>
          </div>
          <div className="flex justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600">Status:</span>
            <span className={`font-semibold text-xs md:text-sm ${
              currentUser?.status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>
              {currentUser?.status?.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600">Next Due Date:</span>
            <span className="font-semibold text-xs md:text-sm">
              {currentUser?.nextDueDate 
                ? new Date(currentUser.nextDueDate).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
          <div className="flex justify-between p-2.5 md:p-3 bg-gray-50 rounded-lg">
            <span className="text-xs md:text-sm text-gray-600">Total Visits:</span>
            <span className="font-semibold text-xs md:text-sm">{currentUser?.totalVisits || 0}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-50 rounded-2xl shadow-lg p-4 md:p-6 border-2 border-red-200">
        <h3 className="text-lg md:text-xl font-bold text-red-900 mb-3 md:mb-4">Danger Zone</h3>
        <p className="text-xs md:text-sm text-red-700 mb-3 md:mb-4">
          Once you sign out, you'll need to log in again to access your account.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 text-white py-2.5 md:py-3 rounded-lg font-semibold hover:bg-red-700 transition text-sm md:text-base"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserSettingsPanel;
