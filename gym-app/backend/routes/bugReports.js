// backend/routes/bugReports.js
const express = require('express');
const router = express.Router();
const BugReport = require('../models/BugReport');
const auth = require('../middleware/auth');
const User = require('../models/User');

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

// @route   POST /api/bug-reports
// @desc    Submit a bug report
router.post('/', async (req, res) => {
  try {
    const { subject, description, email } = req.body;

    if (!subject || !description || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Subject, description, and email are required' 
      });
    }

    const userAgent = req.headers['user-agent'] || '';
    
    const bugReport = new BugReport({
      subject,
      description,
      email,
      userAgent,
      reportedBy: req.user ? req.user.id : null
    });

    await bugReport.save();

    console.log(`🐛 New bug report from ${email}: ${subject}`);

    res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully',
      reportId: bugReport._id
    });
  } catch (err) {
    console.error('Error submitting bug report:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit bug report' 
    });
  }
});

// @route   GET /api/bug-reports
// @desc    Get all bug reports (Admin only)
router.get('/', auth, adminAuth, async (req, res) => {
  try {
    const { status, priority, limit = 50 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const reports = await BugReport.find(query)
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const stats = {
      total: await BugReport.countDocuments(),
      new: await BugReport.countDocuments({ status: 'new' }),
      inProgress: await BugReport.countDocuments({ status: 'in_progress' }),
      resolved: await BugReport.countDocuments({ status: 'resolved' }),
      closed: await BugReport.countDocuments({ status: 'closed' })
    };

    res.json({
      success: true,
      reports,
      stats
    });
  } catch (err) {
    console.error('Error fetching bug reports:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bug reports' 
    });
  }
});

// @route   GET /api/bug-reports/:id
// @desc    Get single bug report (Admin only)
router.get('/:id', auth, adminAuth, async (req, res) => {
  try {
    const report = await BugReport.findById(req.params.id)
      .populate('reportedBy', 'name email phone')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Bug report not found' 
      });
    }

    res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('Error fetching bug report:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch bug report' 
    });
  }
});

// @route   PUT /api/bug-reports/:id
// @desc    Update bug report (Admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { status, priority, adminNotes, category } = req.body;

    const updateData = { updatedAt: Date.now() };
    
    if (status) {
      updateData.status = status;
      if (status === 'resolved' || status === 'closed') {
        updateData.resolvedBy = req.user.id;
        updateData.resolvedAt = Date.now();
      }
    }
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (category) updateData.category = category;

    const report = await BugReport.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('reportedBy', 'name email');

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Bug report not found' 
      });
    }

    console.log(`✅ Bug report ${report._id} updated`);

    res.json({
      success: true,
      message: 'Bug report updated successfully',
      report
    });
  } catch (err) {
    console.error('Error updating bug report:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update bug report' 
    });
  }
});

// @route   DELETE /api/bug-reports/:id
// @desc    Delete bug report (Admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const report = await BugReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Bug report not found' 
      });
    }

    console.log(`🗑️ Bug report deleted`);

    res.json({
      success: true,
      message: 'Bug report deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting bug report:', err);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete bug report' 
    });
  }
});

module.exports = router;
