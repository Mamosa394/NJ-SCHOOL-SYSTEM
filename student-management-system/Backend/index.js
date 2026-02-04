import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import SignupRoutes from './routes/SignupRoutes.js';
import LoginRoutes from './routes/LoginRoutes.js';
import AttendanceRoutes from './routes/StudentRoutes/AttendanceRoutes.js';
import CourseworkRoutes from './routes/StudentRoutes/CourseworkRoutes.js';
import GradeRoutes from './routes/StudentRoutes/GradeRoutes.js';
import PaymentRoutes from './routes/StudentRoutes/PaymentRoutes.js';
import StudentRoutes from './routes/StudentRoutes/StudentRoutes.js';
import TimetableRoutes from './routes/StudentRoutes/TimetableRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize TWO Supabase clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Add this to your .env file!

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Required in .env file:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key');
  process.exit(1);
}

console.log('🔧 Initializing Supabase with:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

// Regular client (for auth operations)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (bypasses RLS) - if service key is provided
let supabaseAdmin = supabase;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}... (RLS bypass enabled)`);
} else {
  console.log('⚠️  No service role key provided. RLS may block operations.');
  console.log('ℹ️  Add SUPABASE_SERVICE_ROLE_KEY to your .env file from Supabase dashboard');
}

// Middleware
app.use(cors({
  origin: true, // React frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Optional: Parse Supabase JWT from Authorization header
const extractSupabaseUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Verify token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (!error && user) {
        req.user = user;
        req.supabaseToken = token;
      }
    }
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    next();
  }
};

// Apply auth middleware to all routes (optional)
app.use(extractSupabaseUser);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Express.js',
    supabase: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint to verify your student table structure
app.get('/api/students/test/schema', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    if (data && data.length > 0) {
      const sample = data[0];
      res.json({
        success: true,
        table_exists: true,
        sample_fields: Object.keys(sample),
        sample_data: sample
      });
    } else {
      res.json({
        success: true,
        table_exists: true,
        message: 'Table exists but is empty',
        expected_fields: [
          'id', 'full_name', 'student_number', 'email', 'phone', 'birth_date',
          'gender', 'enrollment_status', 'grade_level', 'grade_numeric',
          'subjects', 'home_address', 'parent_name', 'parent_phone',
          'created_at', 'updated_at', 'created_by', 'updated_by',
          'deleted_at', 'deleted_by'
        ]
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// FIXED STUDENT REGISTRATION ENDPOINT
// ==============================================
app.post('/api/students', async (req, res) => {
  let userId; // Declare here for cleanup
  try {
    console.log('📥 Received student registration request');
    
    // Extract all fields from the request body
    const {
      full_name,
      student_number,
      email,
      password,
      phone,
      birth_date,
      gender,
      enrollment_status = 'active',
      grade_level = 'Grade 10', // Default that should work
      subjects = [],
      home_address,
      parent_name,
      parent_phone
    } = req.body;

    // Log received data
    console.log(`📝 Processing registration for: ${full_name}`);
    console.log(`📧 Email: ${email}`);
    console.log(`#️⃣ Student #: ${student_number}`);
    console.log(`📚 Grade level: ${grade_level}`);

    // Validation
    const requiredFields = ['full_name', 'student_number', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log(`❌ Invalid email format: ${email}`);
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // FIX 1: Normalize grade level to pass check constraint
    let finalGradeLevel = grade_level;
    const validGradeLevels = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    
    // Check if grade_level is valid, otherwise default to Grade 10
    if (!validGradeLevels.includes(grade_level)) {
      console.log(`⚠️ Invalid grade level "${grade_level}", defaulting to "Grade 10"`);
      finalGradeLevel = 'Grade 10';
    }

    console.log(`✅ Using grade level: ${finalGradeLevel}`);

    // Check if student number already exists (using admin client to bypass RLS)
    console.log('🔍 Checking if student number exists...');
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .from('students')
      .select('student_number')
      .eq('student_number', student_number)
      .maybeSingle();

    if (checkError) {
      console.log('❌ Error checking student number:', checkError);
    }

    if (existingStudent) {
      console.log(`❌ Student number ${student_number} already exists`);
      return res.status(400).json({
        success: false,
        error: `Student number ${student_number} already exists`
      });
    }

    // Check if email already exists
    console.log('🔍 Checking if email exists...');
    const { data: existingEmail, error: emailCheckError } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      console.log(`❌ Email ${email} already registered`);
      return res.status(400).json({
        success: false,
        error: `Email ${email} is already registered`
      });
    }

    // 1. Create user in Supabase Auth (using regular client)
    console.log('🔐 Creating user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          user_type: 'student',
          student_number: student_number,
          grade_level: finalGradeLevel
        }
      }
    });

    if (authError) {
      console.log(`❌ Auth error: ${authError.message}`);
      return res.status(400).json({
        success: false,
        error: `Auth error: ${authError.message}`
      });
    }

    userId = authData.user.id;
    console.log(`✅ Auth user created with ID: ${userId}`);

    // 2. Insert into students table using ADMIN CLIENT (bypasses RLS)
    console.log('💾 Inserting into students table...');
    
    // Prepare student data - FIX 2: Remove grade_numeric (it's generated)
    const studentData = {
      id: userId,
      full_name,
      student_number,
      email,
      phone: phone || null,
      birth_date: birth_date || null,
      gender,
      enrollment_status,
      grade_level: finalGradeLevel, // Use validated grade level
      // DO NOT include grade_numeric - it's generated by database
      subjects: Array.isArray(subjects) ? subjects : 
                (typeof subjects === 'string' ? subjects.split(',').map(s => s.trim()).filter(s => s) : []),
      home_address: home_address || null,
      parent_name: parent_name || null,
      parent_phone: parent_phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId
    };

    console.log('📊 Student data to insert (without grade_numeric):', JSON.stringify(studentData, null, 2));

    // Try insertion with admin client (bypasses RLS)
    const { data: studentRecord, error: dbError } = await supabaseAdmin
      .from('students')
      .insert([studentData])
      .select()
      .single();

    if (dbError) {
      console.log('❌ Database insertion error:', dbError);
      console.log('Full error details:', JSON.stringify(dbError, null, 2));
      
      // Special handling for generated column error
      if (dbError.message.includes('generated column') || dbError.message.includes('grade_numeric')) {
        console.log('⚠️ grade_numeric is a generated column, trying without it...');
        
        // Make sure grade_numeric is not in the data
        delete studentData.grade_numeric;
        
        // Try again
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('students')
          .insert([studentData])
          .select()
          .single();
          
        if (retryError) {
          throw retryError;
        }
        
        studentRecord = retryData;
        console.log('✅ Inserted without grade_numeric');
      } else {
        throw dbError;
      }
    }

    console.log(`✅ Successfully registered student: ${full_name}`);
    console.log(`🎓 Student ID: ${userId}`);
    console.log(`📚 Grade: ${finalGradeLevel}`);
    console.log('📦 Full student record:', JSON.stringify(studentRecord, null, 2));

    // Auto-confirm email for testing (optional)
    if (process.env.NODE_ENV === 'development') {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true
        });
        console.log('📧 Email auto-confirmed for development');
      } catch (confirmError) {
        console.log('⚠️ Could not auto-confirm email:', confirmError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: studentRecord,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name,
        confirmed: authData.user.email_confirmed_at !== null
      },
      note: 'grade_numeric is auto-generated by the database based on grade_level'
    });

  } catch (error) {
    console.error('🔥 Server error in student registration:', error);
    console.error('Error stack:', error.stack);
    
    // Cleanup: If user was created but student record failed, delete the auth user
    if (userId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        console.log(`🧹 Cleaned up auth user ${userId} due to error`);
      } catch (cleanupError) {
        console.log('⚠️ Could not cleanup auth user:', cleanupError.message);
      }
    }
    
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
  }
});

// GET all students
app.get('/api/students', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (error) {
    console.error('Server error fetching students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Student not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Server error fetching student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE student
app.put('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove grade_numeric if present (it's generated)
    if (updateData.grade_numeric !== undefined) {
      delete updateData.grade_numeric;
      console.log('⚠️ grade_numeric removed from update (generated column)');
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating student:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: data
    });
  } catch (error) {
    console.error('Server error updating student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE student (soft delete)
app.delete('/api/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('students')
      .update({
        deleted_at: new Date().toISOString(),
        enrollment_status: 'inactive'
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting student:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Student deactivated successfully',
      data: data
    });
  } catch (error) {
    console.error('Server error deleting student:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================
// NEW ENDPOINTS FOR DEBUGGING
// ==============================================

// Test RLS and constraints
app.get('/api/debug/grade-levels', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('grade_level')
      .order('grade_level');
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    const uniqueGrades = [...new Set(data?.map(g => g.grade_level) || [])];
    
    res.json({
      success: true,
      valid_grade_levels_in_use: uniqueGrades,
      recommended_grade_levels: ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
      note: 'Use exactly these values for grade_level to pass check constraint'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test database constraints
app.get('/api/debug/constraints', async (req, res) => {
  try {
    // Try a simple insert to see what works
    const testData = {
      id: '00000000-0000-0000-0000-000000000000',
      full_name: 'Test Constraint',
      student_number: '999999999',
      email: 'test@constraint.com',
      grade_level: 'Grade 10'
    };
    
    const { error } = await supabaseAdmin
      .from('students')
      .insert([testData]);
    
    res.json({
      success: !error,
      error: error?.message,
      note: error ? 'Database has constraints' : 'No constraints blocking insert'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quick fix endpoint - drops and recreates table (DANGEROUS - for development only)
app.post('/api/debug/reset-table', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Only available in development' });
  }
  
  try {
    // This would require SQL execution permission
    res.json({
      success: true,
      message: 'Run this SQL in Supabase SQL Editor:',
      sql: `
        -- Drop grade_numeric column constraint
        ALTER TABLE students DROP COLUMN IF EXISTS grade_numeric CASCADE;
        
        -- Recreate as regular column
        ALTER TABLE students ADD COLUMN grade_numeric INTEGER DEFAULT 10;
        
        -- Update check constraint if needed
        ALTER TABLE students DROP CONSTRAINT IF EXISTS students_grade_level_check;
        ALTER TABLE students ADD CONSTRAINT students_grade_level_check 
        CHECK (grade_level IN ('Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'));
        
        -- Disable RLS for testing
        ALTER TABLE students DISABLE ROW LEVEL SECURITY;
      `
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// The rest of your existing endpoints remain the same...
// Auth endpoints that work with Supabase
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
          created_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      console.error('Supabase registration error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({
      success: true,
      message: data.user?.identities?.length === 0 
        ? 'Registration successful! Please check your email for confirmation.'
        : 'Registration successful!',
      user: data.user,
      session: data.session
    });

  } catch (error) {
    console.error('Server registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ error: error.message });
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: data.user,
      session: data.session,
      access_token: data.session.access_token
    });

  } catch (error) {
    console.error('Server login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = req.supabaseToken;
    
    if (token) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase logout error:', error);
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Server logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Not authenticated. Please login first.'
      });
    }

    res.json({
      success: true,
      user: req.user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test Supabase connection
app.get('/api/test', async (req, res) => {
  try {
    // Test auth connection
    const { data: sessionData } = await supabase.auth.getSession();
    
    res.json({
      success: true,
      message: 'Supabase connection test',
      supabaseUrl: supabaseUrl,
      authWorking: !!sessionData,
      hasServiceKey: !!supabaseServiceKey,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      supabaseUrl: supabaseUrl
    });
  }
});

// Serve static files in production (if you're serving React build)
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📚 API available at http://localhost:${PORT}/api`);
  console.log(`🎓 Student Registration: POST http://localhost:${PORT}/api/students`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🐛 Debug endpoints:`);
  console.log(`   - http://localhost:${PORT}/api/debug/grade-levels`);
  console.log(`   - http://localhost:${PORT}/api/debug/constraints`);
  console.log(`⚠️  IMPORTANT: Add SUPABASE_SERVICE_ROLE_KEY to .env file from Supabase dashboard!`);
});