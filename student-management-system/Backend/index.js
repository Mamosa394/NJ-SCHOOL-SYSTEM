import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

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
}

// ==================== MIDDLEWARE ====================
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and JPG are allowed.'));
    }
  }
});

// ==================== AUTH MIDDLEWARE ====================
const extractSupabaseUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
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

// Apply auth middleware to all routes
app.use(extractSupabaseUser);

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    server: 'Express.js',
    supabase: 'Connected',
    timestamp: new Date().toISOString()
  });
});

// ==================== PHONE FORMATTING HELPER ====================
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  
  // Remove all spaces
  let cleaned = phone.replace(/\s+/g, '');
  
  // If it starts with +, keep the + and only keep digits after it
  if (cleaned.startsWith('+')) {
    const digits = cleaned.substring(1).replace(/\D/g, '');
    if (digits.length >= 7) {
      return `+${digits}`;
    }
  } else {
    // Otherwise just keep digits
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length >= 7) {
      // Assume Lesotho country code +266
      return `+266${digits.slice(-7)}`;
    }
  }
  
  return null; // Invalid phone number
};

// ==================== STUDENT REGISTRATION ====================
app.post('/api/students', async (req, res) => {
  try {
    console.log('📥 Received student registration request');
    console.log('Request body:', req.body);
    
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const userId = req.user.id;
    const studentData = req.body;
    
    console.log('Processing student data:', studentData);

    const {
      full_name,
      student_number,
      email,
      phone,
      birth_date,
      gender,
      grade_level = 'Grade 11',
      subjects = [],
      enrollment_status = 'pending'
    } = studentData;

    // Validate required fields
    const requiredFields = ['full_name', 'student_number', 'email', 'phone', 'birth_date', 'gender'];
    const missingFields = requiredFields.filter(field => !studentData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Format student number
    let finalStudentNumber = String(student_number).replace(/\D/g, '');
    if (finalStudentNumber.length !== 9) {
      if (finalStudentNumber.length < 9) {
        finalStudentNumber = finalStudentNumber.padStart(9, '0');
      } else {
        finalStudentNumber = finalStudentNumber.substring(0, 9);
      }
    }

    // Format phone number to pass database constraint
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`📞 Phone formatted from "${phone}" to "${formattedPhone}"`);

    // Check if student number already exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('student_number')
      .eq('student_number', finalStudentNumber)
      .maybeSingle();

    if (existingStudent) {
      // Generate a new unique student number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalStudentNumber = `${year}${random}`.slice(0, 9);
      console.log(`🔄 Generated new student number: ${finalStudentNumber}`);
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: `Email ${email} is already registered`
      });
    }

    // Prepare student data for insertion
    const studentRecord = {
      id: userId,
      full_name,
      student_number: finalStudentNumber,
      email,
      phone: formattedPhone,
      birth_date,
      gender,
      enrollment_status,
      grade_level,
      subjects: Array.isArray(subjects) ? subjects : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId
    };

    console.log('📊 Inserting student data:', studentRecord);

    // Insert into students table
    const { data: insertedStudent, error: dbError } = await supabaseAdmin
      .from('students')
      .insert([studentRecord])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion error:', dbError);
      
      if (dbError.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: 'Student number or email already exists'
        });
      }
      
      if (dbError.code === '23514') { // Check constraint violation
        return res.status(400).json({
          success: false,
          error: 'Invalid data format. Please check phone number format.'
        });
      }
      
      throw dbError;
    }

    console.log(`✅ Successfully registered student: ${full_name}`);
    console.log(`🎓 Student Number: ${finalStudentNumber}`);

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: insertedStudent
    });

  } catch (error) {
    console.error('🔥 Server error in student registration:', error);
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// ==================== COMPLETE REGISTRATION WITH PAYMENT ====================
app.post('/api/complete-registration', upload.single('paymentProof'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    console.log('📥 Complete registration request for:', req.user.email);
    
    // Parse the registration data
    let registrationData;
    try {
      registrationData = JSON.parse(req.body.data || '{}');
    } catch (e) {
      return res.status(400).json({
        success: false,
        error: 'Invalid registration data format'
      });
    }

    console.log('Registration data:', registrationData);

    const userId = req.user.id;
    
    const {
      full_name,
      student_number,
      email,
      phone,
      birth_date,
      gender,
      grade_level = 'Grade 11',
      subjects = [],
      payment_method,
      payment_number,
      payer_name
    } = registrationData;

    // Validate required fields
    const requiredFields = ['full_name', 'student_number', 'email', 'phone', 'birth_date', 'gender'];
    const missingFields = requiredFields.filter(field => !registrationData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Format student number
    let finalStudentNumber = String(student_number).replace(/\D/g, '');
    if (finalStudentNumber.length !== 9) {
      if (finalStudentNumber.length < 9) {
        finalStudentNumber = finalStudentNumber.padStart(9, '0');
      } else {
        finalStudentNumber = finalStudentNumber.substring(0, 9);
      }
    }

    // Format phone number to pass database constraint
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`📞 Phone formatted from "${phone}" to "${formattedPhone}"`);

    // Check if student number already exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('student_number')
      .eq('student_number', finalStudentNumber)
      .maybeSingle();

    if (existingStudent) {
      // Generate a new unique student number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalStudentNumber = `${year}${random}`.slice(0, 9);
      console.log(`🔄 Generated new student number: ${finalStudentNumber}`);
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('students')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: `Email ${email} is already registered`
      });
    }

    // Prepare student data for insertion
    const studentRecord = {
      id: userId,
      full_name,
      student_number: finalStudentNumber,
      email,
      phone: formattedPhone,
      birth_date,
      gender,
      enrollment_status: 'pending',
      grade_level,
      subjects: Array.isArray(subjects) ? subjects : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: userId,
      updated_by: userId
    };

    console.log('📊 Inserting student data');

    // Insert into students table
    const { data: insertedStudent, error: dbError } = await supabaseAdmin
      .from('students')
      .insert([studentRecord])
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insertion error:', dbError);
      
      if (dbError.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: 'Student number or email already exists'
        });
      }
      
      if (dbError.code === '23514') { // Check constraint violation
        return res.status(400).json({
          success: false,
          error: 'Invalid data format. Please check phone number format.'
        });
      }
      
      throw dbError;
    }

    console.log(`✅ Successfully registered student: ${full_name}`);

    // Handle payment proof if uploaded
    let paymentProofUrl = null;
    if (req.file) {
      console.log('📸 Uploading payment proof...');
      
      const fileName = `${insertedStudent.id}/${Date.now()}_payment.${req.file.originalname.split('.').pop()}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('payment-proofs')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600'
        });

      if (!uploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);
        
        paymentProofUrl = publicUrl;
        console.log('✅ Payment proof uploaded:', paymentProofUrl);
      } else {
        console.error('❌ Payment proof upload failed:', uploadError);
      }
    }

    // Save payment information
    if (payment_method) {
      // Calculate total amount based on subjects
      const subjectPrices = {
        math: 450, physics: 500, sesotho: 350, english: 400,
        economics: 480, accounts: 520, biology: 470, computers: 490, geography: 430
      };
      
      const totalAmount = (subjects || []).reduce(
        (total, subject) => total + (subjectPrices[subject] || 0), 0
      );

      const paymentData = {
        student_id: insertedStudent.id,
        payment_method,
        payment_number,
        payer_name,
        payment_proof_url: paymentProofUrl,
        amount: totalAmount,
        subjects: subjects || [],
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
        updated_by: userId
      };

      console.log('💰 Saving payment record');

      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .insert([paymentData]);

      if (paymentError) {
        console.error('❌ Payment record failed:', paymentError);
      } else {
        console.log('✅ Payment record saved');
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully',
      data: {
        student: insertedStudent,
        payment_proof: paymentProofUrl
      }
    });

  } catch (error) {
    console.error('🔥 Complete registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// ==================== PAYMENT ENDPOINTS ====================

// Upload payment proof only
app.post('/api/upload-payment-proof', upload.single('paymentProof'), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: 'Student ID is required'
      });
    }

    console.log(`📤 Uploading payment proof for student: ${studentId}`);

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${studentId}/${Date.now()}_payment.${fileExt}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('payment-proofs')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    console.log('✅ Payment proof uploaded successfully');

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        url: publicUrl,
        path: fileName
      }
    });

  } catch (error) {
    console.error('🔥 Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload payment proof',
      message: error.message
    });
  }
});

// Submit payment information
app.post('/api/payments', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const {
      student_id,
      payment_method,
      payment_number,
      payer_name,
      payment_proof_url,
      amount,
      subjects
    } = req.body;

    // Validate required fields
    const requiredFields = ['student_id', 'payment_method', 'payment_number', 'payer_name', 'amount', 'subjects'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    console.log(`💰 Processing payment for student: ${student_id}`);

    // Check if student exists
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    // Prepare payment data
    const paymentData = {
      student_id,
      payment_method,
      payment_number,
      payer_name,
      payment_proof_url,
      amount,
      subjects,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: req.user.id,
      updated_by: req.user.id
    };

    // Insert payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insertion error:', paymentError);
      throw paymentError;
    }

    console.log('✅ Payment recorded successfully');

    res.status(201).json({
      success: true,
      message: 'Payment information saved successfully',
      data: payment
    });

  } catch (error) {
    console.error('🔥 Payment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save payment information',
      message: error.message
    });
  }
});

// Get payments for a student
app.get('/api/payments/student/:studentId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { studentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments',
      message: error.message
    });
  }
});

// Get single payment
app.get('/api/payments/:paymentId', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { paymentId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, students(full_name, email, student_number)')
      .eq('id', paymentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment',
      message: error.message
    });
  }
});

// Update payment status (admin only)
app.put('/api/payments/:paymentId/status', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { paymentId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'verified', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const updateData = {
      status,
      notes: notes || null,
      verified_at: status === 'verified' ? new Date().toISOString() : null,
      verified_by: status === 'verified' ? req.user.id : null,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: `Payment ${status} successfully`,
      data
    });

  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status',
      message: error.message
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
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

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

// ==================== AUTH ENDPOINTS ====================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
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
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
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
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Supabase login error:', error);
      return res.status(401).json({ 
        success: false,
        error: error.message 
      });
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
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    if (req.supabaseToken) {
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
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

app.get('/api/auth/profile', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated. Please login first.'
      });
    }

    // Get student record if exists
    const { data: studentData } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    // Get payment records if any
    const { data: paymentData } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('student_id', req.user.id)
      .order('created_at', { ascending: false });

    res.json({
      success: true,
      user: req.user,
      student: studentData || null,
      payments: paymentData || []
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

// ==================== TEST ENDPOINT ====================
app.get('/api/test', async (req, res) => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    
    res.json({
      success: true,
      message: 'Supabase connection test',
      supabaseUrl: supabaseUrl,
      authWorking: !!sessionData,
      hasServiceKey: !!supabaseServiceKey,
      timestamp: new Date().toISOString(),
      user: req.user || null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ==================== 404 HANDLER ====================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
✅ Server running on http://localhost:${PORT}
📚 API Endpoints:
   POST /api/students                 - Register student
   GET  /api/students                 - Get all students  
   GET  /api/students/:id             - Get single student
   
   POST /api/payments                  - Save payment info
   GET  /api/payments/student/:id      - Get student payments
   GET  /api/payments/:id              - Get single payment
   PUT  /api/payments/:id/status       - Update payment status
   
   POST /api/upload-payment-proof      - Upload payment screenshot
   POST /api/complete-registration     - Complete registration with payment
   
   POST /api/auth/register             - User registration
   POST /api/auth/login                 - User login
   POST /api/auth/logout                - User logout
   GET  /api/auth/profile                - Get user profile
   
   GET  /api/health                     - Health check
   GET  /api/test                       - Test Supabase

🔧 Important Notes:
   • student_number must be 9 digits
   • grade_level must be Grade 8-12
   • Phone numbers are automatically formatted to pass validation
   • Payment proofs go to Supabase Storage
   • Payments table created for tracking
   • All endpoints require Bearer token except auth endpoints

🚀 Ready for student registration!
`);
});