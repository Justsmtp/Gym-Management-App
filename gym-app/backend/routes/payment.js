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
  'walk-in': 1,
  Weekly: 7,
  weekly: 7,
  Deluxe: 30,
  deluxe: 30,
  'Bi-Monthly': 90,
  'bi-monthly': 90,
};

// Helper function to get duration
const getDuration = (membershipType, providedDuration) => {
  if (providedDuration) return parseInt(providedDuration);
  return membershipDurations[membershipType] || membershipDurations[membershipType.toLowerCase()] || 30;
};

// POST /api/payments/verify - CRITICAL FIX
router.post('/verify', auth, async (req, res) => {
  try {
    const { reference, membershipType, amount, duration, trainerAddon } = req.body;
    const userId = req.user.id;

    console.log('===========================================');
    console.log('🔍 PAYMENT VERIFICATION STARTED');
    console.log('===========================================');
    console.log('📋 Request Data:', {
      reference,
      membershipType,
      amount,
      duration,
      trainerAddon,
      userId
    });

    // Step 1: Validate input
    if (!reference) {
      console.error('❌ Missing reference');
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    if (!membershipType || !amount) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required payment information'
      });
    }

    // Step 2: Check for duplicate
    console.log('🔍 Checking for duplicate payment...');
    const existingPayment = await Payment.findOne({ paystackReference: reference });
    
    if (existingPayment && existingPayment.status === 'completed') {
      console.log('⚠️ Payment already verified:', reference);
      return res.status(400).json({
        success: false,
        message: 'Payment already verified'
      });
    }

    // Step 3: Get Paystack secret key
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!paystackSecretKey) {
      console.error('❌ PAYSTACK_SECRET_KEY not found in environment');
      return res.status(500).json({
        success: false,
        message: 'Payment system configuration error'
      });
    }

    // Step 4: Verify with Paystack
    console.log('📡 Verifying with Paystack API...');
    console.log('🔗 URL:', `https://api.paystack.co/transaction/verify/${reference}`);

    let paystackData;
    try {
      const verifyResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log('📥 Paystack response status:', verifyResponse.status);
      console.log('📥 Paystack response:', JSON.stringify(verifyResponse.data, null, 2));

      if (!verifyResponse.data || !verifyResponse.data.data) {
        console.error('❌ Invalid Paystack response structure');
        return res.status(500).json({
          success: false,
          message: 'Invalid response from payment provider'
        });
      }

      paystackData = verifyResponse.data.data;

    } catch (paystackError) {
      console.error('❌ Paystack API Error:', {
        message: paystackError.message,
        response: paystackError.response?.data,
        status: paystackError.response?.status
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to verify with payment provider: ' + paystackError.message
      });
    }

    // Step 5: Check transaction status
    console.log('🔍 Transaction status:', paystackData.status);
    
    if (paystackData.status !== 'success') {
      console.error('❌ Transaction not successful:', paystackData.status);
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${paystackData.status}`
      });
    }

    // Step 6: Verify amount
    const expectedAmount = parseInt(amount);
    const receivedAmount = parseInt(paystackData.amount);
    
    console.log('💰 Amount verification:', {
      expected: expectedAmount,
      received: receivedAmount,
      match: receivedAmount === expectedAmount
    });

    if (receivedAmount !== expectedAmount) {
      console.error('❌ Amount mismatch');
      return res.status(400).json({
        success: false,
        message: 'Payment amount verification failed'
      });
    }

    console.log('✅ Paystack verification successful');

    // Step 7: Create/Update payment record
    console.log('💾 Creating payment record...');
    
    const membershipDays = getDuration(membershipType, duration);
    console.log('📅 Membership duration:', membershipDays, 'days');

    let payment = existingPayment;

    if (!payment) {
      payment = new Payment({
        user: userId,
        amount: amount / 100, // Convert kobo to naira
        membershipType,
        paymentMethod: 'Paystack',
        duration: membershipDays,
        trainerAddon: trainerAddon || false,
        paystackReference: reference,
        transactionId: reference,
        status: 'completed',
        verificationStatus: 'verified',
        completedAt: new Date(),
        verifiedAt: new Date(),
        paystackData: paystackData,
      });
    } else {
      payment.status = 'completed';
      payment.verificationStatus = 'verified';
      payment.completedAt = new Date();
      payment.verifiedAt = new Date();
      payment.paystackData = paystackData;
    }

    try {
      await payment.save();
      console.log('✅ Payment record saved:', payment._id);
    } catch (saveError) {
      console.error('❌ Payment save error:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Failed to save payment record: ' + saveError.message
      });
    }

    // Step 8: Update user membership
    console.log('👤 Updating user membership...');
    
    let user;
    try {
      user = await User.findById(userId);
      
      if (!user) {
        console.error('❌ User not found:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('📝 Current user state:', {
        status: user.status,
        membershipType: user.membershipType,
        currentEndDate: user.membershipEndDate
      });

      // Calculate new dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + membershipDays);

      console.log('📅 New membership dates:', {
        start: startDate,
        end: endDate,
        duration: membershipDays
      });

      // Update user fields
      user.membershipType = membershipType;
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      user.activationDate = startDate;
      user.membershipStartDate = startDate;
      user.lastPaymentDate = startDate;
      user.nextDueDate = endDate;
      user.membershipEndDate = endDate;

      await user.save();
      console.log('✅ User membership updated successfully');

    } catch (userError) {
      console.error('❌ User update error:', userError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user membership: ' + userError.message
      });
    }

    // Step 9: Send success response
    const responseData = {
      success: true,
      message: 'Payment verified and membership activated',
      payment: {
        id: payment._id,
        amount: payment.amount,
        reference: payment.paystackReference,
        membershipType: payment.membershipType,
        duration: payment.duration
      },
      user: {
        membershipType: user.membershipType,
        status: user.status,
        membershipStartDate: user.membershipStartDate,
        membershipEndDate: user.membershipEndDate,
        nextDueDate: user.nextDueDate,
        isActive: user.isActive,
        paymentStatus: user.paymentStatus
      }
    };

    console.log('✅ Sending success response');
    console.log('===========================================');
    
    res.json(responseData);

  } catch (error) {
    console.error('===========================================');
    console.error('❌ VERIFICATION CRITICAL ERROR');
    console.error('===========================================');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Payment verification failed: ' + error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/payments - Record cash payment
router.post('/', auth, async (req, res) => {
  try {
    const { amount, membershipType, paymentMethod, duration, trainerAddon } = req.body;
    const userId = req.user.id;

    console.log('💵 Recording cash payment:', {
      userId,
      amount,
      membershipType,
      duration
    });

    const membershipDays = getDuration(membershipType, duration);

    const payment = new Payment({
      user: userId,
      amount,
      membershipType,
      paymentMethod: paymentMethod || 'Cash',
      duration: membershipDays,
      trainerAddon: trainerAddon || false,
      status: 'completed',
      completedAt: new Date(),
    });

    await payment.save();
    console.log('✅ Cash payment record saved');

    // Update user membership
    const user = await User.findById(userId);
    if (user) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + membershipDays);

      user.membershipType = membershipType;
      user.status = 'active';
      user.paymentStatus = 'active';
      user.isActive = true;
      user.activationDate = startDate;
      user.membershipStartDate = startDate;
      user.lastPaymentDate = startDate;
      user.nextDueDate = endDate;
      user.membershipEndDate = endDate;
      
      await user.save();
      console.log('✅ User membership updated for cash payment');
    }

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      payment,
      user: user ? {
        membershipType: user.membershipType,
        status: user.status,
        membershipEndDate: user.membershipEndDate,
        nextDueDate: user.nextDueDate
      } : null
    });

  } catch (error) {
    console.error('❌ Cash payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record payment: ' + error.message
    });
  }
});

// GET /api/payments - Get all payments (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const payments = await Payment.find()
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

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

// GET /api/payments/my-history - Get user's payment history (NEW ENDPOINT)
router.get('/my-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('📋 Fetching payment history for user:', userId);

    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('✅ Found', payments.length, 'payments');

    res.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (err) {
    console.error('❌ Payment history error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// GET /api/payments/history - Get user's payment history (LEGACY ENDPOINT - KEPT FOR COMPATIBILITY)
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (err) {
    console.error('Payment history error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

// GET /api/payments/user/:userId - Get specific user's payment history (NEW ENDPOINT)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user.id;

    console.log('📋 Fetching payments for user:', userId, 'requested by:', requestingUserId);

    // Check if user is requesting their own data or is admin
    const requestingUser = await User.findById(requestingUserId);
    if (userId !== requestingUserId && (!requestingUser || !requestingUser.isAdmin)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    const payments = await Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('✅ Found', payments.length, 'payments for user');

    res.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (err) {
    console.error('❌ User payment history error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
});

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

module.exports = router;
