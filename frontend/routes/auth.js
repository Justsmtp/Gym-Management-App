const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Register new user (creates PENDING user, payment required to activate)
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, membershipType } = req.body;

    // Validation
    if (!name || !email || !phone || !password || !membershipType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get membership details
    const membershipDetails = {
      'Walk-in': { price: 5000, duration: 1 },
      'Weekly': { price: 6500, duration: 7 },
      'Deluxe': { price: 15500, duration: 30 },
      'Bi-Monthly': { price: 40000, duration: 90 },
    };

    const membership = membershipDetails[membershipType] || membershipDetails['Deluxe'];

    // Create PENDING user (not active yet)
    user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      membershipType: membershipType,
      membershipPrice: membership.price,
      membershipDuration: membership.duration,
      status: 'pending', // IMPORTANT: User is pending until payment
      paymentStatus: 'pending',
      isActive: false,
      registrationDate: new Date(),
    });

    await user.save();

    // Return user info for payment initiation
    res.json({ 
      success: true,
      message: 'Registration initiated. Please complete payment to activate your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipType: user.membershipType,
        membershipPrice: user.membershipPrice,
        membershipDuration: user.membershipDuration,
        status: user.status // pending
      }
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (only if status is 'active')
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if user is active (payment completed)
    if (user.status === 'pending') {
      return res.status(403).json({ 
        message: 'Account pending. Please complete payment to activate your account.',
        status: 'pending',
        userId: user._id
      });
    }

    if (user.status === 'suspended' || user.status === 'expired') {
      return res.status(403).json({ 
        message: 'Account ' + user.status + '. Please contact support or renew your membership.',
        status: user.status
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const payload = { 
      user: { 
        id: user._id, 
        isAdmin: user.isAdmin,
        email: user.email
      } 
    };
    
    const token = jwt.sign(
      payload, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        barcode: user.barcode,
        isAdmin: user.isAdmin,
        membershipType: user.membershipType,
        paymentStatus: user.paymentStatus,
        nextDueDate: user.nextDueDate,
        status: user.status
      } 
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Auth check error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// @route   POST /api/auth/check-pending
// @desc    Check if user has pending payment
router.post('/check-pending', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      exists: true,
      status: user.status,
      isPending: user.status === 'pending',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipType: user.membershipType,
        membershipPrice: user.membershipPrice,
        membershipDuration: user.membershipDuration
      }
    });
  } catch (err) {
    console.error('Check pending error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;