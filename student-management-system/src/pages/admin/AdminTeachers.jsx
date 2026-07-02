
// AdminTeachers.jsx
import React from 'react';
import { UserCog } from 'lucide-react';

const AdminTeachers = () => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><UserCog size={22} /> Teacher Management</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        <UserCog size={48} />
        <h3>Teacher Management</h3>
        <p>Full teacher management features coming soon.</p>
      </div>
    </div>
  </div>
);
export default AdminTeachers;