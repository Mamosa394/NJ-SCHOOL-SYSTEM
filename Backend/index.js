import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
import SignupRoutes from './routes/SignupRoutes.js';
import LoginRoutes from './routes/LoginRoutes.js';
import AttendanceRoutes from './routes/StudentRoutes/AttendanceRoutes.js';
import CourseworkRoutes from './routes/StudentRoutes/CourseworkRoutes.js';
import GradeRoutes from './routes/StudentRoutes/GradeRoutes.js';
import PaymentRoutes from './routes/StudentRoutes/PaymentRoutes.js';
import StudentRoutes from './routes/StudentRoutes/StudentRoutes.js';
import TimetableRoutes from './routes/StudentRoutes/TimetableRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', SignupRoutes);
app.use('/api', LoginRoutes);
app.use('/api/students', StudentRoutes);
app.use('/api/grades', GradeRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/finance', PaymentRoutes);
app.use('/api/coursework', CourseworkRoutes);
app.use('/api/timetable', TimetableRoutes);

// MongoDB connection & Server Start
const PORT = 5000;
const MONGO_URI = 'mongodb+srv://motsiemamosa:JONttCU9ZHgiZl5w@njschoolsystem.kylcszl.mongodb.net/?appName=NJSCHOOLSYSTEM';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Database connected successfully');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error Details:');
    console.error('Error Name:', err.name);
    console.error('Message:', err.message);
  });