import React from 'react';
import {
  FaClipboardList, FaSearch, FaDownload,
  FaPlus, FaEdit, FaEye
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const TeacherMarks = ({ students }) => {
  return (
    <div className="teacher-dashboard-card full-view">
      <div className="teacher-card-header">
        <h2><FaClipboardList /> Student Marks Management</h2>
        <div className="teacher-header-actions">
          <div className="teacher-search-box">
            <FaSearch />
            <input type="text" placeholder="Search students..." />
          </div>
          <button className="teacher-primary-btn">
            <FaDownload /> Export Grades
          </button>
          <button className="teacher-secondary-btn">
            <FaPlus /> Add Assignment
          </button>
        </div>
      </div>

      <div className="teacher-table-wrapper">
        <div className="teacher-marks-table">
          <div className="teacher-table-header">
            <div className="teacher-table-col">Student</div>
            <div className="teacher-table-col">Grade</div>
            <div className="teacher-table-col">Test 1</div>
            <div className="teacher-table-col">Test 2</div>
            <div className="teacher-table-col">Test 3</div>
            <div className="teacher-table-col">Test 4</div>
            <div className="teacher-table-col">Average</div>
            <div className="teacher-table-col">Comment</div>
            <div className="teacher-table-col">Improvement</div>
            <div className="teacher-table-col">Actions</div>
          </div>
          {students.map(student => {
            const marks = Object.values(student.marks);
            const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : 0;
            
            return (
              <div key={student.id} className="teacher-table-row">
                <div className="teacher-table-col" data-label="Student">
                  <div className="teacher-student-info">
                    <div className="teacher-student-avatar">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <strong>{student.name}</strong>
                      <div className="teacher-student-grade">{student.grade}</div>
                    </div>
                  </div>
                </div>
                <div className="teacher-table-col" data-label="Grade">
                  {student.grade}
                </div>
                <div className="teacher-table-col" data-label="Test 1">
                  <input 
                    type="number" 
                    defaultValue={student.marks.test1}
                    className="teacher-grade-input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="teacher-table-col" data-label="Test 2">
                  <input 
                    type="number" 
                    defaultValue={student.marks.test2}
                    className="teacher-grade-input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="teacher-table-col" data-label="Test 3">
                  <input 
                    type="number" 
                    defaultValue={student.marks.test3}
                    className="teacher-grade-input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="teacher-table-col" data-label="Test 4">
                  <input 
                    type="number" 
                    defaultValue={student.marks.test4}
                    className="teacher-grade-input"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="teacher-table-col" data-label="Average">
                  <span className={`teacher-grade-average ${average >= 80 ? 'excellent' : average >= 70 ? 'good' : average >= 60 ? 'average' : 'poor'}`}>
                    {average}%
                  </span>
                </div>
                <div className="teacher-table-col" data-label="Comment">
                  <input 
                    type="text" 
                    defaultValue={student.comment}
                    className="teacher-comment-input"
                    placeholder="Add comment..."
                  />
                </div>
                <div className="teacher-table-col" data-label="Improvement">
                  <input 
                    type="text" 
                    defaultValue={student.improvement}
                    className="teacher-improvement-input"
                    placeholder="Suggest improvement..."
                  />
                </div>
                <div className="teacher-table-col" data-label="Actions">
                  <div className="teacher-action-buttons">
                    <button className="teacher-action-btn small">
                      <FaEdit /> Update
                    </button>
                    <button className="teacher-action-btn small">
                      <FaEye /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="teacher-table-scroll-hint">
          ← Scroll horizontally to see more →
        </div>
      </div>

      <div className="teacher-table-footer">
        <button className="teacher-primary-btn">
          Save All Changes
        </button>
        <div className="teacher-records-info">
          Showing {students.length} students • Last saved: Today, 10:30 AM
        </div>
      </div>
    </div>
  );
};

export default TeacherMarks;