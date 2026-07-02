// AdminStudents.jsx
import React from 'react';
import { GraduationCap } from 'lucide-react';

const AdminStudents = () => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><GraduationCap size={22} /> Student Management</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        <GraduationCap size={48} />
        <h3>Student Management</h3>
        <p>Full student management features coming soon.</p>
      </div>
    </div>
  </div>
);
export default AdminStudents;
