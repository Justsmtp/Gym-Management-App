const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Membership plan durations (in days)
const membershipDurations = {
  'Walk-in': 1,
  'Weekly': 7,
  'Deluxe': 30,
  'Bi-Monthly': 90,
};

// @route   POST /api/payments/initiate
// @desc    Initiate payment (for new registration or renewal)
router.post('/initiate', async (req, res) => {
  try {
    const { userId, email, amount, membershipType, duration } = req.body;

    // Validation
    if (!userId || !email || !amount || !membershipType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate unique transaction ID and Paystack reference
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const paystackReference = `GYM-${userId}-${Date.now()}`;

    // Create payment record
    const payment = new Payment({
      user: userId,
      userEmail: email,
      userName: user.name,
      amount: amount / 100, // Convert from kobo to Naira
      currency: 'NGN',
      membershipType: membershipType,
      duration: duration || membershipDurations[membershipType] || 30,
      transactionId: transactionId,
      paystackReference: paystackReference,
      paymentMethod: 'Paystack',
      status: 'pending',
      verificationStatus: 'unverified',
      initiatedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await payment.save();

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      payment: {
        transactionId: payment.transactionId,
        paystackReference: payment.paystackReference,
        amount: amount, // in kobo for Paystack
        email: email,
      }
    });
  } catch (err) {
    console.error('Payment initiation error:', err.message);
    res.status(500).json({ message: 'Server error during payment initiation' });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Paystack payment and activate user
router.post('/verify', async (req, res) => {
  try {
    const { reference } = req.body;

    if (!reference) {
      return res.status(400).json({ message: 'Payment reference is required' });
    }

    // Find payment record
    const payment = await Payment.findOne({ paystackReference: reference });
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // Check if already verified
    if (payment.status === 'completed' && payment.verificationStatus === 'verified') {
      return res.json({
        success: true,
        message: 'Payment already verified',
        payment: payment
      });
    }

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const transactionData = paystackResponse.data.data;

    if (transactionData.status === 'success') {
      // Update payment record
      payment.status = 'completed';
      payment.verificationStatus = 'verified';
      payment.completedAt = new Date();
      payment.verifiedAt = new Date();
      payment.paystackData = transactionData;
      payment.channel = transactionData.channel;
      await payment.save();

      // Find user and activate account
      const user = await User.findById(payment.user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Generate barcode if new user
      if (!user.barcode) {
        const userCount = await User.countDocuments();
        user.barcode = `GYM-2025-${String(userCount).padStart(3, '0')}`;
      }

      // Update user to ACTIVE
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      user.activationDate = new Date();
      user.lastPaymentDate = new Date();
      user.nextDueDate = new Date(Date.now() + payment.duration * 24 * 60 * 60 * 1000);
      await user.save();

      res.json({
        success: true,
        message: 'Payment verified successfully. Account is now active!',
        payment: {
          transactionId: payment.transactionId,
          amount: payment.amount,
          status: payment.status,
          completedAt: payment.completedAt
        },
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          barcode: user.barcode,
          status: user.status,
          membershipType: user.membershipType,
          nextDueDate: user.nextDueDate
        }
      });
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.verificationStatus = 'failed';
      payment.paystackData = transactionData;
      await payment.save();

      res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        status: transactionData.status
      });
    }
  } catch (err) {
    console.error('Payment verification error:', err.message);
    
    if (err.response) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed with Paystack',
        error: err.response.data.message
      });
    }

    res.status(500).json({ message: 'Server error during payment verification' });
  }
});

// @route   POST /api/payments/cash
// @desc    Record cash payment (Admin only)
router.post('/cash', auth, async (req, res) => {
  try {
    const { userId, amount, membershipType, duration } = req.body;

    // Find user making the request (must be admin)
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || !requestingUser.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Find target user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate transaction ID
    const transactionId = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      user: userId,
      userEmail: user.email,
      userName: user.name,
      amount: amount,
      currency: 'NGN',
      membershipType: membershipType,
      duration: duration || membershipDurations[membershipType] || 30,
      transactionId: transactionId,
      paymentMethod: 'Cash',
      status: 'completed',
      verificationStatus: 'verified',
      initiatedAt: new Date(),
      completedAt: new Date(),
      verifiedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    await payment.save();

    // Generate barcode if new user
    if (!user.barcode) {
      const userCount = await User.countDocuments();
      user.barcode = `GYM-2025-${String(userCount).padStart(3, '0')}`;
    }

    // Activate user
    user.status = 'active';
    user.paymentStatus = 'active';
    user.isActive = true;
    user.activationDate = user.activationDate || new Date();
    user.lastPaymentDate = new Date();
    user.nextDueDate = new Date(Date.now() + payment.duration * 24 * 60 * 60 * 1000);
    await user.save();

    res.json({
      success: true,
      message: 'Cash payment recorded successfully',
      payment: payment,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        barcode: user.barcode,
        status: user.status,
        nextDueDate: user.nextDueDate
      }
    });
  } catch (err) {
    console.error('Cash payment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments
// @desc    Get all payments (Admin)
router.get('/', auth, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email membershipType')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/user/:userId
// @desc    Get user payment history
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/stats
// @desc    Get payment statistics (Admin)
router.get('/stats', auth, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ status: 'completed' });
    
    const revenueResult = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = revenueResult[0]?.total || 0;
    
    const paymentsByType = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$membershipType', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      { $sort: { count: -1 } }
    ]);
    
    const recentPayments = await Payment.find({ status: 'completed' })
      .populate('user', 'name email')
      .sort({ completedAt: -1 })
      .limit(10);
    
    res.json({
      totalPayments,
      totalRevenue,
      paymentsByType,
      recentPayments
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;