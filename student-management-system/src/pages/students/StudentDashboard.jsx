import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../../components/supabaseClient';
import '../../styles/students/studentDashboard.css';
import Logo from '../../assets/Logo.jpg';
import MultiStageRegistration from '../../components/MultiStageRegistration';
import { 
  FaGraduationCap, 
  FaCalendarCheck, 
  FaCreditCard, 
  FaCalendarAlt, 
  FaBell,
  FaUser,
  FaBars,
  FaTimes,
  FaHome,
  FaSignOutAlt,
  FaSearch,
  FaChevronRight,
  FaEllipsisV,
  FaArrowUp,
  FaClock,
  FaMapMarkerAlt,
  FaBook,
  FaChartLine,
  FaExclamationTriangle,
  FaUserPlus,
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

const StudentDashboard = () => {
  // Registration & Auth State
  const [isRegistered, setIsRegistered] = useState(null); // null = loading, false = not registered, true = registered & approved
  const [registrationStatus, setRegistrationStatus] = useState(null); // 'pending', 'approved', 'rejected', null
  const [registrationData, setRegistrationData] = useState(null);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  
  // Dashboard State
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState({});
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [notifications] = useState(3);

  // Check registration status on mount
  useEffect(() => {
    checkRegistrationStatus();
  }, []);

  // Check mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch dashboard data once registered and approved
  useEffect(() => {
    if (isRegistered === true) {
      fetchDashboardData();
    }
  }, [isRegistered]);

  const checkRegistrationStatus = async () => {
    setIsCheckingRegistration(true);
    setRegistrationError(null);
    
    try {
      // Step 1: Get current authenticated user from Supabase
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error. Please try logging in again.');
      }
      
      if (!user) {
        console.log('No authenticated user found, redirecting to login');
        window.location.href = '/login';
        return;
      }

      console.log('✅ User authenticated:', user.id, user.email);

      // Step 2: Check student_registrations table for this user
      const { data: registration, error: regError } = await supabase
        .from('student_registrations')
        .select(`
          id,
          user_id,
          profile_id,
          full_name,
          student_number,
          email,
          phone,
          birth_date,
          gender,
          class_type,
          subjects,
          payment_method,
          payment_number,
          payer_name,
          payment_screenshot_url,
          registration_status,
          total_amount,
          submitted_at,
          updated_at,
          approved_at,
          admin_notes
        `)
        .eq('user_id', user.id)
        .single();

      if (regError) {
        if (regError.code === 'PGRST116') {
          // No registration found - user needs to register
          console.log('📝 No registration found for user');
          setIsRegistered(false);
          setRegistrationStatus(null);
          setRegistrationData(null);
          
          // Set basic student info from auth
          setStudent({
            fullName: user.user_metadata?.full_name || '',
            email: user.email,
          });
        } else {
          // Other error
          console.error('Registration query error:', regError);
          throw regError;
        }
      } else if (registration) {
        // Registration found - check status
        console.log('📋 Registration found:', registration.id, 'Status:', registration.registration_status);
        
        setRegistrationData(registration);
        setRegistrationStatus(registration.registration_status);
        
        if (registration.registration_status === 'approved') {
          // Approved - allow dashboard access
          setIsRegistered(true);
          setStudent({
            fullName: registration.full_name,
            studentNumber: registration.student_number,
            email: registration.email,
            phone: registration.phone,
            gender: registration.gender,
            classType: registration.class_type,
            subjects: registration.subjects,
            ...registration
          });
        } else if (registration.registration_status === 'pending') {
          // Pending - show waiting screen
          setIsRegistered(false);
        } else if (registration.registration_status === 'rejected') {
          // Rejected - allow re-registration
          setIsRegistered(false);
          setRegistrationError('Your previous registration was not approved. You can submit a new registration below.');
        }
      }
    } catch (error) {
      console.error('❌ Error checking registration:', error);
      setRegistrationError(error.message || 'Failed to check registration status. Please try again.');
      setIsRegistered(false);
    } finally {
      setIsCheckingRegistration(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    
    try {
      const [studentRes, gradesRes, attendanceRes, paymentsRes, eventsRes] = await Promise.allSettled([
        axios.get('/api/student/info'),
        axios.get('/api/student/grades'),
        axios.get('/api/student/attendance'),
        axios.get('/api/student/payments'),
        axios.get('/api/events')
      ]);

      if (studentRes.status === 'fulfilled') setStudent(prev => ({ ...prev, ...studentRes.value.data }));
      if (gradesRes.status === 'fulfilled') setGrades(Array.isArray(gradesRes.value.data) ? gradesRes.value.data : []);
      if (attendanceRes.status === 'fulfilled') setAttendance(Array.isArray(attendanceRes.value.data) ? attendanceRes.value.data : []);
      if (paymentsRes.status === 'fulfilled') setPayments(Array.isArray(paymentsRes.value.data) ? paymentsRes.value.data : []);
      if (eventsRes.status === 'fulfilled') setEvents(Array.isArray(eventsRes.value.data) ? eventsRes.value.data : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  const handleRegistrationComplete = (registrationInfo) => {
    console.log('Registration completed:', registrationInfo);
    setRegistrationData(registrationInfo);
    setRegistrationStatus('pending');
    setIsRegistered(false); // Still false until approved
    setShowRegistration(false);
  };

  const handleRegistrationCancel = () => {
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  };

  const handleResubmit = () => {
    setRegistrationError(null);
    setShowRegistration(true);
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: <FaHome /> },
    { id: 'grades', label: 'My Grades', icon: <FaGraduationCap /> },
    { id: 'attendance', label: 'Attendance', icon: <FaCalendarCheck /> },
    { id: 'payments', label: 'Payments', icon: <FaCreditCard /> },
    { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
    { id: 'events', label: 'Events', icon: <FaBell /> }
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const averageGrade = grades.length > 0
    ? (grades.reduce((acc, g) => acc + (g.mark || 0), 0) / grades.length).toFixed(1)
    : '0';

  const attendanceRate = attendance.length > 0
    ? ((attendance.filter(a => a.present).length / attendance.length) * 100).toFixed(1)
    : '0';

  const paidCount = payments.filter(p => p.paid).length;
  const totalPayments = payments.length;

  const getGradeColor = (mark) => {
    if (mark >= 80) return 'excellent';
    if (mark >= 60) return 'good';
    if (mark >= 40) return 'average';
    return 'poor';
  };

  // ===== LOADING SCREEN =====
  if (isCheckingRegistration) {
    return (
      <div className="dash-loader-container">
        <div className="dash-loader-content">
          <img src={Logo} alt="NJEC" className="dash-loader-logo" />
          <div className="dash-loader-spinner">
            <div className="dash-loader-ring"></div>
          </div>
          <p>Checking your account...</p>
          <span className="dash-loader-sub">Verifying registration status</span>
        </div>
      </div>
    );
  }

  // ===== REGISTRATION PENDING SCREEN =====
  if (!isRegistered && registrationStatus === 'pending' && !showRegistration) {
    return (
      <div className="dash-registration-required">
        <div className="dash-registration-card">
          <div className="dash-registration-icon pending">
            <FaHourglassHalf />
          </div>
          <h1>Registration Pending Approval</h1>
          <p>Your registration has been submitted and is currently being reviewed by our administration team.</p>
          
          <div className="dash-registration-details">
            <div className="dash-detail-row">
              <span>Student Number:</span>
              <strong>{registrationData?.student_number || 'N/A'}</strong>
            </div>
            <div className="dash-detail-row">
              <span>Full Name:</span>
              <strong>{registrationData?.full_name || 'N/A'}</strong>
            </div>
            <div className="dash-detail-row">
              <span>Status:</span>
              <span className="dash-status-badge pending">Pending Review</span>
            </div>
            <div className="dash-detail-row">
              <span>Submitted:</span>
              <strong>{registrationData?.submitted_at ? new Date(registrationData.submitted_at).toLocaleDateString() : 'N/A'}</strong>
            </div>
          </div>

          <div className="dash-registration-info">
            <div className="dash-info-item">
              <FaCheckCircle />
              <span>You will receive an email notification once approved</span>
            </div>
            <div className="dash-info-item">
              <FaClock />
              <span>Approval typically takes 24-48 hours</span>
            </div>
          </div>
          
          <div className="dash-registration-actions">
            <button onClick={checkRegistrationStatus} className="dash-registration-btn secondary">
              <FaArrowUp />
              Check Status Again
            </button>
            <button onClick={handleRegistrationCancel} className="dash-registration-cancel">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== REGISTRATION REJECTED SCREEN =====
  if (!isRegistered && registrationStatus === 'rejected' && !showRegistration) {
    return (
      <div className="dash-registration-required">
        <div className="dash-registration-card">
          <div className="dash-registration-icon rejected">
            <FaTimesCircle />
          </div>
          <h1>Registration Not Approved</h1>
          <p>Unfortunately, your registration was not approved. You can submit a new registration below.</p>
          
          {registrationData?.admin_notes && (
            <div className="dash-admin-note">
              <strong>Admin Note:</strong>
              <p>{registrationData.admin_notes}</p>
            </div>
          )}
          
          <div className="dash-registration-actions">
            <button onClick={handleResubmit} className="dash-registration-btn">
              <FaUserPlus />
              Submit New Registration
            </button>
            <button onClick={handleRegistrationCancel} className="dash-registration-cancel">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== NO REGISTRATION SCREEN =====
  if (!isRegistered && !showRegistration && registrationStatus !== 'pending' && registrationStatus !== 'rejected') {
    return (
      <div className="dash-registration-required">
        <div className="dash-registration-card">
          <div className="dash-registration-icon">
            <FaUserPlus />
          </div>
          <h1>Complete Your Registration</h1>
          <p>You need to complete your registration before accessing the student dashboard.</p>
          
          {registrationError && (
            <div className="dash-registration-error">
              <FaExclamationTriangle />
              <span>{registrationError}</span>
              <button onClick={checkRegistrationStatus} className="dash-btn-text">
                Try Again
              </button>
            </div>
          )}
          
          <div className="dash-registration-info">
            <div className="dash-info-item">
              <FaGraduationCap />
              <span>Access your grades and academic records</span>
            </div>
            <div className="dash-info-item">
              <FaCalendarCheck />
              <span>Track your attendance and schedule</span>
            </div>
            <div className="dash-info-item">
              <FaCreditCard />
              <span>Manage payments and fees</span>
            </div>
          </div>
          
          <div className="dash-registration-actions">
            <button onClick={() => setShowRegistration(true)} className="dash-registration-btn">
              <FaUserPlus />
              Register Now
            </button>
            <button onClick={handleRegistrationCancel} className="dash-registration-cancel">
              Cancel & Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== REGISTRATION FORM =====
  if (!isRegistered && showRegistration) {
    return (
      <MultiStageRegistration
        onComplete={handleRegistrationComplete}
        onCancel={() => setShowRegistration(false)}
        initialData={registrationData}
      />
    );
  }

  // ===== MAIN DASHBOARD LOADING =====
  if (loading) {
    return (
      <div className="dash-loader-container">
        <div className="dash-loader-content">
          <img src={Logo} alt="NJEC" className="dash-loader-logo" />
          <div className="dash-loader-spinner">
            <div className="dash-loader-ring"></div>
          </div>
          <p>Loading your dashboard</p>
          <span className="dash-loader-sub">Preparing your academic overview...</span>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD RENDER FUNCTIONS =====
  const renderOverview = () => (
    <div className="dash-overview">
      {/* Welcome Card */}
      <div className="dash-welcome-card">
        <div className="dash-welcome-content">
          <div className="dash-welcome-text">
            <span className="dash-greeting">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
            </span>
            <h1>{student?.fullName?.split(' ')[0] || 'Student'} 👋</h1>
            <p>Track your academic progress and stay on top of your studies</p>
          </div>
          <div className="dash-welcome-stats">
            <div className="dash-mini-stat">
              <FaGraduationCap />
              <span>{grades.length} Subjects</span>
            </div>
            <div className="dash-mini-stat">
              <FaChartLine />
              <span>{averageGrade}% Avg</span>
            </div>
          </div>
        </div>
        <div className="dash-welcome-illustration">
          <div className="dash-illustration-circle"></div>
          <div className="dash-illustration-circle-small"></div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card purple">
          <div className="dash-stat-icon-wrap"><FaGraduationCap /></div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{averageGrade}%</span>
            <span className="dash-stat-label">Average Grade</span>
          </div>
          <div className="dash-stat-trend up"><FaArrowUp /><span>12%</span></div>
        </div>

        <div className="dash-stat-card blue">
          <div className="dash-stat-icon-wrap"><FaCalendarCheck /></div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{attendanceRate}%</span>
            <span className="dash-stat-label">Attendance</span>
          </div>
          <div className="dash-stat-trend up"><FaArrowUp /><span>5%</span></div>
        </div>

        <div className="dash-stat-card green">
          <div className="dash-stat-icon-wrap"><FaCreditCard /></div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{paidCount}/{totalPayments}</span>
            <span className="dash-stat-label">Payments Done</span>
          </div>
          <div className="dash-stat-trend neutral"><span>{totalPayments - paidCount} left</span></div>
        </div>

        <div className="dash-stat-card orange">
          <div className="dash-stat-icon-wrap"><FaBell /></div>
          <div className="dash-stat-content">
            <span className="dash-stat-value">{events.length}</span>
            <span className="dash-stat-label">Upcoming Events</span>
          </div>
          <div className="dash-stat-trend"><span>This month</span></div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dash-main-grid">
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Recent Grades</h3>
            <button onClick={() => setActiveTab('grades')} className="dash-btn-text">
              View All <FaChevronRight />
            </button>
          </div>
          <div className="dash-grades-list">
            {grades.slice(0, 5).length > 0 ? grades.slice(0, 5).map((grade, i) => (
              <div key={i} className="dash-grade-row">
                <div className="dash-grade-info">
                  <div className={`dash-grade-dot ${getGradeColor(grade.mark)}`}></div>
                  <div>
                    <span className="dash-grade-subject">{grade.subject || 'Subject'}</span>
                    <span className="dash-grade-term">Term 2, 2024</span>
                  </div>
                </div>
                <div className="dash-grade-right">
                  <div className="dash-grade-bar-wrap">
                    <div className={`dash-grade-bar ${getGradeColor(grade.mark)}`} style={{ width: `${grade.mark || 0}%` }}></div>
                  </div>
                  <span className={`dash-grade-score ${getGradeColor(grade.mark)}`}>{grade.mark || 0}%</span>
                </div>
              </div>
            )) : (
              <div className="dash-empty-state"><FaBook /><p>No grades available yet</p></div>
            )}
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card-header">
            <h3>Upcoming Events</h3>
            <button onClick={() => setActiveTab('events')} className="dash-btn-text">
              View All <FaChevronRight />
            </button>
          </div>
          <div className="dash-events-list">
            {events.slice(0, 4).length > 0 ? events.slice(0, 4).map((event, i) => (
              <div key={i} className="dash-event-row">
                <div className="dash-event-date-badge">
                  <span className="dash-event-date-num">{new Date(event.date).getDate()}</span>
                  <span className="dash-event-date-mon">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                </div>
                <div className="dash-event-info">
                  <h4>{event.title || 'Event'}</h4>
                  <div className="dash-event-meta">
                    <span><FaClock /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span><FaMapMarkerAlt /> {event.location || 'Main Hall'}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="dash-empty-state"><FaBell /><p>No upcoming events</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Snapshot */}
      <div className="dash-card dash-attendance-card">
        <div className="dash-card-header">
          <h3>Attendance Overview</h3>
          <span className="dash-attendance-rate">{attendanceRate}% Present</span>
        </div>
        <div className="dash-attendance-donut">
          <div className="dash-donut-ring">
            <svg viewBox="0 0 36 36">
              <path className="dash-donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="dash-donut-fill" strokeDasharray={`${attendanceRate}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="dash-donut-center"><span>{attendanceRate}%</span></div>
          </div>
          <div className="dash-attendance-legend">
            <div className="dash-legend-item">
              <span className="dash-legend-dot present"></span>
              <span>Present: {attendance.filter(a => a.present).length} days</span>
            </div>
            <div className="dash-legend-item">
              <span className="dash-legend-dot absent"></span>
              <span>Absent: {attendance.filter(a => !a.present).length} days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ... (rest of render functions remain the same: renderGrades, renderAttendance, renderPayments, renderTimetable, renderEvents)

  const renderGrades = () => (
    <div className="dash-tab-content">
      <div className="dash-tab-header">
        <div>
          <h2>Academic Performance</h2>
          <p>Your grades across all subjects</p>
        </div>
        <div className="dash-tab-actions">
          <button className="dash-btn-outline">Export</button>
          <button className="dash-btn-primary">Print Report</button>
        </div>
      </div>
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Progress</th>
                <th>Grade</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {grades.length > 0 ? grades.map((grade, i) => (
                <tr key={i}>
                  <td>
                    <div className="dash-table-subject">
                      <div className={`dash-subject-icon ${getGradeColor(grade.mark)}`}><FaBook /></div>
                      <span>{grade.subject || 'Subject'}</span>
                    </div>
                  </td>
                  <td><span className={`dash-score-badge ${getGradeColor(grade.mark)}`}>{grade.mark || 0}%</span></td>
                  <td>
                    <div className="dash-progress-bar">
                      <div className={`dash-progress-fill ${getGradeColor(grade.mark)}`} style={{ width: `${grade.mark || 0}%` }}></div>
                    </div>
                  </td>
                  <td><strong>{grade.grade || '-'}</strong></td>
                  <td>
                    <span className={`dash-status-pill ${grade.mark >= 50 ? 'pass' : 'fail'}`}>
                      {grade.mark >= 50 ? 'Passing' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="dash-empty-state"><FaGraduationCap /><p>No grades recorded yet</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="dash-tab-content">
      <div className="dash-tab-header">
        <div><h2>Attendance Record</h2><p>Your attendance throughout the term</p></div>
      </div>
      <div className="dash-card">
        <div className="dash-attendance-calendar">
          {attendance.slice(0, 30).length > 0 ? attendance.slice(0, 30).map((day, i) => (
            <div key={i} className={`dash-calendar-day ${day.present ? 'present' : 'absent'}`} title={`${new Date(day.date).toLocaleDateString()}: ${day.present ? 'Present' : 'Absent'}`}>
              <span className="dash-calendar-num">{new Date(day.date).getDate()}</span>
              <span className="dash-calendar-label">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <div className={`dash-calendar-dot ${day.present ? 'present' : 'absent'}`}></div>
            </div>
          )) : (
            <div className="dash-empty-state"><FaCalendarCheck /><p>No attendance data</p></div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPayments = () => (
    <div className="dash-tab-content">
      <div className="dash-tab-header">
        <div><h2>Payment History</h2><p>Track your tuition payments</p></div>
      </div>
      <div className="dash-card">
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr><th>Description</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Receipt</th></tr>
            </thead>
            <tbody>
              {payments.length > 0 ? payments.map((p, i) => (
                <tr key={i}>
                  <td>
                    <div className="dash-table-subject">
                      <div className="dash-subject-icon payment"><FaCreditCard /></div>
                      <span>Tuition - {p.month || 'N/A'}</span>
                    </div>
                  </td>
                  <td><strong>${p.amount || '0.00'}</strong></td>
                  <td>{p.dueDate || 'End of month'}</td>
                  <td><span className={`dash-status-pill ${p.paid ? 'pass' : 'pending'}`}>{p.paid ? 'Paid' : 'Pending'}</span></td>
                  <td>
                    {p.paid ? (
                      <button className="dash-btn-text">Download</button>
                    ) : (
                      <button className="dash-btn-primary dash-btn-sm">Pay Now</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5"><div className="dash-empty-state"><FaCreditCard /><p>No payment records</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTimetable = () => (
    <div className="dash-tab-content">
      <div className="dash-tab-header">
        <div><h2>Weekly Timetable</h2><p>Your class schedule</p></div>
      </div>
      <div className="dash-card">
        <div className="dash-empty-state dash-empty-large">
          <FaCalendarAlt />
          <h3>Class Schedule</h3>
          <p>Your weekly timetable will be available here soon</p>
          <a href="/timetable" className="dash-btn-primary">View Full Timetable</a>
        </div>
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="dash-tab-content">
      <div className="dash-tab-header">
        <div><h2>School Events</h2><p>Stay updated with upcoming activities</p></div>
      </div>
      <div className="dash-events-full-grid">
        {events.length > 0 ? events.map((event, i) => (
          <div key={i} className="dash-event-full-card">
            <div className="dash-event-card-top">
              <div className="dash-event-card-date-big">
                <span>{new Date(event.date).getDate()}</span>
                <small>{new Date(event.date).toLocaleString('default', { month: 'short' })}</small>
              </div>
              <button className="dash-event-more"><FaEllipsisV /></button>
            </div>
            <h3>{event.title || 'Event'}</h3>
            <p>{event.description || 'No description available'}</p>
            <div className="dash-event-card-footer">
              <span><FaClock /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span><FaMapMarkerAlt /> {event.location || 'Main Campus'}</span>
            </div>
          </div>
        )) : (
          <div className="dash-empty-state dash-empty-large"><FaBell /><h3>No Events</h3><p>There are no upcoming events at the moment</p></div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'grades': return renderGrades();
      case 'attendance': return renderAttendance();
      case 'payments': return renderPayments();
      case 'timetable': return renderTimetable();
      case 'events': return renderEvents();
      default: return null;
    }
  };

  // ===== MAIN DASHBOARD UI =====
  return (
    <div className="dash-app">
      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="dash-sidebar-brand">
          <img src={Logo} alt="NJEC" className="dash-brand-logo" />
          {sidebarOpen && (
            <div className="dash-brand-text">
              <h2>NJEC</h2>
              <span>Student Portal</span>
            </div>
          )}
          <button className="dash-sidebar-collapse" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="dash-sidebar-user">
          <div className="dash-user-avatar">
            {student?.fullName?.charAt(0) || 'S'}
          </div>
          {sidebarOpen && (
            <div className="dash-user-details">
              <h4>{student?.fullName || 'Student'}</h4>
              <span>{student?.studentNumber || 'Student ID'}</span>
            </div>
          )}
        </div>

        <nav className="dash-sidebar-nav">
          <span className="dash-nav-section">MAIN MENU</span>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`dash-nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="dash-nav-text">{item.label}</span>}
              {item.id === 'events' && notifications > 0 && sidebarOpen && (
                <span className="dash-nav-badge">{notifications}</span>
              )}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="dash-sidebar-footer">
            <button className="dash-logout-btn" onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}>
              <FaSignOutAlt />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {isMobile && sidebarOpen && <div className="dash-overlay" onClick={toggleSidebar}></div>}

      <main className="dash-main">
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            {!sidebarOpen && (
              <button className="dash-menu-btn" onClick={toggleSidebar}><FaBars /></button>
            )}
            <div className="dash-search-box">
              <FaSearch className="dash-search-icon" />
              <input type="text" placeholder="Search anything..." />
            </div>
          </div>
          <div className="dash-topbar-right">
            <button className="dash-notif-btn">
              <FaBell />
              {notifications > 0 && <span className="dash-notif-dot"></span>}
            </button>
            <div className="dash-topbar-user">
              <div className="dash-topbar-avatar">{student?.fullName?.charAt(0) || 'S'}</div>
              <span>{student?.fullName || 'Student'}</span>
            </div>
          </div>
        </header>

        <div className="dash-content">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;