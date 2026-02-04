import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== ENVIRONMENT CHECK ====================
console.log('\n🔍 Checking environment...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Required in .env file:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=your-project-url');
  console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log(`🔧 Supabase URL: ${supabaseUrl}`);
console.log(`🔑 Key starts with: ${supabaseAnonKey.substring(0, 10)}...`);

// Initialize Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client (bypasses RLS) - if service key is provided
let supabaseAdmin = supabase;
if (supabaseServiceKey && supabaseServiceKey.trim() !== '') {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  console.log('✅ Service role client initialized (RLS bypass enabled)');
} else {
  console.log('⚠️  No service role key provided. RLS may block operations.');
  console.log('ℹ️  Add SUPABASE_SERVICE_ROLE_KEY to your .env file from Supabase dashboard');
}

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: true, // React frontend
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ==================== AUTH MIDDLEWARE ====================
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

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'Express.js',
    supabase: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// ==================== TEST SCHEMA ENDPOINT ====================
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

// ==================== STUDENT REGISTRATION (FIXED VERSION) ====================
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
      grade_level = 'Grade 10',
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

    // ========== CRITICAL FIX: STUDENT NUMBER FORMAT ==========
    let finalStudentNumber = String(student_number).replace(/\D/g, ''); // Remove non-digits
    
    if (finalStudentNumber.length !== 9) {
      console.log(`⚠️ Student number "${student_number}" is ${finalStudentNumber.length} digits, needs to be 9`);
      
      // Pad with zeros to make 9 digits
      if (finalStudentNumber.length < 9) {
        finalStudentNumber = finalStudentNumber.padStart(9, '0');
      }
      // If longer than 9, truncate
      else if (finalStudentNumber.length > 9) {
        finalStudentNumber = finalStudentNumber.substring(0, 9);
      }
      
      console.log(`✅ Formatted student number: ${finalStudentNumber}`);
    }

    // ========== CRITICAL FIX: GRADE LEVEL VALIDATION ==========
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
      .eq('student_number', finalStudentNumber)
      .maybeSingle();

    if (checkError) {
      console.log('❌ Error checking student number:', checkError);
    }

    if (existingStudent) {
      console.log(`❌ Student number ${finalStudentNumber} already exists`);
      
      // Generate a new unique student number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      finalStudentNumber = `${year}${random}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`.slice(0, 9);
      console.log(`🔄 Generated new student number: ${finalStudentNumber}`);
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
          student_number: finalStudentNumber,
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
    
    // Prepare student data - FIX: Remove grade_numeric (it's generated)
    const studentData = {
      id: userId,
      full_name,
      student_number: finalStudentNumber,
      email,
      phone: phone || null,
      birth_date: birth_date || null,
      gender,
      enrollment_status,
      grade_level: finalGradeLevel, // Use validated grade level
      // ⚠️ DO NOT include grade_numeric - it's generated by database
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

    console.log('📊 Student data to insert:', JSON.stringify({
      id: studentData.id,
      full_name: studentData.full_name,
      student_number: studentData.student_number,
      email: studentData.email,
      grade_level: studentData.grade_level,
      gender: studentData.gender
    }, null, 2));

    // Try insertion with admin client (bypasses RLS)
    let studentRecord;
    let dbError;
    
    try {
      const result = await supabaseAdmin
        .from('students')
        .insert([studentData])
        .select()
        .single();
      
      studentRecord = result.data;
      dbError = result.error;
    } catch (error) {
      dbError = error;
    }

    if (dbError) {
      console.log('❌ Database insertion error:', dbError);
      console.log('Full error details:', JSON.stringify(dbError, null, 2));
      
      // Special handling for generated column error
      if (dbError.message.includes('generated column') || dbError.message.includes('grade_numeric')) {
        console.log('⚠️ grade_numeric is a generated column, trying without it...');
        
        // Ensure grade_numeric is not in the data
        const { grade_numeric, ...dataWithoutGradeNumeric } = studentData;
        
        const retryResult = await supabaseAdmin
          .from('students')
          .insert([dataWithoutGradeNumeric])
          .select()
          .single();
          
        if (retryResult.error) {
          throw retryResult.error;
        }
        
        studentRecord = retryResult.data;
        console.log('✅ Inserted without grade_numeric');
      } else {
        throw dbError;
      }
    }

    console.log(`✅ Successfully registered student: ${full_name}`);
    console.log(`🎓 Student ID: ${userId}`);
    console.log(`📚 Grade: ${finalGradeLevel}`);
    console.log(`🔢 Student Number: ${finalStudentNumber}`);

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
      note: 'Registration completed successfully'
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

// ==================== GET ALL STUDENTS ====================
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

// ==================== GET SINGLE STUDENT ====================
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

// ==================== UPDATE STUDENT ====================
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

// ==================== DELETE STUDENT ====================
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

// ==================== DEBUG ENDPOINTS ====================

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
      student_number: '202400001',
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

// ==================== AUTH ENDPOINTS ====================
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

// ==================== TEST SUPABASE CONNECTION ====================
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

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
✅ Server running on http://localhost:${PORT}
📚 API Endpoints:
   POST /api/students      - Register student
   GET  /api/students      - Get all students  
   GET  /api/students/:id  - Get single student
   PUT  /api/students/:id  - Update student
   DELETE /api/students/:id - Delete student
   POST /api/auth/register - User registration
   POST /api/auth/login    - User login
   GET  /api/health        - Health check
   GET  /api/test          - Test Supabase

🔧 Important Notes:
   • student_number must be 9 digits
   • grade_level must be Grade 8-12
   • grade_numeric is auto-generated (don't send it)
   • Add SUPABASE_SERVICE_ROLE_KEY to .env for RLS bypass

🚀 Ready for student registration!
`);
});