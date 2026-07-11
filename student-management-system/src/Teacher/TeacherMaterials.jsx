import React, { useState, useEffect } from 'react';
import {
  FaBook, FaSearch, FaPlus, FaFileUpload,
  FaFileAlt, FaDownload, FaTrash,
  FaExclamationTriangle, FaCheckCircle, FaFolderOpen, FaSpinner
} from 'react-icons/fa';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher/teachermaterials.css';

const TeacherMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    materialType: 'notes'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // =============================================
  // AUTH HELPER
  // =============================================
  const getAuthHeaders = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session?.access_token) {
        throw new Error('No active session');
      }
      
      return {
        'Authorization': `Bearer ${session.access_token}`
      };
    } catch (error) {
      setError('Session expired. Please log in again.');
      setTimeout(() => window.location.href = '/login', 2000);
      throw error;
    }
  };

  // =============================================
  // API CALL HELPER
  // =============================================
  const apiCall = async (url, options = {}) => {
    const headers = await getAuthHeaders();
    
    if (options.body instanceof FormData) {
      // Let browser set Content-Type for FormData
    } else {
      headers['Content-Type'] = 'application/json';
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      setError('Session expired. Please log in again.');
      setTimeout(() => window.location.href = '/login', 2000);
      throw new Error('Unauthorized');
    }
    
    if (response.status === 403) {
      const data = await response.json();
      throw new Error(data.message || 'Access denied');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }
    
    return data;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTeacherSubjects(),
        fetchMaterials()
      ]);
    } catch (err) {
      console.error('Load error:', err);
      if (!error) setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // FETCH SUBJECTS FROM approved_teachers
  // =============================================
  const fetchTeacherSubjects = async () => {
    try {
      setLoadingSubjects(true);
      console.log('📚 Fetching subjects from approved_teachers...');
      
      const data = await apiCall('/api/teachers/subjects');
      
      console.log('✅ Subjects received:', data);
      
      let subjects = data.data || [];
      
      // Handle different formats
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
      
      setTeacherSubjects(subjects);
      
      if (data.teacher_name) {
        setTeacherInfo({ name: data.teacher_name, id: data.teacher_id });
      }
      
      // Set first subject as default
      if (subjects.length > 0 && !formData.subject) {
        setFormData(prev => ({ ...prev, subject: subjects[0] }));
      }
      
    } catch (err) {
      console.error('❌ Error fetching subjects:', err);
      setTeacherSubjects([]);
      if (err.message === 'Unauthorized') return;
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // =============================================
  // FETCH MATERIALS
  // =============================================
  const fetchMaterials = async () => {
    try {
      console.log('📁 Fetching materials...');
      const data = await apiCall('/api/materials/teacher');
      setMaterials(data.data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
      setMaterials([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title.trim());
      submitFormData.append('description', formData.description.trim());
      submitFormData.append('subject', formData.subject || teacherSubjects[0] || 'General');
      submitFormData.append('materialType', formData.materialType);
      submitFormData.append('file', selectedFile);
      
      await apiCall('/api/materials/upload', {
        method: 'POST',
        body: submitFormData
      });
      
      setSuccess('Material uploaded successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        subject: teacherSubjects.length > 0 ? teacherSubjects[0] : '',
        materialType: 'notes'
      });
      setSelectedFile(null);
      
      await fetchMaterials();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;
    
    try {
      await apiCall(`/api/materials/${materialId}`, { method: 'DELETE' });
      setSuccess('Material deleted');
      await fetchMaterials();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/materials/${materialId}/download`, { headers });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'material');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Download failed');
    }
  };

  const filteredMaterials = materials.filter(material =>
    material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="teacher-dashboard-card full-view">
        <div style={{ 
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', 
          minHeight: '400px', gap: '20px'
        }}>
          <FaSpinner style={{ fontSize: '48px', color: '#4F46E5', animation: 'spin 1s linear infinite' }} />
          <h3>Loading Materials...</h3>
          <p style={{ color: '#6B7280' }}>Fetching from approved_teachers table</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-card full-view">
      <div className="teacher-card-header">
        <h2><FaBook /> Learning Materials</h2>
        {teacherInfo && (
          <span style={{ fontSize: '14px', color: '#6B7280' }}>
            Teacher: {teacherInfo.name} ({teacherInfo.id})
          </span>
        )}
        <div className="teacher-header-actions">
          <div className="teacher-search-box">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search materials..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px', borderRadius: '8px' }}>
          <strong>🐛 Debug (approved_teachers):</strong><br/>
          Subjects: {teacherSubjects.join(', ') || 'None'}<br/>
          Materials: {materials.length}<br/>
          Source: approved_teachers table
        </div>
      )}

      {error && (
        <div className="teacher-error">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="teacher-error-close">×</button>
        </div>
      )}

      {success && (
        <div className="teacher-success">
          <FaCheckCircle />
          <span>{success}</span>
        </div>
      )}

      <div className="teacher-upload-card">
        <h3><FaPlus style={{ marginRight: '8px' }} />Upload New Material</h3>
        <form className="teacher-upload-form" onSubmit={handleSubmit}>
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Title *</label>
              <input 
                type="text" name="title"
                placeholder="e.g. Term 1 Chemistry Notes" 
                value={formData.title}
                onChange={handleInputChange}
                required disabled={uploading}
              />
            </div>
            <div className="teacher-form-group">
              <label>Subject * (from approved_teachers)</label>
              {loadingSubjects ? (
                <select disabled><option>Loading subjects...</option></select>
              ) : teacherSubjects.length > 0 ? (
                <select name="subject" value={formData.subject} onChange={handleInputChange} disabled={uploading}>
                  <option value="">Select subject</option>
                  {teacherSubjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
              ) : (
                <div>
                  <input type="text" name="subject" placeholder="Enter subject"
                    value={formData.subject} onChange={handleInputChange} disabled={uploading}
                  />
                  <small style={{ color: '#F59E0B' }}>
                    ⚠️ No subjects in approved_teachers. Your account may not be approved.
                  </small>
                </div>
              )}
            </div>
          </div>
          
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Material Type</label>
              <select name="materialType" value={formData.materialType} onChange={handleInputChange} disabled={uploading}>
                <option value="notes">Notes</option>
                <option value="assignment">Assignment</option>
                <option value="exam_paper">Exam Paper</option>
                <option value="book">Book</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Description</label>
              <textarea name="description" placeholder="Brief description..." rows="3"
                value={formData.description} onChange={handleInputChange} disabled={uploading}
              ></textarea>
            </div>
          </div>

          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>File *</label>
              <div className={`teacher-file-upload ${selectedFile ? 'has-file' : ''}`}>
                <FaFileUpload />
                <span>{selectedFile ? selectedFile.name : 'Choose file (max 50MB)'}</span>
                <input type="file" onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.zip,.epub"
                  required disabled={uploading}
                />
              </div>
            </div>
          </div>

          <div className="teacher-form-actions">
            <button type="submit" className="teacher-primary-btn" disabled={uploading || loadingSubjects}>
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
            <button type="button" className="teacher-secondary-btn"
              onClick={() => {
                setFormData({ title: '', description: '', subject: teacherSubjects[0] || '', materialType: 'notes' });
                setSelectedFile(null);
                setError(null);
              }}
              disabled={uploading}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="teacher-materials-section">
        <h3><FaBook style={{ marginRight: '8px' }} />My Materials ({filteredMaterials.length})</h3>
        
        {filteredMaterials.length === 0 ? (
          <div className="teacher-empty-state">
            <FaFolderOpen style={{ fontSize: '48px', color: '#9CA3AF' }} />
            <h4>No Materials</h4>
            <p>{searchTerm ? 'No matches found' : 'Upload your first material above'}</p>
          </div>
        ) : (
          <div className="teacher-materials-grid">
            {filteredMaterials.map(material => (
              <div key={material.id} className="teacher-material-card">
                <div className="teacher-material-card-header">
                  <div className="teacher-material-card-icon"><FaFileAlt /></div>
                  <div className="teacher-material-card-actions">
                    <button className="teacher-action-btn" onClick={() => handleDownload(material.id, material.file_name)} title="Download">
                      <FaDownload />
                    </button>
                    <button className="teacher-action-btn danger" onClick={() => handleDelete(material.id)} title="Delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="teacher-material-card-body">
                  <h4>{material.title}</h4>
                  <p>{material.subject}</p>
                  <div className="teacher-material-meta">
                    <span>{new Date(material.created_at).toLocaleDateString()}</span>
                    {material.file_size && <span>{material.file_size}</span>}
                    <span>{material.material_type?.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="teacher-material-footer">
                    <span>📥 {material.download_count || 0} downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMaterials;