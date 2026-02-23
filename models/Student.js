const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  parentName: { type: String, trim: true, default: '' },
  parentPhone: { type: String, trim: true, default: '' },
  branch: { type: String, trim: true, default: '' },
  year: { type: String, trim: true, default: '' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  qrCode: { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model('Student', studentSchema);
