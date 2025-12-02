const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{11}$/, 'Please provide a valid 11-digit phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  
  // Membership Details
  membershipType: {
    type: String,
    enum: ['Walk-in', 'Weekly', 'Deluxe', 'Bi-Monthly', 'Admin'],
    default: 'Deluxe',
  },
  membershipPrice: {
    type: Number,
    default: 0,
  },
  membershipDuration: {
    type: Number, // in days
    default: 30,
  },
  
  // Status & Dates
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'expired'],
    default: 'pending',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'due'],
    default: 'pending',
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  activationDate: {
    type: Date,
  },
  nextDueDate: {
    type: Date,
  },
  lastPaymentDate: {
    type: Date,
  },
  
  // Access Control
  barcode: {
    type: String,
    unique: true,
    sparse: true, // Allow null for pending users
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  
  // Tracking
  lastCheckIn: {
    type: Date,
  },
  totalVisits: {
    type: Number,
    default: 0,
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ barcode: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ paymentStatus: 1 });
UserSchema.index({ nextDueDate: 1 });

module.exports = mongoose.model('User', UserSchema);