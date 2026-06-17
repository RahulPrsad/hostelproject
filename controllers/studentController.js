const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');
const Complaint = require('../models/Complaint');
const { validationResult } = require('express-validator');

exports.dashboard = async (req, res) => {
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
  const equipment = await Equipment.find({ studentId: req.user._id }).sort({ issueDate: -1 });
  res.render('student/equipment', { user: req.user, equipment, navbar: true, sidebar: true });
};

exports.myQR = (req, res) => {
  res.render('student/myQR', { user: req.user, navbar: true, sidebar: true });
};
