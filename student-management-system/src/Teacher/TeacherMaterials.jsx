import React, { useState, useEffect } from 'react';
import {
  FaBook, FaSearch, FaPlus, FaFileUpload,
  FaFileAlt, FaDownload, FaEdit, FaTrash,
  FaExclamationTriangle, FaCheckCircle, FaFolderOpen
} from 'react-icons/fa';
import axios from 'axios';
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
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    materialType: 'notes'
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchMaterials();
    fetchTeacherSubjects();
  }, []);

  const fetchTeacherSubjects = async () => {
    try {
      setLoadingSubjects(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/teachers/subjects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const subjects = response.data?.data || response.data?.subjects || [];
      setTeacherSubjects(Array.isArray(subjects) ? subjects : []);
      
      // Set default subject if available
      if (subjects.length > 0) {
        setFormData(prev => ({
          ...prev,
          subject: subjects[0]
        }));
      }
    } catch (err) {
      console.error('Error fetching teacher subjects:', err);
      setTeacherSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/materials/teacher', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const materialsData = response.data?.data || response.data?.materials || response.data || [];
      setMaterials(Array.isArray(materialsData) ? materialsData : []);
      setError(null);
    } catch (err) {
      setError('Failed to load materials. Please try again.');
      console.error('Error fetching materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const submitFormData = new FormData();
      
      Object.keys(formData).forEach(key => {
        submitFormData.append(key, formData[key]);
      });
      
      submitFormData.append('file', selectedFile);
      
      const response = await axios.post('/api/materials/upload', submitFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Material uploaded successfully!');
      
      // Reset form but keep subject
      setFormData({
        title: '',
        description: '',
        subject: teacherSubjects.length > 0 ? teacherSubjects[0] : '',
        materialType: 'notes'
      });
      setSelectedFile(null);
      
      fetchMaterials();
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload material. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Material deleted successfully');
      fetchMaterials();
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError('Failed to delete material');
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (materialId, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/materials/${materialId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'material');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      setError('Failed to download material');
      console.error('Download error:', err);
    }
  };

  const filteredMaterials = Array.isArray(materials) 
    ? materials.filter(material =>
        material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <div className="teacher-dashboard-card full-view">
        <div className="teacher-loading">
          <div className="teacher-loading-spinner"></div>
          <p>Loading materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-card full-view">
      <div className="teacher-card-header">
        <h2><FaBook /> Learning Materials</h2>
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

      {error && (
        <div className="teacher-error">
          <FaExclamationTriangle />
          {error}
          <button 
            onClick={() => setError(null)} 
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dash-red)' }}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="teacher-success">
          <FaCheckCircle />
          {success}
        </div>
      )}

      <div className="teacher-upload-card">
        <h3>Upload New Material</h3>
        <form className="teacher-upload-form" onSubmit={handleSubmit}>
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Title *</label>
              <input 
                type="text" 
                name="title"
                placeholder="e.g. Term 1 Chemistry Notes" 
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="teacher-form-group">
              <label>Subject</label>
              {loadingSubjects ? (
                <select disabled>
                  <option>Loading subjects...</option>
                </select>
              ) : teacherSubjects.length > 0 ? (
                <select name="subject" value={formData.subject} onChange={handleInputChange}>
                  {teacherSubjects.map((subject, index) => (
                    <option key={index} value={subject}>{subject}</option>
                  ))}
                </select>
              ) : (
                <select name="subject" value={formData.subject} onChange={handleInputChange}>
                  <option value="">No subjects assigned</option>
                </select>
              )}
            </div>
          </div>
          
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Material Type</label>
              <select name="materialType" value={formData.materialType} onChange={handleInputChange}>
                <option value="notes">Notes</option>
                <option value="assignment">Assignment</option>
                <option value="exam_paper">Exam Paper</option>
                <option value="book">Book</option>
                <option value="video">Video</option>
                <option value="presentation">Presentation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Description</label>
              <textarea 
                name="description"
                placeholder="Brief description of the material..." 
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>
          </div>

          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>File *</label>
              <div className={`teacher-file-upload ${selectedFile ? 'has-file' : ''}`}>
                <FaFileUpload />
                <span>{selectedFile ? selectedFile.name : 'Choose file or drag & drop'}</span>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.zip,.epub"
                  required
                />
              </div>
              {selectedFile && (
                <small style={{ color: 'var(--dash-text-muted)', marginTop: '4px' }}>
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </small>
              )}
            </div>
          </div>

          <div className="teacher-form-actions">
            <button 
              type="submit" 
              className="teacher-primary-btn"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
            <button 
              type="button" 
              className="teacher-secondary-btn"
              onClick={() => {
                setFormData({
                  title: '',
                  description: '',
                  subject: teacherSubjects.length > 0 ? teacherSubjects[0] : '',
                  materialType: 'notes'
                });
                setSelectedFile(null);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {filteredMaterials.length === 0 ? (
        <div className="teacher-empty-state">
          <FaFolderOpen />
          <h3>No Materials Found</h3>
          <p>Upload your first learning material using the form above</p>
        </div>
      ) : (
        <div className="teacher-materials-grid">
          {filteredMaterials.map(material => (
            <div key={material.id || material._id} className="teacher-material-card">
              <div className="teacher-material-card-header">
                <div className="teacher-material-card-icon">
                  <FaFileAlt />
                </div>
                <div className="teacher-material-card-actions">
                  <button 
                    className="teacher-action-btn small"
                    onClick={() => handleDownload(material.id || material._id, material.file_name)}
                    title="Download"
                  >
                    <FaDownload />
                  </button>
                  <button className="teacher-action-btn small" title="Edit">
                    <FaEdit />
                  </button>
                  <button 
                    className="teacher-action-btn small danger"
                    onClick={() => handleDelete(material.id || material._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="teacher-material-card-content">
                <h4>{material.title}</h4>
                <p className="teacher-material-card-subject">{material.subject}</p>
                <div className="teacher-material-card-meta">
                  <span className="teacher-material-card-date">
                    {new Date(material.created_at).toLocaleDateString()}
                  </span>
                  {material.file_size && (
                    <span className="teacher-material-card-size">{material.file_size}</span>
                  )}
                  <span className="teacher-material-card-type">
                    {material.material_type?.toUpperCase() || material.file_type?.toUpperCase()}
                  </span>
                </div>
                <div className="teacher-material-card-footer">
                  <span className="teacher-material-card-downloads">
                    {material.download_count || 0} downloads
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherMaterials;