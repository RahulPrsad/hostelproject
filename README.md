# QR-Based Hostel Management System

A web-based hostel management system with QR-based student verification, role-based access (Student & Admin), and weekly PDF reports.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, EJS, Tailwind CSS (CDN)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcrypt, Nodemailer (OTP)
- **QR:** qrcode (generation), html5-qrcode (browser scanning)
- **PDF:** pdfkit

## Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)

## Setup

1. **Clone and install**

   ```bash
   cd hostel-1
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/hostel_db
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   NODEMAILER_HOST=smtp.gmail.com
   NODEMAILER_PORT=587
   NODEMAILER_USER=your-email@gmail.com
   NODEMAILER_PASS=your-app-password
   APP_URL=http://localhost:3000
   ```

   For Gmail: use an [App Password](https://support.google.com/accounts/answer/185833), not your normal password.

3. **Database**

   - **Local:** Start MongoDB, then use `MONGODB_URI=mongodb://localhost:27017/hostel_db`.
   - **Atlas:** Create a cluster, get the connection string, and set it as `MONGODB_URI`.

4. **Create first admin**

   ```bash
   node scripts/seedAdmin.js
   ```

   Default admin: `admin@hostel.com` / `admin123`. Override with `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`.

5. **Run**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Login as admin or register as a student.

## Features

### Student

- Register with email, OTP verification, login/logout
- Dashboard, apply for leave, view leave status
- Raise complaint, view fruit distribution history, view issued equipment
- View/download personal QR code

### Admin

- Dashboard (totals: students, pending leaves, equipment, fruit this week, complaints)
- View all students, approve/reject leave
- Scan QR via webcam, view student details, issue fruit/equipment
- Issue fruit, issue/return sports equipment, log damage
- View complaints, mark resolved
- Weekly PDF report (download)
- Call parent (clickable phone link on student list)

## Deployment

1. Set all env vars in production (strong `JWT_SECRET`, real MongoDB URI, Nodemailer credentials).
2. Build: no frontend build step (Tailwind via CDN). For production you may add a Tailwind build and serve compiled CSS.
3. Process manager: e.g. `pm2 start server.js --name hostel`.
4. Optional: put Nginx (or similar) in front and proxy to `PORT`.

## Project Structure

```
/config       - DB connection
/controllers  - auth, student, admin
/models       - Student, Leave, Equipment, FruitDistribution, Complaint
/routes       - auth, student, admin
/middleware   - auth (JWT), role (student/admin)
/views        - EJS templates (auth, student, admin)
/public       - static assets, js (scan, app)
/utils        - email (OTP), qrGenerator, pdfReport
scripts       - seedAdmin.js
server.js
```


