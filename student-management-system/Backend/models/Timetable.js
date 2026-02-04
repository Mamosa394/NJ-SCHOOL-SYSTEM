import mongoose from 'mongoose';

const timetableSchema = new mongoose.Schema({
  className: { type: String, required: true }, // e.g., "Form 4", "Grade 10"
  day: { type: String, required: true },       // e.g., "Monday"
  lessons: [{
    time: String,                              // e.g., "08:00 - 09:00"
    subject: String,
    teacher: String
  }]
}, { timestamps: true });

export default mongoose.model('Timetable', timetableSchema);
