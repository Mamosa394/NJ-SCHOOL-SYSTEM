import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import SignupRoutes from './routes/SignupRoutes.js'; 
import LoginRoutes from './routes/LoginRoutes.js'; 
import AttendanceRoutes from './routes/StudentRoutes/AttendanceRoutes.js'; 
import CourseworkRoutes from './routes/StudentRoutes/CourseworkRoutes.js';
import GradeRoutes from './routes/StudentRoutes/GradeRoutes.js';
import PaymentRoutes from './routes/StudentRoutes/PaymentRoutes.js';
import Studentroutes from './routes/StudentRoutes/Studentroutes.js';
import TimetableRoutes from './routes/StudentRoutes/TimetableRoutes.js';     

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb+srv://motsiemamosa:sI0qJMGueCfMsfVf@school-management-syste.xxx2c6d.mongodb.net/?retryWrites=true&w=majority&appName=school-management-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api', SignupRoutes);   // ✅ new signup-related routes
app.use('/api', LoginRoutes);
app.use('/api/students', Studentroutes);
app.use('/api/grades', GradeRoutes);
app.use('/api/attendance', AttendanceRoutes);
app.use('/api/finance', PaymentRoutes);
app.use('/api/coursework', CourseworkRoutes);
app.use('/api/timetable', TimetableRoutes);


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
