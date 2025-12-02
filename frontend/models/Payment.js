const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  membershipType: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Paystack', 'Flutterwave', 'Cash'],
    default: 'Cash',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  transactionId: {
    type: String,
  },
  duration: {
    type: Number, // in days
    default: 30,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  verifiedAt: {
    type: Date,
  },
  paystackReference: {
    type: String,
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);