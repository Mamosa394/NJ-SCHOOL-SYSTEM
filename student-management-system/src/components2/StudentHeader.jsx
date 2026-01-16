import React from 'react';
import '../styles/studentdashboard.css';

const StudentHeader = ({ activeTab, setActiveTab }) => {
  return (
    <header className="dashboard-header">

      <nav className="dashboard-nav">
        <button onClick={() => setActiveTab('grades')} className={activeTab === 'grades' ? 'active' : ''}>Grades</button>
        <button onClick={() => setActiveTab('attendance')} className={activeTab === 'attendance' ? 'active' : ''}>Attendance</button>
        <button onClick={() => setActiveTab('payments')} className={activeTab === 'payments' ? 'active' : ''}>Payments</button>
        <button onClick={() => setActiveTab('timetable')} className={activeTab === 'timetable' ? 'active' : ''}>Timetable</button>
        <button onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'active' : ''}>Events</button>
      </nav>
    </header>
  );
};

export default StudentHeader;
