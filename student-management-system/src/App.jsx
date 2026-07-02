import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { supabase } from './components/supabaseClient'; 
import HomePage from "./components/HomePage";
import SignUp from "./components/Signup";
import Login from "./components/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminManageAdmins from "./pages/admin/AdminManageAdmins";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import TeacherDashboard from "./Teacher/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import StudentDashboard from "./pages/students/StudentDashboard";
import StudentRegistration from './components/TestSignUP';
import SelectRole from './components/SelectRole';
import MultiStageRegistration from './components/MultiStageRegistration';
import AdminVerification from './admin_only/AdminVerification';
import AuthCallback from './components/AuthCallback';
import './App.css';

// =============================================
// ASYNC SECURITY GATEKEEPER (Zero LocalStorage Roles)
// =============================================
const ProtectedRoute = ({ allowedRoles }) => {
  const [authStatus, setAuthStatus] = useState({ loading: true, authenticated: false, role: null });

  useEffect(() => {
    let isMounted = true;

    const verifyServerAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          if (isMounted) setAuthStatus({ loading: false, authenticated: false, role: null });
          return;
        }

        // 1. Run administrative check via RPC (Server Truth Layer)
        const { data: isAdmin, error: rpcError } = await supabase.rpc('check_is_administrative_user');
        
        if (!rpcError && isAdmin === true) {
          if (isMounted) setAuthStatus({ loading: false, authenticated: true, role: 'admin' });
          return;
        }

        // 2. Fall back to reading application role from app user metadata for standard accounts
        const userRole = session.user.user_metadata?.role || 'student'; 
        
        if (isMounted) {
          setAuthStatus({ loading: false, authenticated: true, role: userRole });
        }
      } catch (err) {
        console.error("Route Guard Error:", err);
        if (isMounted) setAuthStatus({ loading: false, authenticated: false, role: null });
      }
    };

    verifyServerAccess();
    return () => { isMounted = false; };
  }, []);

  if (authStatus.loading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', flexDirection: 'column', gap: '12px',
        alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#FFF' 
      }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #4F46E5', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ fontFamily: 'monospace', fontSize: '13px', letterSpacing: '0.5px' }}>VERIFYING PORTAL CREDENTIALS...</p>
      </div>
    );
  }

  if (!authStatus.authenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(authStatus.role)) {
    // Dynamic routing fallback if roles conflict
    if (authStatus.role === 'admin') return <Navigate to="/admin" replace />;
    if (authStatus.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (authStatus.role === 'student') return <Navigate to="/student" replace />;
    if (authStatus.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// =============================================
// ADMIN LAYOUT - Core Router Structural Wrapper
// =============================================
const AdminLayout = () => {
  return <AdminDashboard />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* ============================================ */}
        {/* PUBLIC ROUTES */}
        {/* ============================================ */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/select-role" element={<SelectRole />} />
        <Route path="/registration" element={<MultiStageRegistration />} />
        <Route path="/authcallback" element={<AuthCallback />} />
        <Route path="/test-signup" element={<StudentRegistration />} />

        {/* ============================================ */}
        {/* ADMIN ROUTES (Protected Layout Nested) */}
        {/* ============================================ */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="registrations" element={<AdminRegistrations />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="admins" element={<AdminManageAdmins />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          
          <Route path="/admin/verify" element={<AdminVerification />} />
        </Route>

        {/* Legacy redirect handling */}
        <Route path="/admindashboard" element={<Navigate to="/admin" replace />} />

        {/* ============================================ */}
        {/* TEACHER ROUTES (Protected) */}
        {/* ============================================ */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />
        </Route>
        <Route path="/teacherdashboard" element={<Navigate to="/teacher" replace />} />

        {/* ============================================ */}
        {/* STUDENT ROUTES (Protected) */}
        {/* ============================================ */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/*" element={<StudentDashboard />} />
        </Route>
        <Route path="/studentdashboard" element={<Navigate to="/student" replace />} />

        {/* ============================================ */}
        {/* PARENT ROUTES (Protected) */}
        {/* ============================================ */}
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/*" element={<ParentDashboard />} />
        </Route>
        <Route path="/parentdashboard" element={<Navigate to="/parent" replace />} />

        {/* ============================================ */}
        {/* 404 - Page Not Found */}
        {/* ============================================ */}
        <Route path="*" element={
          <div className="not-found">
            <h1>404</h1>
            <p>Page Not Found</p>
            <a href="/">Go to Login</a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;