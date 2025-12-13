// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/mailer');

const membershipDetails = {
  'Walk-in': { price: 5000, duration: 1 },
  Weekly: { price: 6500, duration: 7 },
  Deluxe: { price: 15500, duration: 30 },
  'Bi-Monthly': { price: 40000, duration: 90 },
};

// ============================================
// REGISTRATION & VERIFICATION
// ============================================

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, membershipType, isAdmin } = req.body;
    
    console.log('\n🔍 REGISTRATION:', email);
    
    if (!name || !email || !phone || !password || !membershipType) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const membership = membershipDetails[membershipType] || membershipDetails.Deluxe;
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
    console.log('✅ User saved');

    let emailSent = false;
    let emailError = null;
    let emailId = null;

    try {
      console.log('📧 Sending email to:', user.email);
      const result = await sendVerificationEmail({ 
        to: user.email, 
        token: verificationToken, 
        name: user.name 
      });
      emailSent = true;
      emailId = result?.id;
      console.log('✅ Email sent, ID:', emailId);
    } catch (mailErr) {
      emailError = mailErr.message;
      console.error('❌ Email failed:', mailErr.message);
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Registration successful! Check your email (and spam folder).' 
        : 'Registration successful, but email failed. Use resend option.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        membershipType: user.membershipType,
      },
      emailSent,
      emailError,
      emailId
    });
    
  } catch (err) {
    console.error('❌ Registration error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    console.log('✅ User verified:', user.email);
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('❌ Verification error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/resend
router.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Resend request for:', email);
    
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });

    user.verificationToken = crypto.randomBytes(24).toString('hex');
    await user.save();

    let emailSent = false;
    let emailError = null;
    let emailId = null;

    try {
      const result = await sendVerificationEmail({ 
        to: user.email, 
        token: user.verificationToken, 
        name: user.name 
      });
      emailSent = true;
      emailId = result?.id;
      console.log('✅ Email resent');
    } catch (mailErr) {
      emailError = mailErr.message;
      console.error('❌ Resend failed:', mailErr.message);
    }

    res.json({ 
      success: emailSent, 
      message: emailSent ? 'Email sent' : 'Failed to send',
      emailSent,
      emailError,
      emailId
    });
  } catch (err) {
    console.error('❌ Resend error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// PASSWORD RESET
// ============================================

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('🔑 Password reset request for:', email);
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Security: Don't reveal if user exists or not
    if (!user) {
      // Still return success to prevent email enumeration
      console.log('⚠️ User not found, but returning success for security');
      return res.json({ 
        success: true, 
        message: 'If an account exists with this email, you will receive a reset code.' 
      });
    }

    // Generate 6-digit reset code
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    console.log('✅ Reset token generated:', resetToken);

    let emailSent = false;
    let emailError = null;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        token: resetToken,
        name: user.name
      });
      emailSent = true;
      console.log('✅ Reset email sent');
    } catch (mailErr) {
      emailError = mailErr.message;
      console.error('❌ Reset email failed:', mailErr.message);
    }

    res.json({ 
      success: emailSent, 
      message: emailSent 
        ? 'Reset code sent to your email' 
        : 'Failed to send reset code. Please try again.',
      emailError: emailError
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    console.log('🔐 Password reset attempt for:', email);
    
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase(),
      resetPasswordToken: resetToken
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    // Check if token is expired
    if (new Date() > user.resetPasswordExpiry) {
      return res.status(400).json({ message: 'Reset code has expired. Please request a new one.' });
    }

    // Update password
    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    console.log('✅ Password reset successful for:', user.email);

    res.json({ 
      success: true, 
      message: 'Password reset successful! You can now login with your new password.' 
    });
  } catch (err) {
    console.error('❌ Reset password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// LOGIN
// ============================================

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, isAdmin } = req.body;
    console.log('🔐 Login attempt:', email);
    
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    if (isAdmin && !user.isAdmin) {
      return res.status(403).json({ message: 'Not an admin account' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const match = await user.comparePassword(password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { user: { id: user._id, isAdmin: user.isAdmin } }, 
      process.env.JWT_SECRET || 'secret', 
      { expiresIn: '30d' }
    );

    console.log('✅ Login successful:', email);

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
    console.error('❌ Login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============================================
// USER MANAGEMENT
// ============================================

// Test verification email (for debugging)
router.post('/test-verification-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    console.log('🧪 Testing verification email to:', email);
    
    const result = await sendVerificationEmail({
      to: email,
      token: 'test-token-' + crypto.randomBytes(12).toString('hex'),
      name: 'Test User'
    });
    
    console.log('✅ Test email sent, ID:', result.id);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      emailId: result.id,
      checkUrl: `https://resend.com/emails/${result.id}`
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to send test email',
      error: error.message 
    });
  }
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.user.id).select('-password -verificationToken -resetPasswordToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// PUT /api/auth/update-profile
router.put('/update-profile', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'All fields required' });
    }

    if (!/^[0-9]{11}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone must be 11 digits' });
    }

    const existingUser = await User.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: decoded.user.id } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.findById(decoded.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.name = name;
    user.email = email.toLowerCase();
    user.phone = phone;
    await user.save();

    console.log('✅ Profile updated:', user.email);

    res.json({
      success: true,
      message: 'Profile updated',
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
    console.error('❌ Update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be 6+ characters' });
    }

    const user = await User.findById(decoded.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();

    console.log('✅ Password changed:', user.email);
    res.json({ success: true, message: 'Password changed' });
  } catch (err) {
    console.error('❌ Change password error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/notification-preferences
router.get('/notification-preferences', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const notifications = user.notificationPreferences || [
      { id: 'email', title: 'Email Notifications', desc: 'Payment reminders', enabled: true },
      { id: 'push', title: 'Push Notifications', desc: 'Class schedules', enabled: true },
      { id: 'renewal', title: 'Renewal Reminders', desc: 'Before expiry', enabled: true },
      { id: 'promotional', title: 'Promotional Updates', desc: 'Special offers', enabled: false },
    ];

    res.json({ notifications });
  } catch (err) {
    console.error('❌ Get preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/notification-preferences
router.put('/notification-preferences', async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { notifications } = req.body;

    const user = await User.findById(decoded.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.notificationPreferences = notifications;
    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      notifications: user.notificationPreferences
    });
  } catch (err) {
    console.error('❌ Update preferences error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
