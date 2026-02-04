import mongoose from 'mongoose';

const signupSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  studentNumber: { type: String },
  phone: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'teacher', 'parent', 'admin'] },
  parentName: { type: String },
  parentPhone: { type: String },
  birthDate: { type: Date },
  subjects: { type: [String], default: [] },
}, { timestamps: true });

const User = mongoose.model('User', signupSchema);
export default User;
