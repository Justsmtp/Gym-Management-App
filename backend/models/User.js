// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    trim: true
  },
  
  // Membership Information
  membershipType: {
    type: String,
    enum: ['Walk-in', 'Weekly', 'Deluxe', 'Bi-Monthly'],
    default: 'Walk-in'
  },
  membershipPrice: {
    type: Number,
    default: 0
  },
  membershipDuration: {
    type: Number,
    default: 1
  },
  membershipStartDate: {
    type: Date
  },
  membershipEndDate: {
    type: Date
  },
  nextDueDate: {
    type: Date
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending', 'active', 'expired', 'suspended'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'overdue'],
    default: 'pending'
  },
  
  // Identification
  barcode: {
    type: String,
    unique: true,
    required: true
  },
  
  // Account Type
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  
  // Profile Picture URL
  profilePicture: {
    type: String,
    default: null
  },
  
  // Attendance Tracking
  lastCheckIn: {
    type: Date
  },
  totalVisits: {
    type: Number,
    default: 0
  },
  
  // Health & Medical Information
  healthInfo: {
    // Medical Conditions
    hasMedicalConditions: {
      type: String,
      enum: ['Yes', 'No']
    },
    medicalConditionsDetails: {
      type: String,
      trim: true
    },
    
    // Medication
    isOnMedication: {
      type: String,
      enum: ['Yes', 'No']
    },
    medicationDetails: {
      type: String,
      trim: true
    },
    
    // Surgery/Injury
    hasSurgeryOrInjury: {
      type: String,
      enum: ['Yes', 'No']
    },
    surgeryOrInjuryDetails: {
      type: String,
      trim: true
    },
    
    // Exercise-related symptoms
    hasChestPainOrDizziness: {
      type: String,
      enum: ['Yes', 'No']
    },
    
    // Allergies
    hasAllergies: {
      type: String,
      enum: ['Yes', 'No']
    },
    allergiesDetails: {
      type: String,
      trim: true
    },
    
    // Pregnancy (for female clients)
    isPregnant: {
      type: String,
      enum: ['Yes', 'No', 'N/A']
    },
    
    // Emergency Contact
    emergencyContactName: {
      type: String,
      trim: true
    },
    emergencyContactPhone: {
      type: String,
      trim: true
    },
    
    // Lifestyle
    smokes: {
      type: String,
      enum: ['Yes', 'No']
    },
    drinksAlcohol: {
      type: String,
      enum: ['Yes', 'No']
    },
    exerciseFrequency: {
      type: String,
      enum: ['Never', 'Occasionally', 'Regularly']
    },
    fitnessGoals: {
      type: String,
      trim: true
    },
    
    // Declaration Agreement
    agreedToDeclaration: {
      type: Boolean,
      default: false
    },
    declarationDate: {
      type: Date
    }
  },
  
  // Notification Preferences
  notificationPreferences: {
    type: Array,
    default: [
      { id: 'email', title: 'Email Notifications', desc: 'Receive payment reminders via email', enabled: true },
      { id: 'push', title: 'Push Notifications', desc: 'Get notified about class schedules', enabled: true },
      { id: 'renewal', title: 'Renewal Reminders', desc: 'Remind me before membership expires', enabled: true },
      { id: 'promotional', title: 'Promotional Updates', desc: 'Receive news about special offers', enabled: false }
    ]
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set declaration date if agreed
  if (this.healthInfo && this.healthInfo.agreedToDeclaration && !this.healthInfo.declarationDate) {
    this.healthInfo.declarationDate = Date.now();
  }
  
  next();
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ barcode: 1 });
userSchema.index({ status: 1 });
userSchema.index({ membershipEndDate: 1 });

module.exports = mongoose.model('User', userSchema);