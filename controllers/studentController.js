const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');
const Complaint = require('../models/Complaint');
const { validationResult } = require('express-validator');
const { cleanupExpiredEquipmentPhotos, getPhotoExpiryDate } = require('../utils/equipmentPhotoRetention');
const { generateQRDataURL, generateQRBuffer } = require('../utils/qrGenerator');

exports.dashboard = async (req, res) => {
  await cleanupExpiredEquipmentPhotos();
  const studentId = req.user._id;
  const [leaves, equipment, fruitCount, complaints] = await Promise.all([
    Leave.find({ studentId }).sort({ createdAt: -1 }).limit(5),
    Equipment.find({ studentId }).sort({ issueDate: -1 }),
    FruitDistribution.countDocuments({ studentId }),
    Complaint.find({ studentId }).sort({ createdAt: -1 }).limit(5),
  ]);
  res.render('student/dashboard', {
    user: req.user,
    leaves,
    equipment,
    fruitCount,
    complaints,
    navbar: true,
    sidebar: true,
  });
};

exports.getLeave = async (req, res) => {
  const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  res.render('student/leave', { user: req.user, leaves, success: req.query.success, navbar: true, sidebar: true });
};

exports.postLeave = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.render('student/leave', { user: req.user, leaves, error: errors.array()[0].msg, navbar: true, sidebar: true });
  }
  const { fromDate, toDate, reason } = req.body;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.render('student/leave', { user: req.user, leaves, error: 'Invalid leave dates', navbar: true, sidebar: true });
  }
  if (start < today) {
    const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.render('student/leave', { user: req.user, leaves, error: 'From date must be today or later', navbar: true, sidebar: true });
  }
  if (end <= start) {
    const leaves = await Leave.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.render('student/leave', { user: req.user, leaves, error: 'To date must be after from date', navbar: true, sidebar: true });
  }
  await Leave.create({ studentId: req.user._id, fromDate, toDate, reason });
  return res.redirect('/student/leave?success=Leave applied');
};

exports.getComplaint = async (req, res) => {
  const complaints = await Complaint.find({ studentId: req.user._id }).sort({ createdAt: -1 });
  res.render('student/complaint', { user: req.user, complaints, success: req.query.success, navbar: true, sidebar: true });
};

exports.postComplaint = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const complaints = await Complaint.find({ studentId: req.user._id }).sort({ createdAt: -1 });
    return res.render('student/complaint', { user: req.user, complaints, error: errors.array()[0].msg, navbar: true, sidebar: true });
  }
  await Complaint.create({ studentId: req.user._id, message: req.body.message });
  return res.redirect('/student/complaint?success=Complaint submitted');
};

exports.fruitHistory = async (req, res) => {
  const history = await FruitDistribution.find({ studentId: req.user._id }).sort({ date: -1 });
  res.render('student/fruitHistory', { user: req.user, history, navbar: true, sidebar: true });
};

exports.equipment = async (req, res) => {
  await cleanupExpiredEquipmentPhotos();
  const equipment = await Equipment.find({ studentId: req.user._id }).sort({ issueDate: -1 });
  res.render('student/equipment', { user: req.user, equipment, success: req.query.success, error: req.query.error, navbar: true, sidebar: true });
};

exports.returnEquipment = async (req, res) => {
  const equipment = await Equipment.findOne({ _id: req.params.id, studentId: req.user._id, returnDate: null });
  if (!equipment) return res.redirect('/student/equipment?error=Active equipment record not found');

  const returnedAt = new Date();
  equipment.returnDate = returnedAt;
  equipment.returnPhoto = req.body.returnPhoto || '';
  equipment.photosExpireAt = getPhotoExpiryDate(returnedAt);
  equipment.damageStatus = 'Returned';
  await equipment.save();

  return res.redirect('/student/equipment?success=Equipment submitted');
};

exports.myQR = async (req, res) => {
  let user = req.user;
  if (!user.qrCode) {
    user.qrCode = await generateQRDataURL(user._id.toString());
    await require('../models/Student').findByIdAndUpdate(user._id, { qrCode: user.qrCode });
  }
  res.render('student/myQR', { user, navbar: true, sidebar: true });
};

exports.downloadQR = async (req, res) => {
  const StudentModel = require('../models/Student');
  const student = await StudentModel.findById(req.user._id).select('qrCode');
  if (!student) return res.status(404).send('Student not found');

  let qrBuffer;
  if (student.qrCode) {
    const base64 = student.qrCode.split(',')[1];
    qrBuffer = Buffer.from(base64, 'base64');
  } else {
    qrBuffer = await generateQRBuffer(req.user._id.toString());
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', 'attachment; filename="my-qr.png"');
  return res.send(qrBuffer);
};
