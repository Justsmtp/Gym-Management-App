// backend/models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  membershipType: {
    type: String,
    enum: ['Walk-in', 'Weekly', 'Deluxe', 'Bi-Monthly'],
    required: true,
  },
  duration: {
    type: Number, // in days
    required: true,
  },
  trainerAddon: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Paystack', 'Bank Transfer'],
    default: 'Cash',
  },
  transactionId: {
    type: String,
    sparse: true,
    index: true,
  },
  paystackReference: {
    type: String,
    sparse: true,
    index: true,
  },
  paystackData: {
    type: mongoose.Schema.Types.Mixed,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  completedAt: Date,
  verifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

PaymentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paystackReference: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);