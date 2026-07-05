import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'video/mp4',
      'application/zip',
      'application/epub+zip'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Middleware
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const teacherOnly = async (req, res, next) => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();
    
    if (error || !profile || profile.role !== 'teacher') {
      return res.status(403).json({ message: 'Teacher access required' });
    }
    
    next();
  } catch (error) {
    res.status(403).json({ message: 'Access denied' });
  }
};

// ===== TEACHER SUBJECTS =====
router.get('/teachers/subjects', authenticateUser, teacherOnly, async (req, res) => {
  try {
    const { data: teacherProfile, error } = await supabase
      .from('profiles')
      .select('subjects')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch teacher subjects' });
    }

    res.json({
      success: true,
      data: teacherProfile?.subjects || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch teacher subjects' });
  }
});

// ===== UPLOAD MATERIAL =====
router.post('/materials/upload', authenticateUser, teacherOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { title, description, subject, materialType } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const { data: teacherProfile } = await supabase
      .from('profiles')
      .select('full_name, email, subjects')
      .eq('id', req.user.id)
      .single();

    let finalSubject = subject;
    if (!finalSubject && teacherProfile?.subjects?.length > 0) {
      finalSubject = teacherProfile.subjects[0];
    }
    if (!finalSubject) finalSubject = 'General';

    const timestamp = Date.now();
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFileName = `${req.user.id}/${timestamp}_${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(uniqueFileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return res.status(500).json({ message: 'Failed to upload file to storage' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('materials')
      .getPublicUrl(uniqueFileName);

    const { data: material, error: dbError } = await supabase
      .from('materials')
      .insert({
        title,
        description: description || '',
        uploaded_by: req.user.id,
        teacher_name: teacherProfile?.full_name || teacherProfile?.email || 'Unknown',
        subject: finalSubject,
        material_type: materialType || 'notes',
        file_type: req.file.mimetype,
        file_name: req.file.originalname,
        file_url: publicUrl,
        file_size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
        file_path: uniqueFileName,
        download_count: 0,
        is_active: true
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return res.status(500).json({ message: 'Failed to save material record' });
    }

    res.status(201).json({
      success: true,
      message: 'Material uploaded successfully',
      data: material
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// ===== GET TEACHER'S MATERIALS =====
router.get('/materials/teacher', authenticateUser, teacherOnly, async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('uploaded_by', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch materials' });
    }

    res.json({ success: true, data: materials || [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
});

// ===== GET STUDENT MATERIALS =====
router.get('/materials/student', authenticateUser, async (req, res) => {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ message: 'Failed to fetch materials' });
    }

    res.json({ success: true, data: materials || [] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch materials' });
  }
});

// ===== DOWNLOAD MATERIAL =====
router.get('/materials/:id/download', authenticateUser, async (req, res) => {
  try {
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    await supabase
      .from('materials')
      .update({ download_count: (material.download_count || 0) + 1 })
      .eq('id', material.id);

    const { data, error: downloadError } = await supabase.storage
      .from('materials')
      .download(material.file_path);

    if (downloadError) {
      return res.status(500).json({ message: 'Failed to download file' });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', material.file_type);
    res.setHeader('Content-Disposition', `attachment; filename="${material.file_name}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to download file' });
  }
});

// ===== DELETE MATERIAL =====
router.delete('/materials/:id', authenticateUser, teacherOnly, async (req, res) => {
  try {
    const { data: material, error: fetchError } = await supabase
      .from('materials')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    if (material.uploaded_by !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await supabase.storage.from('materials').remove([material.file_path]);
    await supabase.from('materials').delete().eq('id', req.params.id);

    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete material' });
  }
});

export default router;