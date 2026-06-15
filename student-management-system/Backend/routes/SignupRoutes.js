// routes/signup.js
import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// POST /signup - Create a new user account
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ 
        message: 'Missing required fields: fullName, email, password, role' 
      });
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be: student, teacher, parent, or admin' 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long.' 
      });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role
    });

    await newUser.save();

    // Return success (don't send password back)
    res.status(201).json({ 
      message: 'Account created successfully.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt
      }
    });

  } catch (err) {
    console.error('Signup error:', err);
    
    // Handle duplicate email error
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered.' });
    }
    
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// GET /users/role/:role - Get users by role
router.get('/users/role/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ['student', 'teacher', 'parent', 'admin'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const users = await User.find({ role })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ count: users.length, users });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

export default router;