import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from "./components/HomePage"
import Signup from "./components/Signup"
import Login from "./components/Login"
import AdminDashboard from "./pages/AdminDashboard"
import TeacherDashboard from "./pages/TeacherDashboard"
import ParentDashboard from "./pages/ParentDashboard"
import StudentDashboard from "./pages/StudentDashboard"
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        {/* Welcome/Home Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Dashboard Pages */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/parent" element={<ParentDashboard />} />
        
        {/* Optional: 404 Page */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  )
}

export default App