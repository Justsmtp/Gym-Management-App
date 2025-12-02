// backend/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

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

// @route   GET /api/users
// @desc    Get all users (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    console.log('📊 Fetching all users...');

    const users = await User.find({ isAdmin: false })
      .select('-password -verificationToken')
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${users.length} users`);

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

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -verificationToken');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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