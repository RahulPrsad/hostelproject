const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require('../models/Student');
const { sendOTP } = require('../utils/email');
const { generateQRDataURL } = require('../utils/qrGenerator');
const { validationResult } = require('express-validator');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

exports.getLogin = (req, res) => {
  if (req.cookies?.token) {
    try {
      const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
      const role = decoded.role || 'student';
      return res.redirect(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    } catch (e) {}
  }
  res.render('auth/login', { error: req.query.error || null, success: req.query.success || null });
};

exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { error: errors.array()[0].msg, success: null });
  }
  const { email, password } = req.body;
  const user = await Student.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.render('auth/login', { error: 'Invalid email or password', success: null });
  }
  if (!user.isVerified) {
    return res.render('auth/login', { error: 'Please verify your email with OTP first', success: null });
  }
  if (user.role === 'student') {
    const approvalStatus = user.approvalStatus || 'approved';
    if (approvalStatus === 'pending') {
      return res.render('auth/login', { error: 'Your registration is verified and waiting for admin approval', success: null });
    }
    if (approvalStatus === 'rejected') {
      return res.render('auth/login', { error: 'Your registration was rejected. Please contact the hostel admin.', success: null });
    }
  }
  const token = generateToken(user._id, user.role);
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { error: null });
};

exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { error: errors.array()[0].msg });
  }
  const { name, email, password, parentName, parentPhone, branch, year } = req.body;
  const existing = await Student.findOne({ email });
  if (existing) {
    if (existing.role === 'student' && !existing.isVerified) {
      return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
    }
    if (existing.role === 'student' && existing.approvalStatus === 'pending') {
      return res.render('auth/register', { error: 'Your registration is already waiting for admin approval' });
    }
    return res.render('auth/register', { error: 'Email already registered' });
  }
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await Student.create({
    name,
    email,
    password,
    parentName: parentName || '',
    parentPhone: parentPhone || '',
    branch: branch || '',
    year: year || '',
    role: 'student',
    approvalStatus: 'pending',
    isVerified: false,
    otp,
    otpExpires,
  });
  try {
    await sendOTP(email, otp);
  } catch (err) {
    console.error('Send OTP error:', err.message || err);
    console.log('\n--- OTP (use this if email is not configured) ---');
    console.log(`Email: ${email}  =>  OTP: ${otp}`);
    console.log('----------------------------------------\n');
    return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}&noEmail=1`);
  }
  return res.redirect(`/verify-otp?email=${encodeURIComponent(email)}`);
};

exports.getVerifyOTP = (req, res) => {
  const email = req.query.email || '';
  const noEmail = req.query.noEmail === '1';
  res.render('auth/verifyOTP', { email, error: null, noEmail });
};

exports.getThankYou = (req, res) => {
  res.render('auth/thankYou', {
    email: req.query.email || '',
    name: req.query.name || '',
  });
};

exports.postVerifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  const user = await Student.findOne({ email });
  if (!user) {
    return res.render('auth/verifyOTP', { email: email || '', error: 'Invalid email' });
  }
  if (user.otp !== otp) {
    return res.render('auth/verifyOTP', { email: email || '', error: 'Invalid OTP' });
  }
  if (new Date() > user.otpExpires) {
    return res.render('auth/verifyOTP', { email: email || '', error: 'OTP expired' });
  }
  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  const qrDataURL = await generateQRDataURL(user._id.toString());
  user.qrCode = qrDataURL;
  if (!user.approvalStatus) {
    user.approvalStatus = 'pending';
  }
  await user.save();
  return res.render('auth/thankYou', {
    email,
    name: user.name,
  });
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
};
