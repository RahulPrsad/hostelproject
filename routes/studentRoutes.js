const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { requireStudent } = require('../middleware/roleCheck');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.use(protect);
router.use(requireStudent);

router.get('/dashboard', studentController.dashboard);
router.get('/leave', studentController.getLeave);
router.post('/leave', [
  body('fromDate').notEmpty().withMessage('From date required'),
  body('toDate').notEmpty().withMessage('To date required'),
  body('reason').trim().notEmpty().withMessage('Reason required'),
], studentController.postLeave);
router.get('/complaint', studentController.getComplaint);
router.post('/complaint', [
  body('message').trim().notEmpty().withMessage('Message required'),
], studentController.postComplaint);
router.get('/fruit-history', studentController.fruitHistory);
router.get('/equipment', studentController.equipment);
router.get('/my-qr', studentController.myQR);

module.exports = router;
