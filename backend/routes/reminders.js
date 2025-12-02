// backend/routes/reminders.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { runImmediately } = require('../services/reminderScheduler');
const { sendManualReminder } = require('../services/emailReminder');

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

// POST /api/reminders/send-all - Manually trigger reminder check for all users
router.post('/send-all', auth, adminAuth, async (req, res) => {
  try {
    console.log('📧 Admin triggered manual reminder check');

    const result = await runImmediately();

    res.json({
      success: true,
      message: 'Reminder check completed',
      summary: result,
    });
  } catch (error) {
    console.error('Manual reminder error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message,
    });
  }
});

// POST /api/reminders/send/:userId - Send reminder to specific user
router.post('/send/:userId', auth, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📧 Admin sending reminder to user:', userId);

    const result = await sendManualReminder(userId);

    res.json({
      success: true,
      message: 'Reminder sent successfully',
      result,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send reminder',
    });
  }
});

// GET /api/reminders/preview - Get list of users who will receive reminders
router.get('/preview', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();

    const users = await User.find({
      isAdmin: false,
      status: { $in: ['active', 'expired'] },
      nextDueDate: { $exists: true },
    }).select('name email nextDueDate membershipType status');

    const usersWithDays = users.map(user => {
      const dueDate = new Date(user.nextDueDate);
      const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      const willReceiveReminder = 
        daysUntilDue === 7 ||
        daysUntilDue === 3 ||
        daysUntilDue === 1 ||
        daysUntilDue === 0 ||
        (daysUntilDue < 0 && daysUntilDue >= -7);

      return {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipType: user.membershipType,
        status: user.status,
        nextDueDate: user.nextDueDate,
        daysUntilDue,
        willReceiveReminder,
        reminderType: 
          daysUntilDue < 0 ? 'Overdue' :
          daysUntilDue === 0 ? 'Due Today' :
          daysUntilDue <= 3 ? 'Urgent' :
          'Advance Notice',
      };
    });

    const toReceiveReminders = usersWithDays.filter(u => u.willReceiveReminder);

    res.json({
      success: true,
      total: users.length,
      willReceiveReminders: toReceiveReminders.length,
      users: usersWithDays,
      nextScheduledRun: '9:00 AM tomorrow',
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load reminder preview',
    });
  }
});

// GET /api/reminders/stats - Get reminder statistics
router.get('/stats', auth, adminAuth, async (req, res) => {
  try {
    const now = new Date();

    const allUsers = await User.countDocuments({ 
      isAdmin: false,
      nextDueDate: { $exists: true },
    });

    // Count users by days until due
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    const dueIn7Days = await User.countDocuments({
      isAdmin: false,
      nextDueDate: { 
        $gte: now,
        $lte: sevenDays,
      },
    });

    const dueIn3Days = await User.countDocuments({
      isAdmin: false,
      nextDueDate: { 
        $gte: now,
        $lte: threeDays,
      },
    });

    const dueToday = await User.countDocuments({
      isAdmin: false,
      nextDueDate: { 
        $gte: now,
        $lte: tomorrow,
      },
    });

    const overdue = await User.countDocuments({
      isAdmin: false,
      nextDueDate: { $lt: now },
    });

    res.json({
      success: true,
      stats: {
        totalWithDueDate: allUsers,
        dueIn7Days,
        dueIn3Days,
        dueToday,
        overdue,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminder stats',
    });
  }
});

module.exports = router;