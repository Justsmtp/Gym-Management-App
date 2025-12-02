// backend/routes/attendance.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Middleware to verify token
const verifyToken = (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.user.id;
    req.isAdmin = decoded.user.isAdmin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/attendance/my-status - Get current user's check-in status (user-facing)
router.get('/my-status', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    console.log('📍 Fetching attendance status for user:', userId);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's attendance for this user
    const attendance = await Attendance.findOne({
      user: userId,
      checkInTime: { $gte: today, $lt: tomorrow }
    }).sort({ checkInTime: -1 });

    if (!attendance) {
      console.log('❌ No attendance found for today');
      // Return success:false but with 200 status so frontend can handle it
      return res.json({ 
        success: false,
        message: 'No check-in found for today',
        isCheckedIn: false,
        checkInTime: null,
        checkOutTime: null
      });
    }

    console.log('✅ Attendance found:', {
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      isCheckedIn: !attendance.checkOutTime
    });

    res.json({
      success: true,
      isCheckedIn: !attendance.checkOutTime, // true if not checked out yet
      checkInTime: attendance.checkInTime,
      checkOutTime: attendance.checkOutTime,
      date: attendance.date
    });

  } catch (err) {
    console.error('❌ Get my status error:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error fetching attendance status' 
    });
  }
});

// POST /api/attendance/checkin - Check in a member
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ message: 'Barcode is required' });
    }

    // Find user by barcode
    const user = await User.findOne({ barcode: barcode.trim() });
    
    if (!user) {
      return res.status(404).json({ message: 'Member not found with this barcode' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Member account not verified' });
    }

    // Check if user has active membership
    if (user.status !== 'active') {
      return res.status(403).json({ 
        message: `Membership is ${user.status}. Please renew to access gym.` 
      });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingCheckIn = await Attendance.findOne({
      user: user._id,
      checkInTime: { $gte: today },
      checkOutTime: null
    });

    if (existingCheckIn) {
      return res.status(400).json({ 
        message: `${user.name} is already checked in since ${new Date(existingCheckIn.checkInTime).toLocaleTimeString()}` 
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      user: user._id,
      checkInTime: new Date(),
      date: today
    });

    await attendance.save();

    // Update user's last check-in and total visits
    user.lastCheckIn = new Date();
    user.totalVisits = (user.totalVisits || 0) + 1;
    await user.save();

    console.log('✅ Check-in successful:', user.name);

    res.json({
      success: true,
      message: `Welcome ${user.name}! Check-in successful.`,
      user: {
        name: user.name,
        membershipType: user.membershipType,
        totalVisits: user.totalVisits
      },
      attendance
    });

  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ message: 'Server error during check-in' });
  }
});

// POST /api/attendance/checkout - Check out a member
router.post('/checkout', verifyToken, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find today's attendance without checkout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      user: userId,
      checkInTime: { $gte: today },
      checkOutTime: null
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No active check-in found for this member' });
    }

    // Update checkout time
    attendance.checkOutTime = new Date();
    await attendance.save();

    console.log('✅ Check-out successful:', user.name);

    res.json({
      success: true,
      message: `${user.name} checked out successfully.`,
      user: {
        name: user.name
      },
      attendance
    });

  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ message: 'Server error during check-out' });
  }
});

// GET /api/attendance/today - Get today's attendance
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.find({
      checkInTime: { $gte: today, $lt: tomorrow }
    })
    .populate('user', 'name email barcode membershipType status profilePicture')
    .sort({ checkInTime: -1 });

    res.json({
      success: true,
      attendance,
      count: attendance.length
    });

  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ message: 'Server error fetching attendance' });
  }
});

// GET /api/attendance/history - Get user's check-in history (requires auth)
router.get('/history', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select(
      'name totalVisits lastCheckIn membershipType status nextDueDate'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      attendance: {
        totalVisits: user.totalVisits || 0,
        lastCheckIn: user.lastCheckIn,
        membershipType: user.membershipType,
        status: user.status,
        nextDueDate: user.nextDueDate,
      },
    });
  } catch (err) {
    console.error('Attendance history error:', err.message);
    res.status(500).json({ message: 'Failed to fetch attendance history' });
  }
});

// GET /api/attendance/stats - Get attendance statistics (admin only)
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await Attendance.countDocuments({
      checkInTime: { $gte: today, $lt: tomorrow }
    });

    // This week's check-ins
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const weekCheckIns = await Attendance.countDocuments({
      checkInTime: { $gte: weekAgo }
    });

    // Total members
    const totalMembers = await User.countDocuments({ isAdmin: false });

    // Active members
    const activeMembers = await User.countDocuments({ 
      status: 'active',
      isAdmin: false 
    });

    res.json({
      success: true,
      stats: {
        todayCheckIns,
        weekCheckIns,
        totalMembers,
        activeMembers,
      },
    });
  } catch (err) {
    console.error('Attendance stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch attendance statistics' });
  }
});

module.exports = router;