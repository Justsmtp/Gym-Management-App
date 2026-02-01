// frontend/src/components/User/UserSettingsPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, Bell, Lock, CreditCard, Mail, Phone, Save, Eye, EyeOff, 
  Camera, Upload, X, Check, ChevronRight, ArrowLeft, Copy, 
  Headphones, MessageSquare, AlertCircle, ExternalLink, Send
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import api from '../../api/api';

// Profile Picture Component with Persistent Error Handling
const ProfilePicture = ({ user, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Key that changes when user or profilePicture changes
  const imageKey = `${user?._id}-${user?.profilePicture}-${Date.now()}`;
  
  // Reset state when user or profile picture changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [user?._id, user?.profilePicture]);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 md:w-20 md:h-20 text-xl md:text-2xl',
    lg: 'w-32 h-32 md:w-40 md:h-40 text-3xl md:text-4xl',
    xl: 'w-40 h-40 text-4xl md:text-5xl'
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

const UserSettingsPanel = () => {
  const { currentUser, setCurrentUser, handleSignOut } = useApp();
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Close modal handler
  const closeModal = () => {
    setActiveModal(null);
    setMessage(null);
  };

  // Settings menu items
  const settingsMenu = [
    {
      id: 'profile',
      icon: User,
      title: 'Profile Information',
      description: 'Update your name, email, and phone number',
      color: 'blue'
    },
    {
      id: 'picture',
      icon: Camera,
      title: 'Profile Picture',
      description: 'Upload or change your profile photo',
      color: 'purple'
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Change Password',
      description: 'Update your account password',
      color: 'green'
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Manage your notification preferences',
      color: 'orange'
    },
    {
      id: 'membership',
      icon: CreditCard,
      title: 'Membership Info',
      description: 'View your membership details',
      color: 'indigo'
    },
    {
      id: 'support',
      icon: Headphones,
      title: 'Customer Service',
      description: 'Get help and contact support',
      color: 'pink'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    indigo: 'bg-indigo-500',
    pink: 'bg-pink-500'
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Global Message Banner */}
      {message && !activeModal && (
        <div className={`mb-4 p-3 md:p-4 rounded-xl border-2 ${
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

      {/* Settings Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveModal(item.id)}
            className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200 hover:border-black transition-all text-left group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${colorClasses[item.color]} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <item.icon className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-black mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="text-gray-400 group-hover:text-black transition-colors flex-shrink-0" size={24} />
            </div>
          </button>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="mt-6 bg-red-50 rounded-2xl shadow-lg p-6 border-2 border-red-200">
        <h3 className="text-lg font-bold text-red-900 mb-2">Sign Out</h3>
        <p className="text-sm text-red-700 mb-4">
          Once you sign out, you'll need to log in again to access your account.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Sign Out of Account
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'profile' && <ProfileModal closeModal={closeModal} currentUser={currentUser} setCurrentUser={setCurrentUser} message={message} setMessage={setMessage} loading={loading} setLoading={setLoading} />}
      {activeModal === 'picture' && <PictureModal closeModal={closeModal} currentUser={currentUser} setCurrentUser={setCurrentUser} message={message} setMessage={setMessage} />}
      {activeModal === 'password' && <PasswordModal closeModal={closeModal} message={message} setMessage={setMessage} loading={loading} setLoading={setLoading} />}
      {activeModal === 'notifications' && <NotificationsModal closeModal={closeModal} message={message} setMessage={setMessage} />}
      {activeModal === 'membership' && <MembershipModal closeModal={closeModal} currentUser={currentUser} />}
      {activeModal === 'support' && <SupportModal closeModal={closeModal} message={message} setMessage={setMessage} currentUser={currentUser} />}
    </div>
  );
};

// Profile Information Modal
const ProfileModal = ({ closeModal, currentUser, setCurrentUser, message, setMessage, loading, setLoading }) => {
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await API.put('/auth/update-profile', profileData);
      
      const updatedUser = { ...currentUser, ...response.data.user };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Profile Information" onClose={closeModal} icon={User}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
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

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save className="inline mr-2" size={16} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// Profile Picture Modal - FIXED VERSION
const PictureModal = ({ closeModal, currentUser, setCurrentUser, message, setMessage }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

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

      console.log('📤 Uploading profile picture...');

      const response = await API.post('/users/upload-profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('✅ Upload response:', response.data);

      if (response.data.success) {
        // Update user with new profile picture
        const updatedUser = {
          ...currentUser,
          profilePicture: response.data.profilePicture
        };
        
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Show success message in the modal
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
        
        // Reset form state
        setSelectedFile(null);
        setPreviewUrl(null);
        
        // DON'T close modal immediately - let user see the success message
        // Close after 2 seconds
        setTimeout(() => {
          closeModal();
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      setUploading(true);
      const response = await API.delete('/users/delete-profile-picture');
      
      if (response.data.success) {
        const updatedUser = { ...currentUser, profilePicture: null };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
        
        // Close after showing message
        setTimeout(() => {
          closeModal();
        }, 2000);
      }
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to delete picture');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ModalWrapper title="Profile Picture" onClose={closeModal} icon={Camera}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      <div className="text-center space-y-4">
        <div className="relative inline-block">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-40 h-40 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <ProfilePicture user={currentUser} size="lg" />
          )}

          <label
            htmlFor="picture-upload"
            className="absolute bottom-0 right-0 w-12 h-12 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-800 transition shadow-lg"
          >
            <Camera size={20} />
          </label>
          
          <input
            id="picture-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
        </div>

        <p className="text-sm text-gray-600">Click the camera icon to select a photo</p>
        <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB</p>

        {uploadError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2">
            <X size={18} className="text-red-600" />
            <p className="text-sm text-red-700">{uploadError}</p>
          </div>
        )}

        {selectedFile && (
          <>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-left">
              <p className="text-sm text-blue-800 font-semibold">Selected: {selectedFile.name}</p>
              <p className="text-xs text-blue-600">Size: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Photo
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  setUploadError(null);
                }}
                disabled={uploading}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {currentUser?.profilePicture && !selectedFile && (
          <button
            onClick={handleDelete}
            disabled={uploading}
            className="w-full px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition disabled:opacity-50"
          >
            {uploading ? 'Removing...' : 'Remove Profile Picture'}
          </button>
        )}

        {!selectedFile && (
          <button
            onClick={closeModal}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Close
          </button>
        )}
      </div>
    </ModalWrapper>
  );
};

// Password Change Modal
const PasswordModal = ({ closeModal, message, setMessage, loading, setLoading }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e) => {
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
      setTimeout(() => closeModal(), 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper title="Change Password" onClose={closeModal} icon={Lock}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
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
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none"
            required
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
          <button
            type="button"
            onClick={closeModal}
            className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

// Notifications Modal
const NotificationsModal = ({ closeModal, message, setMessage }) => {
  const [notifications, setNotifications] = useState({
    emailReminders: true,
    paymentDue: true,
    checkInConfirmation: false,
    promotions: false,
  });

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setMessage({ type: 'success', text: 'Notification preferences saved!' });
    setTimeout(() => closeModal(), 1500);
  };

  const notificationItems = [
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
  ];

  return (
    <ModalWrapper title="Notification Preferences" onClose={closeModal} icon={Bell}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {notificationItems.map((item, index) => (
          <div
            key={item.key}
            className={`flex justify-between items-center py-3 ${
              index !== notificationItems.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="flex-1">
              <p className="font-semibold text-black">{item.title}</p>
              <p className="text-sm text-gray-600">{item.desc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={notifications[item.key]}
                onChange={() => handleToggle(item.key)}
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-6">
        <button
          onClick={handleSave}
          className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          <Save className="inline mr-2" size={16} />
          Save Preferences
        </button>
        <button
          onClick={closeModal}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </ModalWrapper>
  );
};

// Membership Info Modal
const MembershipModal = ({ closeModal, currentUser }) => {
  const membershipInfo = [
    { label: 'Membership Type', value: currentUser?.membershipType || 'N/A' },
    { 
      label: 'Status', 
      value: currentUser?.status?.toUpperCase() || 'N/A',
      color: currentUser?.status === 'active' ? 'text-green-600' : 'text-red-600'
    },
    { 
      label: 'Next Due Date', 
      value: currentUser?.nextDueDate 
        ? new Date(currentUser.nextDueDate).toLocaleDateString()
        : 'N/A'
    },
    { label: 'Total Visits', value: currentUser?.totalVisits || 0 },
  ];

  return (
    <ModalWrapper title="Membership Information" onClose={closeModal} icon={CreditCard}>
      <div className="space-y-3">
        {membershipInfo.map((item, index) => (
          <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">{item.label}:</span>
            <span className={`font-semibold text-sm ${item.color || 'text-black'}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={closeModal}
        className="w-full mt-6 px-4 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition"
      >
        Close
      </button>
    </ModalWrapper>
  );
};

// Customer Service Modal
const SupportModal = ({ closeModal, message, setMessage, currentUser }) => {
  const [bugReport, setBugReport] = useState({
    subject: '',
    description: '',
    email: currentUser?.email || ''
  });
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState('');

  const contactInfo = [
    { icon: Mail, label: 'Email', value: 'support@1stimpression.com', copyable: true },
    { icon: Phone, label: 'Phone', value: '+234 123 456 7890', copyable: true },
    { icon: ExternalLink, label: 'Address', value: '123 Fitness Street, Lagos, Nigeria', copyable: true },
  ];

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      console.log('📤 Sending bug report:', bugReport);
      
      const response = await API.post('/bug-reports', bugReport);
      
      console.log('✅ Bug report response:', response.data);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Bug report sent successfully! We\'ll get back to you soon.' });
        setBugReport({ subject: '', description: '', email: currentUser?.email || '' });
        setTimeout(() => closeModal(), 2000);
      }
    } catch (error) {
      console.error('❌ Bug report error:', error);
      setMessage({ type: 'error', text: 'Failed to send report. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalWrapper title="Customer Service" onClose={closeModal} icon={Headphones}>
      {message && (
        <div className={`mb-4 p-3 rounded-lg border-2 ${
          message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
            <Headphones size={18} />
            Contact Information
          </h4>
          <div className="space-y-2">
            {contactInfo.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gray-600" />
                  <div>
                    <p className="text-xs text-gray-600">{item.label}</p>
                    <p className="font-semibold text-sm text-black">{item.value}</p>
                  </div>
                </div>
                {item.copyable && (
                  <button
                    onClick={() => handleCopy(item.value, item.label)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                  >
                    {copied === item.label ? (
                      <Check size={18} className="text-green-600" />
                    ) : (
                      <Copy size={18} className="text-gray-600" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
            <MessageSquare size={18} />
            Report a Bug or Issue
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
              <input
                type="email"
                value={bugReport.email}
                onChange={(e) => setBugReport({ ...bugReport, email: e.target.value })}
                className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                value={bugReport.subject}
                onChange={(e) => setBugReport({ ...bugReport, subject: e.target.value })}
                className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={bugReport.description}
                onChange={(e) => setBugReport({ ...bugReport, description: e.target.value })}
                className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:border-black focus:outline-none text-sm"
                rows={4}
                placeholder="Please describe the bug or issue in detail..."
                required
              />
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  We typically respond within 24-48 hours. For urgent matters, please call our support line.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Send Report
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={closeModal}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </ModalWrapper>
  );
};

// Modal Wrapper Component
const ModalWrapper = ({ title, onClose, icon: Icon, children }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <Icon className="text-white" size={20} />
                  </div>
                )}
                <h2 className="text-xl font-bold text-black">{title}</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UserSettingsPanel;
