const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware to verify authentication
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  req.user = user;
  next();
};

// GET all students (with optional filters)
router.get('/students', authenticate, async (req, res) => {
  try {
    const { 
      grade_level, 
      enrollment_status, 
      grade_numeric,
      page = 1,
      limit = 20,
      search 
    } = req.query;

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .is('deleted_at', null); // Only non-deleted records

    // Apply filters
    if (grade_level) query = query.eq('grade_level', grade_level);
    if (enrollment_status) query = query.eq('enrollment_status', enrollment_status);
    if (grade_numeric) query = query.eq('grade_numeric', parseInt(grade_numeric));
    
    // Search functionality
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,student_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: students, error, count } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET single student by ID
router.get('/students/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE new student (with user registration)
router.post('/students', authenticate, async (req, res) => {
  try {
    // Destructure all fields from the exact JSON structure
    const { 
      full_name,
      student_number,
      email,
      phone,
      birth_date,
      gender,
      enrollment_status = 'active',
      grade_level = 'Grade 10',
      grade_numeric = 10,
      subjects = [],
      home_address,
      parent_name,
      parent_phone,
      // Auth fields
      password = 'TempPassword123!' // Default password that should be changed
    } = req.body;

    // Validate required fields
    const requiredFields = ['full_name', 'student_number', 'email', 'gender'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          full_name,
          role: 'student'
        }
      }
    });

    if (authError) {
      return res.status(400).json({ 
        success: false, 
        error: `Auth Error: ${authError.message}` 
      });
    }

    const userId = authData.user.id;

    // 2. Insert into students table with ALL fields
    const studentData = {
      id: userId,
      full_name,
      student_number,
      email,
      phone: phone || null,
      birth_date: birth_date || null,
      gender,
      enrollment_status,
      grade_level,
      grade_numeric: grade_numeric || parseInt(grade_level.replace('Grade ', '')),
      subjects: Array.isArray(subjects) ? subjects : [subjects].filter(Boolean),
      home_address: home_address || null,
      parent_name: parent_name || null,
      parent_phone: parent_phone || null,
      created_by: req.user.id,
      updated_by: req.user.id
    };

    const { data: student, error: dbError } = await supabase
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (dbError) {
      // Cleanup: Delete the auth user if student creation fails
      await supabase.auth.admin.deleteUser(userId);
      return res.status(400).json({ 
        success: false, 
        error: `Database Error: ${dbError.message}` 
      });
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });

  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE student
router.put('/students/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.created_by;

    // Add updated_by and updated_at
    updateData.updated_by = req.user.id;
    updateData.updated_at = new Date().toISOString();

    // Convert subjects to array if provided
    if (updateData.subjects && !Array.isArray(updateData.subjects)) {
      updateData.subjects = [updateData.subjects];
    }

    // Update grade_numeric if grade_level changes
    if (updateData.grade_level && !updateData.grade_numeric) {
      const gradeMatch = updateData.grade_level.match(/\d+/);
      updateData.grade_numeric = gradeMatch ? parseInt(gradeMatch[0]) : 10;
    }

    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// SOFT DELETE student (mark as deleted)
router.delete('/students/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Soft delete by setting deleted_at and deleted_by
    const { data: student, error } = await supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.id,
        enrollment_status: 'inactive'
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    // Optionally deactivate the auth user
    await supabase.auth.admin.updateUserById(id, {
      user_metadata: { ...student.user_metadata, status: 'inactive' }
    });

    res.json({
      success: true,
      message: 'Student deactivated successfully',
      data: student
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// RESTORE deleted student
router.post('/students/:id/restore', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: student, error } = await supabase
      .from('students')
      .update({
        deleted_at: null,
        deleted_by: null,
        enrollment_status: 'active',
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .not('deleted_at', 'is', null)
      .select()
      .single();

    if (error) throw error;
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found or already active' });
    }

    // Reactivate auth user
    await supabase.auth.admin.updateUserById(id, {
      user_metadata: { ...student.user_metadata, status: 'active' }
    });

    res.json({
      success: true,
      message: 'Student restored successfully',
      data: student
    });
  } catch (error) {
    console.error('Error restoring student:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET student statistics
router.get('/students/stats', authenticate, async (req, res) => {
  try {
    // Get total students
    const { count: total } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null);

    // Get active students
    const { count: active } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('enrollment_status', 'active')
      .is('deleted_at', null);

    // Get students by gender
    const { data: genderStats } = await supabase
      .from('students')
      .select('gender')
      .is('deleted_at', null);

    const genderCount = genderStats?.reduce((acc, curr) => {
      acc[curr.gender] = (acc[curr.gender] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get students by grade level
    const { data: gradeStats } = await supabase
      .from('students')
      .select('grade_level')
      .is('deleted_at', null);

    const gradeCount = gradeStats?.reduce((acc, curr) => {
      acc[curr.grade_level] = (acc[curr.grade_level] || 0) + 1;
      return acc;
    }, {}) || {};

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive: total - active,
        genderDistribution: genderCount,
        gradeDistribution: gradeCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// BULK operations (optional)
router.post('/students/bulk', authenticate, async (req, res) => {
  try {
    const { students } = req.body; // Array of student objects

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No student data provided or invalid format'
      });
    }

    // Process students in batches to avoid overwhelming the API
    const BATCH_SIZE = 10;
    const results = [];
    const errors = [];

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      
      for (const student of batch) {
        try {
          // Create auth user
          const { data: authData } = await supabase.auth.signUp({
            email: student.email,
            password: student.password || 'TempPassword123!',
            options: {
              data: { full_name: student.full_name, role: 'student' }
            }
          });

          // Insert student record
          const { data: dbData } = await supabase
            .from('students')
            .insert([{
              ...student,
              id: authData.user.id,
              created_by: req.user.id,
              updated_by: req.user.id
            }])
            .select()
            .single();

          results.push(dbData);
        } catch (error) {
          errors.push({ student: student.email, error: error.message });
        }
      }
    }

    res.json({
      success: true,
      message: `Processed ${students.length} students`,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;