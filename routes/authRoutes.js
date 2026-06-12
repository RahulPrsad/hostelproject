const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX ? Number(process.env.AUTH_RATE_LIMIT_MAX) : 1000,
  message: 'Too many attempts, try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/login', authController.getLogin);
router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], authController.postLogin);

router.get('/register', authController.getRegister);
router.post('/register', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], authController.postRegister);

router.get('/verify-otp', authController.getVerifyOTP);
router.post('/verify-otp', authLimiter, authController.postVerifyOTP);
router.get('/thank-you', authController.getThankYou);

router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

module.exports = router;
