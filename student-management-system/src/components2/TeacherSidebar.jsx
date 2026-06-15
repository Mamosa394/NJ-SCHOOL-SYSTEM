import React from 'react';
import {
  FaHome, FaClipboardList, FaBook,
  FaUserCheck, FaCalendarAlt, FaBullhorn,
  FaChalkboardTeacher, FaBars, FaTimes,
  FaCog, FaBell, FaUsers, FaChartLine
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const tabs = [
  { id: 'home', label: 'Dashboard', icon: <FaHome /> },
  { id: 'marks', label: 'Marks', icon: <FaClipboardList /> },
  { id: 'materials', label: 'Materials', icon: <FaBook /> },
  { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
  { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
  { id: 'events', label: 'Events', icon: <FaBullhorn /> },
];

const TeacherSidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  toggleSidebar, 
  isMobile 
}) => {
  return (
    <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
      <div className="teacher-sidebar-header">
        <div className="teacher-sidebar-logo">
          <FaChalkboardTeacher />
          <span className="teacher-school-name">Teacher Portal</span>
        </div>
        <button className="teacher-sidebar-toggle" onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className="teacher-user-profile">
        <div className="teacher-user-avatar">
          MS
        </div>
        <div className="teacher-user-info">
          <h3>Ms. Smith</h3>
          <p className="teacher-user-role">Mathematics & Physics Teacher</p>
          <p className="teacher-user-subject">Grades 11-12</p>
        </div>
      </div>

      <nav className="teacher-sidebar-nav">
        {tabs.map(item => (
          <button
            key={item.id}
            className={`teacher-nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(item.id);
              if (isMobile) toggleSidebar();
            }}
          >
            <span className="teacher-nav-icon">{item.icon}</span>
            {sidebarOpen && <span className="teacher-nav-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="teacher-sidebar-footer">
        <div className="teacher-quick-links">
          <h4><FaCog /> Quick Settings</h4>
          <button className="teacher-sidebar-btn">
            <FaBell /> Notifications
          </button>
          <button className="teacher-sidebar-btn">
            <FaUsers /> Student Reports
          </button>
          <button className="teacher-sidebar-btn">
            <FaChartLine /> Performance
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TeacherSidebar;