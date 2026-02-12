import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import HomePage from "./components/HomePage";
// import Signup from "./components/Signup";
import Login from "./components/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentRegistration from './components/TestSignUP';
import MultiStageRegistration from './components/MultiStageRegistration';
import './App.css';

// ✅ Security Gatekeeper Component
const ProtectedRoute = ({ allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // Redirect home if they don't have permission
  }

  return <Outlet />; // Render the dashboard
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/ss" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/signup" element={<Signup />} /> */}
        <Route path="/s" element={<StudentRegistration />} />
        <Route path="/" element={<MultiStageRegistration />} />


        
        {/* ✅ Protected Dashboard Routes */}
        
        {/* Admin Only */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Teacher Only */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Route>

        {/* Student Only */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>

        {/* Parent Only */}
        <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
          <Route path="/parent" element={<ParentDashboard />} />
        </Route>
        
        {/* 404 Page */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;