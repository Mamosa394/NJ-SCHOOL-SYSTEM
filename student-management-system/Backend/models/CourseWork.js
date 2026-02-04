import mongoose from 'mongoose';

const courseworkSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true }, // e.g., 'Mathematics'
  test1: { type: Number, default: 0 },
  test2: { type: Number, default: 0 },
  test3: { type: Number, default: 0 },
  test4: { type: Number, default: 0 },
  average: { type: Number, default: 0 }, // This will be auto-calculated
  feedback: { type: String }, // Optional teacher comments
}, { timestamps: true });

// Auto-calculate average before saving
courseworkSchema.pre('save', function (next) {
  const scores = [this.test1, this.test2, this.test3, this.test4].filter(score => score !== null);
  this.average = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : 0;
  next();
});

export default mongoose.model('Coursework', courseworkSchema);
