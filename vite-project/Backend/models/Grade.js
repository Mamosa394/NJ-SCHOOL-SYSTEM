import mongoose from 'mongoose';

const gradeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  test1: Number,
  test2: Number,
  test3: Number,
  test4: Number,
  comments: String,
}, { timestamps: true });

export default mongoose.model('Grade', gradeSchema);
