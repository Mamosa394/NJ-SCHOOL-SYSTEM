// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String 
  },
  role: { 
    type: String, 
    required: true, 
    enum: ['student', 'teacher', 'parent', 'admin'],
    index: true  // Add index for faster queries by role
  },
  avatar_url: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: { 
    type: Date 
  }
}, { 
  timestamps: true 
});

// Index for role-based queries
userSchema.index({ role: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const bcrypt = await import('bcryptjs');
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);
export default User;