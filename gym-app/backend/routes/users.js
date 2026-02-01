// backend/routes/users.js - UPDATED WITH ENHANCED DEBUGGING
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
// PROFILE PICTURE ROUTES - ENHANCED VERSION
// ============================================

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture (User only)
router.post('/upload-profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('\n📸 ===== PROFILE PICTURE UPLOAD REQUEST =====');
    console.log('User ID:', req.user.id);
    console.log('File uploaded:', req.file ? 'YES' : 'NO');
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:', {
      filename: req.file.filename,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      mimetype: req.file.mimetype
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.name, `(${user.email})`);

    // Delete old profile picture if exists
    if (user.profilePicture) {
      console.log('Old profile picture exists:', user.profilePicture);
      
      // Extract just the path part if it's a full URL
      const oldPath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullOldPath = path.join(__dirname, '..', 'uploads', oldPath);
      
      if (fs.existsSync(fullOldPath)) {
        try {
          fs.unlinkSync(fullOldPath);
          console.log('🗑️ Deleted old profile picture:', fullOldPath);
        } catch (err) {
          console.error('⚠️ Error deleting old picture:', err);
        }
      } else {
        console.log('⚠️ Old file not found at:', fullOldPath);
      }
    }

    // Create full URL for the profile picture
    const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
    
    // Build base URL with multiple fallbacks
    let baseUrl;
    
    // Priority 1: Environment variable
    if (process.env.API_BASE_URL) {
      baseUrl = process.env.API_BASE_URL;
      console.log('Using API_BASE_URL from env:', baseUrl);
    } 
    // Priority 2: Build from request
    else {
      const protocol = req.protocol; // http or https
      const host = req.get('host'); // localhost:5000 or domain.com
      baseUrl = `${protocol}://${host}`;
      console.log('Built base URL from request:', baseUrl);
    }
    
    const fullUrl = `${baseUrl}${profilePicturePath}`;
    
    console.log('\n🔗 URL Construction:');
    console.log('   Base URL:', baseUrl);
    console.log('   Path:', profilePicturePath);
    console.log('   Full URL:', fullUrl);
    
    // Verify the file exists
    const fullFilePath = path.join(__dirname, '..', 'uploads', 'profile-pictures', req.file.filename);
    const fileExists = fs.existsSync(fullFilePath);
    console.log('   File exists on disk:', fileExists ? 'YES ✅' : 'NO ❌');
    
    // Save to database
    user.profilePicture = fullUrl;
    await user.save();

    console.log('✅ Profile picture saved to database');
    console.log('✅ Upload complete for:', user.name);
    console.log('==========================================\n');

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
    console.error('❌ Profile picture upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log('🗑️ Cleaned up uploaded file after error');
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Failed to upload profile picture', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/users/delete-profile-picture
// @desc    Delete profile picture (User only)
router.delete('/delete-profile-picture', auth, async (req, res) => {
  try {
    console.log('\n🗑️ ===== PROFILE PICTURE DELETE REQUEST =====');
    console.log('User ID:', req.user.id);
    
    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User:', user.name, `(${user.email})`);
    console.log('Current profile picture:', user.profilePicture || 'None');

    // Delete file from filesystem
    if (user.profilePicture) {
      // Extract just the path part if it's a full URL
      const filePath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
      
      console.log('Attempting to delete file:', fullFilePath);
      
      if (fs.existsSync(fullFilePath)) {
        try {
          fs.unlinkSync(fullFilePath);
          console.log('✅ Profile picture deleted from filesystem');
        } catch (err) {
          console.error('⚠️ Error deleting file:', err);
        }
      } else {
        console.log('⚠️ File not found on disk');
      }
    }

    // Remove from database
    user.profilePicture = null;
    await user.save();

    console.log('✅ Profile picture removed from database');
    console.log('✅ Delete complete for:', user.name);
    console.log('==========================================\n');

    res.json({
      success: true,
      message: 'Profile picture deleted successfully'
    });

  } catch (error) {
    console.error('❌ Profile picture delete error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete profile picture', 
      error: error.message 
    });
  }
});

// ============================================
// DEBUG ENDPOINT - Check profile picture URL
// ============================================
router.get('/debug/profile-picture', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email profilePicture');
    
    const debugInfo = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePictureUrl: user.profilePicture
      },
      urlAnalysis: {
        hasProfilePicture: !!user.profilePicture,
        isFullUrl: user.profilePicture?.startsWith('http'),
        isRelativePath: user.profilePicture?.startsWith('/uploads')
      },
      serverInfo: {
        nodeEnv: process.env.NODE_ENV,
        apiBaseUrl: process.env.API_BASE_URL || 'Not set',
        protocol: req.protocol,
        host: req.get('host'),
        constructedBaseUrl: `${req.protocol}://${req.get('host')}`
      }
    };

    // Check if file exists on disk
    if (user.profilePicture) {
      const filePath = user.profilePicture.includes('http') 
        ? user.profilePicture.split('/uploads/')[1] 
        : user.profilePicture.replace('/uploads/', '');
      
      const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
      debugInfo.fileSystem = {
        expectedPath: fullFilePath,
        fileExists: fs.existsSync(fullFilePath)
      };
    }

    res.json(debugInfo);

  } catch (error) {
    res.status(500).json({ error: error.message });
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
