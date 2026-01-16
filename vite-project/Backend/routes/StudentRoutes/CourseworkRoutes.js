import express from 'express';
import Grade from '../../models/Grade.js';

const router = express.Router();

// GET coursework derived from grades
router.get('/:studentId', async (req, res) => {
  try {
    const coursework = await Grade.find({ student: req.params.studentId }).select('subject test1 test2 test3 test4 comments');
    res.json(coursework);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching coursework' });
  }
});

export default router;
