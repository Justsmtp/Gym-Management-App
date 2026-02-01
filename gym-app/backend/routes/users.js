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
// CLOUDINARY SETUP FOR PERSISTENT STORAGE
// ============================================

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary (will use environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if Cloudinary is configured
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

console.log('📸 Cloudinary configured:', isCloudinaryConfigured);

// ============================================
// MULTER CONFIGURATION
// ============================================

let storage;
let upload;

if (isCloudinaryConfigured) {
  // Use Cloudinary storage (for production)
  console.log('✅ Using Cloudinary storage for profile pictures');
  
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'gym-profile-pictures',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
      public_id: (req, file) => {
        return `${req.user.id}-${Date.now()}`;
      }
    }
  });

  upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  });

} else {
  // Fallback to local storage (for development)
  console.log('⚠️ Using local storage for profile pictures (NOT RECOMMENDED FOR PRODUCTION)');
  console.log('⚠️ Please configure Cloudinary for persistent storage on Render.com');
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueName = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  };

  upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024
    }
  });
}

// ============================================
// ADMIN AUTH MIDDLEWARE
// ============================================

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
    console.log('\n📸 ===== PROFILE PICTURE UPLOAD REQUEST =====');
    console.log('User ID:', req.user.id);
    console.log('File uploaded:', req.file ? 'YES' : 'NO');
    console.log('Using Cloudinary:', isCloudinaryConfigured);
    
    if (!req.file) {
      console.log('❌ No file in request');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File details:', {
      filename: req.file.filename || req.file.originalname,
      size: `${(req.file.size / 1024).toFixed(2)} KB`,
      mimetype: req.file.mimetype
    });

    const user = await User.findById(req.user.id);
    if (!user) {
      console.log('❌ User not found:', req.user.id);
      
      // Clean up uploaded file
      if (isCloudinaryConfigured && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id);
      } else if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', user.name, `(${user.email})`);

    // Delete old profile picture
    if (user.profilePicture) {
      console.log('Old profile picture exists:', user.profilePicture);
      
      try {
        if (isCloudinaryConfigured) {
          // Extract public_id from Cloudinary URL
          const urlParts = user.profilePicture.split('/');
          const publicIdWithExt = urlParts[urlParts.length - 1];
          const publicId = `gym-profile-pictures/${publicIdWithExt.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Deleted old Cloudinary image:', publicId);
        } else {
          // Local file deletion
          const oldPath = user.profilePicture.includes('http') 
            ? user.profilePicture.split('/uploads/')[1] 
            : user.profilePicture.replace('/uploads/', '');
          
          const fullOldPath = path.join(__dirname, '..', 'uploads', oldPath);
          
          if (fs.existsSync(fullOldPath)) {
            fs.unlinkSync(fullOldPath);
            console.log('🗑️ Deleted old local file');
          }
        }
      } catch (err) {
        console.warn('⚠️ Error deleting old picture:', err.message);
      }
    }

    // Get the profile picture URL
    let profilePictureUrl;
    
    if (isCloudinaryConfigured) {
      // Cloudinary URL (already a full URL)
      profilePictureUrl = req.file.path; // Cloudinary provides full URL
      console.log('☁️ Cloudinary URL:', profilePictureUrl);
    } else {
      // Local file URL
      const protocol = req.protocol;
      const host = req.get('host');
      const filePath = `/uploads/profile-pictures/${req.file.filename}`;
      profilePictureUrl = `${protocol}://${host}${filePath}`;
      console.log('💾 Local URL:', profilePictureUrl);
    }

    console.log('🔗 Final profile picture URL:', profilePictureUrl);

    // Save to database
    user.profilePicture = profilePictureUrl;
    await user.save();

    console.log('✅ Profile picture saved to database');
    console.log('✅ Upload complete for:', user.name);
    console.log('==========================================\n');

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePicture: profilePictureUrl,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: profilePictureUrl
      }
    });

  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    
    // Clean up uploaded file if there was an error
    if (isCloudinaryConfigured && req.file?.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id);
      } catch (cleanupErr) {
        console.error('Error cleaning up Cloudinary file:', cleanupErr);
      }
    } else if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
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

    // Delete file
    if (user.profilePicture) {
      try {
        if (isCloudinaryConfigured && user.profilePicture.includes('cloudinary')) {
          // Delete from Cloudinary
          const urlParts = user.profilePicture.split('/');
          const publicIdWithExt = urlParts[urlParts.length - 1];
          const publicId = `gym-profile-pictures/${publicIdWithExt.split('.')[0]}`;
          
          await cloudinary.uploader.destroy(publicId);
          console.log('✅ Deleted from Cloudinary:', publicId);
        } else {
          // Delete local file
          const filePath = user.profilePicture.includes('http') 
            ? user.profilePicture.split('/uploads/')[1] 
            : user.profilePicture.replace('/uploads/', '');
          
          const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
          
          if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
            console.log('✅ Deleted local file');
          }
        }
      } catch (err) {
        console.error('⚠️ Error deleting file:', err.message);
      }
    }

    // Remove from database
    user.profilePicture = null;
    await user.save();

    console.log('✅ Profile picture removed from database');
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
// EXISTING USER ROUTES (unchanged)
// ============================================

router.get('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('📊 Fetching all users...');
    let users = await User.find({ isAdmin: false })
      .select('-password -verificationToken')
      .sort({ createdAt: -1 });
    users = await checkMultipleMemberships(users);
    console.log(`✅ Found ${users.length} users (statuses updated)`);
    res.json({ success: true, users, total: users.length });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/check-memberships', auth, adminAuth, async (req, res) => {
  try {
    console.log('🔄 Admin triggered manual membership check');
    const result = await runBulkMembershipCheck();
    res.json({ success: true, message: 'Membership status check completed', result });
  } catch (err) {
    console.error('❌ Error checking memberships:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    let user = await User.findById(req.params.id).select('-password -verificationToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    user = await checkAndUpdateMembershipStatus(user);
    res.json({ success: true, user });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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
    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log(`✅ User ${user.name} status updated to: ${status}`);
    res.json({ success: true, message: `User status updated to ${status}`, user });
  } catch (err) {
    console.error('Error updating user status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/payment-status', auth, adminAuth, async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!['pending', 'active', 'due'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const updateData = { paymentStatus, updatedAt: Date.now() };
    if (paymentStatus === 'active') {
      updateData.nextDueDate = new Date(Date.now() + 30*24*60*60*1000);
      updateData.lastPaymentDate = new Date();
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('-password -verificationToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log(`✅ User ${user.name} payment status updated to: ${paymentStatus}`);
    res.json({ success: true, message: `Payment status updated to ${paymentStatus}`, user });
  } catch (err) {
    console.error('Error updating payment status:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats/summary', auth, adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isAdmin: false });
    const activeUsers = await User.countDocuments({ status: 'active', isAdmin: false });
    const pendingUsers = await User.countDocuments({ status: 'pending', isAdmin: false });
    const expiredUsers = await User.countDocuments({ status: 'expired', isAdmin: false });
    res.json({ success: true, stats: { totalUsers, activeUsers, pendingUsers, expiredUsers } });
  } catch (err) {
    console.error('Error fetching user stats:', err.message);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
});

router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete profile picture if exists
    if (user.profilePicture) {
      try {
        if (isCloudinaryConfigured && user.profilePicture.includes('cloudinary')) {
          const urlParts = user.profilePicture.split('/');
          const publicIdWithExt = urlParts[urlParts.length - 1];
          const publicId = `gym-profile-pictures/${publicIdWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
          console.log('🗑️ Deleted Cloudinary image');
        } else {
          const filePath = user.profilePicture.includes('http') 
            ? user.profilePicture.split('/uploads/')[1] 
            : user.profilePicture.replace('/uploads/', '');
          const fullFilePath = path.join(__dirname, '..', 'uploads', filePath);
          if (fs.existsSync(fullFilePath)) {
            fs.unlinkSync(fullFilePath);
            console.log('🗑️ Deleted local file');
          }
        }
      } catch (err) {
        console.error('Error deleting profile picture:', err);
      }
    }

    await User.findByIdAndDelete(req.params.id);
    console.log(`🗑️ User deleted: ${user.name}`);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
