// backend/routes/payments.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Membership durations mapping (days)
const membershipDurations = {
  'Walk-in': 1,
  Weekly: 7,
  Deluxe: 30,
  'Bi-Monthly': 90,
};

// NEW: GET /api/payments - Get all payments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    console.log('📊 Fetching all payments for admin...');

    const payments = await Payment.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    console.log(`✅ Found ${payments.length} payments`);

    res.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (err) {
    console.error('Payments fetch error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
});

// POST /api/payments - Record cash payment
router.post('/', auth, async (req, res) => {
  try {
    const { amount, membershipType, paymentMethod, duration, trainerAddon } = req.body;
    const userId = req.user.id;

    const payment = new Payment({
      user: userId,
      amount,
      membershipType,
      paymentMethod: paymentMethod || 'Cash',
      duration: duration || membershipDurations[membershipType] || 30,
      trainerAddon: trainerAddon || false,
      status: 'completed',
      completedAt: new Date(),
    });

    await payment.save();

    // Activate user membership
    const user = await User.findById(userId);
    if (user) {
      const membershipDays = payment.duration;
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      user.activationDate = new Date();
      user.lastPaymentDate = new Date();
      user.nextDueDate = new Date(Date.now() + membershipDays * 24 * 60 * 60 * 1000);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
    });
  } catch (err) {
    console.error('Cash payment error:', err.message);
    res.status(500).json({ message: 'Failed to record payment' });
  }
});

// POST /api/payments/initiate - Initialize Paystack payment
router.post('/initiate', auth, async (req, res) => {
  try {
    const { amount, membershipType, duration, trainerAddon } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create payment reference
    const reference = `GYM-${userId}-${Date.now()}`;

    // Save pending payment
    const payment = new Payment({
      user: userId,
      amount: amount / 100, // convert kobo to naira
      membershipType,
      paymentMethod: 'Paystack',
      duration: duration || membershipDurations[membershipType] || 30,
      trainerAddon: trainerAddon || false,
      paystackReference: reference,
      status: 'pending',
    });

    await payment.save();

    // Initialize Paystack transaction
    const paystackResponse = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: user.email,
        amount, // in kobo
        reference,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback`,
        metadata: {
          user_id: userId.toString(),
          membership_type: membershipType,
          duration,
          trainer_addon: trainerAddon,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      success: true,
      authorization_url: paystackResponse.data.data.authorization_url,
      access_code: paystackResponse.data.data.access_code,
      reference,
    });
  } catch (err) {
    console.error('Paystack initialization error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to initialize payment' });
  }
});

// POST /api/payments/verify - Verify Paystack payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { reference, membershipType, amount, duration, trainerAddon } = req.body;

    if (!reference) return res.status(400).json({ message: 'Reference required' });

    // Verify with Paystack
    const verifyResponse = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const txData = verifyResponse.data.data;

    if (txData.status !== 'success') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Find or create payment record
    let payment = await Payment.findOne({ paystackReference: reference });

    if (!payment) {
      payment = new Payment({
        user: req.user.id,
        amount: amount / 100,
        membershipType,
        paymentMethod: 'Paystack',
        duration: duration || membershipDurations[membershipType] || 30,
        trainerAddon: trainerAddon || false,
        paystackReference: reference,
        transactionId: reference,
        status: 'completed',
        verificationStatus: 'verified',
        completedAt: new Date(),
        verifiedAt: new Date(),
        paystackData: txData,
      });
    } else {
      payment.status = 'completed';
      payment.verificationStatus = 'verified';
      payment.completedAt = new Date();
      payment.verifiedAt = new Date();
      payment.paystackData = txData;
    }

    await payment.save();

    // Activate user membership
    const user = await User.findById(req.user.id);
    if (user) {
      const membershipDays = payment.duration;
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      user.activationDate = new Date();
      user.lastPaymentDate = new Date();
      user.nextDueDate = new Date(Date.now() + membershipDays * 24 * 60 * 60 * 1000);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });
  } catch (err) {
    console.error('Payment verification error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// POST /api/payments/webhook - Paystack webhook handler
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
      const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.body).digest('hex');

      if (hash !== req.headers['x-paystack-signature']) {
        console.warn('Invalid Paystack signature');
        return res.status(401).send('Invalid signature');
      }

      const event = JSON.parse(req.body);

      // Handle charge.success event
      if (event.event === 'charge.success') {
        const tx = event.data;
        const reference = tx.reference;
        const metadata = tx.metadata || {};

        // Find payment record
        let payment = await Payment.findOne({ paystackReference: reference });
        let user = null;

        if (payment) {
          user = await User.findById(payment.user);
        } else if (metadata.user_id) {
          user = await User.findById(metadata.user_id);
          // Create payment record if it doesn't exist
          if (user) {
            payment = new Payment({
              user: user._id,
              amount: tx.amount / 100,
              membershipType: metadata.membership_type || user.membershipType,
              paymentMethod: 'Paystack',
              duration: metadata.duration || membershipDurations[user.membershipType] || 30,
              trainerAddon: metadata.trainer_addon || false,
              transactionId: reference,
              paystackReference: reference,
              status: 'completed',
              verificationStatus: 'verified',
              completedAt: new Date(),
              verifiedAt: new Date(),
              paystackData: tx,
            });
            await payment.save();
          }
        }

        // Update user if found
        if (user && payment) {
          const membershipDays = payment.duration;
          user.status = 'active';
          user.paymentStatus = 'active';
          user.isActive = true;
          user.activationDate = new Date();
          user.lastPaymentDate = new Date();
          user.nextDueDate = new Date(Date.now() + membershipDays * 24 * 60 * 60 * 1000);
          await user.save();
        } else {
          console.warn('Webhook: User not found for transaction', reference);
        }
      }

      res.sendStatus(200);
    } catch (err) {
      console.error('Webhook handling error:', err.message);
      res.status(500).send('Webhook error');
    }
  }
);

// GET /api/payments/stats - Get payment statistics (admin only)
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const paymentsByMethod = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, total: { $sum: '$amount' } } },
    ]);

    const trainerAddons = await Payment.countDocuments({ trainerAddon: true, status: 'completed' });

    res.json({
      success: true,
      totalRevenue: totalRevenue[0]?.total || 0,
      paymentsByMethod,
      trainerAddons,
    });
  } catch (err) {
    console.error('Payment stats error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payment statistics' });
  }
});

// GET /api/payments/history - Get user's payment history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📊 Fetching payment history for user:', userId);

    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${payments.length} payments`);

    res.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (err) {
    console.error('Payment history error:', err.message);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
});

module.exports = router;