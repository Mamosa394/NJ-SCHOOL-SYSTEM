import React from 'react';
import {
  FaBook, FaSearch, FaPlus, FaFileUpload,
  FaFileAlt, FaDownload, FaEdit, FaTrash
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const TeacherMaterials = ({ materials }) => {
  return (
    <div className="teacher-dashboard-card full-view">
      <div className="teacher-card-header">
        <h2><FaBook /> Learning Materials</h2>
        <div className="teacher-header-actions">
          <div className="teacher-search-box">
            <FaSearch />
            <input type="text" placeholder="Search materials..." />
          </div>
          <button className="teacher-primary-btn">
            <FaPlus /> Upload New
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <div className="teacher-upload-card">
        <h3>Upload New Material</h3>
        <form className="teacher-upload-form">
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Title</label>
              <input type="text" placeholder="e.g. Term 1 Chemistry Notes" />
            </div>
            <div className="teacher-form-group">
              <label>Subject</label>
              <select>
                <option>Mathematics</option>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Biology</option>
                <option>General Science</option>
              </select>
            </div>
          </div>
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>Description</label>
              <textarea placeholder="Brief description of the material..." rows="3"></textarea>
            </div>
          </div>
          <div className="teacher-form-row">
            <div className="teacher-form-group">
              <label>File</label>
              <div className="teacher-file-upload">
                <FaFileUpload />
                <span>Choose file or drag & drop</span>
                <input type="file" />
              </div>
            </div>
            <div className="teacher-form-group">
              <label>Access Level</label>
              <select>
                <option>All Students</option>
                <option>Specific Grade</option>
                <option>Private</option>
              </select>
            </div>
          </div>
          <div className="teacher-form-actions">
            <button type="submit" className="teacher-primary-btn">
              Upload Material
            </button>
            <button type="button" className="teacher-secondary-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Materials Grid */}
      <div className="teacher-materials-grid">
        {materials.map(material => (
          <div key={material.id} className="teacher-material-card">
            <div className="teacher-material-card-header">
              <div className="teacher-material-card-icon">
                <FaFileAlt />
              </div>
              <div className="teacher-material-card-actions">
                <button className="teacher-action-btn small">
                  <FaDownload />
                </button>
                <button className="teacher-action-btn small">
                  <FaEdit />
                </button>
                <button className="teacher-action-btn small danger">
                  <FaTrash />
                </button>
              </div>
            </div>
            <div className="teacher-material-card-content">
              <h4>{material.title}</h4>
              <p className="teacher-material-card-subject">{material.subject}</p>
              <div className="teacher-material-card-meta">
                <span className="teacher-material-card-date">{material.date}</span>
                <span className="teacher-material-card-size">{material.size}</span>
                <span className="teacher-material-card-type">{material.type.toUpperCase()}</span>
              </div>
              <div className="teacher-material-card-footer">
                <span className="teacher-material-card-downloads">
                  {material.downloads} downloads
                </span>
                <button className="teacher-action-btn small">
                  Share
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherMaterials;