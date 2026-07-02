// src/components/TeacherSidebar.jsx
import React, { useState, useEffect } from 'react';
import {
  FaHome, FaClipboardList, FaBook,
  FaUserCheck, FaCalendarAlt, FaBullhorn,
  FaChalkboardTeacher, FaBars, FaTimes,
  FaExclamationTriangle, FaCheckCircle,
  FaSignOutAlt, FaUser, FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher/teacher-sidebar.css';

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
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    let mounted = true;
    let subscription = null;

    const initialize = async () => {
      await fetchTeacherData();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) {
        subscription = supabase
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
              if (payload.new && mounted) {
                setTeacherData(payload.new);
              }
            }
          )
          .subscribe();
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
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
          setError('Teacher profile not found');
        } else {
          throw teacherError;
        }
      } else {
        setTeacherData(teacher);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching teacher:', error);
      setError(error.message || 'Failed to load teacher data');
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
    if (teacherData?.email) return teacherData.email?.split('@')[0] || 'Teacher';
    return 'Teacher';
  };

  const getSubjectsDisplay = () => {
    if (!teacherData?.subjects || teacherData.subjects.length === 0) return 'No subjects';
    if (Array.isArray(teacherData.subjects)) {
      return teacherData.subjects.slice(0, 2).join(' & ');
    }
    return teacherData.subjects;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) toggleSidebar();
  };

  const isProfileActive = activeTab === 'profile';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      
      <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''} ${isMobile && sidebarOpen ? 'mobile-open' : ''}`}>
        
        {/* Header with collapse button */}
        <div className="teacher-sidebar-header">
          <div className="teacher-sidebar-logo">
            <FaChalkboardTeacher />
            {sidebarOpen && <span className="teacher-school-name">Teacher Portal</span>}
          </div>
          
          {/* Collapse/Expand button */}
          <button 
            className="sidebar-toggle-btn" 
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isMobile ? (
              <FaTimes />
            ) : sidebarOpen ? (
              <FaChevronLeft />
            ) : (
              <FaChevronRight />
            )}
          </button>
        </div>

        {/* Teacher Profile Section */}
        {teacherData && teacherData.registration_completed && (
          <div 
            className={`teacher-user-profile ${isProfileActive ? 'active-profile' : ''}`}
            onClick={() => handleNavClick('profile')}
          >
            <div className={`teacher-user-avatar ${teacherData.approval_status === 'approved' ? 'registered-teacher' : ''}`}>
              {getInitials(getDisplayName())}
            </div>
            {sidebarOpen && (
              <div className="teacher-user-info">
                <h3>{getDisplayName()}</h3>
                <p className="teacher-user-role">{getSubjectsDisplay()}</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {teacherData && teacherData.registration_completed && (
          <nav className="teacher-sidebar-nav">
            {tabs.map((item) => (
              <button
                key={item.id}
                className={`teacher-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => !sidebarOpen && !isMobile && setShowTooltip(item.id)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <span className="teacher-nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="teacher-nav-label">{item.label}</span>}
                {activeTab === item.id && <span className="active-indicator"></span>}
                
                {/* Tooltip for collapsed state */}
                {!sidebarOpen && !isMobile && showTooltip === item.id && (
                  <div className="nav-tooltip">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>
        )}

        {/* Sign Out Button */}
        {teacherData && teacherData.registration_completed && (
          <div className="teacher-sidebar-footer">
            <button 
              className="signout-btn"
              onClick={handleLogout}
              onMouseEnter={() => !sidebarOpen && !isMobile && setShowTooltip('signout')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <span className="signout-icon">
                <FaSignOutAlt />
              </span>
              {sidebarOpen && <span className="signout-text">Sign Out</span>}
              
              {/* Tooltip for collapsed state */}
              {!sidebarOpen && !isMobile && showTooltip === 'signout' && (
                <div className="nav-tooltip">
                  Sign Out
                </div>
              )}
            </button>
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
  { id: 'profile', label: 'My Profile', icon: <FaUser /> },
];

export default TeacherSidebar;