const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/mailer');

// Membership details helper
const membershipDetails = {
  'Walk-in': { price: 5000, duration: 1 },
  'Weekly': { price: 6500, duration: 7 },
  'Deluxe': { price: 15500, duration: 30 },
  'Bi-Monthly': { price: 40000, duration: 90 },
};

// @route   POST /api/auth/register
// @desc    Register new user with email verification
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, membershipType, isAdmin, ...healthData } = req.body;
    
    if (!name || !email || !phone || !password || !membershipType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const membership = membershipDetails[membershipType] || membershipDetails.Deluxe;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure barcode and verification token
    const barcode = `GYM-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
      membershipType,
      membershipPrice: membership.price,
      membershipDuration: membership.duration,
      barcode,
      isAdmin: !!isAdmin,
      status: 'pending',
      paymentStatus: 'pending',
      isActive: false,
      isVerified: false,
      verificationToken,
      registrationDate: new Date(),
      // Store health data if provided
      ...healthData
    });

    await user.save();

    // Send verification email (don't block if email fails)
    try {
      await sendVerificationEmail({ 
        to: user.email, 
        token: verificationToken, 
        name: user.name 
      });
    } catch (mailErr) {
      console.error('❌ Email send failed:', mailErr.message);
      // Continue even if email fails - user can request resend
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipType: user.membershipType,
        membershipPrice: user.membershipPrice,
        membershipDuration: user.membershipDuration,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   GET /api/auth/verify/:token
// @desc    Verify email with token
router.get('/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    console.log('✅ Email verified for:', user.email);

    return res.json({ 
      success: true, 
      message: 'Email verified successfully. You may now login.' 
    });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @route   POST /api/auth/resend
// @desc    Resend verification email
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    // Generate new token
    user.verificationToken = crypto.randomBytes(24).toString('hex');
    await user.save();

    try {
      await sendVerificationEmail({ 
        to: user.email, 
        token: user.verificationToken, 
        name: user.name 
      });
      console.log('✅ Verification email resent to:', user.email);
    } catch (mailErr) {
      console.error('❌ Resend email error:', mailErr.message);
    }

    res.json({ success: true, message: 'Verification email resent' });
  } catch (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (requires email verification)
router.post('/login', async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check admin access
    if (isAdmin && !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not an admin account.' });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.',
        needsVerification: true 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { user: { id: user._id, isAdmin: user.isAdmin, email: user.email } },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful:', user.email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        barcode: user.barcode,
        membershipType: user.membershipType,
        paymentStatus: user.paymentStatus,
        isVerified: user.isVerified,
        status: user.status,
        nextDueDate: user.nextDueDate,
      },
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
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.user.id).select('-password -verificationToken');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error('Auth me error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// @route   POST /api/auth/check-pending
// @desc    Check if user has pending payment
router.post('/check-pending', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      exists: true,
      status: user.status,
      isPending: user.status === 'pending',
      isVerified: user.isVerified,
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