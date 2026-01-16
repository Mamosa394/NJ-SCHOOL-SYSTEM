import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  studentNumber: { type: String, unique: true, required: true },
  phone: String,
  email: { type: String, unique: true, required: true },
  parentName: String,
  parentPhone: String,
  birthDate: Date,
  subjects: [String],
}, { timestamps: true });

export default mongoose.model('Student', studentSchema);
