// src/components/TeacherHome.jsx
import React, { useState, useEffect } from 'react';
import {
  FaChalkboardTeacher, FaUserGraduate, FaUserCheck,
  FaBook, FaCalendarAlt, FaClock, FaClipboardList,
  FaBullhorn, FaChartLine, FaFileUpload, FaFileAlt,
  FaDownload, FaSearch, FaBell, FaSignOutAlt, 
  FaTachometerAlt, FaBookOpen, FaCalendarCheck, 
  FaChartBar, FaGraduationCap, FaUsers, FaBars, 
  FaRobot, FaArrowUp, FaUserPlus, FaIdBadge,
  FaPhone, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import TeacherSidebar from '../components2/TeacherSidebar';
import TeacherRegistration from '../components/TeacherRegistration';
import { supabase } from '../components/supabaseClient';
import '../styles/teacherdashboard.css';

const TeacherHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      attendanceRate: 0,
      materialsCount: 0,
      upcomingClasses: 0,
      averagePerformance: 0
    },
    classes: [],
    materials: [],
    events: [],
    attendance: [],
    recentMarks: []
  });

  // Check mobile and set sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize teacher data
  useEffect(() => {
    initializeTeacher();
  }, []);

  const initializeTeacher = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        console.log('No authenticated user');
        setIsLoading(false);
        return;
      }

      // Check if teacher exists using the correct column 'id' (which is the UUID)
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (teacherError) {
        if (teacherError.code === 'PGRST116') {
          // No teacher record found - needs registration
          console.log('Teacher not registered');
          setIsRegistered(false);
          setTeacherData({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
            avatar_url: user.user_metadata?.avatar_url || null
          });
          
          // Auto-redirect to registration
          setTimeout(() => {
            setActiveTab('register');
          }, 1000);
        } else {
          throw teacherError;
        }
      } else {
        // Teacher record exists
        console.log('Teacher found:', teacher);
        setTeacherData(teacher);
        
        if (teacher.registration_completed) {
          setIsRegistered(true);
          // Fetch dashboard data if approved
          if (teacher.approval_status === 'approved') {
            await fetchAllDashboardData(teacher.id);
          }
        } else {
          setIsRegistered(false);
          // Redirect to registration
          setTimeout(() => {
            setActiveTab('register');
          }, 1000);
        }
      }

      // Set up real-time subscription
      setupRealtimeSubscription(user.id);

    } catch (error) {
      console.error('Error initializing teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscription to teachers table
  const setupRealtimeSubscription = (userId) => {
    const subscription = supabase
      .channel('teacher-home-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teachers',
          filter: `id=eq.${userId}`
        },
        async (payload) => {
          console.log('Teacher data changed:', payload);
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updatedTeacher = payload.new;
            setTeacherData(updatedTeacher);
            
            if (updatedTeacher.registration_completed) {
              setIsRegistered(true);
              if (updatedTeacher.approval_status === 'approved') {
                await fetchAllDashboardData(updatedTeacher.id);
              }
              setActiveTab('home');
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Fetch dashboard data
  const fetchAllDashboardData = async (teacherId) => {
    try {
      const [
        classesResult,
        materialsResult,
        eventsResult,
        attendanceResult,
        marksResult
      ] = await Promise.all([
        supabase.from('classes').select('*').eq('teacher_id', teacherId),
        supabase.from('materials').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }).limit(5),
        supabase.from('events').select('*').gte('date', new Date().toISOString().split('T')[0]).order('date', { ascending: true }).limit(5),
        supabase.from('attendance').select('*').eq('teacher_id', teacherId).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('marks').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }).limit(10)
      ]);

      // Calculate total students
      const { count: totalStudents } = await supabase
        .from('student_classes')
        .select('*', { count: 'exact', head: true })
        .in('class_id', (classesResult.data || []).map(c => c.id));

      // Calculate attendance rate
      const todayAttendance = attendanceResult.data || [];
      const presentCount = todayAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = todayAttendance.length > 0 
        ? Math.round((presentCount / todayAttendance.length) * 100) 
        : 0;

      // Get today's classes
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayClasses = (classesResult.data || []).filter(c => 
        (c.schedule_day || '').toLowerCase() === today
      );

      // Calculate average performance
      const recentMarks = marksResult.data || [];
      const averagePerformance = recentMarks.length > 0
        ? Math.round(recentMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / recentMarks.length)
        : 0;

      setDashboardData({
        stats: {
          totalStudents: totalStudents || 0,
          attendanceRate,
          materialsCount: (materialsResult.data || []).length,
          upcomingClasses: todayClasses.length,
          averagePerformance
        },
        classes: classesResult.data || [],
        materials: materialsResult.data || [],
        events: eventsResult.data || [],
        attendance: todayAttendance,
        recentMarks
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getTeacherName = () => {
    if (teacherData?.full_name) return teacherData.full_name;
    if (teacherData?.email) return teacherData.email?.split('@')[0];
    return 'Teacher';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getTeachingTypeDisplay = () => {
    if (!teacherData?.teaching_type) return '';
    switch(teacherData.teaching_type) {
      case 'supplementary': return 'Supplementary Students';
      case 'extra_classes': return 'Extra Classes';
      case 'both': return 'Both Programs';
      default: return '';
    }
  };

  const handleRegistrationComplete = async () => {
    await initializeTeacher();
    setActiveTab('home');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Approval status banner
  const ApprovalBanner = () => {
    if (!teacherData) return null;
    
    switch(teacherData.approval_status) {
      case 'approved':
        return (
          <div className="approval-banner approved">
            <FaCheckCircle />
            <span>Your account is approved and active</span>
          </div>
        );
      case 'pending':
        return (
          <div className="approval-banner pending">
            <FaClock />
            <span>Your registration is pending approval. Some features may be limited.</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="approval-banner rejected">
            <FaExclamationTriangle />
            <span>Registration rejected: {teacherData.rejection_reason || 'No reason provided'}</span>
            <button onClick={() => setActiveTab('register')}>Register Again</button>
          </div>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="premium-teacher-layout">
        <div className="premium-loading">
          <div className="premium-spinner"></div>
          <div className="premium-loading-text">
            <h2>Loading Teacher Portal</h2>
            <p>Preparing your personalized dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-teacher-layout">
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="teacher-sidebar-overlay visible" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <TeacherSidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        isMobile={isMobile}
      />

      {/* Main Content */}
      <div 
        className={`premium-main-wrapper ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}
        style={{
          marginLeft: isMobile ? '0' : (sidebarOpen ? '260px' : '72px')
        }}
      >
        {/* Top Navigation Bar */}
        <nav className="premium-navbar">
          <div className="nav-left">
            {isMobile && (
              <button className="mobile-menu-toggle" onClick={toggleSidebar}>
                <FaBars />
              </button>
            )}
            <div className="search-container">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search classes, students, materials..." 
                className="search-input"
              />
            </div>
          </div>
          <div className="nav-right">
            <button className="notification-bell">
              <FaBell />
              <span className="notification-dot"></span>
            </button>
            <div className="teacher-profile-chip">
              <div className="teacher-avatar-small">
                <FaChalkboardTeacher />
              </div>
              <div className="teacher-info-text">
                <span className="teacher-name-small">
                  {getTeacherName().split(' ')[0]}
                </span>
                <span className="teacher-role">
                  {teacherData?.teacher_id || 'Teacher'}
                </span>
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt />
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        {activeTab === 'register' ? (
          <div className="premium-content-area">
            <TeacherRegistration 
              onRegistrationComplete={handleRegistrationComplete}
              teacherData={teacherData}
            />
          </div>
        ) : !isRegistered ? (
          <div className="premium-content-area">
            <div className="registration-required-banner">
              <div className="registration-required-content">
                <FaUserPlus className="registration-required-icon" />
                <h2>Complete Your Registration</h2>
                <p>You need to complete your teacher profile to access the dashboard and all features.</p>
                <button 
                  className="start-registration-btn"
                  onClick={() => setActiveTab('register')}
                >
                  <FaUserPlus /> Complete Registration Now
                </button>
                <div className="features-preview">
                  <h3>After registration, you'll have access to:</h3>
                  <div className="features-grid">
                    <div className="feature-item">
                      <FaClipboardList />
                      <span>Student Marks Management</span>
                    </div>
                    <div className="feature-item">
                      <FaBook />
                      <span>Learning Materials</span>
                    </div>
                    <div className="feature-item">
                      <FaUserCheck />
                      <span>Attendance Tracking</span>
                    </div>
                    <div className="feature-item">
                      <FaCalendarAlt />
                      <span>Timetable Management</span>
                    </div>
                    <div className="feature-item">
                      <FaBullhorn />
                      <span>Events & Announcements</span>
                    </div>
                    <div className="feature-item">
                      <FaChartLine />
                      <span>Performance Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard Content
          <div className="premium-content-area">
            <div className="premium-content-scroll">
              
              {/* Approval Status Banner */}
              <ApprovalBanner />

              {/* Hero Banner */}
              <div className="hero-banner">
                <div className="hero-bg-decor">
                  <div className="floating-circle circle-1"></div>
                  <div className="floating-circle circle-2"></div>
                  <div className="floating-circle circle-3"></div>
                </div>
                <div className="hero-content">
                  <div className="hero-text">
                    <h1 className="hero-greeting">
                      {getGreeting()}, {getTeacherName().split(' ')[0]} 
                      <span className="wave-emoji">👋</span>
                    </h1>
                    <p className="hero-subtitle">
                      Welcome back! Here's your teaching overview for today.
                    </p>
                    <div className="hero-badges">
                      <span className="badge">
                        <FaIdBadge /> {teacherData?.teacher_id}
                      </span>
                      <span className="badge">
                        <FaGraduationCap /> {teacherData?.qualification}
                      </span>
                      <span className="badge">
                        <FaBookOpen /> {teacherData?.subjects?.length || 0} Subjects
                      </span>
                      {teacherData?.teaching_type && (
                        <span className="badge">
                          <FaUsers /> {getTeachingTypeDisplay()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="hero-graduation-icon">
                      <FaGraduationCap />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper students-icon">
                    <FaUserGraduate />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Total Students</span>
                    <h3 className="stat-value">{dashboardData.stats.totalStudents}</h3>
                    <span className="stat-trend positive">
                      <FaArrowUp /> Across all classes
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper attendance-icon">
                    <FaUserCheck />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Attendance Rate</span>
                    <h3 className="stat-value">{dashboardData.stats.attendanceRate}%</h3>
                    <span className="stat-trend">
                      {dashboardData.attendance.filter(a => a.status === 'present').length} present today
                    </span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper materials-icon">
                    <FaBook />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Materials</span>
                    <h3 className="stat-value">{dashboardData.stats.materialsCount}</h3>
                    <span className="stat-trend">Ready for students</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrapper schedule-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="stat-details">
                    <span className="stat-label">Today's Classes</span>
                    <h3 className="stat-value">{dashboardData.stats.upcomingClasses}</h3>
                    <span className="stat-trend">Scheduled today</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <h2 className="section-title">
                  <FaTachometerAlt /> Quick Actions
                </h2>
                <div className="quick-actions-grid">
                  <div className="quick-action-card" onClick={() => setActiveTab('marks')}>
                    <div className="action-icon"><FaClipboardList /></div>
                    <span>Record Marks</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('materials')}>
                    <div className="action-icon"><FaFileUpload /></div>
                    <span>Upload Material</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('attendance')}>
                    <div className="action-icon"><FaUserCheck /></div>
                    <span>Take Attendance</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('timetable')}>
                    <div className="action-icon"><FaCalendarAlt /></div>
                    <span>View Timetable</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('events')}>
                    <div className="action-icon"><FaBullhorn /></div>
                    <span>Create Event</span>
                  </div>
                  <div className="quick-action-card">
                    <div className="action-icon"><FaChartBar /></div>
                    <span>View Reports</span>
                  </div>
                </div>
              </div>

              {/* Teacher Profile Card */}
              <div className="premium-card">
                <div className="premium-card-header">
                  <h3><FaChalkboardTeacher /> Your Profile</h3>
                </div>
                <div className="teacher-details-grid">
                  <div className="detail-item">
                    <FaUserGraduate />
                    <div>
                      <span className="detail-label">Full Name</span>
                      <span className="detail-value">{teacherData?.full_name}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaIdBadge />
                    <div>
                      <span className="detail-label">Teacher ID</span>
                      <span className="detail-value">{teacherData?.teacher_id}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaPhone />
                    <div>
                      <span className="detail-label">Phone</span>
                      <span className="detail-value">{teacherData?.phone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaGraduationCap />
                    <div>
                      <span className="detail-label">Qualification</span>
                      <span className="detail-value">{teacherData?.qualification || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaBookOpen />
                    <div>
                      <span className="detail-label">Subjects</span>
                      <span className="detail-value">
                        {teacherData?.subjects?.join(', ') || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FaUsers />
                    <div>
                      <span className="detail-label">Teaching Type</span>
                      <span className="detail-value">{getTeachingTypeDisplay() || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="two-column-grid">
                {/* Today's Schedule */}
                <div className="premium-card">
                  <div className="premium-card-header">
                    <h3><FaClock /> Today's Schedule</h3>
                    <button className="view-all-link">View Full Timetable →</button>
                  </div>
                  {dashboardData.classes.filter(c => {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    return (c.schedule_day || '').toLowerCase() === today;
                  }).length > 0 ? (
                    <div className="schedule-list">
                      {dashboardData.classes
                        .filter(c => {
                          const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                          return (c.schedule_day || '').toLowerCase() === today;
                        })
                        .slice(0, 4)
                        .map(cls => (
                          <div key={cls.id} className="schedule-item">
                            <div className="schedule-time">
                              <span className="time">{cls.start_time || '--:--'}</span>
                              <span className="day">Today</span>
                            </div>
                            <div className="schedule-details">
                              <h4>{cls.subject || 'Untitled Class'}</h4>
                              <p>{cls.grade || 'N/A'} • Room {cls.room || 'TBA'}</p>
                            </div>
                            <span className="status-pill upcoming">Upcoming</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FaCalendarAlt />
                      <p>No classes scheduled for today</p>
                    </div>
                  )}
                </div>

                {/* Recent Materials */}
                <div className="premium-card">
                  <div className="premium-card-header">
                    <h3><FaFileAlt /> Recent Materials</h3>
                    <button className="view-all-link">View All →</button>
                  </div>
                  {dashboardData.materials.length > 0 ? (
                    <div className="materials-list">
                      {dashboardData.materials.slice(0, 4).map(material => (
                        <div key={material.id} className="material-item">
                          <div className="material-file-icon"><FaFileAlt /></div>
                          <div className="material-info">
                            <h4>{material.title || 'Untitled Material'}</h4>
                            <p>{material.subject || 'N/A'}</p>
                            <div className="material-meta">
                              <span className="file-type">
                                {(material.file_type || 'DOC').toUpperCase()}
                              </span>
                              <span>{new Date(material.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button className="download-btn"><FaDownload /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <FaFileUpload />
                      <p>No materials uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Assistant */}
              <div className="ai-assistant-card">
                <div className="ai-assistant-content">
                  <div className="ai-icon-wrapper">
                    <FaRobot />
                  </div>
                  <div className="ai-text">
                    <h3>AI Teaching Assistant</h3>
                    <p>Get personalized insights, generate lesson plans, and analyze student performance with AI.</p>
                  </div>
                  <button className="ai-chat-btn">
                    <FaRobot /> Try AI Assistant
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherHome;