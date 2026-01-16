import express from 'express';
import bcrypt from 'bcryptjs'; 
import User from '../models/signup.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Look up user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password.' });

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password.' });

    // ✅ Send minimal info back
    res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      role: user.role,
    });
  } catch (err) {
     console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

export default router;
