import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/studentdashboard.css';
import Logo from '../assets/Logo.jpg';
import { 
  FaGraduationCap, 
  FaCalendarCheck, 
  FaCreditCard, 
  FaCalendarAlt, 
  FaBell,
  FaUser,
  FaBars,
  FaTimes
} from 'react-icons/fa';

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState({});
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);

    axios.get('/api/student/info').then(res => setStudent(res.data));
    axios.get('/api/student/grades').then(res => setGrades(Array.isArray(res.data) ? res.data : []));
    axios.get('/api/student/attendance').then(res => setAttendance(Array.isArray(res.data) ? res.data : []));
    axios.get('/api/student/payments').then(res => setPayments(Array.isArray(res.data) ? res.data : []));
    axios.get('/api/events').then(res => setEvents(Array.isArray(res.data) ? res.data : []));

    // Check mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-grid">
            {/* Quick Stats */}
            <div className="stat-cards">
              <div className="stat-card">
                <div className="stat-icon grades">
                  <FaGraduationCap />
                </div>
                <div className="stat-info">
                  <h3>Average Grade</h3>
                  <p className="stat-value">
                    {grades.length > 0 
                      ? (grades.reduce((acc, grade) => acc + grade.mark, 0) / grades.length).toFixed(1) + '%'
                      : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon attendance">
                  <FaCalendarCheck />
                </div>
                <div className="stat-info">
                  <h3>Attendance</h3>
                  <p className="stat-value">
                    {attendance.length > 0 
                      ? `${((attendance.filter(a => a.present).length / attendance.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon payments">
                  <FaCreditCard />
                </div>
                <div className="stat-info">
                  <h3>Payments Status</h3>
                  <p className="stat-value">
                    {payments.length > 0 
                      ? `${payments.filter(p => p.paid).length}/${payments.length} Paid`
                      : 'No Payments'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Grades */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2><FaGraduationCap /> Recent Grades</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="grades-list">
                {grades.slice(0, 5).map((grade, i) => (
                  <div key={i} className="grade-item">
                    <div className="grade-subject">
                      <span className="subject-name">{grade.subject}</span>
                      <span className="grade-date">Last Updated</span>
                    </div>
                    <div className="grade-metric">
                      <span className={`grade-badge ${grade.mark >= 70 ? 'excellent' : grade.mark >= 50 ? 'good' : 'needs-improvement'}`}>
                        {grade.mark}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="dashboard-card">
              <div className="card-header">
                <h2><FaBell /> Upcoming Events</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="events-list">
                {events.slice(0, 3).map((event, i) => (
                  <div key={i} className="event-item">
                    <div className="event-date">
                      <span className="event-day">{new Date(event.date).getDate()}</span>
                      <span className="event-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <p className="event-time">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'grades':
        return (
          <div className="dashboard-card full-view">
            <div className="card-header">
              <h2><FaGraduationCap /> Academic Grades</h2>
            </div>
            <div className="grades-table">
              <div className="table-header">
                <div className="table-col">Subject</div>
                <div className="table-col">Grade</div>
                <div className="table-col">Status</div>
                <div className="table-col">Last Updated</div>
              </div>
              {grades.map((grade, i) => (
                <div key={i} className="table-row">
                  <div className="table-col subject-col">{grade.subject}</div>
                  <div className="table-col">
                    <span className={`grade-value ${grade.mark >= 70 ? 'excellent' : grade.mark >= 50 ? 'good' : 'needs-improvement'}`}>
                      {grade.mark}%
                    </span>
                  </div>
                  <div className="table-col">
                    <span className={`status-badge ${grade.mark >= 50 ? 'status-success' : 'status-warning'}`}>
                      {grade.mark >= 50 ? 'Passing' : 'Needs Attention'}
                    </span>
                  </div>
                  <div className="table-col">-</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="dashboard-card full-view">
            <div className="card-header">
              <h2><FaCalendarCheck /> Attendance Record</h2>
              <div className="attendance-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Days</span>
                  <span className="summary-value">{attendance.length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Present</span>
                  <span className="summary-value success">{attendance.filter(a => a.present).length}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Absent</span>
                  <span className="summary-value warning">{attendance.filter(a => !a.present).length}</span>
                </div>
              </div>
            </div>
            <div className="attendance-chart">
              {/* Simplified attendance chart */}
              <div className="chart-bars">
                {attendance.slice(0, 14).map((day, i) => (
                  <div key={i} className="chart-bar-container">
                    <div className="chart-bar-label">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div className={`chart-bar ${day.present ? 'present' : 'absent'}`} 
                         style={{ height: `${day.present ? '100%' : '30%'}` }}>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="dashboard-card full-view">
            <div className="card-header">
              <h2><FaCreditCard /> Payment History</h2>
            </div>
            <div className="payments-list">
              {payments.map((p, i) => (
                <div key={i} className="payment-item">
                  <div className="payment-details">
                    <h4>Tuition Fee - {p.month}</h4>
                    <p className="payment-date">Due: {p.dueDate || 'End of month'}</p>
                  </div>
                  <div className="payment-status">
                    <span className={`status-badge ${p.paid ? 'status-success' : 'status-pending'}`}>
                      {p.paid ? 'Paid' : 'Pending'}
                    </span>
                    <span className="payment-amount">${p.amount || '0.00'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'timetable':
        return (
          <div className="dashboard-card full-view">
            <div className="card-header">
              <h2><FaCalendarAlt /> Weekly Timetable</h2>
              <button className="primary-btn">View Full Timetable</button>
            </div>
            <div className="timetable-preview">
              {/* Simplified timetable preview */}
              <p>Your class schedule will appear here.</p>
              <p><a href="/timetable" className="dashboard-link">Click here to view your complete timetable →</a></p>
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="dashboard-card full-view">
            <div className="card-header">
              <h2><FaBell /> School Events</h2>
            </div>
            <div className="events-grid">
              {events.map((event, i) => (
                <div key={i} className="event-card">
                  <div className="event-card-date">
                    <span className="event-card-day">{new Date(event.date).getDate()}</span>
                    <span className="event-card-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="event-card-content">
                    <h3>{event.title}</h3>
                    <p className="event-card-desc">{event.description || 'School event'}</p>
                    <div className="event-card-meta">
                      <span className="event-time">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="event-location">{event.location || 'Campus'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <img src={Logo} alt="logo" className="loading-logo" />
        <div className="bouncing-loader">
          <div></div>
          <div></div>
          <div></div>
        </div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <FaUser /> },
    { id: 'grades', label: 'Grades', icon: <FaGraduationCap /> },
    { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
    { id: 'payments', label: 'Payments', icon: <FaCreditCard /> },
    { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
    { id: 'events', label: 'Events', icon: <FaBell /> }
  ];

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="sidebar-header">
          <img src={Logo} alt="Logo" className="sidebar-logo" />
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            {student?.fullName?.charAt(0) || 'S'}
          </div>
          <div className="user-info">
            <h3>{student?.fullName || 'Student'}</h3>
            <p className="user-id">{student?.studentNumber || 'N/A'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="copyright">© 2024 University System</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="content-header">
          <button className="mobile-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="header-content">
            <h1 className="welcome-heading">
              Welcome back, <span className="highlight">{student?.fullName?.split(' ')[0] || 'Student'}</span>
            </h1>
            <p className="welcome-subtitle">Here's your academic overview</p>
          </div>
          <div className="header-actions">
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        <div className="content-body">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;