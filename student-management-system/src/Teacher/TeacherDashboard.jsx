// src/components/TeacherHome.jsx
import React, { useState, useEffect } from 'react';
import {
  FaChalkboardTeacher, FaUserGraduate, FaUserCheck,
  FaBook, FaCalendarAlt, FaClock, FaClipboardList,
  FaBullhorn, FaChartLine, FaFileUpload, FaFileAlt,
  FaDownload, FaBookOpen,
  FaChartBar, FaGraduationCap, FaUsers, FaBars, 
  FaArrowUp, FaUserPlus, FaIdBadge,
  FaPhone, FaCheckCircle, FaExclamationTriangle,
  FaSignOutAlt, FaUserEdit, FaSave, FaTimes,
  FaEnvelope, FaMapMarkerAlt
} from 'react-icons/fa';
import TeacherSidebar from '../components2/TeacherSidebar';
import TeacherRegistration from '../components/TeacherRegistration';
// Import tab components
import TeacherMarks from '../Teacher/TeacherMarks';
import TeacherMaterials from '../Teacher/TeacherMaterials';
import TeacherAttendance from '../Teacher/TeacherAttendance';
import TeacherTimetable from '../Teacher/TeacherTimetable';
import TeacherEvents from '../Teacher/TeacherEvents';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher/teacherdashboard.css';

const TeacherHome = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    qualification: '',
    experience: '',
    subjects: [],
    teaching_type: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

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

  // Initialize teacher data and set up real-time subscription
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      await initializeTeacher();
      
      // Set up real-time subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) {
        const subscription = supabase
          .channel('teacher-home-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'teachers',
              filter: `id=eq.${user.id}`
            },
            async (payload) => {
              console.log('Teacher data changed:', payload);
              
              if (payload.new && mounted) {
                const updatedTeacher = payload.new;
                setTeacherData(updatedTeacher);
                
                if (updatedTeacher.registration_completed) {
                  setIsRegistered(true);
                  if (updatedTeacher.approval_status === 'approved') {
                    await fetchAllDashboardData(updatedTeacher.id);
                  }
                  setActiveTab(prevTab => prevTab === 'register' ? 'home' : prevTab);
                } else {
                  setIsRegistered(false);
                  setActiveTab('register');
                }
              }
            }
          )
          .subscribe();

        return () => {
          mounted = false;
          supabase.removeChannel(subscription);
        };
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  const initializeTeacher = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw userError;
      }
      
      if (!user) {
        console.log('No authenticated user found');
        setIsLoading(false);
        setInitialCheckDone(true);
        return;
      }

      console.log('Authenticated user:', user.id);

      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (teacherError) {
        if (teacherError.code === 'PGRST116') {
          console.log('Teacher not registered - needs to complete registration');
          setIsRegistered(false);
          setTeacherData({
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
            avatar_url: user.user_metadata?.avatar_url || null
          });
          setActiveTab('register');
        } else {
          console.error('Error fetching teacher:', teacherError);
          throw teacherError;
        }
      } else {
        console.log('Teacher record found:', teacher);
        setTeacherData(teacher);
        
        if (teacher.registration_completed) {
          console.log('Teacher registration is completed');
          setIsRegistered(true);
          setActiveTab('home');
          
          if (teacher.approval_status === 'approved') {
            console.log('Teacher is approved - fetching dashboard data');
            await fetchAllDashboardData(teacher.id);
          }
        } else {
          console.log('Teacher registration not completed');
          setIsRegistered(false);
          setActiveTab('register');
        }
      }

      setInitialCheckDone(true);

    } catch (error) {
      console.error('Error initializing teacher:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dashboard data
  const fetchAllDashboardData = async (teacherId) => {
    try {
      console.log('Fetching dashboard data for teacher:', teacherId);
      
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

      let totalStudents = 0;
      if (classesResult.data && classesResult.data.length > 0) {
        const classIds = classesResult.data.map(c => c.id);
        const { count } = await supabase
          .from('student_classes')
          .select('*', { count: 'exact', head: true })
          .in('class_id', classIds);
        totalStudents = count || 0;
      }

      const todayAttendance = attendanceResult.data || [];
      const presentCount = todayAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = todayAttendance.length > 0 
        ? Math.round((presentCount / todayAttendance.length) * 100) 
        : 0;

      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const todayClasses = (classesResult.data || []).filter(c => 
        (c.schedule_day || '').toLowerCase() === today
      );

      const recentMarks = marksResult.data || [];
      const averagePerformance = recentMarks.length > 0
        ? Math.round(recentMarks.reduce((sum, mark) => sum + (mark.score || 0), 0) / recentMarks.length)
        : 0;

      setDashboardData({
        stats: {
          totalStudents,
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

      console.log('Dashboard data loaded successfully');

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
    console.log('Registration completed - reinitializing teacher data');
    await initializeTeacher();
    setActiveTab('home');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Profile Edit Functions
  const startEditing = () => {
    setEditForm({
      full_name: teacherData?.full_name || '',
      phone: teacherData?.phone || '',
      qualification: teacherData?.qualification || '',
      experience: teacherData?.experience || '',
      subjects: teacherData?.subjects || [],
      teaching_type: teacherData?.teaching_type || ''
    });
    setIsEditing(true);
    setSaveMessage(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
    setSaveMessage(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectsChange = (e) => {
    const subjectsString = e.target.value;
    const subjectsArray = subjectsString.split(',').map(s => s.trim()).filter(s => s);
    setEditForm(prev => ({
      ...prev,
      subjects: subjectsArray
    }));
  };

  const saveProfile = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teachers')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          qualification: editForm.qualification,
          experience: editForm.experience,
          subjects: editForm.subjects,
          teaching_type: editForm.teaching_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setTeacherData(data);
      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });

      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);

    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  // Approval status banner component
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

  const getApprovalStatusBadge = () => {
    if (!teacherData) return null;
    
    switch(teacherData.approval_status) {
      case 'approved':
        return (
          <div className="profile-status approved">
            <FaCheckCircle /> Account Approved
          </div>
        );
      case 'pending':
        return (
          <div className="profile-status pending">
            <FaClock /> Pending Approval
          </div>
        );
      case 'rejected':
        return (
          <div className="profile-status rejected">
            <FaExclamationTriangle /> Registration Rejected
            <p className="rejection-reason">{teacherData.rejection_reason}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // Profile Tab Content Component
  const ProfileTabContent = () => {
    if (!teacherData) return null;
    
    return (
      <div className="premium-content-area">
        <div className="premium-content-scroll">
          <div className="profile-page-container">
            
            {saveMessage && (
              <div className={`profile-save-message ${saveMessage.type}`}>
                {saveMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                {saveMessage.text}
              </div>
            )}

            <div className="profile-page-header">
              <div className="profile-avatar-large">
                {(teacherData.full_name || 'T').split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="profile-header-info">
                <h1>{teacherData.full_name}</h1>
                <p className="profile-role">Teacher</p>
                {teacherData.teacher_id && (
                  <p className="profile-id">
                    <FaIdBadge /> {teacherData.teacher_id}
                  </p>
                )}
              </div>
              <div className="profile-header-actions">
                {!isEditing ? (
                  <button className="profile-edit-btn" onClick={startEditing}>
                    <FaUserEdit /> Edit Profile
                  </button>
                ) : (
                  <div className="profile-edit-actions">
                    <button 
                      className="profile-save-btn" 
                      onClick={saveProfile}
                      disabled={isSaving}
                    >
                      <FaSave /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="profile-cancel-btn" onClick={cancelEditing}>
                      <FaTimes /> Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {getApprovalStatusBadge()}

            <div className="profile-cards-container">
              
              <div className="profile-card">
                <div className="profile-card-header">
                  <FaUserGraduate />
                  <h2>Personal Information</h2>
                </div>
                <div className="profile-card-body">
                  {!isEditing ? (
                    <>
                      <div className="profile-detail-row">
                        <span className="detail-label">Full Name</span>
                        <span className="detail-value">{teacherData.full_name || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Email</span>
                        <span className="detail-value">{teacherData.email || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Phone</span>
                        <span className="detail-value">{teacherData.phone || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Teacher ID</span>
                        <span className="detail-value">{teacherData.teacher_id || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="profile-form-group">
                        <label>Full Name</label>
                        <input type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} className="profile-input" placeholder="Enter full name" />
                      </div>
                      <div className="profile-form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} className="profile-input" placeholder="Enter phone number" />
                      </div>
                      <div className="profile-form-group">
                        <label>Email</label>
                        <input type="email" value={teacherData.email || ''} className="profile-input disabled" disabled placeholder="Email" />
                        <span className="field-note">Email cannot be changed</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="profile-card">
                <div className="profile-card-header">
                  <FaBookOpen />
                  <h2>Teaching Information</h2>
                </div>
                <div className="profile-card-body">
                  {!isEditing ? (
                    <>
                      <div className="profile-detail-row">
                        <span className="detail-label">Qualification</span>
                        <span className="detail-value">{teacherData.qualification || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Subjects</span>
                        <span className="detail-value">{teacherData.subjects?.join(', ') || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Teaching Type</span>
                        <span className="detail-value">{getTeachingTypeDisplay() || 'N/A'}</span>
                      </div>
                      <div className="profile-detail-row">
                        <span className="detail-label">Experience</span>
                        <span className="detail-value">{teacherData.experience || 'N/A'}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="profile-form-group">
                        <label>Qualification</label>
                        <input type="text" name="qualification" value={editForm.qualification} onChange={handleEditChange} className="profile-input" placeholder="e.g., Bachelor of Education" />
                      </div>
                      <div className="profile-form-group">
                        <label>Subjects (comma-separated)</label>
                        <input type="text" value={editForm.subjects.join(', ')} onChange={handleSubjectsChange} className="profile-input" placeholder="e.g., Mathematics, Physics, Chemistry" />
                      </div>
                      <div className="profile-form-group">
                        <label>Teaching Type</label>
                        <select name="teaching_type" value={editForm.teaching_type} onChange={handleEditChange} className="profile-input profile-select">
                          <option value="">Select teaching type</option>
                          <option value="supplementary">Supplementary Students</option>
                          <option value="extra_classes">Extra Classes</option>
                          <option value="both">Both Programs</option>
                        </select>
                      </div>
                      <div className="profile-form-group">
                        <label>Experience</label>
                        <input type="text" name="experience" value={editForm.experience} onChange={handleEditChange} className="profile-input" placeholder="e.g., 5 years" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="profile-signout-section">
              <button className="profile-logout-btn" onClick={handleLogout}>
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDER TAB CONTENT BASED ON ACTIVE TAB =====
  const renderTabContent = () => {
    switch(activeTab) {
      case 'marks':
        return <TeacherMarks teacherData={teacherData} />;
      case 'materials':
        return <TeacherMaterials teacherData={teacherData} />;
      case 'attendance':
        return <TeacherAttendance teacherData={teacherData} />;
      case 'timetable':
        return <TeacherTimetable teacherData={teacherData} />;
      case 'events':
        return <TeacherEvents teacherData={teacherData} />;
      case 'profile':
        return <ProfileTabContent />;
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
        {/* Main Content Area */}
        {activeTab === 'register' && !isRegistered ? (
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
                    <div className="feature-item"><FaClipboardList /><span>Student Marks Management</span></div>
                    <div className="feature-item"><FaBook /><span>Learning Materials</span></div>
                    <div className="feature-item"><FaUserCheck /><span>Attendance Tracking</span></div>
                    <div className="feature-item"><FaCalendarAlt /><span>Timetable Management</span></div>
                    <div className="feature-item"><FaBullhorn /><span>Events & Announcements</span></div>
                    <div className="feature-item"><FaChartLine /><span>Performance Analytics</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'home' ? (
          // Dashboard Content
          <div className="premium-content-area">
            <div className="premium-content-scroll">
              
              <ApprovalBanner />

              {/* Hero Banner */}
              <div className="hero-banner" style={{ marginTop: '0' }}>
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
                    <p className="hero-subtitle">Welcome back! Here's your teaching overview for today.</p>
                    <div className="hero-badges">
                      <span className="badge"><FaIdBadge /> {teacherData?.teacher_id}</span>
                      <span className="badge"><FaGraduationCap /> {teacherData?.qualification}</span>
                      <span className="badge"><FaBookOpen /> {teacherData?.subjects?.length || 0} Subjects</span>
                      {teacherData?.teaching_type && (
                        <span className="badge"><FaUsers /> {getTeachingTypeDisplay()}</span>
                      )}
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="hero-graduation-icon"><FaGraduationCap /></div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrapper students-icon"><FaUserGraduate /></div>
                  <div className="stat-details">
                    <span className="stat-label">Total Students</span>
                    <h3 className="stat-value">{dashboardData.stats.totalStudents}</h3>
                    <span className="stat-trend positive"><FaArrowUp /> Across all classes</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper attendance-icon"><FaUserCheck /></div>
                  <div className="stat-details">
                    <span className="stat-label">Attendance Rate</span>
                    <h3 className="stat-value">{dashboardData.stats.attendanceRate}%</h3>
                    <span className="stat-trend">{dashboardData.attendance.filter(a => a.status === 'present').length} present today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper materials-icon"><FaBook /></div>
                  <div className="stat-details">
                    <span className="stat-label">Materials</span>
                    <h3 className="stat-value">{dashboardData.stats.materialsCount}</h3>
                    <span className="stat-trend">Ready for students</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-wrapper schedule-icon"><FaCalendarAlt /></div>
                  <div className="stat-details">
                    <span className="stat-label">Today's Classes</span>
                    <h3 className="stat-value">{dashboardData.stats.upcomingClasses}</h3>
                    <span className="stat-trend">Scheduled today</span>
                  </div>
                </div>
              </div>

              {/* Two Column Grid */}
              <div className="two-column-grid">
                <div className="premium-card">
                  <div className="premium-card-header">
                    <h3><FaClock /> Today's Schedule</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('timetable')}>View Full Timetable →</button>
                  </div>
                  {dashboardData.classes.filter(c => {
                    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    return (c.schedule_day || '').toLowerCase() === today;
                  }).length > 0 ? (
                    <div className="schedule-list">
                      {dashboardData.classes.filter(c => {
                        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                        return (c.schedule_day || '').toLowerCase() === today;
                      }).slice(0, 4).map(cls => (
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
                    <div className="empty-state"><FaCalendarAlt /><p>No classes scheduled for today</p></div>
                  )}
                </div>

                <div className="premium-card">
                  <div className="premium-card-header">
                    <h3><FaFileAlt /> Recent Materials</h3>
                    <button className="view-all-link" onClick={() => setActiveTab('materials')}>View All →</button>
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
                              <span className="file-type">{(material.file_type || 'DOC').toUpperCase()}</span>
                              <span>{new Date(material.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <button className="download-btn"><FaDownload /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state"><FaFileUpload /><p>No materials uploaded yet</p></div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="quick-actions-section">
                <div className="quick-actions-grid">
                  <div className="quick-action-card" onClick={() => setActiveTab('marks')}>
                    <div className="action-icon"><FaClipboardList /></div>
                    <span>Record Marks</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('attendance')}>
                    <div className="action-icon"><FaUserCheck /></div>
                    <span>Take Attendance</span>
                  </div>
                  <div className="quick-action-card" onClick={() => setActiveTab('materials')}>
                    <div className="action-icon"><FaFileUpload /></div>
                    <span>Upload Material</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // All other tabs (marks, materials, attendance, timetable, events, profile)
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default TeacherHome;