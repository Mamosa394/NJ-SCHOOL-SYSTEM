import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true }, // e.g., "June 2025"
  amountPaid: { type: Number, default: 0 },
  receiptId: String,
  paidOn: Date,
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' }
}, { timestamps: true });

export default mongoose.model('Finance', financeSchema);
