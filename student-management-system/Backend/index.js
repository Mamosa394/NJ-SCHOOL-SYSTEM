import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import SignupRoutes from './routes/SignupRoutes.js'; 
import LoginRoutes from './routes/LoginRoutes.js'; 
import AttendanceRoutes from './routes/StudentRoutes/AttendanceRoutes.js'; 
import CourseworkRoutes from './routes/StudentRoutes/CourseworkRoutes.js';
import GradeRoutes from './routes/StudentRoutes/GradeRoutes.js';
import PaymentRoutes from './routes/StudentRoutes/PaymentRoutes.js';
import StudentRoutes from './routes/StudentRoutes/StudentRoutes.js';
import TimetableRoutes from './routes/StudentRoutes/TimetableRoutes.js';     

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Updated MongoDB connection - Deprecated options removed to fix crash
mongoose.connect('mongodb+srv://motsiemamosa:sI0qJMGueCfMsfVf@school-management-system.xxx2c6d.mongodb.net/?retryWrites=true&w=majority&appName=school-management-system')
.then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/users', SignupRoutes);   
app.use('/api/users', LoginRoutes);
app.use('/api/students', StudentRoutes);
app.use('/api/grades', GradeRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/finance', PaymentRoutes);
app.use('/api/coursework', CourseworkRoutes);
app.use('/api/timetable', TimetableRoutes);

// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));