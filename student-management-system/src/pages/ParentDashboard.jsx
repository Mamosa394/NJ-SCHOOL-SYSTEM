import React, { useState, useEffect } from 'react';
import '../styles/parentdashboard.css';
import { 
  FaUser, 
  FaGraduationCap, 
  FaCalendarCheck, 
  FaCreditCard, 
  FaChartLine,
  FaBell,
  FaBars,
  FaTimes,
  FaDownload,
  FaEnvelope,
  FaPhone,
  FaSchool,
  FaCalendarAlt,
  FaFilePdf,
  FaChartBar,
  FaUsers,
  FaBook,
  FaUniversity,
  FaComments
} from 'react-icons/fa';

const ParentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState({});
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simulated API fetch - replace with real endpoints
    setStudent({
      fullName: 'Thabiso M.',
      studentNumber: 'ST12345',
      gradeLevel: 'Grade 11',
      school: 'University High School',
      classTeacher: 'Mrs. Johnson',
      parentName: 'Mr. & Mrs. M.',
      contactEmail: 'parent@email.com',
      profileImage: null
    });

    setGrades([
      { subject: 'Mathematics', mark: 85, trend: 'up', teacher: 'Mr. Smith', date: '2024-03-15', maxScore: 100, classAverage: 72 },
      { subject: 'Physics', mark: 78, trend: 'stable', teacher: 'Ms. Johnson', date: '2024-03-14', maxScore: 100, classAverage: 65 },
      { subject: 'Biology', mark: 92, trend: 'up', teacher: 'Dr. Williams', date: '2024-03-12', maxScore: 100, classAverage: 68 },
      { subject: 'English Literature', mark: 88, trend: 'up', teacher: 'Mrs. Brown', date: '2024-03-10', maxScore: 100, classAverage: 75 },
      { subject: 'History', mark: 75, trend: 'down', teacher: 'Mr. Davis', date: '2024-03-08', maxScore: 100, classAverage: 70 },
      { subject: 'Computer Science', mark: 95, trend: 'up', teacher: 'Mr. Wilson', date: '2024-03-05', maxScore: 100, classAverage: 80 }
    ]);

    setAttendance([
      { date: '2024-03-15', status: 'Present', timeIn: '08:15', timeOut: '15:30', day: 'Friday' },
      { date: '2024-03-14', status: 'Present', timeIn: '08:20', timeOut: '15:45', day: 'Thursday' },
      { date: '2024-03-13', status: 'Present', timeIn: '08:10', timeOut: '15:20', day: 'Wednesday' },
      { date: '2024-03-12', status: 'Absent', timeIn: '--:--', timeOut: '--:--', day: 'Tuesday', reason: 'Medical Appointment' },
      { date: '2024-03-11', status: 'Late', timeIn: '09:25', timeOut: '15:35', day: 'Monday', reason: 'Traffic Delay' },
      { date: '2024-03-08', status: 'Present', timeIn: '08:05', timeOut: '15:40', day: 'Friday' },
      { date: '2024-03-07', status: 'Present', timeIn: '08:15', timeOut: '15:30', day: 'Thursday' }
    ]);

    setPayments([
      { month: 'March 2024', status: 'Paid', amount: 'R1,200', dueDate: '2024-03-01', paidDate: '2024-02-28', invoice: 'INV-2024-003' },
      { month: 'February 2024', status: 'Paid', amount: 'R1,200', dueDate: '2024-02-01', paidDate: '2024-01-30', invoice: 'INV-2024-002' },
      { month: 'January 2024', status: 'Paid', amount: 'R1,200', dueDate: '2024-01-01', paidDate: '2023-12-28', invoice: 'INV-2024-001' },
      { month: 'December 2023', status: 'Pending', amount: 'R1,200', dueDate: '2024-04-01', paidDate: null, invoice: 'INV-2024-004' },
      { month: 'November 2023', status: 'Paid', amount: 'R1,200', dueDate: '2023-12-01', paidDate: '2023-11-28', invoice: 'INV-2023-012' }
    ]);

    setMessages([
      { id: 1, from: 'Principal Office', subject: 'Parent-Teacher Meeting Invitation', date: '2024-03-10', read: true, urgent: true, category: 'meeting' },
      { id: 2, from: 'Mathematics Department', subject: 'Quarterly Progress Report Available', date: '2024-03-08', read: true, urgent: false, category: 'academic' },
      { id: 3, from: 'Sports Department', subject: 'Inter-school Sports Competition Details', date: '2024-03-05', read: false, urgent: false, category: 'event' },
      { id: 4, from: 'Finance Office', subject: 'Fee Payment Reminder for March', date: '2024-03-03', read: true, urgent: false, category: 'financial' },
      { id: 5, from: 'Science Club', subject: 'Science Fair Participation Request', date: '2024-03-01', read: false, urgent: true, category: 'academic' }
    ]);

    setEvents([
      { title: 'Parent-Teacher Conference', date: '2024-03-25', time: '14:00 - 16:00', location: 'Main Campus Hall', type: 'meeting' },
      { title: 'End of Term Examinations', date: '2024-03-30', time: 'All Day', location: 'Various Classrooms', type: 'academic' },
      { title: 'Annual Sports Day', date: '2024-04-05', time: '09:00 - 15:00', location: 'School Sports Field', type: 'event' },
      { title: 'Science Fair Exhibition', date: '2024-04-12', time: '10:00 - 14:00', location: 'Science Building', type: 'academic' },
      { title: 'Music Concert', date: '2024-04-18', time: '18:00 - 20:00', location: 'Auditorium', type: 'cultural' }
    ]);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="parent-overview-grid">
            {/* Welcome Section */}
            <div className="parent-welcome-card">
              <div className="parent-welcome-content">
                <h2>Welcome to the Parent Portal</h2>
                <p>Monitor your child's academic progress, attendance, and school activities in real-time.</p>
                <div className="parent-welcome-stats">
                  <div className="parent-welcome-stat">
                    <span className="parent-welcome-stat-label">Last Login</span>
                    <span className="parent-welcome-stat-value">Today, 09:42 AM</span>
                  </div>
                  <div className="parent-welcome-stat">
                    <span className="parent-welcome-stat-label">Unread Messages</span>
                    <span className="parent-welcome-stat-value">2 New</span>
                  </div>
                </div>
              </div>
              <div className="parent-welcome-actions">
                <button className="parent-primary-btn">
                  <FaComments /> Contact Teacher
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="parent-stat-cards">
              <div className="parent-stat-card">
                <div className="parent-stat-icon grades">
                  <FaGraduationCap />
                </div>
                <div className="parent-stat-info">
                  <h3>Academic Average</h3>
                  <p className="parent-stat-value">
                    {grades.length > 0 
                      ? (grades.reduce((acc, grade) => acc + grade.mark, 0) / grades.length).toFixed(1) + '%'
                      : 'N/A'}
                  </p>
                  <span className="parent-stat-trend">
                    <span className="trend-up">↑ 3.2%</span> from last term
                  </span>
                </div>
              </div>

              <div className="parent-stat-card">
                <div className="parent-stat-icon attendance">
                  <FaCalendarCheck />
                </div>
                <div className="parent-stat-info">
                  <h3>Attendance Rate</h3>
                  <p className="parent-stat-value">
                    {attendance.length > 0 
                      ? `${((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                  <span className="parent-stat-trend">
                    {attendance.filter(a => a.status === 'Present').length} of {attendance.length} days
                  </span>
                </div>
              </div>

              <div className="parent-stat-card">
                <div className="parent-stat-icon payments">
                  <FaCreditCard />
                </div>
                <div className="parent-stat-info">
                  <h3>Fee Status</h3>
                  <p className="parent-stat-value">
                    {payments.filter(p => p.status === 'Paid').length}/{payments.length}
                  </p>
                  <span className="parent-stat-trend">
                    {payments.find(p => p.status === 'Pending') ? 'Pending payment due soon' : 'All fees paid'}
                  </span>
                </div>
              </div>

              <div className="parent-stat-card">
                <div className="parent-stat-icon messages">
                  <FaBell />
                </div>
                <div className="parent-stat-info">
                  <h3>Notifications</h3>
                  <p className="parent-stat-value">
                    {messages.filter(m => !m.read).length} New
                  </p>
                  <span className="parent-stat-trend">
                    {messages.length} total messages
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Performance Chart */}
            <div className="parent-dashboard-card">
              <div className="parent-card-header">
                <h2><FaChartBar /> Academic Performance Trend</h2>
                <select className="parent-period-select">
                  <option>This Term</option>
                  <option>Last Term</option>
                  <option>This Year</option>
                </select>
              </div>
              <div className="parent-performance-chart">
                <div className="parent-chart-legend">
                  <div className="parent-legend-item">
                    <span className="parent-legend-color student"></span>
                    <span>Your Child</span>
                  </div>
                  <div className="parent-legend-item">
                    <span className="parent-legend-color average"></span>
                    <span>Class Average</span>
                  </div>
                </div>
                <div className="parent-chart-bars">
                  {grades.slice(0, 6).map((subject, index) => (
                    <div key={index} className="parent-chart-bar-group">
                      <div className="parent-chart-bar-label">{subject.subject.split(' ')[0]}</div>
                      <div className="parent-chart-bars-container">
                        <div className="parent-chart-bar student" style={{ height: `${subject.mark}%` }}>
                          <span className="parent-chart-value">{subject.mark}%</span>
                        </div>
                        <div className="parent-chart-bar average" style={{ height: `${subject.classAverage}%` }}>
                          <span className="parent-chart-value">{subject.classAverage}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="parent-dashboard-card">
              <div className="parent-card-header">
                <h2><FaCalendarAlt /> Recent School Activities</h2>
                <button className="parent-view-all-btn">View Calendar</button>
              </div>
              <div className="parent-activities-list">
                {events.slice(0, 3).map((event, index) => (
                  <div key={index} className="parent-activity-item">
                    <div className="parent-activity-date">
                      <span className="parent-activity-day">{new Date(event.date).getDate()}</span>
                      <span className="parent-activity-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="parent-activity-details">
                      <h4>{event.title}</h4>
                      <p className="parent-activity-time">{event.time} • {event.location}</p>
                      <span className={`parent-activity-type ${event.type}`}>{event.type}</span>
                    </div>
                    <button className="parent-activity-action">Details</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="parent-dashboard-card">
              <div className="parent-card-header">
                <h2><FaUsers /> Quick Actions</h2>
              </div>
              <div className="parent-quick-actions">
                <button className="parent-quick-action">
                  <FaEnvelope />
                  <span>Message Teacher</span>
                </button>
                <button className="parent-quick-action">
                  <FaDownload />
                  <span>Download Reports</span>
                </button>
                <button className="parent-quick-action">
                  <FaCalendarCheck />
                  <span>View Attendance</span>
                </button>
                <button className="parent-quick-action">
                  <FaCreditCard />
                  <span>Make Payment</span>
                </button>
                <button className="parent-quick-action">
                  <FaBook />
                  <span>Study Resources</span>
                </button>
                <button className="parent-quick-action">
                  <FaUniversity />
                  <span>School Info</span>
                </button>
              </div>
            </div>
          </div>
        );

      case 'academic':
        return (
          <div className="parent-dashboard-card full-view">
            <div className="parent-card-header">
              <h2><FaGraduationCap /> Detailed Academic Performance</h2>
              <div className="parent-header-actions-group">
                <button className="parent-primary-btn">
                  <FaDownload /> Export Report
                </button>
                <button className="parent-secondary-btn">
                  <FaChartLine /> View Analytics
                </button>
              </div>
            </div>

            <div className="parent-academic-summary">
              <div className="parent-summary-card">
                <h3>Overall Average</h3>
                <p className="parent-summary-value">
                  {(grades.reduce((acc, grade) => acc + grade.mark, 0) / grades.length).toFixed(1)}%
                </p>
                <span className="parent-summary-trend trend-up">↑ 3.2% from last term</span>
              </div>
              <div className="parent-summary-card">
                <h3>Best Subject</h3>
                <p className="parent-summary-value">
                  {grades.reduce((max, grade) => grade.mark > max.mark ? grade : max).subject}
                </p>
                <span className="parent-summary-score">
                  {grades.reduce((max, grade) => grade.mark > max.mark ? grade : max).mark}%
                </span>
              </div>
              <div className="parent-summary-card">
                <h3>Needs Improvement</h3>
                <p className="parent-summary-value">
                  {grades.filter(g => g.mark < 70).length} subjects
                </p>
                <span className="parent-summary-list">
                  {grades.filter(g => g.mark < 70).map(g => g.subject).join(', ')}
                </span>
              </div>
            </div>

            <div className="parent-academic-table">
              <div className="parent-table-header">
                <div className="parent-table-col">Subject</div>
                <div className="parent-table-col">Score</div>
                <div className="parent-table-col">Class Average</div>
                <div className="parent-table-col">Performance</div>
                <div className="parent-table-col">Teacher</div>
                <div className="parent-table-col">Last Updated</div>
                <div className="parent-table-col">Actions</div>
              </div>
              {grades.map((grade, i) => (
                <div key={i} className="parent-table-row">
                  <div className="parent-table-col parent-subject-col">
                    <div className="parent-subject-icon-wrapper">
                      <FaBook />
                    </div>
                    <div>
                      <strong>{grade.subject}</strong>
                      <div className="parent-subject-code">Subject Code: SUB-{100 + i}</div>
                    </div>
                  </div>
                  <div className="parent-table-col">
                    <div className="parent-grade-score">
                      <span className={`parent-grade-value ${grade.mark >= 80 ? 'excellent' : grade.mark >= 70 ? 'good' : 'average'}`}>
                        {grade.mark}%
                      </span>
                      <div className="parent-grade-max">/ {grade.maxScore}%</div>
                    </div>
                  </div>
                  <div className="parent-table-col">
                    <span className="parent-class-average">{grade.classAverage}%</span>
                    <div className="parent-difference">
                      {grade.mark > grade.classAverage ? '+' : ''}{(grade.mark - grade.classAverage).toFixed(1)}%
                    </div>
                  </div>
                  <div className="parent-table-col">
                    <div className="parent-performance-indicator">
                      <span className={`parent-trend-badge ${grade.trend === 'up' ? 'trend-up' : grade.trend === 'down' ? 'trend-down' : 'trend-stable'}`}>
                        {grade.trend === 'up' ? 'Improving' : grade.trend === 'down' ? 'Declining' : 'Stable'}
                      </span>
                      <div className="parent-performance-bar">
                        <div 
                          className="parent-progress" 
                          style={{ width: `${grade.mark}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="parent-table-col">
                    <div className="parent-teacher-info">
                      <strong>{grade.teacher}</strong>
                      <button className="parent-contact-btn">Contact</button>
                    </div>
                  </div>
                  <div className="parent-table-col">{grade.date}</div>
                  <div className="parent-table-col">
                    <div className="parent-action-buttons">
                      <button className="parent-action-btn small">
                        <FaFilePdf /> PDF
                      </button>
                      <button className="parent-action-btn small">
                        <FaComments /> Discuss
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="parent-academic-notes">
              <h3>Teacher's Overall Comments</h3>
              <div className="parent-notes-content">
                <p>Your child is showing excellent progress in Mathematics and Computer Science, demonstrating strong analytical skills. 
                Additional focus on History revision is recommended to improve understanding of key concepts. 
                Regular attendance in Physics practical sessions will help reinforce theoretical knowledge.</p>
                <div className="parent-notes-footer">
                  <span className="parent-notes-author">Class Teacher: Mrs. Johnson</span>
                  <span className="parent-notes-date">Last Updated: March 15, 2024</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="parent-dashboard-card full-view">
            <div className="parent-card-header">
              <h2><FaCalendarCheck /> Detailed Attendance Record</h2>
              <div className="parent-attendance-summary">
                <div className="parent-summary-item">
                  <span className="parent-summary-label">This Month</span>
                  <span className="parent-summary-value">
                    {attendance.filter(a => a.status === 'Present').length}/{attendance.length} days
                  </span>
                </div>
                <div className="parent-summary-item">
                  <span className="parent-summary-label">Rate</span>
                  <span className="parent-summary-value success">
                    {((attendance.filter(a => a.status === 'Present').length / attendance.length) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="parent-summary-item">
                  <span className="parent-summary-label">Absences</span>
                  <span className="parent-summary-value warning">
                    {attendance.filter(a => a.status === 'Absent').length}
                  </span>
                </div>
                <div className="parent-summary-item">
                  <span className="parent-summary-label">Late Arrivals</span>
                  <span className="parent-summary-value info">
                    {attendance.filter(a => a.status === 'Late').length}
                  </span>
                </div>
              </div>
            </div>

            <div className="parent-attendance-calendar">
              <h3>March 2024 Attendance</h3>
              <div className="parent-calendar-grid">
                {attendance.map((day, index) => (
                  <div key={index} className="parent-calendar-day">
                    <div className="parent-calendar-day-header">
                      <span className="parent-calendar-date">{new Date(day.date).getDate()}</span>
                      <span className="parent-calendar-weekday">{day.day.substring(0, 3)}</span>
                    </div>
                    <div className={`parent-calendar-status ${day.status.toLowerCase()}`}>
                      {day.status}
                    </div>
                    <div className="parent-calendar-times">
                      <div className="parent-time-in">
                        <small>IN</small>
                        <span>{day.timeIn}</span>
                      </div>
                      <div className="parent-time-out">
                        <small>OUT</small>
                        <span>{day.timeOut}</span>
                      </div>
                    </div>
                    {day.reason && (
                      <div className="parent-calendar-reason">
                        <small>Note: {day.reason}</small>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="parent-attendance-table">
              <h3>Attendance History</h3>
              <div className="parent-table-header">
                <div className="parent-table-col">Date</div>
                <div className="parent-table-col">Day</div>
                <div className="parent-table-col">Status</div>
                <div className="parent-table-col">Time In</div>
                <div className="parent-table-col">Time Out</div>
                <div className="parent-table-col">Duration</div>
                <div className="parent-table-col">Notes</div>
              </div>
              {attendance.map((record, i) => (
                <div key={i} className="parent-table-row">
                  <div className="parent-table-col">{record.date}</div>
                  <div className="parent-table-col">{record.day}</div>
                  <div className="parent-table-col">
                    <span className={`parent-status-badge ${record.status === 'Present' ? 'status-success' : 
                                      record.status === 'Absent' ? 'status-warning' : 'status-info'}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="parent-table-col">{record.timeIn}</div>
                  <div className="parent-table-col">{record.timeOut}</div>
                  <div className="parent-table-col">
                    {record.timeIn !== '--:--' ? '7h 15m' : '--:--'}
                  </div>
                  <div className="parent-table-col">{record.reason || '-'}</div>
                </div>
              ))}
            </div>

            <div className="parent-attendance-notes">
              <h3>Attendance Policy & Notes</h3>
              <div className="parent-notes-content">
                <p>• Regular attendance is crucial for academic success. Please ensure your child arrives on time.</p>
                <p>• Medical appointments should be scheduled outside school hours when possible.</p>
                <p>• Any planned absences should be communicated to the school office in advance.</p>
                <p>• Persistent lateness may affect academic performance and school participation.</p>
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="parent-dashboard-card full-view">
            <div className="parent-card-header">
              <h2><FaCreditCard /> Financial Records & Payments</h2>
              <button className="parent-primary-btn">Make Online Payment</button>
            </div>

            <div className="parent-payments-overview">
              <div className="parent-payment-stats">
                <div className="parent-payment-stat">
                  <h3>Total Paid This Year</h3>
                  <p className="parent-payment-amount">R{payments.filter(p => p.status === 'Paid').length * 1200}</p>
                </div>
                <div className="parent-payment-stat">
                  <h3>Outstanding Balance</h3>
                  <p className="parent-payment-amount pending">R{payments.filter(p => p.status === 'Pending').length * 1200}</p>
                </div>
                <div className="parent-payment-stat">
                  <h3>Next Due Date</h3>
                  <p className="parent-payment-date">
                    {payments.find(p => p.status === 'Pending')?.dueDate || 'All Paid'}
                  </p>
                  <span className="parent-payment-days">Due in 15 days</span>
                </div>
              </div>
            </div>

            <div className="parent-payments-list">
              <div className="parent-table-header">
                <div className="parent-table-col">Invoice</div>
                <div className="parent-table-col">Month</div>
                <div className="parent-table-col">Amount</div>
                <div className="parent-table-col">Due Date</div>
                <div className="parent-table-col">Paid Date</div>
                <div className="parent-table-col">Status</div>
                <div className="parent-table-col">Actions</div>
              </div>
              {payments.map((payment, i) => (
                <div key={i} className="parent-table-row">
                  <div className="parent-table-col">
                    <div className="parent-invoice-number">{payment.invoice}</div>
                  </div>
                  <div className="parent-table-col">
                    <strong>{payment.month}</strong>
                  </div>
                  <div className="parent-table-col">
                    <span className="parent-payment-amount">{payment.amount}</span>
                  </div>
                  <div className="parent-table-col">
                    <span className={`parent-due-date ${new Date(payment.dueDate) < new Date() ? 'overdue' : ''}`}>
                      {payment.dueDate}
                    </span>
                  </div>
                  <div className="parent-table-col">
                    {payment.paidDate || '-'}
                  </div>
                  <div className="parent-table-col">
                    <span className={`parent-status-badge ${payment.status === 'Paid' ? 'status-success' : 'status-pending'}`}>
                      {payment.status}
                    </span>
                  </div>
                  <div className="parent-table-col">
                    <div className="parent-action-buttons">
                      {payment.status === 'Paid' ? (
                        <>
                          <button className="parent-action-btn small">
                            <FaFilePdf /> Receipt
                          </button>
                          <button className="parent-action-btn small secondary">
                            Re-download
                          </button>
                        </>
                      ) : (
                        <button className="parent-action-btn small success">
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="parent-payment-methods">
              <h3>Payment Methods</h3>
              <div className="parent-methods-grid">
                <div className="parent-method-card">
                  <h4>Online Payment</h4>
                  <p>Secure online payment via credit card or bank transfer</p>
                  <button className="parent-action-btn">Pay Online</button>
                </div>
                <div className="parent-method-card">
                  <h4>Bank Transfer</h4>
                  <p>Direct deposit to school bank account</p>
                  <button className="parent-action-btn secondary">View Details</button>
                </div>
                <div className="parent-method-card">
                  <h4>In-Person</h4>
                  <p>Visit school finance office during working hours</p>
                  <button className="parent-action-btn secondary">Office Hours</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="parent-dashboard-card full-view">
            <div className="parent-card-header">
              <h2><FaEnvelope /> School Communications</h2>
              <button className="parent-primary-btn">
                <FaEnvelope /> New Message
              </button>
            </div>

            <div className="parent-messages-container">
              <div className="parent-messages-sidebar">
                <div className="parent-messages-filters">
                  <button className="parent-filter-btn active">All Messages</button>
                  <button className="parent-filter-btn">Unread ({messages.filter(m => !m.read).length})</button>
                  <button className="parent-filter-btn">Urgent</button>
                  <button className="parent-filter-btn">From Teachers</button>
                </div>
                <div className="parent-messages-list">
                  {messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`parent-message-preview ${!message.read ? 'unread' : ''} ${message.urgent ? 'urgent' : ''}`}
                      onClick={() => {/* Handle message select */}}
                    >
                      <div className="parent-message-preview-header">
                        <div className="parent-message-sender">
                          <FaUser />
                          <span>{message.from}</span>
                        </div>
                        <div className="parent-message-date">{message.date}</div>
                      </div>
                      <div className="parent-message-preview-subject">{message.subject}</div>
                      <div className="parent-message-preview-category">{message.category}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="parent-message-detail">
                <div className="parent-message-detail-header">
                  <h3>{messages[0]?.subject || 'Select a message'}</h3>
                  <div className="parent-message-detail-meta">
                    <span className="parent-message-from">From: {messages[0]?.from}</span>
                    <span className="parent-message-date">{messages[0]?.date}</span>
                  </div>
                </div>
                <div className="parent-message-detail-content">
                  <p>Dear Parents,</p>
                  <p>We are pleased to invite you to the upcoming Parent-Teacher Meeting scheduled for March 25, 2024. This meeting provides an excellent opportunity to discuss your child's progress, address any concerns, and plan for the upcoming term.</p>
                  <p>Please confirm your attendance by replying to this message or contacting the school office.</p>
                  <p>Best regards,<br/>School Administration</p>
                </div>
                <div className="parent-message-detail-actions">
                  <button className="parent-primary-btn">Reply</button>
                  <button className="parent-secondary-btn">Forward</button>
                  <button className="parent-action-btn">Archive</button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="parent-dashboard-card full-view">
            <div className="parent-card-header">
              <h2><FaChartLine /> Reports & Analytics</h2>
              <button className="parent-primary-btn">
                <FaDownload /> Export All Reports
              </button>
            </div>

            <div className="parent-reports-grid">
              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaGraduationCap className="parent-report-icon" />
                  <h3>Academic Performance Report</h3>
                </div>
                <p>Comprehensive analysis of academic performance across all subjects with detailed insights and recommendations.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">Last Updated: March 15, 2024</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>

              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaCalendarCheck className="parent-report-icon" />
                  <h3>Attendance Summary</h3>
                </div>
                <p>Detailed monthly attendance report showing patterns, trends, and comparison with class averages.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">March 2024 Report</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>

              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaCreditCard className="parent-report-icon" />
                  <h3>Financial Statement</h3>
                </div>
                <p>Complete financial history including all payments, receipts, and outstanding balances.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">Year: 2023-2024</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>

              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaChartBar className="parent-report-icon" />
                  <h3>Progress Analytics</h3>
                </div>
                <p>Advanced analytics showing learning trends, prediction models, and improvement areas.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">Real-time Analytics</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>

              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaBook className="parent-report-icon" />
                  <h3>Term Examination Report</h3>
                </div>
                <p>Detailed analysis of term examination performance with subject-wise breakdown.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">Term 1, 2024</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>

              <div className="parent-report-card">
                <div className="parent-report-card-header">
                  <FaUsers className="parent-report-icon" />
                  <h3>Behavior & Participation</h3>
                </div>
                <p>Report on classroom participation, extracurricular activities, and behavioral observations.</p>
                <div className="parent-report-card-footer">
                  <span className="parent-report-date">Quarter 1 Report</span>
                  <div className="parent-report-actions">
                    <button className="parent-action-btn small">
                      <FaFilePdf /> PDF
                    </button>
                    <button className="parent-action-btn small">
                      <FaChartLine /> View
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="parent-report-history">
              <h3>Report Generation History</h3>
              <div className="parent-table-header">
                <div className="parent-table-col">Report Type</div>
                <div className="parent-table-col">Generated Date</div>
                <div className="parent-table-col">Period</div>
                <div className="parent-table-col">File Size</div>
                <div className="parent-table-col">Actions</div>
              </div>
              <div className="parent-table-row">
                <div className="parent-table-col">Academic Performance Report</div>
                <div className="parent-table-col">March 15, 2024</div>
                <div className="parent-table-col">Term 1, 2024</div>
                <div className="parent-table-col">2.4 MB</div>
                <div className="parent-table-col">
                  <button className="parent-action-btn small">Download</button>
                </div>
              </div>
              {/* Add more history rows as needed */}
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
    { id: 'overview', label: 'Dashboard Overview', icon: <FaUser /> },
    { id: 'academic', label: 'Academic Performance', icon: <FaGraduationCap /> },
    { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
    { id: 'payments', label: 'Payments', icon: <FaCreditCard /> },
    { id: 'messages', label: 'Messages', icon: <FaEnvelope /> },
    { id: 'reports', label: 'Reports', icon: <FaChartLine /> }
  ];

  return (
    <div className="parent-dashboard-container">
      {/* Sidebar */}
      <aside className={`parent-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="parent-sidebar-header">
          <div className="parent-sidebar-logo">
            <FaSchool />
            <span className="parent-school-name">Parent Portal</span>
          </div>
          <button className="parent-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="parent-user-profile">
          <div className="parent-user-avatar">
            {student.parentName?.charAt(0) || 'P'}
          </div>
          <div className="parent-user-info">
            <h3>{student.parentName || 'Parent'}</h3>
            <p className="parent-user-role">Parent Dashboard</p>
          </div>
        </div>

        <div className="parent-student-info">
          <div className="parent-student-avatar">
            <FaUser />
          </div>
          <div className="parent-student-details">
            <h4>{student.fullName}</h4>
            <p className="parent-student-id">ID: {student.studentNumber}</p>
            <p className="parent-student-grade">{student.gradeLevel}</p>
          </div>
        </div>

        <nav className="parent-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`parent-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span className="parent-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="parent-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="parent-sidebar-footer">
          <div className="parent-support-info">
            <h4><FaPhone /> School Support</h4>
            <p>Office: (012) 345-6789</p>
            <p>Email: parent@school.edu</p>
            <p>Hours: 8AM - 4PM</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`parent-main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="parent-content-header">
          <button className="parent-mobile-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="parent-header-content">
            <h1 className="parent-welcome-heading">
              Parent Portal • {student.fullName}
            </h1>
            <p className="parent-welcome-subtitle">
              {student.gradeLevel} • {student.school} • Class Teacher: {student.classTeacher}
            </p>
          </div>
          <div className="parent-header-actions">
            <div className="parent-date-display">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <button className="parent-notification-btn">
              <FaBell />
              <span className="parent-notification-count">{messages.filter(m => !m.read).length}</span>
            </button>
          </div>
        </div>

        <div className="parent-content-body">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;