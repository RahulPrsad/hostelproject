const PDFDocument = require('pdfkit');
const Leave = require('../models/Leave');
const Equipment = require('../models/Equipment');
const FruitDistribution = require('../models/FruitDistribution');

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
