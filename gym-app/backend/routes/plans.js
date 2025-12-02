const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const MembershipPlan = require('../models/MembershipPlan');

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (!decoded.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    req.userId = decoded.user.id;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /api/plans - Get all membership plans
router.get('/', async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, plans });
  } catch (err) {
    console.error('Get plans error:', err.message);
    res.status(500).json({ message: 'Server error fetching plans' });
  }
});

// GET /api/plans/:id - Get single plan
router.get('/:id', async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    res.json({ success: true, plan });
  } catch (err) {
    console.error('Get plan error:', err.message);
    res.status(500).json({ message: 'Server error fetching plan' });
  }
});

// POST /api/plans - Create new plan (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    const { name, displayName, price, duration, description } = req.body;

    // Validation
    if (!name || !displayName || !price || !duration || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price must be positive' });
    }

    if (duration < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 day' });
    }

    // Check if plan name already exists
    const existing = await MembershipPlan.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Plan name already exists' });
    }

    const plan = new MembershipPlan({
      name,
      displayName,
      price,
      duration,
      description
    });

    await plan.save();

    console.log('✅ New plan created:', plan.name);

    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      plan
    });

  } catch (err) {
    console.error('Create plan error:', err.message);
    res.status(500).json({ message: 'Server error creating plan' });
  }
});

// PUT /api/plans/:id - Update plan (Admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  try {
    const { displayName, price, duration, description } = req.body;

    // Validation
    if (!displayName || !price || !duration || !description) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (price < 0) {
      return res.status(400).json({ message: 'Price must be positive' });
    }

    if (duration < 1) {
      return res.status(400).json({ message: 'Duration must be at least 1 day' });
    }

    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    plan.displayName = displayName;
    plan.price = price;
    plan.duration = duration;
    plan.description = description;

    await plan.save();

    console.log('✅ Plan updated:', plan.name);

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });

  } catch (err) {
    console.error('Update plan error:', err.message);
    res.status(500).json({ message: 'Server error updating plan' });
  }
});

// DELETE /api/plans/:id - Delete (deactivate) plan (Admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Soft delete - just mark as inactive
    plan.isActive = false;
    await plan.save();

    console.log('✅ Plan deactivated:', plan.name);

    res.json({
      success: true,
      message: 'Plan deactivated successfully'
    });

  } catch (err) {
    console.error('Delete plan error:', err.message);
    res.status(500).json({ message: 'Server error deleting plan' });
  }
});

module.exports = router;
