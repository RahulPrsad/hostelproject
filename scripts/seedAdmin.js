/**
 * Seed first admin user. Run: node scripts/seedAdmin.js
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (optional; defaults below).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@hostel.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_db');
  const existing = await Student.findOne({ role: 'admin' });
  if (existing) {
    console.log('Admin already exists:', existing.email);
    process.exit(0);
    return;
  }
  await Student.create({
    name: 'Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: 'admin',
    isVerified: true,
  });
  console.log('Admin created:', ADMIN_EMAIL, '(password:', ADMIN_PASSWORD + ')');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
