const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  equipmentName: { type: String, required: true, trim: true },
  issueDate: { type: Date, required: true, default: Date.now },
  returnDate: { type: Date, default: null },
  damageStatus: { type: String, trim: true, default: '' },
}, { timestamps: true });

equipmentSchema.index({ studentId: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
