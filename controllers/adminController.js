const Student = require('../models/Student');
const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');
const Complaint = require('../models/Complaint');
const { validationResult } = require('express-validator');
const { generateReportPDF, generateWeeklyPDF } = require('../utils/pdfReport');
const { cleanupExpiredEquipmentPhotos, getPhotoExpiryDate } = require('../utils/equipmentPhotoRetention');

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getActiveLeaveQuery(studentId) {
  const { start, end } = getTodayRange();
  const query = {
    status: 'approved',
    earlyReturnAt: null,
    fromDate: { $lte: end },
    toDate: { $gte: start },
  };
  if (studentId) query.studentId = studentId;
  return query;
}

async function getActiveLeave(studentId) {
  return Leave.findOne(getActiveLeaveQuery(studentId)).sort({ fromDate: -1 });
}

async function ensureStudentPresent(studentId) {
  const activeLeave = await getActiveLeave(studentId);
  if (activeLeave) {
    const error = new Error('Student is currently on leave');
    error.statusCode = 409;
    throw error;
  }
}

async function hasFruitToday(studentId) {
  const { start, end } = getTodayRange();
  return Boolean(await FruitDistribution.exists({
    studentId,
    date: { $gte: start, $lte: end },
  }));
}

async function ensureFruitNotIssuedToday(studentId) {
  if (await hasFruitToday(studentId)) {
    const error = new Error('Done for today');
    error.statusCode = 409;
    throw error;
  }
}

exports.dashboard = async (req, res) => {
  await cleanupExpiredEquipmentPhotos();
  const activeLeaveStudentIds = await Leave.distinct('studentId', getActiveLeaveQuery());
  const startOfWeek = new Date();
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const [totalStudents, equipmentIssued, fruitThisWeek, complaintCount] = await Promise.all([
    Student.countDocuments({ role: 'student', approvalStatus: { $ne: 'rejected' } }),
    Equipment.countDocuments({ returnDate: null }),
    FruitDistribution.countDocuments({ date: { $gte: startOfWeek } }),
    Complaint.countDocuments({ status: 'open' }),
  ]);
  const onLeaveStudents = activeLeaveStudentIds.length;
  const presentStudents = Math.max(totalStudents - onLeaveStudents, 0);
  res.render('admin/dashboard', {
    user: req.user,
    totalStudents,
    presentStudents,
    onLeaveStudents,
    equipmentIssued,
    fruitThisWeek,
    complaintCount,
    navbar: true,
    sidebar: true,
  });
};

exports.students = async (req, res) => {
  const view = (req.query.status || 'all').toLowerCase();
  const activeLeaveStudentIds = await Leave.distinct('studentId', getActiveLeaveQuery());
  let query = { role: 'student' };
  let pageTitle = 'All Students';

  if (view === 'present') {
    query = {
      role: 'student',
      approvalStatus: 'approved',
      isVerified: true,
      _id: { $nin: activeLeaveStudentIds },
    };
    pageTitle = 'Present Students';
  } else if (view === 'on-leave') {
    query = {
      role: 'student',
      approvalStatus: 'approved',
      isVerified: true,
      _id: { $in: activeLeaveStudentIds },
    };
    pageTitle = 'On Leave Students';
  }

  const students = await Student.find(query).select('-password -otp -qrCode').sort({ createdAt: -1 });
  res.render('admin/students', {
    user: req.user,
    students,
    pageTitle,
    activeView: view,
    success: req.query.success,
    error: req.query.error,
    navbar: true,
    sidebar: true,
  });
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
  const leaves = await Leave.find().populate('studentId', 'name email branch year parentName parentPhone').sort({ createdAt: -1 });
  res.render('admin/leaves', { user: req.user, leaves, success: req.query.success, focusStudentId: req.query.studentId || '', navbar: true, sidebar: true });
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
  const [activeLeave, pendingLeave, fruitIssuedToday] = await Promise.all([
    getActiveLeave(student._id),
    Leave.findOne({ studentId: student._id, status: 'pending' }).sort({ createdAt: -1 }),
    hasFruitToday(student._id),
  ]);
  return res.json({
    ...student.toObject(),
    activeLeave: activeLeave ? {
      _id: activeLeave._id,
      fromDate: activeLeave.fromDate,
      toDate: activeLeave.toDate,
      reason: activeLeave.reason,
    } : null,
    pendingLeave: pendingLeave ? {
      _id: pendingLeave._id,
      fromDate: pendingLeave.fromDate,
      toDate: pendingLeave.toDate,
      reason: pendingLeave.reason,
    } : null,
    fruitIssuedToday,
  });
};

exports.markStudentPresent = async (req, res) => {
  const activeLeave = await getActiveLeave(req.params.id);
  if (!activeLeave) return res.status(404).json({ error: 'No active leave found for this student' });
  activeLeave.earlyReturnAt = new Date();
  await activeLeave.save();
  return res.json({ success: true });
};

exports.activeEquipmentByStudent = async (req, res) => {
  await cleanupExpiredEquipmentPhotos();
  const studentId = req.query.studentId;
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });

  const equipment = await Equipment.find({ studentId, returnDate: null })
    .select('equipmentName issueDate issuePhoto')
    .sort({ issueDate: -1 });

  return res.json({ equipment });
};

exports.getFruit = (req, res) => {
  res.render('admin/fruit', { user: req.user, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.issueFruit = async (req, res) => {
  const studentId = req.body.studentId || req.query.studentId;
  if (!studentId) return res.redirect('/admin/fruit?error=Student required');
  try {
    await ensureStudentPresent(studentId);
    await ensureFruitNotIssuedToday(studentId);
  } catch (error) {
    return res.redirect(`/admin/fruit?error=${encodeURIComponent(error.message)}`);
  }
  const quantity = Number(req.body.quantity) || 1;
  await FruitDistribution.create({ studentId, date: new Date(), quantity });
  return res.redirect('/admin/fruit/thank-you');
};

exports.issueFruitByQR = async (req, res) => {
  const { studentId } = req.body;
  const quantity = Number(req.body.quantity) || 1;
  if (!studentId) return res.status(400).json({ error: 'Student ID required' });
  try {
    await ensureStudentPresent(studentId);
    await ensureFruitNotIssuedToday(studentId);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
  await FruitDistribution.create({ studentId, date: new Date(), quantity });
  return res.json({ success: true, redirectUrl: '/admin/fruit/thank-you' });
};

exports.fruitThankYou = (req, res) => {
  res.render('admin/fruitThankYou', { user: req.user, navbar: true, sidebar: true });
};

exports.getEquipment = async (req, res) => {
  await cleanupExpiredEquipmentPhotos();
  const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
  res.render('admin/equipment', { user: req.user, equipment, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.issueEquipment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
    return res.render('admin/equipment', { user: req.user, equipment, error: errors.array()[0].msg, navbar: true, sidebar: true });
  }
  const { studentId, equipmentName, issuePhoto } = req.body;
  try {
    await ensureStudentPresent(studentId);
  } catch (error) {
    const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
    return res.render('admin/equipment', { user: req.user, equipment, error: 'Student is currently on leave', navbar: true, sidebar: true });
  }
  if (!issuePhoto) {
    const equipment = await Equipment.find().populate('studentId', 'name email').sort({ issueDate: -1 });
    return res.render('admin/equipment', { user: req.user, equipment, error: 'Issue photo required', navbar: true, sidebar: true });
  }
  await Equipment.create({ studentId, equipmentName, issuePhoto, issueDate: new Date() });
  return res.redirect('/admin/equipment?success=Equipment issued');
};

exports.issueEquipmentByQR = async (req, res) => {
  const { studentId, equipmentName, issuePhoto } = req.body;
  if (!studentId || !equipmentName) return res.status(400).json({ error: 'Student ID and equipment name required' });
  try {
    await ensureStudentPresent(studentId);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message });
  }
  if (!issuePhoto) return res.status(400).json({ error: 'Issue photo required' });
  await Equipment.create({ studentId, equipmentName, issuePhoto, issueDate: new Date() });
  return res.json({ success: true });
};

exports.returnEquipment = async (req, res) => {
  const returnedAt = new Date();
  await Equipment.findByIdAndUpdate(req.params.id, {
    returnDate: returnedAt,
    returnPhoto: req.body.returnPhoto || '',
    photosExpireAt: getPhotoExpiryDate(returnedAt),
    damageStatus: 'Returned',
  });
  return res.redirect('/admin/equipment?success=Marked returned');
};

exports.returnEquipmentByQR = async (req, res) => {
  const equipment = await Equipment.findOne({ _id: req.params.id, returnDate: null });
  if (!equipment) return res.status(404).json({ error: 'Active equipment record not found' });

  const returnedAt = new Date();
  equipment.returnDate = returnedAt;
  equipment.returnPhoto = req.body.returnPhoto || '';
  equipment.photosExpireAt = getPhotoExpiryDate(returnedAt);
  equipment.damageStatus = 'Returned';
  await equipment.save();

  return res.json({
    success: true,
    equipmentName: equipment.equipmentName,
  });
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

function parseReportDate(value, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

exports.reportPage = (req, res) => {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  res.render('admin/report', {
    user: req.user,
    defaultFrom: weekAgo.toISOString().slice(0, 10),
    defaultTo: today.toISOString().slice(0, 10),
    navbar: true,
    sidebar: true,
  });
};

exports.generateReport = async (req, res) => {
  const start = parseReportDate(req.query.from);
  const end = parseReportDate(req.query.to, true);
  if (!start || !end || start > end) {
    return res.status(400).send('Invalid report date range');
  }

  const doc = await generateReportPDF({ start, end });
  const filename = `hostel-report-${req.query.from}-to-${req.query.to}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  doc.pipe(res);
  doc.end();
};

exports.weeklyReport = async (req, res) => {
  const doc = await generateWeeklyPDF();
  const filename = `weekly-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  doc.end();
};
