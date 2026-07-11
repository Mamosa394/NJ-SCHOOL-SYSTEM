import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Backend root (2 directories up from routes/TeacherRoutes/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

// Use the SAME variable names as your index.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Debug log
console.log('TAttendanceRoutes - Supabase URL:', supabaseUrl ? '✅ Loaded' : '❌ Missing');
console.log('TAttendanceRoutes - Supabase Key:', supabaseKey ? '✅ Loaded' : '❌ Missing');

if (!supabaseUrl) {
  console.error('❌ CRITICAL: supabaseUrl is undefined. Check .env file location and variable names.');
  console.log('Available SUPABASE env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ... rest of your routes stay the same
// =============================================
// AUTH MIDDLEWARE
// =============================================
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error?.message || 'No user found');
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    console.log('✅ Authenticated user:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

router.use(authMiddleware);

// =============================================
// GET TEACHER PROFILE
// =============================================
router.get('/teacher/profile', async (req, res) => {
  try {
    console.log('👤 Fetching teacher profile for:', req.user.email);
    
    const { data: teacher, error } = await supabase
      .from('approved_teachers')
      .select('*')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (error || !teacher) {
      console.error('Teacher profile error:', error?.message || 'Not found');
      return res.status(404).json({ message: 'Teacher not found or not approved' });
    }

    console.log('✅ Teacher profile found:', teacher.teacher_id);
    res.json({ teacher });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// =============================================
// GET TEACHER'S SUBJECTS - FIXED VERSION
// =============================================
router.get('/teacher/attendance/subjects', async (req, res) => {
  try {
    console.log('==========================================');
    console.log('📚 SUBJECTS REQUEST');
    console.log('User email from auth:', req.user.email);
    console.log('User ID from auth:', req.user.id);
    console.log('==========================================');

    // STEP 1: Find the approved teacher by email
    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name, email, subjects, teaching_type, approval_status')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    console.log('Database query result:');
    console.log('- Error:', teacherError?.message || 'None');
    console.log('- Teacher found:', teacher ? 'YES' : 'NO');

    if (teacherError) {
      console.error('❌ Database error:', teacherError);
      return res.status(500).json({
        message: 'Database error while fetching teacher',
        subjects: [],
        teacher_name: '',
        teaching_type: ''
      });
    }

    if (!teacher) {
      console.error('❌ No approved teacher found for email:', req.user.email);
      
      // Debug: Check if teacher exists at all (might be in different table)
      const { data: anyTeacher } = await supabase
        .from('approved_teachers')
        .select('email, approval_status')
        .eq('email', req.user.email)
        .maybeSingle();
      
      if (anyTeacher) {
        console.log('⚠️ Teacher found but not approved. Status:', anyTeacher.approval_status);
        return res.status(403).json({
          message: `Your account status is "${anyTeacher.approval_status}". Only approved teachers can access attendance.`,
          subjects: [],
          teacher_name: '',
          teaching_type: ''
        });
      }
      
      // Check if user exists in profiles table instead
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();
      
      console.log('Profile check:', profile);
      
      return res.status(404).json({
        message: 'No approved teacher record found. Please ensure your teacher registration is approved.',
        subjects: [],
        teacher_name: '',
        teaching_type: ''
      });
    }

    console.log('✅ Approved teacher found:');
    console.log('- Teacher ID:', teacher.teacher_id);
    console.log('- Name:', teacher.full_name);
    console.log('- Email:', teacher.email);
    console.log('- Teaching type:', teacher.teaching_type);
    console.log('- Subjects (raw):', teacher.subjects);
    console.log('- Subjects type:', typeof teacher.subjects);
    console.log('- Is array?', Array.isArray(teacher.subjects));

    // STEP 2: Parse subjects
    let subjectsList = [];

    if (!teacher.subjects) {
      console.warn('⚠️ Teacher has no subjects assigned');
    } else if (Array.isArray(teacher.subjects)) {
      // ✅ Your data format: ["Mathematics", "English", "Science"]
      console.log('📝 Subjects is already an array');
      subjectsList = teacher.subjects.filter(s => s && String(s).trim() !== '');
    } else if (typeof teacher.subjects === 'string') {
      console.log('📝 Subjects is a string, parsing...');
      try {
        // Try JSON parse first
        const parsed = JSON.parse(teacher.subjects);
        if (Array.isArray(parsed)) {
          subjectsList = parsed;
        } else {
          subjectsList = [teacher.subjects];
        }
      } catch {
        // Try comma-separated
        if (teacher.subjects.includes(',')) {
          subjectsList = teacher.subjects.split(',').map(s => s.trim());
        } else {
          subjectsList = [teacher.subjects.trim()];
        }
      }
    } else if (typeof teacher.subjects === 'object') {
      // Supabase array format: {0: "Math", 1: "English"}
      console.log('📝 Subjects is an object, converting...');
      subjectsList = Object.values(teacher.subjects).filter(s => s && String(s).trim() !== '');
    }

    console.log('- Parsed subjects list:', subjectsList);
    console.log('- Number of subjects:', subjectsList.length);

    // STEP 3: Format subjects for frontend
    const formattedSubjects = subjectsList
      .filter(subject => subject && String(subject).trim() !== '')
      .map((subject, index) => ({
        id: `${teacher.teacher_id}-${index}`,
        subject_name: String(subject).trim(),
        teacher_id: teacher.teacher_id,
        teaching_type: teacher.teaching_type
      }));

    console.log('📋 Final formatted subjects:');
    formattedSubjects.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.subject_name} (ID: ${s.id})`);
    });
    console.log('==========================================');

    // STEP 4: Send response
    res.json({
      subjects: formattedSubjects,
      teacher_name: teacher.full_name,
      teaching_type: teacher.teaching_type
    });

  } catch (error) {
    console.error('❌ Subjects endpoint error:', error);
    res.status(500).json({
      message: 'Failed to fetch subjects',
      subjects: [],
      teacher_name: '',
      teaching_type: '',
      error: error.message
    });
  }
});

// =============================================
// GET STUDENTS FOR SUBJECT
// =============================================
router.get('/teacher/attendance/students', async (req, res) => {
  try {
    const { subject_name } = req.query;

    console.log('==========================================');
    console.log('👥 FETCHING STUDENTS');
    console.log('Subject requested:', subject_name);
    console.log('Teacher email:', req.user.email);

    if (!subject_name) {
      return res.status(400).json({
        message: 'Subject name is required',
        students: []
      });
    }

    // Get teacher info first
    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id, subjects, teaching_type')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (teacherError || !teacher) {
      console.error('Teacher not found:', teacherError);
      return res.status(403).json({
        message: 'Teacher not authorized',
        students: []
      });
    }

    // Verify teacher teaches this subject
    let teacherSubjects = [];
    if (Array.isArray(teacher.subjects)) {
      teacherSubjects = teacher.subjects.map(s => String(s).toLowerCase().trim());
    }

    const normalizedRequestedSubject = subject_name.toLowerCase().trim();
    const teachesSubject = teacherSubjects.some(s => s === normalizedRequestedSubject);

    if (!teachesSubject) {
      console.warn('⚠️ Teacher does not teach this subject');
      return res.status(403).json({
        message: 'You are not assigned to teach this subject',
        students: []
      });
    }

    // Get all approved students
    const { data: allStudents, error: studentsError } = await supabase
      .from('approved_students')
      .select('*')
      .eq('registration_status', 'approved')
      .order('full_name');

    if (studentsError) {
      throw studentsError;
    }

    console.log(`Total approved students: ${allStudents?.length || 0}`);

    // Filter students who have this subject
    const matchingStudents = (allStudents || []).filter(student => {
      let studentSubjects = [];
      
      if (Array.isArray(student.subjects)) {
        studentSubjects = student.subjects.map(s => String(s).toLowerCase().trim());
      } else if (typeof student.subjects === 'string') {
        try {
          const parsed = JSON.parse(student.subjects);
          studentSubjects = Array.isArray(parsed) 
            ? parsed.map(s => String(s).toLowerCase().trim())
            : [String(student.subjects).toLowerCase().trim()];
        } catch {
          studentSubjects = student.subjects.split(',')
            .map(s => String(s).toLowerCase().trim())
            .filter(s => s);
        }
      }

      const hasSubject = studentSubjects.includes(normalizedRequestedSubject);
      
      // Check teaching type match
      let typeMatch = true;
      if (teacher.teaching_type !== 'both' && student.class_type !== 'both') {
        typeMatch = teacher.teaching_type === student.class_type;
      }

      return hasSubject && typeMatch;
    });

    console.log(`Matching students found: ${matchingStudents.length}`);

    const formattedStudents = matchingStudents.map(student => ({
      id: student.id,
      student_id: student.user_id || student.id,
      full_name: student.full_name,
      student_number: student.student_number || '',
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      class_type: student.class_type || 'regular',
      birth_date: student.birth_date || ''
    }));

    console.log('==========================================');

    res.json({
      students: formattedStudents,
      subject_name,
      total_found: formattedStudents.length
    });

  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({
      message: 'Failed to fetch students',
      students: [],
      error: error.message
    });
  }
});

// =============================================
// SUBMIT ATTENDANCE
// =============================================
router.post('/teacher/attendance/submit', async (req, res) => {
  try {
    const { subject_name, date, records } = req.body;

    console.log('📝 Submitting attendance:', { subject_name, date, recordCount: records?.length });

    // Get teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name, email, teaching_type')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (teacherError || !teacher) {
      return res.status(403).json({ message: 'Teacher not authorized' });
    }

    if (!subject_name || !date || !records?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check for existing attendance
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('teacher_id', teacher.teacher_id)
      .eq('subject_name', subject_name)
      .eq('date', date);

    if (existing?.length > 0) {
      return res.status(409).json({
        message: 'Attendance already marked for this subject and date'
      });
    }

    // Prepare records
    const attendanceRecords = records.map(record => ({
      teacher_id: teacher.teacher_id,
      teacher_name: teacher.full_name,
      teacher_email: teacher.email,
      student_id: record.student_id,
      student_name: record.student_name,
      student_number: record.student_number || null,
      student_email: record.email || null,
      subject_name,
      class_type: record.class_type || 'regular',
      teaching_type: teacher.teaching_type,
      date,
      status: record.status || 'present',
      time_in: record.time_in || null,
      notes: record.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log(`✅ Inserted ${data.length} attendance records`);

    res.status(201).json({
      message: `Attendance marked for ${data.length} students`,
      count: data.length,
      records: data
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({
      message: error.message || 'Failed to submit attendance',
      error: error.message
    });
  }
});

// =============================================
// GET ATTENDANCE RECORDS
// =============================================
router.get('/teacher/attendance/records', async (req, res) => {
  try {
    const { date, subject_name } = req.query;

    const { data: teacher } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found', records: [] });
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('teacher_id', teacher.teacher_id)
      .order('date', { ascending: false })
      .order('student_name', { ascending: true });

    if (date) query = query.eq('date', date);
    if (subject_name) query = query.eq('subject_name', subject_name);

    const { data: records, error } = await query;

    if (error) throw error;

    console.log(`📋 Fetched ${records?.length || 0} attendance records`);
    res.json({ records: records || [] });

  } catch (error) {
    console.error('Records fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch records', records: [] });
  }
});

// =============================================
// UPDATE ATTENDANCE RECORD
// =============================================
router.put('/teacher/attendance/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, time_in, notes } = req.body;

    const { data: teacher } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (!teacher) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Verify record belongs to this teacher
    const { data: record } = await supabase
      .from('attendance')
      .select('teacher_id')
      .eq('id', id)
      .single();

    if (!record || record.teacher_id !== teacher.teacher_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {
      ...(status && { status }),
      ...(time_in !== undefined && { time_in }),
      ...(notes !== undefined && { notes }),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('attendance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Record updated', record: data });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update record' });
  }
});

// =============================================
// GET ATTENDANCE STATISTICS
// =============================================
router.get('/teacher/attendance/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: teacher } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (!teacher) {
      return res.json({
        stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0 }
      });
    }

    const { data: records, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('teacher_id', teacher.teacher_id)
      .eq('date', today);

    if (error) throw error;

    const data = records || [];
    const stats = {
      total: data.length,
      present: data.filter(r => r.status === 'present').length,
      absent: data.filter(r => r.status === 'absent').length,
      late: data.filter(r => r.status === 'late').length,
      excused: data.filter(r => r.status === 'excused').length,
      attendanceRate: data.length > 0
        ? Math.round((data.filter(r => ['present', 'late'].includes(r.status)).length / data.length) * 100)
        : 0
    };

    res.json({ stats });

  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      stats: { total: 0, present: 0, absent: 0, late: 0, excused: 0, attendanceRate: 0 }
    });
  }
});

// =============================================
// EXPORT ATTENDANCE
// =============================================
router.get('/teacher/attendance/export', async (req, res) => {
  try {
    const { date, subject_name } = req.query;

    const { data: teacher } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name')
      .eq('email', req.user.email)
      .single();

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('teacher_id', teacher.teacher_id)
      .order('date', { ascending: false });

    if (date) query = query.eq('date', date);
    if (subject_name) query = query.eq('subject_name', subject_name);

    const { data: records, error } = await query;
    if (error) throw error;

    const BOM = '\uFEFF';
    const headers = 'Date,Student Name,Student Number,Email,Subject,Status,Time In,Notes\n';
    const rows = (records || []).map(r => 
      [
        r.date || '',
        `"${(r.student_name || '').replace(/"/g, '""')}"`,
        r.student_number || '',
        r.student_email || '',
        `"${(r.subject_name || '').replace(/"/g, '""')}"`,
        r.status || '',
        r.time_in || '',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',')
    ).join('\n');

    const csv = BOM + headers + rows;
    const filename = `attendance_${teacher.full_name.replace(/\s+/g, '_')}_${date || 'all'}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Export failed' });
  }
});

// =============================================
// DEBUG: CHECK TEACHER DATA
// =============================================
router.get('/debug/check-teacher', async (req, res) => {
  try {
    const { data: teacher, error } = await supabase
      .from('approved_teachers')
      .select('*')
      .eq('email', req.user.email)
      .maybeSingle();

    res.json({
      authenticated_email: req.user.email,
      teacher_exists: !!teacher,
      teacher_data: teacher ? {
        teacher_id: teacher.teacher_id,
        email: teacher.email,
        full_name: teacher.full_name,
        subjects: teacher.subjects,
        subjects_type: typeof teacher.subjects,
        is_array: Array.isArray(teacher.subjects),
        approval_status: teacher.approval_status,
        teaching_type: teacher.teaching_type
      } : null,
      error: error?.message || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;