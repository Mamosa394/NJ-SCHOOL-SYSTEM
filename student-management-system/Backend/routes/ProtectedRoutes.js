import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  // In a real app, you'd get this from a Global State (Context API/Redux) 
  // or LocalStorage after the login response.
  const user = JSON.parse(localStorage.getItem('user')); 

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Logged in but wrong role (e.g., student trying to access /admin)
    return <Navigate to="/unauthorized" replace />;
  }

  // If everything is fine, render the child components (the dashboard)
  return <Outlet />;
};

export default ProtectedRoute;