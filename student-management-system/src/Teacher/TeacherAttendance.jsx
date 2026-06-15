import React from 'react';
import {
  FaUserCheck, FaDownload, FaPlus, FaEdit
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const TeacherAttendance = ({ attendance, stats }) => {
  return (
    <div className="teacher-dashboard-card full-view">
      <div className="teacher-card-header">
        <h2><FaUserCheck /> Attendance Management</h2>
        <div className="teacher-header-actions">
          <div className="teacher-date-filter">
            <input type="date" defaultValue="2024-03-15" />
          </div>
          <button className="teacher-primary-btn">
            <FaDownload /> Export Report
          </button>
          <button className="teacher-secondary-btn">
            <FaPlus /> Take Attendance
          </button>
        </div>
      </div>

      <div className="teacher-attendance-summary">
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Present Today</span>
          <span className="teacher-summary-value success">
            {attendance.filter(a => a.status === 'Present').length}
          </span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Absent</span>
          <span className="teacher-summary-value warning">
            {attendance.filter(a => a.status === 'Absent').length}
          </span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Late</span>
          <span className="teacher-summary-value info">
            {attendance.filter(a => a.status === 'Late').length}
          </span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Rate</span>
          <span className="teacher-summary-value">
            {stats.attendanceRate}%
          </span>
        </div>
      </div>

      <div className="teacher-table-wrapper">
        <div className="teacher-attendance-table">
          <div className="teacher-table-header">
            <div className="teacher-table-col">Student</div>
            <div className="teacher-table-col">Date</div>
            <div className="teacher-table-col">Subject</div>
            <div className="teacher-table-col">Time In</div>
            <div className="teacher-table-col">Time Out</div>
            <div className="teacher-table-col">Status</div>
            <div className="teacher-table-col">Notes</div>
            <div className="teacher-table-col">Actions</div>
          </div>
          {attendance.map(record => (
            <div key={record.id} className="teacher-table-row">
              <div className="teacher-table-col" data-label="Student">
                <strong>{record.name}</strong>
              </div>
              <div className="teacher-table-col" data-label="Date">
                {record.date}
              </div>
              <div className="teacher-table-col" data-label="Subject">
                {record.subject}
              </div>
              <div className="teacher-table-col" data-label="Time In">
                {record.timeIn}
              </div>
              <div className="teacher-table-col" data-label="Time Out">
                {record.timeOut}
              </div>
              <div className="teacher-table-col" data-label="Status">
                <span className={`teacher-status-badge ${record.status === 'Present' ? 'present' : 
                                record.status === 'Absent' ? 'absent' : 'late'}`}>
                  {record.status}
                </span>
              </div>
              <div className="teacher-table-col" data-label="Notes">
                {record.reason || '-'}
              </div>
              <div className="teacher-table-col" data-label="Actions">
                <button className="teacher-action-btn small">
                  <FaEdit /> Update
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="teacher-table-scroll-hint">
          ← Scroll horizontally to see more →
        </div>
      </div>

      <div className="teacher-attendance-actions">
        <div className="teacher-attendance-bulk">
          <h3>Quick Attendance Update</h3>
          <div className="teacher-bulk-actions">
            <button className="teacher-action-btn success">
              Mark All Present
            </button>
            <button className="teacher-action-btn warning">
              Mark All Absent
            </button>
            <button className="teacher-action-btn">
              Reset Today
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;