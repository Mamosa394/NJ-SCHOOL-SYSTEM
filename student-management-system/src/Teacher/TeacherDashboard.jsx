import React from 'react';
import {
  FaChalkboardTeacher, FaUserGraduate, FaUserCheck,
  FaBook, FaCalendarAlt, FaClock, FaClipboardList,
  FaBullhorn, FaChartLine, FaFileUpload, FaFileAlt,
  FaDownload
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const TeacherHome = ({ stats, classes, materials, events, attendance }) => {
  return (
    <div className="teacher-overview-grid">
      {/* Welcome Section */}
      <div className="teacher-welcome-card">
        <div className="teacher-welcome-content">
          <h2>Welcome back, Ms. Smith!</h2>
          <p>Mathematics & Physics Teacher • Grade 11-12</p>
          <div className="teacher-welcome-stats">
            <div className="teacher-welcome-stat">
              <span className="teacher-welcome-stat-label">Today's Schedule</span>
              <span className="teacher-welcome-stat-value">3 Classes</span>
            </div>
            <div className="teacher-welcome-stat">
              <span className="teacher-welcome-stat-label">Pending Grading</span>
              <span className="teacher-welcome-stat-value">24 Assignments</span>
            </div>
          </div>
        </div>
        <div className="teacher-welcome-avatar">
          <FaChalkboardTeacher />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="teacher-stat-cards">
        <div className="teacher-stat-card">
          <div className="teacher-stat-icon students">
            <FaUserGraduate />
          </div>
          <div className="teacher-stat-info">
            <h3>Total Students</h3>
            <p className="teacher-stat-value">{stats.totalStudents}</p>
            <span className="teacher-stat-trend">Across all classes</span>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon attendance">
            <FaUserCheck />
          </div>
          <div className="teacher-stat-info">
            <h3>Attendance Rate</h3>
            <p className="teacher-stat-value">{stats.attendanceRate}%</p>
            <span className="teacher-stat-trend">Today: {attendance.filter(a => a.status === 'Present').length}/{attendance.length}</span>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon materials">
            <FaBook />
          </div>
          <div className="teacher-stat-info">
            <h3>Materials</h3>
            <p className="teacher-stat-value">{stats.materialsCount}</p>
            <span className="teacher-stat-trend">{materials.reduce((acc, mat) => acc + mat.downloads, 0)} total downloads</span>
          </div>
        </div>

        <div className="teacher-stat-card">
          <div className="teacher-stat-icon schedule">
            <FaCalendarAlt />
          </div>
          <div className="teacher-stat-info">
            <h3>Today's Classes</h3>
            <p className="teacher-stat-value">{stats.upcomingClasses}</p>
            <span className="teacher-stat-trend">Next: Mathematics (08:00)</span>
          </div>
        </div>
      </div>

      {/* Today's Classes */}
      <div className="teacher-dashboard-card">
        <div className="teacher-card-header">
          <h2><FaClock /> Today's Schedule</h2>
          <button className="teacher-view-all-btn">View Full Timetable</button>
        </div>
        <div className="teacher-classes-list">
          {classes.slice(0, 3).map(cls => (
            <div key={cls.id} className="teacher-class-item">
              <div className="teacher-class-time">
                <span className="teacher-class-hour">{cls.time}</span>
                <span className="teacher-class-day">{cls.day}</span>
              </div>
              <div className="teacher-class-details">
                <h4>{cls.subject}</h4>
                <p className="teacher-class-grade">{cls.grade} • {cls.room}</p>
              </div>
              <div className="teacher-class-status">
                <span className="teacher-status-badge upcoming">Upcoming</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="teacher-dashboard-card">
        <div className="teacher-card-header">
          <h2><FaClipboardList /> Quick Actions</h2>
        </div>
        <div className="teacher-quick-actions">
          <button className="teacher-quick-action">
            <FaClipboardList />
            <span>Enter Marks</span>
          </button>
          <button className="teacher-quick-action">
            <FaUserCheck />
            <span>Take Attendance</span>
          </button>
          <button className="teacher-quick-action">
            <FaBook />
            <span>Upload Materials</span>
          </button>
          <button className="teacher-quick-action">
            <FaCalendarAlt />
            <span>View Schedule</span>
          </button>
          <button className="teacher-quick-action">
            <FaBullhorn />
            <span>Post Announcement</span>
          </button>
          <button className="teacher-quick-action">
            <FaChartLine />
            <span>View Reports</span>
          </button>
        </div>
      </div>

      {/* Recent Uploads */}
      <div className="teacher-dashboard-card">
        <div className="teacher-card-header">
          <h2><FaFileUpload /> Recent Materials</h2>
          <button className="teacher-view-all-btn">View All</button>
        </div>
        <div className="teacher-materials-list">
          {materials.slice(0, 3).map(material => (
            <div key={material.id} className="teacher-material-item">
              <div className="teacher-material-icon">
                <FaFileAlt />
              </div>
              <div className="teacher-material-details">
                <h4>{material.title}</h4>
                <p className="teacher-material-subject">{material.subject} • {material.date}</p>
                <div className="teacher-material-meta">
                  <span className="teacher-material-type">{material.type.toUpperCase()}</span>
                  <span className="teacher-material-size">{material.size}</span>
                  <span className="teacher-material-downloads">{material.downloads} downloads</span>
                </div>
              </div>
              <button className="teacher-action-btn small">
                <FaDownload />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="teacher-dashboard-card">
        <div className="teacher-card-header">
          <h2><FaBullhorn /> Upcoming Events</h2>
          <button className="teacher-view-all-btn">View Calendar</button>
        </div>
        <div className="teacher-events-list">
          {events.slice(0, 3).map(event => (
            <div key={event.id} className="teacher-event-item">
              <div className="teacher-event-date">
                <span className="teacher-event-day">{new Date(event.date).getDate()}</span>
                <span className="teacher-event-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="teacher-event-details">
                <h4>{event.title}</h4>
                <p className="teacher-event-time">{event.time} • {event.location}</p>
                <span className={`teacher-event-type ${event.type}`}>{event.type}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherHome;