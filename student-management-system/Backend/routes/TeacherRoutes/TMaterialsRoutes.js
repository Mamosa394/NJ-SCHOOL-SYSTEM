import express from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

let supabase;
const getSupabase = async () => {
  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg', 'image/png', 'image/gif',
      'video/mp4', 'application/zip', 'application/epub+zip'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// =============================================
// AUTH MIDDLEWARE
// =============================================
const authenticateUser = async (req, res, next) => {
  try {
    const client = await getSupabase();
    
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await client.auth.getUser(token);
    
    if (error || !user) {
      console.error('Auth error:', error?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    req.user = user;
    req.supabase = client;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

// =============================================
// TEACHER ONLY - CHECK approved_teachers TABLE
// =============================================
const teacherOnly = async (req, res, next) => {
  try {
    const client = req.supabase || await getSupabase();
    
    console.log('🔍 Checking approved_teachers for:', req.user.email);
    
    // ONLY query approved_teachers - NEVER profiles
    const { data: teacher, error } = await client
      .from('approved_teachers')
      .select('*')
      .eq('email', req.user.email)
      .eq('approval_status', 'approved')
      .single();

    if (error || !teacher) {
      console.error('❌ Teacher not found in approved_teachers:', req.user.email);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your email is not in the approved teachers list or not yet approved.'
      });
    }

    console.log('✅ Approved teacher found:', teacher.full_name);
    console.log('   Subjects:', teacher.subjects);
    
    req.teacher = teacher;
    next();
  } catch (error) {
    console.error('Teacher check error:', error);
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
};

// =============================================
// GET TEACHER SUBJECTS (from approved_teachers)
// =============================================
router.get('/teachers/subjects', authenticateUser, teacherOnly, async (req, res) => {
  try {
    console.log('📚 MATERIALS: Fetching subjects from approved_teachers');
    
    let subjects = req.teacher.subjects || [];

    // Parse subjects if string
    if (typeof subjects === 'string') {
      try {
        subjects = JSON.parse(subjects);
      } catch {
        subjects = subjects.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    if (!Array.isArray(subjects)) {
      subjects = [];
    }

    console.log('📋 Subjects found:', subjects);

    res.json({ 
      success: true, 
      data: subjects,
      teacher_name: req.teacher.full_name,
      teacher_id: req.teacher.teacher_id
    });
  } catch (error) {
    console.error('Subjects error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =============================================
// UPLOAD MATERIAL
// =============================================
router.post('/materials/upload', authenticateUser, teacherOnly, upload.single('file'), async (req, res) => {
  try {
    const client = req.supabase || await getSupabase();
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title, description, subject, materialType } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Get teacher info from approved_teachers (already in req.teacher)
    const teacherName = req.teacher.full_name;
    const teacherId = req.teacher.teacher_id;

    // Get subjects from approved_teachers
    let teacherSubjects = req.teacher.subjects || [];
    if (typeof teacherSubjects === 'string') {
      try {
        teacherSubjects = JSON.parse(teacherSubjects);
      } catch {
        teacherSubjects = teacherSubjects.split(',').map(s => s.trim()).filter(s => s);
      }
    }

    const finalSubject = subject?.trim() || (Array.isArray(teacherSubjects) ? teacherSubjects[0] : 'General');

    console.log('📤 Uploading material:');
    console.log('   Title:', title.trim());
    console.log('   Subject:', finalSubject);
    console.log('   Teacher:', teacherName, `(${teacherId})`);
    console.log('   File:', req.file.originalname);

    // Upload file to storage
    const timestamp = Date.now();
    const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${req.user.id}/${timestamp}_${safeName}`;

    const { error: uploadError } = await client.storage
      .from('materials')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Storage error:', uploadError);
      return res.status(500).json({ 
        success: false, 
        message: 'Upload failed: ' + uploadError.message 
      });
    }

    const { data: { publicUrl } } = client.storage
      .from('materials')
      .getPublicUrl(filePath);

    const fileSizeMB = (req.file.size / (1024 * 1024)).toFixed(2);

    // Save to materials table
    const { data: material, error: dbError } = await client
      .from('materials')
      .insert({
        title: title.trim(),
        description: description || '',
        uploaded_by: req.user.id,
        teacher_name: teacherName,
        teacher_id: teacherId,
        subject: finalSubject,
        material_type: materialType || 'notes',
        file_type: req.file.mimetype,
        file_name: req.file.originalname,
        file_url: publicUrl,
        file_size: `${fileSizeMB} MB`,
        file_path: filePath,
        download_count: 0,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file
      await client.storage.from('materials').remove([filePath]);
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error: ' + dbError.message 
      });
    }

    console.log('✅ Material uploaded successfully:', material.id);

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: material
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// =============================================
// GET TEACHER'S MATERIALS
// =============================================
router.get('/materials/teacher', authenticateUser, teacherOnly, async (req, res) => {
  try {
    const client = req.supabase || await getSupabase();
    
    console.log('📁 Fetching materials for:', req.user.email);
    
    const { data: materials, error } = await client
      .from('materials')
      .select('*')
      .eq('uploaded_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    console.log(`✅ Found ${materials?.length || 0} materials`);

    res.json({ success: true, data: materials || [] });
  } catch (error) {
    console.error('Materials fetch error:', error);
    res.status(500).json({ success: false, message: 'Error fetching materials' });
  }
});

// =============================================
// DOWNLOAD MATERIAL
// =============================================
router.get('/materials/:id/download', authenticateUser, async (req, res) => {
  try {
    const client = req.supabase || await getSupabase();
    
    const { data: material, error } = await client
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !material) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    // Increment download count
    await client
      .from('materials')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', material.id);

    const { data, error: dlError } = await client.storage
      .from('materials')
      .download(material.file_path);

    if (dlError) {
      return res.status(500).json({ success: false, message: 'Download failed' });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', material.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${material.file_name}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ success: false, message: 'Error' });
  }
});

// =============================================
// DELETE MATERIAL
// =============================================
router.delete('/materials/:id', authenticateUser, teacherOnly, async (req, res) => {
  try {
    const client = req.supabase || await getSupabase();
    
    const { data: material, error } = await client
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !material) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    if (material.uploaded_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Delete from storage
    await client.storage.from('materials').remove([material.file_path]);
    
    // Delete from database
    await client.from('materials').delete().eq('id', req.params.id);

    console.log('✅ Material deleted:', req.params.id);

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ success: false, message: 'Error deleting material' });
  }
});

export default router;