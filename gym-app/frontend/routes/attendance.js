const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

// @route   POST /api/attendance/checkin
// @desc    Check in user
router.post('/checkin', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      user: req.user.id,
      date: today,
      checkOutTime: null
    });

    if (attendance) {
      return res.status(400).json({ message: 'Already checked in' });
    }

    // Create new check-in
    attendance = new Attendance({
      user: req.user.id,
    });

    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/attendance/checkout
// @desc    Check out user
router.put('/checkout', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const attendance = await Attendance.findOne({
      user: req.user.id,
      date: today,
      checkOutTime: null
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No active check-in found' });
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance
// @desc    Get all attendance records (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const attendance = await Attendance.find()
      .populate('user', 'name email barcode membershipType paymentStatus')
      .sort({ checkInTime: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/attendance/today
// @desc    Get today's attendance
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.find({ date: today })
      .populate('user', 'name email barcode membershipType paymentStatus')
      .sort({ checkInTime: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;