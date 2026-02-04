import express from 'express';
import Attendance from '../../models/Attendance.js';

const router = express.Router();

router.get('/:studentId', async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.studentId });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Attendance fetch failed' });
  }
});

export default router;
