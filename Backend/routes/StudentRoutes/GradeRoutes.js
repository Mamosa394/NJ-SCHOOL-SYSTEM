import express from 'express';
import Grade from '../../models/Grade.js';

const router = express.Router();

// GET all grades for a student
router.get('/:studentId', async (req, res) => {
  try {
    const grades = await Grade.find({ studentId: req.params.studentId });
    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch grades.' });
  }
});

// POST create or update grade for a student in a subject
router.post('/', async (req, res) => {
  const { studentId, subject, test1, test2, test3, test4, comments } = req.body;

  try {
    let grade = await Grade.findOne({ studentId, subject });

    if (grade) {
      // Update existing
      grade.test1 = test1 ?? grade.test1;
      grade.test2 = test2 ?? grade.test2;
      grade.test3 = test3 ?? grade.test3;
      grade.test4 = test4 ?? grade.test4;
      grade.comments = comments ?? grade.comments;
    } else {
      // Create new
      grade = new Grade({ studentId, subject, test1, test2, test3, test4, comments });
    }

    await grade.save();
    res.status(200).json(grade);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit grade.' });
  }
});

export default router;
