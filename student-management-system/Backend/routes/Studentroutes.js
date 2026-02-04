import express from 'express';
import Student from '../../models/Student.js';

const router = express.Router();

// GET student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching student.' });
  }
});

export default router;
