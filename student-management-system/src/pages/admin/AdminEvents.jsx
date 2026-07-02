


// AdminEvents.jsx
import React from 'react';
import { Calendar } from 'lucide-react';

const AdminEvents = () => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><Calendar size={22} /> Events Management</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        <Calendar size={48} />
        <h3>Events Management</h3>
        <p>Full events management features coming soon.</p>
      </div>
    </div>
  </div>
);
export default AdminEvents;
