const Student = require('../models/Student');
const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');
const Complaint = require('../models/Complaint');
const { validationResult } = require('express-validator');
const { generateWeeklyPDF } = require('../utils/pdfReport');

exports.dashboard = async (req, res) => {
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const [totalStudents, pendingStudents, pendingLeaves, equipmentIssued, fruitThisWeek, complaintCount] = await Promise.all([
    Student.countDocuments({ role: 'student', approvalStatus: { $ne: 'rejected' } }),
    Student.countDocuments({ role: 'student', isVerified: true, approvalStatus: 'pending' }),
    Leave.countDocuments({ status: 'pending' }),
    Equipment.countDocuments({ returnDate: null }),
    FruitDistribution.countDocuments({ date: { $gte: startOfWeek } }),
    Complaint.countDocuments({ status: 'open' }),
  ]);
  res.render('admin/dashboard', {
    user: req.user,
    totalStudents,
    pendingStudents,
    pendingLeaves,
    equipmentIssued,
    fruitThisWeek,
    complaintCount,
    navbar: true,
    sidebar: true,
  });
};

exports.students = async (req, res) => {
  const students = await Student.find({ role: 'student' }).select('-password -otp -qrCode').sort({ createdAt: -1 });
  res.render('admin/students', { user: req.user, students, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.approveStudent = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.redirect('/admin/students?error=Student not found');
  if (!student.isVerified) return res.redirect('/admin/students?error=Student must verify OTP before approval');

  student.approvalStatus = 'approved';
  student.approvedAt = new Date();
  student.approvedBy = req.user._id;
  await student.save();
  return res.redirect('/admin/students?success=Student approved');
};

exports.rejectStudent = async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.redirect('/admin/students?error=Student not found');

  student.approvalStatus = 'rejected';
  student.approvedAt = null;
  student.approvedBy = null;
  await student.save();
  return res.redirect('/admin/students?success=Student rejected');
};

exports.leaves = async (req, res) => {
  const leaves = await Leave.find().populate('studentId', 'name email branch year').sort({ createdAt: -1 });
  res.render('admin/leaves', { user: req.user, leaves, success: req.query.success, navbar: true, sidebar: true });
};

exports.approveLeave = async (req, res) => {
  await Leave.findByIdAndUpdate(req.params.id, { status: 'approved' });
  return res.redirect('/admin/leaves?success=Leave approved');
};

exports.rejectLeave = async (req, res) => {
  await Leave.findByIdAndUpdate(req.params.id, { status: 'rejected' });
  return res.redirect('/admin/leaves?success=Leave rejected');
};

exports.getScan = (req, res) => {
  res.render('admin/scan', { user: req.user, navbar: true, sidebar: true });
};

exports.studentByQR = async (req, res) => {
  const id = req.query.data || req.query.id;
  if (!id) return res.status(400).json({ error: 'Missing student id' });
  const student = await Student.findById(id).select('name email branch year parentName parentPhone');
  if (!student) return res.status(404).json({ error: 'Student not found' });
  return res.json(student);
};

exports.getFruit = (req, res) => {
  res.render('admin/fruit', { user: req.user, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.issueFruit = async (req, res) => {
  const studentId = req.body.studentId || req.query.studentId;
  if (!studentId) return res.redirect('/admin/fruit?error=Student required');
  const quantity = Number(req.body.quantity) || 1;
  await FruitDistribution.create({ studentId, date: new Date(), quantity });
  return res.redirect('/admin/fruit?success=Fruit issued');
};

exports.issueFruitByQR = async (req, res) => {
  const { studentId } = req.body;
  const quantity = Number(req.body.quantity) || 1;
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });
  await FruitDistribution.create({ studentId, date: new Date(), quantity });
  return res.json({ success: true });
};

exports.getEquipment = async (req, res) => {
  const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
  res.render('admin/equipment', { user: req.user, equipment, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.issueEquipment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
    return res.render('admin/equipment', { user: req.user, equipment, error: errors.array()[0].msg, navbar: true, sidebar: true });
  }
  const { studentId, equipmentName } = req.body;
  await Equipment.create({ studentId, equipmentName, issueDate: new Date() });
  return res.redirect('/admin/equipment?success=Equipment issued');
};

exports.issueEquipmentByQR = async (req, res) => {
  const { studentId, equipmentName } = req.body;
  if (!studentId || !equipmentName) return res.status(400).json({ error: 'Student ID and equipment name required' });
  await Equipment.create({ studentId, equipmentName, issueDate: new Date() });
  return res.json({ success: true });
};

exports.returnEquipment = async (req, res) => {
  await Equipment.findByIdAndUpdate(req.params.id, { returnDate: new Date() });
  return res.redirect('/admin/equipment?success=Marked returned');
};

exports.logDamage = async (req, res) => {
  const { damageStatus } = req.body;
  await Equipment.findByIdAndUpdate(req.params.id, { damageStatus: damageStatus || 'Damaged' });
  return res.redirect('/admin/equipment?success=Damage logged');
};

exports.complaints = async (req, res) => {
  const complaints = await Complaint.find().populate('studentId', 'name email').sort({ createdAt: -1 });
  res.render('admin/complaints', { user: req.user, complaints, success: req.query.success, navbar: true, sidebar: true });
};

exports.resolveComplaint = async (req, res) => {
  await Complaint.findByIdAndUpdate(req.params.id, { status: 'resolved' });
  return res.redirect('/admin/complaints?success=Complaint resolved');
};

exports.weeklyReport = async (req, res) => {
  const doc = await generateWeeklyPDF();
  const filename = `weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.end();
};
