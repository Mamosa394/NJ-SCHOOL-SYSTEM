import express from 'express';
import Timetable from '../../models/Timetable.js';

const router = express.Router();

router.get('/:studentId', async (req, res) => {
  try {
    const schedule = await Timetable.find({ student: req.params.studentId });
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Timetable fetch failed' });
  }
});

export default router;
