// src/App.jsx or src/routes/TeacherRoutes.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '../components/supabaseClient';
import TeacherHome from '../Teacher/TeacherDashboard';
import TeacherRegistration from '../components/TeacherRegistration';
import TeacherSidebar from '../components2/TeacherSidebar';

const TeacherRoutes = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teacherData, setTeacherData] = useState(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkTeacherStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkTeacherStatus(session.user.id);
      } else {
        setTeacherData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkTeacherStatus = async (userId) => {
    try {
      setLoading(true);
      
      const { data: teacher, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No teacher record found
          setTeacherData(null);
        } else {
          console.error('Error fetching teacher:', error);
        }
      } else {
        setTeacherData(teacher);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  // Registration route - redirects based on status
  const RegistrationRoute = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Checking registration status...</p>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    // If teacher already exists and registration is complete
    if (teacherData && teacherData.registration_completed) {
      if (teacherData.approval_status === 'approved') {
        return <Navigate to="/teacher/dashboard" replace />;
      } else if (teacherData.approval_status === 'pending') {
        return <Navigate to="/teacher/pending-approval" replace />;
      }
    }

    return <TeacherRegistration onRegistrationComplete={() => {
      checkTeacherStatus(session.user.id);
    }} />;
  };

  // Dashboard route - requires registration and approval
  const DashboardRoute = () => {
    if (loading) {
      return (
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      );
    }

    if (!session) {
      return <Navigate to="/login" replace />;
    }

    if (!teacherData || !teacherData.registration_completed) {
      return <Navigate to="/teacher/register" replace />;
    }

    if (teacherData.approval_status === 'pending') {
      return <Navigate to="/teacher/pending-approval" replace />;
    }

    if (teacherData.approval_status === 'rejected') {
      return (
        <div className="rejected-notice">
          <h2>Registration Rejected</h2>
          <p>Your registration was rejected. Reason: {teacherData.rejection_reason}</p>
          <button onClick={() => window.location.href = '/teacher/register'}>
            Register Again
          </button>
        </div>
      );
    }

    return <TeacherHome />;
  };

  // Pending approval page
  const PendingApprovalPage = () => {
    if (!session) return <Navigate to="/login" replace />;
    
    return (
      <div className="pending-approval-page">
        <div className="pending-approval-content">
          <h1>Application Under Review</h1>
          <div className="pending-icon">⏳</div>
          <p>Your teacher registration is currently under review.</p>
          <p>You'll be notified once an administrator approves your application.</p>
          <div className="pending-details">
            {teacherData && (
              <>
                <p><strong>Teacher ID:</strong> {teacherData.teacher_id}</p>
                <p><strong>Submitted:</strong> {new Date(teacherData.created_at).toLocaleDateString()}</p>
              </>
            )}
          </div>
          <button onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </div>
    );
  };

  return (
    <Routes>
      {/* Registration Route */}
      <Route path="/teacher/register" element={<RegistrationRoute />} />
      
      {/* Dashboard Route */}
      <Route path="/teacher/dashboard/*" element={<DashboardRoute />} />
      
      {/* Pending Approval Route */}
      <Route path="/teacher/pending-approval" element={<PendingApprovalPage />} />
      
      {/* Default redirect */}
      <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
    </Routes>
  );
};

export default TeacherRoutes;