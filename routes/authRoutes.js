const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many attempts, try again later.',
});

router.use(authLimiter);

router.get('/login', authController.getLogin);
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.postRegister);

router.get('/verify-otp', authController.getVerifyOTP);
router.post('/verify-otp', authController.postVerifyOTP);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
