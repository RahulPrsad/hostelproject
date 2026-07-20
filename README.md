# Hostel Management System - version_1.0
### Secure QR-Based Digital Hostel Management Platform

A modern, full-stack Hostel Management System designed to digitize hostel operations through **QR-based student verification**, **role-based authentication**, **equipment tracking**, **leave management**, **complaint handling**, and **automated reporting**.

The system eliminates manual registers and paper-based workflows by providing administrators with a centralized dashboard while giving students a seamless self-service portal.

---

#  Highlights

-  Secure JWT Authentication
-  OTP Email Verification
-  QR Code Based Student Identification
-  Mobile Friendly Responsive UI
-  Role-Based Access Control (RBAC)
-  Real-time Admin Dashboard
-  Leave Management Workflow
-  Fruit Distribution Tracking
-  Sports Equipment Management
-  Complaint Management System
-  Weekly PDF Report Generation
-  Downloadable Personal QR Cards
-  Cloud Ready Architecture

---

#  System Overview

```
                    +----------------+
                    |   Student      |
                    +--------+-------+
                             |
                    Login / Register
                             |
                    JWT Authentication
                             |
               +-------------+-------------+
               |                           |
         Student Dashboard          QR Generation
               |
        Leave / Complaint /
      Equipment / Fruit History
               |
               |
      -----------------------------
               |
         MongoDB Database
               |
      -----------------------------
               |
        Admin Dashboard
               |
   QR Scan → Student Verification
               |
 Issue Fruit | Equipment | Leave
 Complaint Resolution | Reports
```

---

#  Core Features

##  Student Portal

### Authentication

- Secure Registration
- Email OTP Verification
- Login & Logout
- JWT Authentication
- Password Encryption using bcrypt

### Dashboard

Students can

- View Profile
- Download Personal QR Code
- Apply for Leave
- Track Leave Status
- Raise Complaints
- View Complaint History
- View Fruit Distribution Records
- View Issued Sports Equipment

---

##  Admin Portal

A centralized control panel to manage hostel activities.

### Dashboard Analytics

Displays

- Total Students
- Pending Leave Requests
- Active Complaints
- Equipment Issued
- Fruit Distributed This Week
- Recent Activities

---

### Student Management

- View Student Details
- Search Students
- Verify Student QR
- Contact Parent
- View Leave History
- Equipment History
- Fruit Distribution History

---

### QR Verification

The admin can simply scan the student's QR code using the webcam.

After scanning

- Student Identity Verification
- Profile Details
- Room Details
- Hostel Status
- Issue Fruit
- Issue Equipment

Instantly from one screen.

---

### Leave Management

- Approve Leave
- Reject Leave
- View Leave History
- Leave Status Tracking

---

### Equipment Management

- Issue Sports Equipment
- Return Equipment
- Mark Equipment Damaged
- Track Equipment Inventory

---

### Fruit Distribution

- Weekly Distribution
- Student-wise History
- Prevent Duplicate Distribution

---

### Complaint Management

- View Complaints
- Resolve Complaints
- Complaint Status Tracking

---

### Reporting

Generate downloadable

- Weekly Reports
- Student Reports
- Equipment Reports
- Fruit Distribution Reports

Exported as professionally formatted PDF files.

---

#  Tech Stack

## Frontend

| Technology | Purpose |
|------------|---------|
| HTML5 | Structure |
| CSS3 | Styling |
| Tailwind CSS | Responsive UI |
| JavaScript | Client Logic |
| EJS | Server Side Rendering |

---

## Backend

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API |
| Express Session | Session Handling |
| JWT | Authentication |
| bcrypt | Password Hashing |
| Nodemailer | Email OTP |

---

## Database

| Technology | Purpose |
|------------|---------|
| MongoDB | Database |
| Mongoose | ODM |

---

## Additional Libraries

| Package | Usage |
|---------|-------|
| qrcode | QR Generation |
| html5-qrcode | QR Scanning |
| pdfkit | PDF Generation |
| dotenv | Environment Variables |
| cookie-parser | Cookies |
| express-validator | Validation |
| multer *(optional)* | File Uploads |

---

# Security Features

✔ JWT Authentication

✔ Password Hashing (bcrypt)

✔ Email OTP Verification

✔ Protected Routes

✔ Role-Based Authorization

✔ Environment Variables

✔ Secure Cookie Support

✔ Input Validation

✔ MongoDB Injection Prevention

✔ XSS Protection Ready

✔ Authentication Middleware

✔ Authorization Middleware

---

#  Project Structure

```
hostel-management-system/
│
├── config/
│   ├── db.js
│   └── mail.js
│
├── controllers/
│   ├── authController.js
│   ├── adminController.js
│   └── studentController.js
│
├── middleware/
│   ├── auth.js
│   ├── role.js
│   └── validator.js
│
├── models/
│   ├── Student.js
│   ├── Leave.js
│   ├── Equipment.js
│   ├── Complaint.js
│   └── FruitDistribution.js
│
├── routes/
│   ├── auth.js
│   ├── admin.js
│   └── student.js
│
├── utils/
│   ├── qrGenerator.js
│   ├── sendOTP.js
│   └── pdfGenerator.js
│
├── public/
│   ├── css/
│   ├── js/
│   └── images/
│
├── views/
│   ├── auth/
│   ├── student/
│   ├── admin/
│   └── partials/
│
├── scripts/
│   └── seedAdmin.js
│
├── server.js
├── package.json
└── README.md
```

---

#  Installation

## Clone Repository

```bash
git clone <repository-url>

cd hostel-management-system
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment

Create a `.env`

```env
PORT=3000

MONGODB_URI=mongodb://localhost:27017/hostel_db

JWT_SECRET=your_super_secret_key

JWT_EXPIRE=7d

NODEMAILER_HOST=smtp.gmail.com

NODEMAILER_PORT=587

NODEMAILER_USER=your_email@gmail.com

NODEMAILER_PASS=your_app_password

APP_URL=http://localhost:3000
```

---

## Seed Admin

```bash
node scripts/seedAdmin.js
```

Default

```
Email

admin@hostel.com

Password

admin123
```

---

## Start Development Server

```bash
npm run dev
```

Production

```bash
npm start
```



## If you found this project helpful, consider giving it a star!
