import React from 'react';
import {
  FaHome, FaClipboardList, FaBook,
  FaUserCheck, FaCalendarAlt, FaBullhorn
} from 'react-icons/fa';
import '../styles/teacherdashboard.css';

const tabs = [
  { id: 'home', label: 'Home', icon: <FaHome /> },
  { id: 'marks', label: 'Marks', icon: <FaClipboardList /> },
  { id: 'materials', label: 'Materials', icon: <FaBook /> },
  { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
  { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
  { id: 'events', label: 'Events', icon: <FaBullhorn /> },
];

const TeacherSidebar = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="teacher-sidebar">
      <div className="logo">📘 SMS</div>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </aside>
  );
};

export default TeacherSidebar;
