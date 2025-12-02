const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  checkInTime: {
    type: Date,
    default: Date.now,
  },
  checkOutTime: {
    type: Date,
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
});

module.exports = mongoose.model('Attendance', AttendanceSchema);