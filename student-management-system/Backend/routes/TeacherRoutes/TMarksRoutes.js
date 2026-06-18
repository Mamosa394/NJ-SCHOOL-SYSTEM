// routes/TMarksRoutes.js
const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Get teacher's subjects
router.get('/subjects/:teacherId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('subjects')
      .eq('id', req.params.teacherId)
      .single();
    
    if (error) throw error;
    res.json(data?.subjects || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get assessments for a subject
router.get('/assessments/:teacherId/:subject', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .eq('teacher_id', req.params.teacherId)
      .eq('subject', req.params.subject)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create assessment
router.post('/assessments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assessments')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete assessment
router.delete('/assessments/:id', async (req, res) => {
  try {
    // Delete marks first
    await supabase.from('marks').delete().eq('assessment_id', req.params.id);
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', req.params.id);
    
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get students enrolled in a subject
router.get('/students/:subject', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('student_subjects')
      .select(`
        student_id,
        students!inner(id, full_name, grade, student_id, approval_status)
      `)
      .eq('subject', req.params.subject)
      .eq('students.approval_status', 'approved');
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get marks for an assessment
router.get('/marks/:assessmentId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('marks')
      .select('*')
      .eq('assessment_id', req.params.assessmentId);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save/Update marks
router.post('/marks', async (req, res) => {
  try {
    const { marks } = req.body;
    const results = [];
    
    for (const mark of marks) {
      if (mark.id) {
        // Update
        const { data, error } = await supabase
          .from('marks')
          .update({ score: mark.score, comment: mark.comment })
          .eq('id', mark.id)
          .select()
          .single();
        if (!error) results.push(data);
      } else {
        // Insert
        const { data, error } = await supabase
          .from('marks')
          .insert(mark)
          .select()
          .single();
        if (!error) results.push(data);
      }
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;