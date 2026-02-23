const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
}, { timestamps: true });

complaintSchema.index({ studentId: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
