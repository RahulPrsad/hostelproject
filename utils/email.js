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
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });
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
  await transporter.sendMail(mailOptions);
};

module.exports = { sendOTP };
