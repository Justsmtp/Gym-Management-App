// backend/routes/users.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkAndUpdateMembershipStatus, checkMultipleMemberships, runBulkMembershipCheck } = require('../utils/membershipChecker');

// ============================================
// MULTER CONFIGURATION FOR PROFILE PICTURES
// ============================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename: userId-timestamp-originalname
    const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ============================================
// ADMIN AUTH MIDDLEWARE
// ============================================

// Middleware to check if user is admin
const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// PROFILE PICTURE ROUTES
// ============================================

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture (User only)
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      // Extract just the path part if it's a full URL
      const oldPath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullOldPath = path.join(__dirname, '..', 'uploads', oldPath);
      
      if (fs.existsSync(fullOldPath)) {
        try {
          fs.unlinkSync(fullOldPath);
          console.log('🗑️ Deleted old profile picture');
        } catch (err) {
          console.error('Error deleting old picture:', err);
        }
      }
    }

    // Create full URL for the profile picture
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    const baseUrl = process.env.API_BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${baseUrl}${profilePicturePath}`;
    
    user.profilePicture = fullUrl;
    await user.save();

    console.log(`✅ Profile picture uploaded for user: ${user.name}`);
    console.log(`📸 Picture URL: ${fullUrl}`);

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: fullUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: fullUrl
      }
    });

  } catch (error) {
    console.error('Profile picture upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      message: 'Failed to upload profile picture', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/users/delete-profile-picture
// @desc    Delete profile picture (User only)
router.delete('/delete-profile-picture', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete file from filesystem
    if (user.profilePicture) {
      // Extract just the path part if it's a full URL
      const filePath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
      
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
          console.log('🗑️ Profile picture deleted from filesystem');
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      }
    }

    // Remove from database
    user.profilePicture = null;
    await user.save();

    console.log(`✅ Profile picture removed for user: ${user.name}`);

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('Profile picture delete error:', error);
    res.status(500).json({ 
      message: 'Failed to delete profile picture', 
      error: error.message 
    });
  }
});

// ============================================
// EXISTING USER ROUTES
// ============================================

// @route   GET /api/users
// @desc    Get all users (Admin only) - WITH STATUS CHECK
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('📊 Fetching all users...');

    let users = await User.find({ isAdmin: false })
      .select('-password -verificationToken')
      .sort({ createdAt: -1 });

    // CHECK AND UPDATE ALL USERS' STATUS
    users = await checkMultipleMemberships(users);

    console.log(`✅ Found ${users.length} users (statuses updated)`);

    res.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/check-memberships
// @desc    Manually check all memberships (Admin only)
router.post('/check-memberships', auth, adminAuth, async (req, res) => {
  try {
    console.log('🔄 Admin triggered manual membership check');
    const result = await runBulkMembershipCheck();

    res.json({
      success: true,
      message: 'Membership status check completed',
      result
    });
  } catch (err) {
    console.error('❌ Error checking memberships:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only) - WITH STATUS CHECK
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    let user = await User.findById(req.params.id).select('-password -verificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // CHECK AND UPDATE STATUS
    user = await checkAndUpdateMembershipStatus(user);

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'pending', 'expired', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    ).select('-password -verificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ User ${user.name} status updated to: ${status}`);

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user,
    });
  } catch (err) {
    console.error('Error updating user status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/payment-status
// @desc    Update payment status (Admin only)
router.put('/:id/payment-status', auth, adminAuth, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    
    if (!['pending', 'active', 'due'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const updateData = { 
      paymentStatus, 
      updatedAt: Date.now() 
    };
    
    if (paymentStatus === 'active') {
      updateData.nextDueDate = new Date(Date.now() + 30*24*60*60*1000);
      updateData.lastPaymentDate = new Date();
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -verificationToken');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ User ${user.name} payment status updated to: ${paymentStatus}`);

    res.json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      user,
    });
  } catch (err) {
    console.error('Error updating payment status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats/summary
// @desc    Get user statistics (Admin only)
router.get('/stats/summary', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const activeUsers = await User.countDocuments({ status: 'active', isAdmin: false });
    const pendingUsers = await User.countDocuments({ status: 'pending', isAdmin: false });
    const expiredUsers = await User.countDocuments({ status: 'expired', isAdmin: false });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        pendingUsers,
        expiredUsers,
      },
    });
  } catch (err) {
    console.error('Error fetching user stats:', err.message);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete profile picture if exists
    if (user.profilePicture) {
      // Extract just the path part if it's a full URL
      const filePath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
      
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
          console.log('🗑️ Deleted user profile picture');
        } catch (err) {
          console.error('Error deleting profile picture:', err);
        }
      }
    }

    await User.findByIdAndDelete(req.params.id);

    console.log(`🗑️ User deleted: ${user.name}`);

    res.json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
