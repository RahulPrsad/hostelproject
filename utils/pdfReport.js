const PDFDocument = require('pdfkit');
const path = require('path');
const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');

const LOGO_PATH = path.join(__dirname, '..', 'public', 'images', 'ramdeobaba-university-logo.png');

const getWeekRange = () => {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const generateReportPDF = async ({ start, end } = {}) => {
  const doc = new PDFDocument({ margin: 50 });
  const range = start && end ? { start, end } : getWeekRange();

  function addBranding() {
    const centerX = doc.page.width / 2;
    doc.save();
    doc.opacity(0.08);
    doc.image(LOGO_PATH, centerX - 170, 190, { width: 340 });
    doc.restore();

    doc.image(LOGO_PATH, 50, 38, { width: 54 });
    doc.fontSize(10).fillColor('#0f172a').text('Ramdeobaba University', 112, 45);
    doc.fontSize(8).fillColor('#475569').text('Hostel Management Report', 112, 60);
    doc.moveTo(50, 100).lineTo(doc.page.width - 50, 100).strokeColor('#cbd5e1').stroke();
    doc.fillColor('#0f172a');
  }

  doc.on('pageAdded', addBranding);
  addBranding();
  doc.y = 120;

  doc.fontSize(20).text('Hostel Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).text(`Period: ${range.start.toLocaleDateString()} to ${range.end.toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  const fruitRecords = await FruitDistribution.find({ date: { $gte: range.start, $lte: range.end } }).populate('studentId', 'name');
  doc.fontSize(14).text('Fruit Distribution Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Total distributions: ${fruitRecords.length}`);
  if (fruitRecords.length > 0) {
    fruitRecords.forEach((r, i) => {
      doc.text(`${i + 1}. ${r.studentId?.name || 'N/A'} - ${r.date.toLocaleDateString()} - Qty: ${r.quantity}`);
    });
  }
  doc.moveDown(2);

  const equipmentRecords = await Equipment.find({
    $or: [
      { issueDate: { $gte: range.start, $lte: range.end } },
      { returnDate: { $gte: range.start, $lte: range.end } },
    ],
  }).populate('studentId', 'name');
  doc.fontSize(14).text('Equipment Usage', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Records in period: ${equipmentRecords.length}`);
  equipmentRecords.forEach((r, i) => {
    doc.text(`${i + 1}. ${r.equipmentName} - ${r.studentId?.name || 'N/A'} - Issued: ${r.issueDate.toLocaleDateString()}${r.returnDate ? ` - Returned: ${r.returnDate.toLocaleDateString()}` : ' - Not returned'}`);
  });
  doc.moveDown(2);

  const leaves = await Leave.find({
    createdAt: { $gte: range.start, $lte: range.end },
    status: { $in: ['approved', 'rejected'] },
  }).populate('studentId', 'name');
  doc.fontSize(14).text('Leave Approvals / Rejections', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(10).text(`Count: ${leaves.length}`);
  leaves.forEach((l, i) => {
    doc.text(`${i + 1}. ${l.studentId?.name || 'N/A'} - ${l.fromDate.toLocaleDateString()} to ${l.toDate.toLocaleDateString()} - ${l.status}`);
  });

  return doc;
};

const generateWeeklyPDF = () => generateReportPDF();

module.exports = { generateReportPDF, generateWeeklyPDF };
