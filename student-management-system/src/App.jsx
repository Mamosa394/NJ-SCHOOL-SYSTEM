import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
// SECURITY GATEKEEPER - Checks user role
// =============================================
const ProtectedRoute = ({ allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
    if (user.role === 'student') return <Navigate to="/student" replace />;
    if (user.role === 'parent') return <Navigate to="/parent" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// =============================================
// ADMIN LAYOUT - Wrapper for all admin pages
// =============================================
const AdminLayout = () => {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
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
        {/* ADMIN ROUTES (Protected) */}
        {/* ============================================ */}
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

        {/* Admin Verification (special route) */}
        <Route path="/admin/verify" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminVerification />
          </ProtectedRoute>
        } />

        {/* Legacy admin route - redirects to new admin dashboard */}
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