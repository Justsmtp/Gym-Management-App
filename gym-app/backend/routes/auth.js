// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/mailer');

// membership details helper
const membershipDetails = {
  'Walk-in': { price: 5000, duration: 1 },
  Weekly: { price: 6500, duration: 7 },
  Deluxe: { price: 15500, duration: 30 },
  'Bi-Monthly': { price: 40000, duration: 90 },
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, membershipType, isAdmin } = req.body;
    if (!name || !email || !phone || !password || !membershipType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const membership = membershipDetails[membershipType] || membershipDetails.Deluxe;

    // secure unique barcode
    const barcode = `GYM-${crypto.randomBytes(4).toString('hex').toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const verificationToken = crypto.randomBytes(24).toString('hex');

    const user = new User({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      membershipType,
      membershipPrice: membership.price,
      membershipDuration: membership.duration,
      barcode,
      isAdmin: !!isAdmin,
      status: 'pending',
      paymentStatus: 'pending',
      isActive: false,
      verificationToken,
    });

    await user.save();

    // send verification email (do not block if email fails)
    try {
      await sendVerificationEmail({ to: user.email, token: verificationToken, name: user.name });
    } catch (mailErr) {
      console.error('send email failed', mailErr);
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

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const token = req.params.token;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully. You may now login.' });
  } catch (err) {
    console.error('Verification error:', err.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// POST /api/auth/resend
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    user.verificationToken = crypto.randomBytes(24).toString('hex');
    await user.save();

    try {
      await sendVerificationEmail({ to: user.email, token: user.verificationToken, name: user.name });
    } catch (mailErr) {
      console.error('Resend email error:', mailErr);
    }

    res.json({ success: true, message: 'Verification email resent' });
  } catch (err) {
    console.error('Resend error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (isAdmin && !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not an admin account.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user._id, isAdmin: user.isAdmin } }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '30d',
    });

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

// GET /api/auth/me
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

// PUT /api/auth/update-profile
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user.id;

    const { name, email, phone } = req.body;

    // Validation
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate phone format (11 digits)
    if (!/^[0-9]{11}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be exactly 11 digits' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use by another account' });
    }

    // Update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name;
    user.email = email.toLowerCase();
    user.phone = phone;
    
    await user.save();

    console.log('✅ Profile updated for user:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        membershipType: user.membershipType,
        status: user.status,
        barcode: user.barcode,
        isAdmin: user.isAdmin,
        isVerified: user.isVerified,
        paymentStatus: user.paymentStatus,
        nextDueDate: user.nextDueDate,
      }
    });

  } catch (err) {
    console.error('Update profile error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error while updating profile' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user.id;

    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed for user:', user.email);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (err) {
    console.error('Change password error:', err.message);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error while changing password' });
  }
});

// GET /api/auth/notification-preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return notification preferences (stored in user model or default)
    const notifications = user.notificationPreferences || [
      { id: 'email', title: 'Email Notifications', desc: 'Receive payment reminders via email', enabled: true },
      { id: 'push', title: 'Push Notifications', desc: 'Get notified about class schedules', enabled: true },
      { id: 'renewal', title: 'Renewal Reminders', desc: 'Remind me before membership expires', enabled: true },
      { id: 'promotional', title: 'Promotional Updates', desc: 'Receive news about special offers', enabled: false },
    ];

    res.json({ notifications });

  } catch (err) {
    console.error('Get notification preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/notification-preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.user.id;

    const { notifications } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.notificationPreferences = notifications;
    await user.save();

    res.json({
      success: true,
      message: 'Notification preferences updated',
      notifications: user.notificationPreferences
    });

  } catch (err) {
    console.error('Update notification preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
