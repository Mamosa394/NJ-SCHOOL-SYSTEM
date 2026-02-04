const express = require('express');
const router = express.Router();

// Middleware to require authentication
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }
  next();
};

// Apply auth middleware to all student routes
router.use(requireAuth);

// Helper function to create authenticated Supabase client
const createAuthenticatedClient = (req) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${req.supabaseToken}`
      }
    }
  });
};

// Validation helpers
const validateStudentData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.full_name !== undefined) {
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    }
  }
  
  if (!isUpdate || data.student_number !== undefined) {
    if (!data.student_number || !/^\d{9}$/.test(data.student_number)) {
      errors.push('Student number must be exactly 9 digits');
    }
    if (data.student_number === '000000000' || data.student_number === '123456789') {
      errors.push('Student number is not valid');
    }
  }
  
  if (!isUpdate || data.email !== undefined) {
    if (!data.email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i.test(data.email)) {
      errors.push('Valid email is required');
    }
  }
  
  if (!isUpdate || data.gender !== undefined) {
    if (data.gender && !['Male', 'Female'].includes(data.gender)) {
      errors.push('Gender must be Male or Female');
    }
  }
  
  if (!isUpdate || data.grade_level !== undefined) {
    const validGrades = [
      'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11',
      'Freshman', 'Sophomore', 'Junior', 'Senior'
    ];
    if (data.grade_level && !validGrades.includes(data.grade_level)) {
      errors.push(`Grade level must be one of: ${validGrades.join(', ')}`);
    }
  }
  
  if (!isUpdate || data.enrollment_status !== undefined) {
    const validStatuses = ['pending', 'active', 'suspended', 'graduated', 'withdrawn'];
    if (data.enrollment_status && !validStatuses.includes(data.enrollment_status)) {
      errors.push(`Enrollment status must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  if (data.birth_date) {
    const birthDate = new Date(data.birth_date);
    const minDate = new Date('1900-01-02');
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() - 13); // Must be at least 13 years old
    
    if (birthDate < minDate || birthDate > maxDate) {
      errors.push('Student must be at least 13 years old');
    }
  }
  
  if (data.phone && !/^\+?[1-9]\d{1,14}$/.test(data.phone)) {
    errors.push('Phone number must be valid international format');
  }
  
  return errors;
};

// GET all students with filtering, sorting, and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sort_by = 'full_name',
      sort_order = 'asc',
      enrollment_status,
      grade_level,
      gender,
      search
    } = req.query;
    
    const userSupabase = createAuthenticatedClient(req);
    
    // Start building query
    let query = userSupabase
      .from('students')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (enrollment_status) {
      query = query.eq('enrollment_status', enrollment_status);
    }
    if (grade_level) {
      query = query.eq('grade_level', grade_level);
    }
    if (gender) {
      query = query.eq('gender', gender);
    }
    
    // Apply search
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,student_number.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    // Apply sorting
    if (sort_by && sort_order) {
      query = query.order(sort_by, { ascending: sort_order === 'asc' });
    }
    
    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;
    
    query = query.range(from, to);
    
    const { data: students, error, count } = await query;
    
    if (error) {
      console.error('Error fetching students:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'FETCH_ERROR'
      });
    }
    
    const totalPages = Math.ceil(count / limitNum);
    
    res.json({
      success: true,
      data: students || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      filters: {
        enrollment_status,
        grade_level,
        gender,
        search
      }
    });
    
  } catch (error) {
    console.error('Server error fetching students:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userSupabase = createAuthenticatedClient(req);
    
    const { data: student, error } = await userSupabase
      .from('students')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND'
        });
      }
      console.error('Error fetching student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'FETCH_ERROR'
      });
    }
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: student
    });
    
  } catch (error) {
    console.error('Server error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET student by student number
router.get('/number/:student_number', async (req, res) => {
  try {
    const { student_number } = req.params;
    const userSupabase = createAuthenticatedClient(req);
    
    if (!/^\d{9}$/.test(student_number)) {
      return res.status(400).json({
        success: false,
        error: 'Student number must be exactly 9 digits',
        code: 'INVALID_FORMAT'
      });
    }
    
    const { data: student, error } = await userSupabase
      .from('students')
      .select('*')
      .eq('student_number', student_number)
      .is('deleted_at', null)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND'
        });
      }
      console.error('Error fetching student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'FETCH_ERROR'
      });
    }
    
    res.json({
      success: true,
      data: student
    });
    
  } catch (error) {
    console.error('Server error fetching student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST create new student
router.post('/', async (req, res) => {
  try {
    const studentData = req.body;
    const userSupabase = createAuthenticatedClient(req);
    
    // Validate required fields
    const validationErrors = validateStudentData(studentData, false);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check if student number already exists
    const { data: existingByNumber } = await userSupabase
      .from('students')
      .select('id, student_number')
      .eq('student_number', studentData.student_number)
      .is('deleted_at', null)
      .single();
    
    if (existingByNumber) {
      return res.status(409).json({
        success: false,
        error: 'Student number already exists',
        code: 'DUPLICATE_STUDENT_NUMBER'
      });
    }
    
    // Check if email already exists
    const { data: existingByEmail } = await userSupabase
      .from('students')
      .select('id, email')
      .eq('email', studentData.email)
      .is('deleted_at', null)
      .single();
    
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }
    
    // Prepare student data with audit fields
    const newStudent = {
      id: studentData.id || require('crypto').randomUUID(), // Generate UUID if not provided
      full_name: studentData.full_name.trim(),
      student_number: studentData.student_number,
      email: studentData.email.toLowerCase(),
      phone: studentData.phone || null,
      birth_date: studentData.birth_date || null,
      gender: studentData.gender || 'Male',
      enrollment_status: studentData.enrollment_status || 'pending',
      grade_level: studentData.grade_level || null,
      subjects: studentData.subjects || [],
      home_address: studentData.home_address || null,
      parent_name: studentData.parent_name || null,
      parent_phone: studentData.parent_phone || null,
      created_by: req.user.id,
      updated_by: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      deleted_by: null
    };
    
    // Insert new student
    const { data: createdStudent, error } = await userSupabase
      .from('students')
      .insert([newStudent])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'CREATE_ERROR'
      });
    }
    
    // Calculate age from birth date
    let age = null;
    if (createdStudent.birth_date) {
      const birthDate = new Date(createdStudent.birth_date);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        ...createdStudent,
        age,
        created_by_name: req.user.email // You might want to fetch user name
      },
      code: 'CREATED'
    });
    
  } catch (error) {
    console.error('Server error creating student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// PUT update student (full update)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userSupabase = createAuthenticatedClient(req);
    
    // Check if student exists
    const { data: existingStudent } = await userSupabase
      .from('students')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Validate updates
    const validationErrors = validateStudentData(updates, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Check for duplicate student number if being changed
    if (updates.student_number && updates.student_number !== existingStudent.student_number) {
      const { data: duplicateNumber } = await userSupabase
        .from('students')
        .select('id')
        .eq('student_number', updates.student_number)
        .neq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (duplicateNumber) {
        return res.status(409).json({
          success: false,
          error: 'Student number already exists',
          code: 'DUPLICATE_STUDENT_NUMBER'
        });
      }
    }
    
    // Check for duplicate email if being changed
    if (updates.email && updates.email !== existingStudent.email) {
      const { data: duplicateEmail } = await userSupabase
        .from('students')
        .select('id')
        .eq('email', updates.email.toLowerCase())
        .neq('id', id)
        .is('deleted_at', null)
        .single();
      
      if (duplicateEmail) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          code: 'DUPLICATE_EMAIL'
        });
      }
    }
    
    // Prepare update data
    const updateData = {
      ...updates,
      updated_by: req.user.id,
      updated_at: new Date().toISOString()
    };
    
    // Clean up data
    if (updateData.full_name) updateData.full_name = updateData.full_name.trim();
    if (updateData.email) updateData.email = updateData.email.toLowerCase();
    
    // Update student
    const { data: updatedStudent, error } = await userSupabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'UPDATE_ERROR'
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
      code: 'UPDATED'
    });
    
  } catch (error) {
    console.error('Server error updating student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// PATCH partial update student
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userSupabase = createAuthenticatedClient(req);
    
    // Only allow specific fields for partial updates
    const allowedFields = [
      'enrollment_status',
      'grade_level',
      'subjects',
      'phone',
      'home_address',
      'parent_name',
      'parent_phone',
      'notes'
    ];
    
    const invalidFields = Object.keys(updates).filter(field => !allowedFields.includes(field));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot update fields: ${invalidFields.join(', ')}`,
        code: 'INVALID_FIELDS'
      });
    }
    
    // Validate updates
    const validationErrors = validateStudentData(updates, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    // Prepare update data
    const updateData = {
      ...updates,
      updated_by: req.user.id,
      updated_at: new Date().toISOString()
    };
    
    const { data: updatedStudent, error } = await userSupabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error patching student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'UPDATE_ERROR'
      });
    }
    
    res.json({
      success: true,
      message: 'Student updated successfully',
      data: updatedStudent,
      code: 'UPDATED'
    });
    
  } catch (error) {
    console.error('Server error patching student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// DELETE student (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userSupabase = createAuthenticatedClient(req);
    
    // Check if student exists
    const { data: student } = await userSupabase
      .from('students')
      .select('id, full_name, student_number')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found',
        code: 'NOT_FOUND'
      });
    }
    
    // Soft delete (update deleted_at and deleted_by)
    const { error } = await userSupabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.id,
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting student:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'DELETE_ERROR'
      });
    }
    
    res.json({
      success: true,
      message: `Student ${student.full_name} (${student.student_number}) deleted successfully`,
      data: {
        id: student.id,
        deleted_at: new Date().toISOString()
      },
      code: 'DELETED'
    });
    
  } catch (error) {
    console.error('Server error deleting student:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET student statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const userSupabase = createAuthenticatedClient(req);
    
    // Get all active students
    const { data: activeStudents, error: activeError } = await userSupabase
      .from('students')
      .select('*')
      .eq('enrollment_status', 'active')
      .is('deleted_at', null);
    
    // Get counts by gender
    const { data: genderStats, error: genderError } = await userSupabase
      .from('students')
      .select('gender, count')
      .eq('enrollment_status', 'active')
      .is('deleted_at', null)
      .group('gender');
    
    // Get counts by grade
    const { data: gradeStats, error: gradeError } = await userSupabase
      .from('students')
      .select('grade_level, count')
      .eq('enrollment_status', 'active')
      .is('deleted_at', null)
      .group('grade_level');
    
    // Get age statistics
    let ageStats = null;
    if (activeStudents && activeStudents.length > 0) {
      const ages = activeStudents
        .filter(s => s.birth_date)
        .map(s => {
          const birthDate = new Date(s.birth_date);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          return age;
        });
      
      if (ages.length > 0) {
        ageStats = {
          average: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
          min: Math.min(...ages),
          max: Math.max(...ages)
        };
      }
    }
    
    if (activeError || genderError || gradeError) {
      console.error('Error fetching stats:', { activeError, genderError, gradeError });
    }
    
    res.json({
      success: true,
      data: {
        total_active: activeStudents?.length || 0,
        total_all: 0, // You might want to add total count query
        by_gender: genderStats || [],
        by_grade: gradeStats || [],
        age_statistics: ageStats,
        enrollment_status_counts: {
          active: activeStudents?.length || 0,
          pending: 0, // Add queries for these
          suspended: 0,
          graduated: 0,
          withdrawn: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Server error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// GET search students
router.get('/search/all', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    const userSupabase = createAuthenticatedClient(req);
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'INVALID_QUERY'
      });
    }
    
    const searchQuery = q.trim();
    
    // Search across multiple fields
    const { data: students, error } = await userSupabase
      .from('students')
      .select('id, full_name, student_number, email, grade_level, enrollment_status')
      .or(`full_name.ilike.%${searchQuery}%,student_number.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .is('deleted_at', null)
      .limit(parseInt(limit));
    
    if (error) {
      console.error('Error searching students:', error);
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'SEARCH_ERROR'
      });
    }
    
    res.json({
      success: true,
      query: searchQuery,
      count: students?.length || 0,
      data: students || []
    });
    
  } catch (error) {
    console.error('Server error searching students:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

module.exports = router;