const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const adminController = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(requireAdmin);

router.get('/dashboard', adminController.dashboard);
router.get('/students', adminController.students);
router.get('/leaves', adminController.leaves);
router.post('/leaves/:id/approve', adminController.approveLeave);
router.post('/leaves/:id/reject', adminController.rejectLeave);
router.get('/scan', adminController.getScan);
router.get('/api/student-by-qr', adminController.studentByQR);
router.get('/fruit', adminController.getFruit);
router.post('/fruit', adminController.issueFruit);
router.post('/fruit/qr', adminController.issueFruitByQR);
router.get('/equipment', adminController.getEquipment);
router.post('/equipment', [
  body('studentId').notEmpty().withMessage('Student required'),
  body('equipmentName').trim().notEmpty().withMessage('Equipment name required'),
], adminController.issueEquipment);
router.post('/equipment/qr', adminController.issueEquipmentByQR);
router.post('/equipment/:id/return', adminController.returnEquipment);
router.post('/equipment/:id/damage', adminController.logDamage);
router.get('/complaints', adminController.complaints);
router.post('/complaints/:id/resolve', adminController.resolveComplaint);
router.get('/report/weekly', adminController.weeklyReport);

module.exports = router;
