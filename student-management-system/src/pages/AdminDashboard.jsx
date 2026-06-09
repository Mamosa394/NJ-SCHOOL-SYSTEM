import React, { useState, useEffect } from 'react';
import '../styles/admindashboard.css';
import {
  FaTachometerAlt,
  FaUsers,
  FaCalendarCheck,
  FaCreditCard,
  FaCalendarAlt,
  FaBell,
  FaChartLine,
  FaCog,
  FaUserShield,
  FaFileAlt,
  FaChartBar,
  FaDatabase,
  FaBars,
  FaTimes,
  FaSearch,
  FaPlus,
  FaDownload,
  FaFilter,
  FaEdit,
  FaTrash,
  FaEye,
  FaSchool,
  FaUserGraduate,
  FaUserTie,
  FaMoneyCheckAlt,
  FaClipboardList,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    collectionRate: 0
  });
  
  // Pagination states
  const [studentPage, setStudentPage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    // Simulated data - replace with actual API calls
    const mockStudents = [
      { id: 1, name: 'Thabiso M.', number: 'ST12345', grade: 'Grade 11', subject: 'Mathematics', feesPaid: true, contact: 'thabiso@email.com', enrollmentDate: '2024-01-15' },
      { id: 2, name: 'Relebohile S.', number: 'ST12346', grade: 'Grade 10', subject: 'Biology', feesPaid: false, contact: 'relebohile@email.com', enrollmentDate: '2024-01-20' },
      { id: 3, name: 'Kagiso L.', number: 'ST12347', grade: 'Grade 12', subject: 'Physics', feesPaid: true, contact: 'kagiso@email.com', enrollmentDate: '2024-01-10' },
      { id: 4, name: 'Nthabiseng M.', number: 'ST12348', grade: 'Grade 11', subject: 'Chemistry', feesPaid: true, contact: 'nthabiseng@email.com', enrollmentDate: '2024-01-18' },
      { id: 5, name: 'Sipho D.', number: 'ST12349', grade: 'Grade 10', subject: 'English', feesPaid: false, contact: 'sipho@email.com', enrollmentDate: '2024-01-22' },
      { id: 6, name: 'Lerato K.', number: 'ST12350', grade: 'Grade 12', subject: 'History', feesPaid: true, contact: 'lerato@email.com', enrollmentDate: '2024-01-12' },
      { id: 7, name: 'Tumi M.', number: 'ST12351', grade: 'Grade 11', subject: 'Computer Science', feesPaid: true, contact: 'tumi@email.com', enrollmentDate: '2024-01-25' },
      { id: 8, name: 'Bongani N.', number: 'ST12352', grade: 'Grade 10', subject: 'Geography', feesPaid: false, contact: 'bongani@email.com', enrollmentDate: '2024-01-30' },
      { id: 9, name: 'Zanele P.', number: 'ST12353', grade: 'Grade 12', subject: 'Economics', feesPaid: true, contact: 'zanele@email.com', enrollmentDate: '2024-01-05' },
      { id: 10, name: 'Mbali T.', number: 'ST12354', grade: 'Grade 11', subject: 'Business Studies', feesPaid: true, contact: 'mbali@email.com', enrollmentDate: '2024-01-28' },
    ];

    const mockAttendance = [
      { id: 1, name: 'Thabiso M.', date: '2024-03-15', status: 'Present', timeIn: '08:15', timeOut: '15:30' },
      { id: 2, name: 'Relebohile S.', date: '2024-03-15', status: 'Absent', timeIn: '--:--', timeOut: '--:--', reason: 'Sick' },
      { id: 3, name: 'Kagiso L.', date: '2024-03-15', status: 'Present', timeIn: '08:05', timeOut: '15:45' },
      { id: 4, name: 'Nthabiseng M.', date: '2024-03-15', status: 'Late', timeIn: '09:30', timeOut: '15:35', reason: 'Traffic' },
      { id: 5, name: 'Sipho D.', date: '2024-03-15', status: 'Present', timeIn: '08:20', timeOut: '15:25' },
      { id: 6, name: 'Lerato K.', date: '2024-03-15', status: 'Present', timeIn: '08:10', timeOut: '15:40' },
      { id: 7, name: 'Tumi M.', date: '2024-03-15', status: 'Absent', timeIn: '--:--', timeOut: '--:--', reason: 'Family Emergency' },
      { id: 8, name: 'Bongani N.', date: '2024-03-15', status: 'Present', timeIn: '08:25', timeOut: '15:50' },
      { id: 9, name: 'Zanele P.', date: '2024-03-15', status: 'Late', timeIn: '09:15', timeOut: '15:30', reason: 'Transport Issues' },
      { id: 10, name: 'Mbali T.', date: '2024-03-15', status: 'Present', timeIn: '08:18', timeOut: '15:35' },
    ];

    const mockPayments = [
      { id: 1, student: 'Thabiso M.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-28', invoice: 'INV-2024-003' },
      { id: 2, student: 'Relebohile S.', month: 'March 2024', amount: 'R1,200', status: 'Pending', dueDate: '2024-03-01', paidDate: null, invoice: 'INV-2024-004' },
      { id: 3, student: 'Kagiso L.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-29', invoice: 'INV-2024-005' },
      { id: 4, student: 'Nthabiseng M.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-27', invoice: 'INV-2024-006' },
      { id: 5, student: 'Sipho D.', month: 'March 2024', amount: 'R1,200', status: 'Overdue', dueDate: '2024-03-01', paidDate: null, invoice: 'INV-2024-007' },
      { id: 6, student: 'Lerato K.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-26', invoice: 'INV-2024-008' },
      { id: 7, student: 'Tumi M.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-25', invoice: 'INV-2024-009' },
      { id: 8, student: 'Bongani N.', month: 'March 2024', amount: 'R1,200', status: 'Pending', dueDate: '2024-03-01', paidDate: null, invoice: 'INV-2024-010' },
      { id: 9, student: 'Zanele P.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-24', invoice: 'INV-2024-011' },
      { id: 10, student: 'Mbali T.', month: 'March 2024', amount: 'R1,200', status: 'Paid', dueDate: '2024-03-01', paidDate: '2024-02-23', invoice: 'INV-2024-012' },
    ];

    const mockEvents = [
      { id: 1, title: 'Parent-Teacher Conference', date: 'March 25, 2024', time: '14:00 - 16:00', location: 'Main Hall', type: 'meeting', status: 'upcoming' },
      { id: 2, title: 'Science Fair', date: 'April 5, 2024', time: '10:00 - 14:00', location: 'Science Building', type: 'academic', status: 'upcoming' },
      { id: 3, title: 'Sports Day', date: 'April 12, 2024', time: '09:00 - 15:00', location: 'Sports Field', type: 'sports', status: 'upcoming' },
      { id: 4, title: 'Staff Meeting', date: 'March 18, 2024', time: '15:00 - 16:30', location: 'Conference Room', type: 'staff', status: 'completed' },
    ];

    const mockTeachers = [
      { id: 1, name: 'Mr. Smith', subject: 'Mathematics', email: 'smith@school.edu', phone: '+27 12 345 6789', students: 45, status: 'active' },
      { id: 2, name: 'Ms. Johnson', subject: 'Biology', email: 'johnson@school.edu', phone: '+27 12 345 6790', students: 38, status: 'active' },
      { id: 3, name: 'Dr. Williams', subject: 'Physics', email: 'williams@school.edu', phone: '+27 12 345 6791', students: 42, status: 'active' },
      { id: 4, name: 'Mrs. Brown', subject: 'English', email: 'brown@school.edu', phone: '+27 12 345 6792', students: 50, status: 'on leave' },
      { id: 5, name: 'Mr. Wilson', subject: 'Computer Science', email: 'wilson@school.edu', phone: '+27 12 345 6793', students: 32, status: 'active' },
      { id: 6, name: 'Ms. Davis', subject: 'History', email: 'davis@school.edu', phone: '+27 12 345 6794', students: 48, status: 'active' },
    ];

    setStudents(mockStudents);
    setAttendance(mockAttendance);
    setPayments(mockPayments);
    setEvents(mockEvents);
    setTeachers(mockTeachers);

    // Calculate statistics
    setStats({
      totalStudents: mockStudents.length,
      totalTeachers: mockTeachers.length,
      attendanceRate: Math.round((mockAttendance.filter(a => a.status === 'Present').length / mockAttendance.length) * 100),
      collectionRate: Math.round((mockPayments.filter(p => p.status === 'Paid').length / mockPayments.length) * 100)
    });

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
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Pagination calculations
  const studentStartIndex = (studentPage - 1) * itemsPerPage;
  const studentEndIndex = studentStartIndex + itemsPerPage;
  const displayedStudents = students.slice(studentStartIndex, studentEndIndex);
  const totalStudentPages = Math.ceil(students.length / itemsPerPage);

  const attendanceStartIndex = (attendancePage - 1) * itemsPerPage;
  const attendanceEndIndex = attendanceStartIndex + itemsPerPage;
  const displayedAttendance = attendance.slice(attendanceStartIndex, attendanceEndIndex);
  const totalAttendancePages = Math.ceil(attendance.length / itemsPerPage);

  const paymentStartIndex = (paymentPage - 1) * itemsPerPage;
  const paymentEndIndex = paymentStartIndex + itemsPerPage;
  const displayedPayments = payments.slice(paymentStartIndex, paymentEndIndex);
  const totalPaymentPages = Math.ceil(payments.length / itemsPerPage);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="admin-overview-grid">
            {/* Welcome & Quick Stats */}
            <div className="admin-welcome-card">
              <div className="admin-welcome-content">
                <h2>Welcome to Admin Dashboard</h2>
                <p>Manage your school's operations, monitor performance, and access all administrative tools.</p>
                <div className="admin-welcome-stats">
                  <div className="admin-welcome-stat">
                    <span className="admin-welcome-stat-label">Last System Update</span>
                    <span className="admin-welcome-stat-value">Today, 08:30 AM</span>
                  </div>
                  <div className="admin-welcome-stat">
                    <span className="admin-welcome-stat-label">Active Users</span>
                    <span className="admin-welcome-stat-value">142 Online</span>
                  </div>
                </div>
              </div>
              <div className="admin-welcome-actions">
                <button className="admin-primary-btn">
                  <FaPlus /> Quick Action
                </button>
              </div>
            </div>

            {/* Key Statistics */}
            <div className="admin-stat-cards">
              <div className="admin-stat-card">
                <div className="admin-stat-icon students">
                  <FaUserGraduate />
                </div>
                <div className="admin-stat-info">
                  <h3>Total Students</h3>
                  <p className="admin-stat-value">{stats.totalStudents}</p>
                  <span className="admin-stat-trend">
                    <span className="trend-up">↑ 12%</span> this month
                  </span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon teachers">
                  <FaUserTie />
                </div>
                <div className="admin-stat-info">
                  <h3>Teaching Staff</h3>
                  <p className="admin-stat-value">{stats.totalTeachers}</p>
                  <span className="admin-stat-trend">
                    {teachers.filter(t => t.status === 'active').length} active
                  </span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon attendance">
                  <FaCalendarCheck />
                </div>
                <div className="admin-stat-info">
                  <h3>Attendance Rate</h3>
                  <p className="admin-stat-value">{stats.attendanceRate}%</p>
                  <span className="admin-stat-trend">
                    Today: {attendance.filter(a => a.status === 'Present').length}/{attendance.length}
                  </span>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon finance">
                  <FaMoneyCheckAlt />
                </div>
                <div className="admin-stat-info">
                  <h3>Collection Rate</h3>
                  <p className="admin-stat-value">{stats.collectionRate}%</p>
                  <span className="admin-stat-trend">
                    R{payments.filter(p => p.status === 'Paid').length * 1200} collected
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="admin-dashboard-card">
              <div className="admin-card-header">
                <h2><FaBell /> Recent Activities</h2>
                <button className="admin-view-all-btn">View All Logs</button>
              </div>
              <div className="admin-activities-list">
                <div className="admin-activity-item">
                  <div className="admin-activity-icon success">
                    <FaUserGraduate />
                  </div>
                  <div className="admin-activity-details">
                    <h4>New Student Registration</h4>
                    <p className="admin-activity-desc">Thabiso M. enrolled in Grade 11</p>
                    <span className="admin-activity-time">10:30 AM • Today</span>
                  </div>
                </div>
                <div className="admin-activity-item">
                  <div className="admin-activity-icon warning">
                    <FaCreditCard />
                  </div>
                  <div className="admin-activity-details">
                    <h4>Payment Received</h4>
                    <p className="admin-activity-desc">R1,200 from Kagiso L. for March fees</p>
                    <span className="admin-activity-time">09:15 AM • Today</span>
                  </div>
                </div>
                <div className="admin-activity-item">
                  <div className="admin-activity-icon info">
                    <FaCalendarAlt />
                  </div>
                  <div className="admin-activity-details">
                    <h4>Event Created</h4>
                    <p className="admin-activity-desc">Parent-Teacher Conference scheduled</p>
                    <span className="admin-activity-time">Yesterday • 3:45 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="admin-dashboard-card">
              <div className="admin-card-header">
                <h2><FaClipboardList /> Quick Actions</h2>
              </div>
              <div className="admin-quick-actions">
                <button className="admin-quick-action">
                  <FaUserGraduate />
                  <span>Add Student</span>
                </button>
                <button className="admin-quick-action">
                  <FaUserTie />
                  <span>Add Teacher</span>
                </button>
                <button className="admin-quick-action">
                  <FaCalendarAlt />
                  <span>Create Event</span>
                </button>
                <button className="admin-quick-action">
                  <FaFileAlt />
                  <span>Generate Report</span>
                </button>
                <button className="admin-quick-action">
                  <FaCreditCard />
                  <span>Process Payment</span>
                </button>
                <button className="admin-quick-action">
                  <FaCog />
                  <span>System Settings</span>
                </button>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="admin-dashboard-card">
              <div className="admin-card-header">
                <h2><FaCreditCard /> Recent Payments</h2>
                <button className="admin-view-all-btn">View All</button>
              </div>
              <div className="admin-recent-payments">
                {payments.slice(0, 4).map(payment => (
                  <div key={payment.id} className="admin-payment-item">
                    <div className="admin-payment-details">
                      <h4>{payment.student}</h4>
                      <p className="admin-payment-month">{payment.month}</p>
                    </div>
                    <div className="admin-payment-info">
                      <span className="admin-payment-amount">{payment.amount}</span>
                      <span className={`admin-payment-status ${payment.status.toLowerCase()}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="admin-dashboard-card">
              <div className="admin-card-header">
                <h2><FaCalendarAlt /> Upcoming Events</h2>
                <button className="admin-view-all-btn">View Calendar</button>
              </div>
              <div className="admin-upcoming-events">
                {events.filter(e => e.status === 'upcoming').slice(0, 3).map(event => (
                  <div key={event.id} className="admin-event-item">
                    <div className="admin-event-date">
                      <span className="admin-event-day">{new Date(event.date).getDate()}</span>
                      <span className="admin-event-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="admin-event-details">
                      <h4>{event.title}</h4>
                      <p className="admin-event-time">{event.time} • {event.location}</p>
                      <span className={`admin-event-type ${event.type}`}>{event.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaUserGraduate /> Student Management</h2>
              <div className="admin-header-actions">
                <div className="admin-search-box">
                  <FaSearch />
                  <input type="text" placeholder="Search students..." />
                </div>
                <button className="admin-primary-btn">
                  <FaPlus /> Add Student
                </button>
                <button className="admin-secondary-btn">
                  <FaDownload /> Export
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <div className="admin-students-table">
                <div className="admin-table-header">
                  <div className="admin-table-col">Student Info</div>
                  <div className="admin-table-col">Grade</div>
                  <div className="admin-table-col">Subject</div>
                  <div className="admin-table-col">Enrollment Date</div>
                  <div className="admin-table-col">Fee Status</div>
                  <div className="admin-table-col">Actions</div>
                </div>
                {displayedStudents.map(student => (
                  <div key={student.id} className="admin-table-row">
                    <div className="admin-table-col" data-label="Student Info">
                      <div className="admin-student-info">
                        <div className="admin-student-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <strong>{student.name}</strong>
                          <div className="admin-student-number">{student.number}</div>
                          <div className="admin-student-contact">{student.contact}</div>
                        </div>
                      </div>
                    </div>
                    <div className="admin-table-col" data-label="Grade">
                      <span className="admin-grade-badge">{student.grade}</span>
                    </div>
                    <div className="admin-table-col" data-label="Subject">
                      {student.subject}
                    </div>
                    <div className="admin-table-col" data-label="Enrollment Date">
                      {student.enrollmentDate}
                    </div>
                    <div className="admin-table-col" data-label="Fee Status">
                      <span className={`admin-status-badge ${student.feesPaid ? 'status-success' : 'status-pending'}`}>
                        {student.feesPaid ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                    <div className="admin-table-col" data-label="Actions">
                      <div className="admin-action-buttons">
                        <button className="admin-action-btn small">
                          <FaEye /> View
                        </button>
                        <button className="admin-action-btn small">
                          <FaEdit /> Edit
                        </button>
                        <button className="admin-action-btn small danger">
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-table-scroll-hint">
                ← Scroll horizontally to see more →
              </div>
            </div>

            <div className="admin-table-footer">
              <div className="admin-pagination">
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setStudentPage(prev => Math.max(1, prev - 1))}
                  disabled={studentPage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                <span className="admin-page-info">
                  Page {studentPage} of {totalStudentPages}
                </span>
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setStudentPage(prev => Math.min(totalStudentPages, prev + 1))}
                  disabled={studentPage === totalStudentPages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
              <div className="admin-records-info">
                Showing {studentStartIndex + 1}-{Math.min(studentEndIndex, students.length)} of {students.length} students
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaCalendarCheck /> Attendance Tracking</h2>
              <div className="admin-header-actions">
                <div className="admin-date-filter">
                  <input type="date" defaultValue="2024-03-15" />
                </div>
                <button className="admin-primary-btn">
                  <FaDownload /> Export Report
                </button>
              </div>
            </div>

            <div className="admin-attendance-summary">
              <div className="admin-summary-item">
                <span className="admin-summary-label">Total Present</span>
                <span className="admin-summary-value success">
                  {attendance.filter(a => a.status === 'Present').length}
                </span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Absent</span>
                <span className="admin-summary-value warning">
                  {attendance.filter(a => a.status === 'Absent').length}
                </span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Late</span>
                <span className="admin-summary-value info">
                  {attendance.filter(a => a.status === 'Late').length}
                </span>
              </div>
              <div className="admin-summary-item">
                <span className="admin-summary-label">Attendance Rate</span>
                <span className="admin-summary-value">
                  {stats.attendanceRate}%
                </span>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <div className="admin-attendance-table">
                <div className="admin-table-header">
                  <div className="admin-table-col">Student</div>
                  <div className="admin-table-col">Date</div>
                  <div className="admin-table-col">Time In</div>
                  <div className="admin-table-col">Time Out</div>
                  <div className="admin-table-col">Status</div>
                  <div className="admin-table-col">Notes</div>
                  <div className="admin-table-col">Actions</div>
                </div>
                {displayedAttendance.map(record => (
                  <div key={record.id} className="admin-table-row">
                    <div className="admin-table-col" data-label="Student">
                      <strong>{record.name}</strong>
                    </div>
                    <div className="admin-table-col" data-label="Date">
                      {record.date}
                    </div>
                    <div className="admin-table-col" data-label="Time In">
                      {record.timeIn}
                    </div>
                    <div className="admin-table-col" data-label="Time Out">
                      {record.timeOut}
                    </div>
                    <div className="admin-table-col" data-label="Status">
                      <span className={`admin-status-badge ${record.status === 'Present' ? 'status-success' : 
                                      record.status === 'Absent' ? 'status-warning' : 'status-info'}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="admin-table-col" data-label="Notes">
                      {record.reason || '-'}
                    </div>
                    <div className="admin-table-col" data-label="Actions">
                      <button className="admin-action-btn small">
                        <FaEdit /> Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-table-scroll-hint">
                ← Scroll horizontally to see more →
              </div>
            </div>

            <div className="admin-table-footer">
              <div className="admin-pagination">
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setAttendancePage(prev => Math.max(1, prev - 1))}
                  disabled={attendancePage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                <span className="admin-page-info">
                  Page {attendancePage} of {totalAttendancePages}
                </span>
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setAttendancePage(prev => Math.min(totalAttendancePages, prev + 1))}
                  disabled={attendancePage === totalAttendancePages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
              <div className="admin-records-info">
                Showing {attendanceStartIndex + 1}-{Math.min(attendanceEndIndex, attendance.length)} of {attendance.length} records
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaCreditCard /> Financial Management</h2>
              <div className="admin-header-actions">
                <div className="admin-search-box">
                  <FaSearch />
                  <input type="text" placeholder="Search payments..." />
                </div>
                <button className="admin-primary-btn">
                  <FaPlus /> Record Payment
                </button>
              </div>
            </div>

            <div className="admin-financial-summary">
              <div className="admin-summary-card">
                <h3>Total Collected</h3>
                <p className="admin-summary-value">
                  R{payments.filter(p => p.status === 'Paid').length * 1200}
                </p>
                <span className="admin-summary-trend">This month</span>
              </div>
              <div className="admin-summary-card">
                <h3>Pending Payments</h3>
                <p className="admin-summary-value warning">
                  R{payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length * 1200}
                </p>
                <span className="admin-summary-trend">{payments.filter(p => p.status === 'Pending' || p.status === 'Overdue').length} invoices</span>
              </div>
              <div className="admin-summary-card">
                <h3>Collection Rate</h3>
                <p className="admin-summary-value">
                  {stats.collectionRate}%
                </p>
                <span className="admin-summary-trend">Current target: 95%</span>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <div className="admin-payments-table">
                <div className="admin-table-header">
                  <div className="admin-table-col">Invoice</div>
                  <div className="admin-table-col">Student</div>
                  <div className="admin-table-col">Amount</div>
                  <div className="admin-table-col">Due Date</div>
                  <div className="admin-table-col">Status</div>
                  <div className="admin-table-col">Actions</div>
                </div>
                {displayedPayments.map(payment => (
                  <div key={payment.id} className="admin-table-row">
                    <div className="admin-table-col" data-label="Invoice">
                      <div className="admin-invoice-number">{payment.invoice}</div>
                    </div>
                    <div className="admin-table-col" data-label="Student">
                      <strong>{payment.student}</strong>
                      <div className="admin-payment-month">{payment.month}</div>
                    </div>
                    <div className="admin-table-col" data-label="Amount">
                      <span className="admin-payment-amount">{payment.amount}</span>
                    </div>
                    <div className="admin-table-col" data-label="Due Date">
                      <span className={`admin-due-date ${payment.status === 'Overdue' ? 'overdue' : ''}`}>
                        {payment.dueDate}
                      </span>
                    </div>
                    <div className="admin-table-col" data-label="Status">
                      <span className={`admin-status-badge ${payment.status === 'Paid' ? 'status-success' : 
                                      payment.status === 'Pending' ? 'status-warning' : 'status-danger'}`}>
                        {payment.status}
                      </span>
                    </div>
                    <div className="admin-table-col" data-label="Actions">
                      <div className="admin-action-buttons">
                        {payment.status === 'Paid' ? (
                          <button className="admin-action-btn small">
                            <FaFileAlt /> Receipt
                          </button>
                        ) : (
                          <button className="admin-action-btn small success">
                            <FaCreditCard /> Mark Paid
                          </button>
                        )}
                        <button className="admin-action-btn small">
                          <FaEdit /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="admin-table-scroll-hint">
                ← Scroll horizontally to see more →
              </div>
            </div>

            <div className="admin-table-footer">
              <div className="admin-pagination">
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setPaymentPage(prev => Math.max(1, prev - 1))}
                  disabled={paymentPage === 1}
                >
                  <FaChevronLeft /> Previous
                </button>
                <span className="admin-page-info">
                  Page {paymentPage} of {totalPaymentPages}
                </span>
                <button 
                  className="admin-pagination-btn"
                  onClick={() => setPaymentPage(prev => Math.min(totalPaymentPages, prev + 1))}
                  disabled={paymentPage === totalPaymentPages}
                >
                  Next <FaChevronRight />
                </button>
              </div>
              <div className="admin-records-info">
                Showing {paymentStartIndex + 1}-{Math.min(paymentEndIndex, payments.length)} of {payments.length} payments
              </div>
            </div>
          </div>
        );

      case 'teachers':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaUserTie /> Teacher Management</h2>
              <div className="admin-header-actions">
                <button className="admin-primary-btn">
                  <FaPlus /> Add Teacher
                </button>
                <button className="admin-secondary-btn">
                  <FaDownload /> Export List
                </button>
              </div>
            </div>

            <div className="admin-teachers-grid">
              {teachers.map(teacher => (
                <div key={teacher.id} className="admin-teacher-card">
                  <div className="admin-teacher-header">
                    <div className="admin-teacher-avatar">
                      {teacher.name.charAt(0)}
                    </div>
                    <div className="admin-teacher-info">
                      <h3>{teacher.name}</h3>
                      <p className="admin-teacher-subject">{teacher.subject}</p>
                      <span className={`admin-status-badge ${teacher.status === 'active' ? 'status-success' : 'status-warning'}`}>
                        {teacher.status}
                      </span>
                    </div>
                  </div>
                  <div className="admin-teacher-details">
                    <div className="admin-teacher-contact">
                      <div className="admin-contact-item">
                        <strong>Email:</strong>
                        <span>{teacher.email}</span>
                      </div>
                      <div className="admin-contact-item">
                        <strong>Phone:</strong>
                        <span>{teacher.phone}</span>
                      </div>
                      <div className="admin-contact-item">
                        <strong>Students:</strong>
                        <span>{teacher.students}</span>
                      </div>
                    </div>
                  </div>
                  <div className="admin-teacher-actions">
                    <button className="admin-action-btn small">
                      <FaEye /> Profile
                    </button>
                    <button className="admin-action-btn small">
                      <FaEdit /> Edit
                    </button>
                    <button className="admin-action-btn small">
                      <FaCalendarAlt /> Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaChartLine /> Reports & Analytics</h2>
              <div className="admin-header-actions">
                <button className="admin-primary-btn">
                  <FaDownload /> Export All Reports
                </button>
              </div>
            </div>

            <div className="admin-reports-grid">
              <div className="admin-report-card">
                <div className="admin-report-card-header">
                  <FaUserGraduate className="admin-report-icon" />
                  <h3>Student Performance</h3>
                </div>
                <p>Detailed academic performance analysis with grade trends and comparisons.</p>
                <div className="admin-report-card-footer">
                  <button className="admin-action-btn small">
                    <FaFileAlt /> Generate
                  </button>
                  <button className="admin-action-btn small">
                    <FaChartLine /> Preview
                  </button>
                </div>
              </div>

              <div className="admin-report-card">
                <div className="admin-report-card-header">
                  <FaCalendarCheck className="admin-report-icon" />
                  <h3>Attendance Report</h3>
                </div>
                <p>Monthly attendance statistics with patterns, trends, and absence analysis.</p>
                <div className="admin-report-card-footer">
                  <button className="admin-action-btn small">
                    <FaFileAlt /> Generate
                  </button>
                  <button className="admin-action-btn small">
                    <FaChartLine /> Preview
                  </button>
                </div>
              </div>

              <div className="admin-report-card">
                <div className="admin-report-card-header">
                  <FaCreditCard className="admin-report-icon" />
                  <h3>Financial Statement</h3>
                </div>
                <p>Complete financial overview including revenue, expenses, and collection rates.</p>
                <div className="admin-report-card-footer">
                  <button className="admin-action-btn small">
                    <FaFileAlt /> Generate
                  </button>
                  <button className="admin-action-btn small">
                    <FaChartLine /> Preview
                  </button>
                </div>
              </div>

              <div className="admin-report-card">
                <div className="admin-report-card-header">
                  <FaChartBar className="admin-report-icon" />
                  <h3>Operational Analytics</h3>
                </div>
                <p>Comprehensive system analytics showing usage patterns and performance metrics.</p>
                <div className="admin-report-card-footer">
                  <button className="admin-action-btn small">
                    <FaFileAlt /> Generate
                  </button>
                  <button className="admin-action-btn small">
                    <FaChartLine /> Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="admin-dashboard-card full-view">
            <div className="admin-card-header">
              <h2><FaCog /> System Settings</h2>
            </div>

            <div className="admin-settings-grid">
              <div className="admin-settings-card">
                <FaSchool className="admin-settings-icon" />
                <h3>School Information</h3>
                <p>Manage school details, contact information, and academic calendar.</p>
                <button className="admin-action-btn">Configure</button>
              </div>

              <div className="admin-settings-card">
                <FaUserShield className="admin-settings-icon" />
                <h3>User Permissions</h3>
                <p>Control access levels and permissions for different user roles.</p>
                <button className="admin-action-btn">Manage</button>
              </div>

              <div className="admin-settings-card">
                <FaDatabase className="admin-settings-icon" />
                <h3>Database Management</h3>
                <p>Backup, restore, and manage your school's database.</p>
                <button className="admin-action-btn">Backup Now</button>
              </div>

              <div className="admin-settings-card">
                <FaBell className="admin-settings-icon" />
                <h3>Notifications</h3>
                <p>Configure email alerts, SMS notifications, and system alerts.</p>
                <button className="admin-action-btn">Settings</button>
              </div>
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

  const navItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: <FaTachometerAlt /> },
    { id: 'students', label: 'Student Management', icon: <FaUserGraduate /> },
    { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
    { id: 'payments', label: 'Financial', icon: <FaCreditCard /> },
    { id: 'teachers', label: 'Teachers', icon: <FaUserTie /> },
    { id: 'reports', label: 'Reports', icon: <FaChartLine /> },
    { id: 'settings', label: 'Settings', icon: <FaCog /> }
  ];

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <FaSchool />
            <span className="admin-school-name">Admin Portal</span>
          </div>
          <button className="admin-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="admin-user-profile">
          <div className="admin-user-avatar">
            <FaUserShield />
          </div>
          <div className="admin-user-info">
            <h3>System Administrator</h3>
            <p className="admin-user-role">Full Access</p>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="admin-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-system-info">
            <h4><FaCog /> System Status</h4>
            <p>All Systems Operational</p>
            <p>Last Backup: Today, 02:00 AM</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="admin-content-header">
          <button className="admin-mobile-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="admin-header-content">
            <h1 className="admin-welcome-heading">
              Administration Dashboard
            </h1>
            <p className="admin-welcome-subtitle">
              Manage all school operations from one centralized platform
            </p>
          </div>
          <div className="admin-header-actions">
            <div className="admin-date-display">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <button className="admin-notification-btn">
              <FaBell />
              <span className="admin-notification-count">3</span>
            </button>
          </div>
        </div>

        <div className="admin-content-body">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;