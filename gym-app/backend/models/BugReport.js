// backend/models/BugReport.js
const mongoose = require('mongoose');

const bugReportSchema = new mongoose.Schema({
  // Reporter Information
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  
  // Report Details
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['bug', 'feature_request', 'feedback', 'other'],
    default: 'bug'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  
  // Admin Response
  adminNotes: {
    type: String,
    trim: true,
    default: ''
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  
  // User Agent Info
  userAgent: {
    type: String,
    default: ''
  },
  browserInfo: {
    type: String,
    default: ''
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
bugReportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for faster queries
bugReportSchema.index({ status: 1 });
bugReportSchema.index({ createdAt: -1 });
bugReportSchema.index({ email: 1 });

module.exports = mongoose.model('BugReport', bugReportSchema);
