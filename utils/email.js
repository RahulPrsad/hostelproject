const nodemailer = require('nodemailer');

const hasEmailConfig = () => {
  const user = process.env.NODEMAILER_USER || '';
  const pass = process.env.NODEMAILER_PASS || '';
  return user && pass && !user.includes('your-email') && pass !== 'your-app-password';
};

let transporter = null;
if (hasEmailConfig()) {
  transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST || 'smtp.gmail.com',
    port: Number(process.env.NODEMAILER_PORT) || 587,
    secure: false,
    connectionTimeout: Number(process.env.NODEMAILER_CONNECTION_TIMEOUT_MS || 5000),
    greetingTimeout: Number(process.env.NODEMAILER_GREETING_TIMEOUT_MS || 5000),
    socketTimeout: Number(process.env.NODEMAILER_SOCKET_TIMEOUT_MS || 5000),
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

const sendOTP = async (email, otp) => {
  if (!transporter) {
    throw new Error('Email not configured. Set NODEMAILER_USER and NODEMAILER_PASS in .env (use Gmail App Password for Gmail).');
  }
  const mailOptions = {
    from: process.env.NODEMAILER_USER,
    to: email,
    subject: 'Hostel Management - OTP Verification',
    text: `Your OTP for verification is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP for verification is: <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  };
  await withTimeout(
    transporter.sendMail(mailOptions),
    Number(process.env.NODEMAILER_SEND_TIMEOUT_MS || 7000),
    'OTP email send'
  );
};

module.exports = { sendOTP };
