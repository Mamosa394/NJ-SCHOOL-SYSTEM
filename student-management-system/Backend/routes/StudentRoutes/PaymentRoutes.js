import express from 'express';
import Finance from '../../models/Payment.js';

const router = express.Router();

router.get('/:studentId', async (req, res) => {
  try {
    const payments = await Finance.find({ student: req.params.studentId });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching finance data' });
  }
});

export default router;
