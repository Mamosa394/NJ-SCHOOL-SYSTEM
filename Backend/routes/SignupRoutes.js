import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/signup.js';

const router = express.Router();

// ✅ Signup Route
router.post('/signup', async (req, res) => {
  try {
    const {
      fullName,
      studentNumber,
      phone,
      email,
      password,
      role,
      parentName,
      parentPhone,
      birthDate,
      subjects,
    } = req.body;

    // Check for duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Validate password strength
    const strongPattern = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    if (!strongPattern.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and include a special character.',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new user
    const newUser = new User({
      fullName,
      studentNumber,
      phone,
      email,
      password: hashedPassword,
      role,
      parentName,
      parentPhone,
      birthDate,
      subjects,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// ✅ Admin Count Route
router.get('/admins/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'admin' });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching admin count.' });
  }
});

export default router;
