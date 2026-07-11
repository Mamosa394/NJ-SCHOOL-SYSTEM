// src/routes/TAttendanceRoutes.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

router.use(authMiddleware);

// ============ TEACHER ROUTES ============

// Get teacher profile
router.get('/teacher/profile', async (req, res) => {
  try {
    console.log('Fetching teacher profile for:', req.user.email);
    
    const { data: teacher, error } = await supabase
      .from('approved_teachers')
      .select('*')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (error || !teacher) {
      console.error('Teacher profile error:', error);
      return res.status(404).json({ message: 'Teacher not found or not approved' });
    }

    console.log('Teacher profile found:', teacher.teacher_id);
    res.json({ teacher });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Get teacher's subjects - FIXED
router.get('/teacher/attendance/subjects', async (req, res) => {
  try {
    console.log('Fetching subjects for teacher:', req.user.email);
    
    const { data: teacher, error } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name, subjects, teaching_type')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (error) {
      console.error('Teacher fetch error:', error);
      return res.status(404).json({ 
        message: 'Teacher not found or not approved', 
        subjects: [],
        teacher_name: '',
        teaching_type: ''
      });
    }

    if (!teacher) {
      console.error('No teacher found');
      return res.status(404).json({ 
        message: 'Teacher not found', 
        subjects: [],
        teacher_name: '',
        teaching_type: ''
      });
    }

    console.log('Teacher found:', teacher.teacher_id, 'Teaching type:', teacher.teaching_type);
    console.log('Raw subjects data:', teacher.subjects, 'Type:', typeof teacher.subjects);

    let subjectsList = [];
    if (teacher.subjects) {
      // Handle different data formats
      if (typeof teacher.subjects === 'string') {
        try {
          // Try parsing as JSON array first
          const parsed = JSON.parse(teacher.subjects);
          if (Array.isArray(parsed)) {
            subjectsList = parsed;
          } else {
            subjectsList = [teacher.subjects];
          }
        } catch {
          // If not JSON, check if it's comma-separated
          if (teacher.subjects.includes(',')) {
            subjectsList = teacher.subjects.split(',').map(s => s.trim());
          } else {
            subjectsList = [teacher.subjects.trim()];
          }
        }
      } else if (Array.isArray(teacher.subjects)) {
        subjectsList = teacher.subjects;
      }
    }

    console.log('Parsed subjects list:', subjectsList);

    const formattedSubjects = subjectsList
      .filter(subject => subject && subject.toString().trim() !== '')
      .map((subject, index) => ({
        id: `${teacher.teacher_id}-${index}`,
        subject_name: typeof subject === 'string' ? subject.trim() : subject.toString().trim(),
        teacher_id: teacher.teacher_id,
        teaching_type: teacher.teaching_type
      }));

    console.log('Formatted subjects:', formattedSubjects);
    console.log('Total subjects found:', formattedSubjects.length);

    res.json({ 
      subjects: formattedSubjects,
      teacher_name: teacher.full_name,
      teaching_type: teacher.teaching_type
    });
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch subjects', 
      subjects: [],
      teacher_name: '',
      teaching_type: '',
      error: error.message 
    });
  }
});

// Get students for a specific subject - FIXED
router.get('/teacher/attendance/students', async (req, res) => {
  try {
    const { subject_name } = req.query;

    console.log('==========================================');
    console.log('Fetching students for subject:', subject_name);
    console.log('Teacher email:', req.user.email);

    if (!subject_name) {
      console.error('No subject name provided');
      return res.status(400).json({ 
        message: 'Subject name is required',
        students: [],
        total_found: 0
      });
    }

    // Get teacher info first
    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name, subjects, teaching_type')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (teacherError || !teacher) {
      console.error('Teacher not found:', teacherError);
      return res.status(403).json({ 
        message: 'Teacher not authorized',
        students: [],
        total_found: 0
      });
    }

    console.log('Teacher found:', {
      id: teacher.teacher_id,
      name: teacher.full_name,
      teaching_type: teacher.teaching_type
    });

    // Get ALL approved students
    const { data: allStudents, error: fetchError } = await supabase
      .from('approved_students')
      .select('*')
      .eq('registration_status', 'approved')
      .order('full_name');

    if (fetchError) {
      console.error('Students fetch error:', fetchError);
      return res.status(500).json({ 
        message: 'Error fetching students',
        students: [],
        total_found: 0
      });
    }

    console.log(`Total approved students in database: ${allStudents?.length || 0}`);

    if (!allStudents || allStudents.length === 0) {
      console.log('No approved students found in the system');
      return res.json({ 
        students: [], 
        subject_name, 
        total_found: 0,
        message: 'No approved students found in the system'
      });
    }

    // Log first few students for debugging
    if (allStudents.length > 0) {
      console.log('Sample student data:');
      allStudents.slice(0, 3).forEach(student => {
        console.log(`- ${student.full_name}: Subjects: ${JSON.stringify(student.subjects)}, Class: ${student.class_type}`);
      });
    }

    // Filter students by subject and class_type
    const filteredStudents = allStudents.filter(student => {
      try {
        let studentSubjects = [];
        
        if (!student.subjects) {
          return false;
        }

        // Parse student subjects
        if (typeof student.subjects === 'string') {
          try {
            const parsed = JSON.parse(student.subjects);
            if (Array.isArray(parsed)) {
              studentSubjects = parsed;
            } else {
              studentSubjects = [student.subjects];
            }
          } catch {
            // Try comma-separated
            if (student.subjects.includes(',')) {
              studentSubjects = student.subjects.split(',').map(s => s.trim());
            } else {
              studentSubjects = [student.subjects.trim()];
            }
          }
        } else if (Array.isArray(student.subjects)) {
          studentSubjects = student.subjects;
        }

        // Clean and normalize subjects
        studentSubjects = studentSubjects
          .filter(s => s && s.toString().trim() !== '')
          .map(s => s.toString().trim());

        // Check if student has the subject
        const targetSubject = subject_name.toLowerCase().trim();
        const hasSubject = studentSubjects.some(s => {
          const studentSubject = s.toLowerCase().trim();
          return studentSubject === targetSubject || 
                 studentSubject.includes(targetSubject) || 
                 targetSubject.includes(studentSubject);
        });

        // Check class type match
        let matchesClassType = false;
        if (!teacher.teaching_type || teacher.teaching_type === 'both') {
          matchesClassType = true;
        } else if (!student.class_type || student.class_type === 'both') {
          matchesClassType = true;
        } else {
          matchesClassType = student.class_type === teacher.teaching_type;
        }

        const matches = hasSubject && matchesClassType;
        
        if (!hasSubject && studentSubjects.length > 0) {
          console.log(`Student ${student.full_name} excluded - Subject mismatch. Student subjects: [${studentSubjects.join(', ')}], Looking for: ${targetSubject}`);
        }
        
        if (!matchesClassType) {
          console.log(`Student ${student.full_name} excluded - Class type mismatch. Student: ${student.class_type}, Teacher: ${teacher.teaching_type}`);
        }

        return matches;
      } catch (err) {
        console.error('Error filtering student:', student.full_name, err);
        return false;
      }
    });

    console.log(`Filtered students count: ${filteredStudents.length}`);
    
    // Log filtered students
    if (filteredStudents.length > 0) {
      console.log('Matching students:');
      filteredStudents.forEach(student => {
        console.log(`- ${student.full_name} (${student.student_number || 'No ID'}) - Class: ${student.class_type}`);
      });
    } else {
      console.log('NO students matched the criteria');
    }

    const formattedStudents = filteredStudents.map(student => ({
      id: student.id,
      student_id: student.user_id || student.id,
      full_name: student.full_name,
      student_number: student.student_number || '',
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || '',
      class_type: student.class_type || 'regular',
      birth_date: student.birth_date || '',
      subjects: student.subjects
    }));

    console.log('==========================================');
    console.log(`Returning ${formattedStudents.length} students`);

    res.json({ 
      students: formattedStudents,
      subject_name,
      total_found: formattedStudents.length,
      teaching_type: teacher.teaching_type,
      message: formattedStudents.length === 0 ? 
        `No students found for ${subject_name}. Check if students are registered for this subject and class type matches.` : 
        undefined
    });
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch students', 
      students: [],
      total_found: 0,
      error: error.message 
    });
  }
});

// Submit attendance - FIXED
router.post('/teacher/attendance/submit', async (req, res) => {
  try {
    const { subject_name, date, records } = req.body;

    console.log('==========================================');
    console.log('Submitting attendance:');
    console.log('- Subject:', subject_name);
    console.log('- Date:', date);
    console.log('- Records count:', records?.length);

    // Validate teacher
    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('*')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (teacherError || !teacher) {
      console.error('Teacher validation failed:', teacherError);
      return res.status(403).json({ 
        message: 'Teacher not found or not approved' 
      });
    }

    console.log('Teacher validated:', teacher.teacher_id);

    if (!subject_name || !date || !records || !Array.isArray(records)) {
      console.error('Missing required fields');
      return res.status(400).json({ 
        message: 'Missing required fields: subject_name, date, records' 
      });
    }

    if (records.length === 0) {
      console.error('No records to submit');
      return res.status(400).json({ 
        message: 'No students to mark attendance for' 
      });
    }

    // Check for existing attendance
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('teacher_id', teacher.teacher_id)
      .eq('subject_name', subject_name)
      .eq('date', date);

    if (existing && existing.length > 0) {
      console.log('Attendance already exists for this date and subject');
      return res.status(409).json({ 
        message: 'Attendance already marked for this subject and date. Please edit existing records instead.' 
      });
    }

    // Prepare attendance records
    const attendanceRecords = records.map(record => ({
      teacher_id: teacher.teacher_id,
      teacher_name: teacher.full_name,
      teacher_email: teacher.email,
      student_id: record.student_id,
      student_name: record.student_name,
      student_number: record.student_number || null,
      student_email: record.email || null,
      subject_name: subject_name,
      class_type: record.class_type || 'regular',
      teaching_type: teacher.teaching_type,
      date: date,
      status: record.status || 'present',
      time_in: record.time_in || null,
      notes: record.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('Prepared records:', attendanceRecords.length);
    console.log('Sample record:', attendanceRecords[0]);

    const { data, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select();

    if (error) {
      console.error('Insert error:', error);
      if (error.code === '23505') {
        return res.status(409).json({ 
          message: 'Some students already have attendance for this date and subject' 
        });
      }
      throw error;
    }

    console.log('Successfully inserted records:', data.length);
    console.log('==========================================');

    res.status(201).json({ 
      message: `Attendance successfully marked for ${data.length} students`,
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

// Get attendance records - FIXED
router.get('/teacher/attendance/records', async (req, res) => {
  try {
    const { date, subject_name } = req.query;

    console.log('Fetching attendance records with filters:', { date, subject_name });

    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (teacherError || !teacher) {
      console.error('Teacher not found:', teacherError);
      return res.status(404).json({ 
        message: 'Teacher not found', 
        records: [] 
      });
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

    if (error) {
      console.error('Records fetch error:', error);
      throw error;
    }

    console.log(`Fetched ${records?.length || 0} attendance records`);
    
    if (records && records.length > 0) {
      console.log('Sample record:', records[0]);
    }

    res.json({ records: records || [] });
  } catch (error) {
    console.error('Records fetch error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch records',
      records: [],
      error: error.message 
    });
  }
});

// Update attendance record
router.put('/teacher/attendance/record/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, time_in, notes } = req.body;

    console.log('Updating record:', id, { status, time_in, notes });

    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (teacherError || !teacher) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { data: record, error: recordError } = await supabase
      .from('attendance')
      .select('teacher_id')
      .eq('id', id)
      .single();

    if (recordError || !record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (record.teacher_id !== teacher.teacher_id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (status && !['present', 'absent', 'late', 'excused'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
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

    if (error) {
      console.error('Update error:', error);
      throw error;
    }

    console.log('Record updated successfully');
    res.json({ message: 'Record updated successfully', record: data });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Failed to update record' });
  }
});

// Get attendance statistics - FIXED
router.get('/teacher/attendance/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log('Fetching stats for date:', today);

    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id')
      .eq('email', req.user.email)
      .single();

    if (teacherError || !teacher) {
      console.log('Teacher not found, returning empty stats');
      return res.json({ 
        stats: { 
          total: 0, 
          present: 0, 
          absent: 0, 
          late: 0, 
          excused: 0, 
          attendanceRate: 0 
        } 
      });
    }

    const { data: records, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('teacher_id', teacher.teacher_id)
      .eq('date', today);

    if (error) {
      console.error('Stats fetch error:', error);
      throw error;
    }

    const data = records || [];
    console.log(`Today's records count: ${data.length}`);

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

    console.log('Stats calculated:', stats);

    res.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.json({ 
      stats: { 
        total: 0, 
        present: 0, 
        absent: 0, 
        late: 0, 
        excused: 0, 
        attendanceRate: 0 
      } 
    });
  }
});

// Export attendance report
router.get('/teacher/attendance/export', async (req, res) => {
  try {
    const { date, subject_name, start_date, end_date } = req.query;

    console.log('Exporting attendance with filters:', { date, subject_name, start_date, end_date });

    const { data: teacher, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('teacher_id, full_name')
      .eq('email', req.user.email)
      .single();

    if (teacherError || !teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    let query = supabase
      .from('attendance')
      .select('*')
      .eq('teacher_id', teacher.teacher_id)
      .order('date', { ascending: false })
      .order('student_name', { ascending: true });

    if (date) query = query.eq('date', date);
    if (subject_name) query = query.eq('subject_name', subject_name);
    if (start_date && end_date) {
      query = query.gte('date', start_date).lte('date', end_date);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error('Export query error:', error);
      throw error;
    }

    console.log(`Exporting ${records?.length || 0} records`);

    const BOM = '\uFEFF';
    const headers = 'Date,Student Name,Student Number,Email,Subject,Class Type,Teaching Type,Status,Time In,Notes\n';
    const rows = (records || []).map(r => {
      return [
        r.date || '',
        `"${(r.student_name || '').replace(/"/g, '""')}"`,
        r.student_number || '',
        r.student_email || '',
        `"${(r.subject_name || '').replace(/"/g, '""')}"`,
        r.class_type || '',
        r.teaching_type || '',
        r.status || '',
        r.time_in || '',
        `"${(r.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    }).join('\n');

    const csv = BOM + headers + rows;

    const filename = `attendance_report_${teacher.full_name.replace(/\s+/g, '_')}_${date || new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Failed to export attendance' });
  }
});

// ============ STUDENT ROUTES ============

// Student views their attendance
router.get('/student/attendance', async (req, res) => {
  try {
    console.log('Fetching student attendance for:', req.user.email);

    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('student_email', req.user.email)
      .order('date', { ascending: false });

    if (error) {
      console.error('Student attendance fetch error:', error);
      throw error;
    }

    const data = records || [];
    console.log(`Found ${data.length} attendance records for student`);
    
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

    const subjectStats = {};
    data.forEach(record => {
      if (!subjectStats[record.subject_name]) {
        subjectStats[record.subject_name] = {
          subject: record.subject_name,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        };
      }
      subjectStats[record.subject_name].total++;
      subjectStats[record.subject_name][record.status]++;
    });

    res.json({ 
      records: data, 
      stats,
      subjectStats: Object.values(subjectStats)
    });
  } catch (error) {
    console.error('Student attendance error:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// Student gets their subjects
router.get('/student/subjects', async (req, res) => {
  try {
    console.log('Fetching subjects for student:', req.user.email);

    const { data: student, error } = await supabase
      .from('approved_students')
      .select('subjects, class_type')
      .eq('email', req.user.email)
      .eq('registration_status', 'approved')
      .single();

    if (error || !student) {
      console.error('Student not found:', error);
      return res.status(404).json({ message: 'Student not found', subjects: [] });
    }

    let subjectsList = [];
    if (student.subjects) {
      if (typeof student.subjects === 'string') {
        try {
          const parsed = JSON.parse(student.subjects);
          subjectsList = Array.isArray(parsed) ? parsed : [student.subjects];
        } catch {
          // Try comma-separated
          if (student.subjects.includes(',')) {
            subjectsList = student.subjects.split(',').map(s => s.trim());
          } else {
            subjectsList = [student.subjects.trim()];
          }
        }
      } else if (Array.isArray(student.subjects)) {
        subjectsList = student.subjects;
      }
    }

    const formattedSubjects = subjectsList
      .filter(subject => subject && subject.toString().trim() !== '')
      .map((subject, index) => ({
        id: `${index}`,
        subject_name: typeof subject === 'string' ? subject.trim() : subject.toString().trim(),
        class_type: student.class_type
      }));

    console.log('Student subjects:', formattedSubjects);

    res.json({ subjects: formattedSubjects });
  } catch (error) {
    console.error('Student subjects error:', error);
    res.status(500).json({ message: 'Failed to fetch subjects', subjects: [] });
  }
});

// ============ DATABASE DIAGNOSTIC ROUTE (For debugging) ============
// This route helps diagnose database issues - Remove in production
router.get('/debug/database-status', async (req, res) => {
  try {
    const { data: teachers, error: teacherError } = await supabase
      .from('approved_teachers')
      .select('count');

    const { data: students, error: studentError } = await supabase
      .from('approved_students')
      .select('count');

    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('count');

    res.json({
      teachers_count: teachers?.[0]?.count || 0,
      students_count: students?.[0]?.count || 0,
      attendance_count: attendance?.[0]?.count || 0,
      errors: {
        teachers: teacherError?.message || null,
        students: studentError?.message || null,
        attendance: attendanceError?.message || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;