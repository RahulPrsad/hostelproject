require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { cleanupExpiredEquipmentPhotos } = require('./utils/equipmentPhotoRetention');

connectDB();

const app = express();

app.set('trust proxy', 1);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);
app.use('/student', studentRoutes);
app.use('/admin', adminRoutes);

cleanupExpiredEquipmentPhotos().catch(console.error);
setInterval(() => {
  cleanupExpiredEquipmentPhotos().catch(console.error);
}, 60 * 60 * 1000);

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.use((req, res) => {
  res.status(404).send('<h1>404 Not Found</h1><a href="/">Go home</a>');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
