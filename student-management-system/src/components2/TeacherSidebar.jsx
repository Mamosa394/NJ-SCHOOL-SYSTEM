// src/components/TeacherSidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  FaHome, FaClipboardList, FaBook,
  FaUserCheck, FaCalendarAlt, FaBullhorn,
  FaChalkboardTeacher, FaBars, FaTimes,
  FaCog, FaBell, FaUsers, FaChartLine,
  FaUserEdit, FaExclamationTriangle, FaCheckCircle
} from 'react-icons/fa';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher-sidebar.css';

const TeacherSidebar = ({ 
  activeTab, 
  setActiveTab, 
  sidebarOpen, 
  toggleSidebar, 
  isMobile 
}) => {
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTeacherData();
    
    // Set up real-time subscription
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const subscription = supabase
          .channel('teacher-sidebar-updates')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'teachers',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              console.log('Teacher data updated:', payload);
              if (payload.new) {
                setTeacherData(payload.new);
              }
            }
          )
          .subscribe();

        return () => {
          subscription.unsubscribe();
        };
      }
    };

    const cleanup = setupSubscription();
    return () => {
      if (cleanup) cleanup.then(fn => fn && fn());
    };
  }, []);

  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in');
        setIsLoading(false);
        return;
      }

      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .single();

      if (teacherError) {
        if (teacherError.code === 'PGRST116') {
          setError('Teacher not found');
        } else {
          throw teacherError;
        }
      } else {
        setTeacherData(teacher);
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    if (teacherData?.full_name) return teacherData.full_name;
    return 'Teacher';
  };

  const getSubjectsDisplay = () => {
    if (!teacherData?.subjects || teacherData.subjects.length === 0) return 'No subjects';
    if (Array.isArray(teacherData.subjects)) {
      return teacherData.subjects.join(' & ');
    }
    return teacherData.subjects;
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

  const getApprovalBadge = () => {
    if (!teacherData) return null;
    
    switch(teacherData.approval_status) {
      case 'approved':
        return (
          <span className="teacher-status-badge registered">
            <FaCheckCircle /> Approved
          </span>
        );
      case 'pending':
        return (
          <span className="teacher-status-badge unregistered">
            ⏳ Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="teacher-status-badge incomplete">
            ❌ Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="teacher-sidebar-overlay visible" onClick={toggleSidebar} />
      )}
      
      <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        {/* Header */}
        <div className="teacher-sidebar-header">
          <div className="teacher-sidebar-logo">
            <FaChalkboardTeacher />
            <span className="teacher-school-name">Teacher Portal</span>
          </div>
          <button className="teacher-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Teacher Profile Section */}
        <div className="teacher-user-profile">
          {isLoading ? (
            <div className="teacher-profile-loading">
              <div className="teacher-avatar-skeleton"></div>
              <div className="teacher-info-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ) : error ? (
            <div className="teacher-profile-error">
              <FaExclamationTriangle />
              <p>{error}</p>
              <button onClick={fetchTeacherData} className="retry-btn">Retry</button>
            </div>
          ) : teacherData ? (
            <>
              <div className={`teacher-user-avatar ${teacherData.approval_status === 'approved' ? 'registered-teacher' : 'unregistered'}`}>
                {getInitials(getDisplayName())}
                {teacherData.approval_status === 'approved' && (
                  <span className="teacher-verified-badge">
                    <FaCheckCircle />
                  </span>
                )}
              </div>
              <div className="teacher-user-info">
                <h3>{getDisplayName()}</h3>
                {teacherData.teacher_id && (
                  <p className="teacher-user-id">ID: {teacherData.teacher_id}</p>
                )}
                <p className="teacher-user-role">{getSubjectsDisplay()}</p>
                {getTeachingTypeDisplay() && (
                  <p className="teacher-user-subject">{getTeachingTypeDisplay()}</p>
                )}
                {teacherData.qualification && (
                  <p className="teacher-user-department">{teacherData.qualification}</p>
                )}
                {getApprovalBadge()}
              </div>
            </>
          ) : (
            <div className="teacher-profile-error">
              <FaExclamationTriangle />
              <p>No teacher data found</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        {!isLoading && teacherData && teacherData.registration_completed && (
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
                {activeTab === item.id && <span className="active-indicator"></span>}
              </button>
            ))}
          </nav>
        )}

        {/* Footer */}
        {!isLoading && teacherData && teacherData.registration_completed && (
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
        )}
      </aside>
    </>
  );
};

const tabs = [
  { id: 'home', label: 'Dashboard', icon: <FaHome /> },
  { id: 'marks', label: 'Marks', icon: <FaClipboardList /> },
  { id: 'materials', label: 'Materials', icon: <FaBook /> },
  { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
  { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
  { id: 'events', label: 'Events', icon: <FaBullhorn /> },
];

export default TeacherSidebar;