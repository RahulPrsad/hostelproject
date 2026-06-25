const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  earlyReturnAt: { type: Date, default: null },
}, { timestamps: true });

leaveSchema.index({ studentId: 1, createdAt: -1 });
leaveSchema.index({ status: 1, earlyReturnAt: 1, fromDate: 1, toDate: 1, studentId: 1 });
leaveSchema.index({ studentId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
