
// AdminReports.jsx
import React from 'react';
import { BarChart3 } from 'lucide-react';

const AdminReports = () => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><BarChart3 size={22} /> Reports</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        <BarChart3 size={48} />
        <h3>Reports & Analytics</h3>
        <p>Full reporting features coming soon.</p>
      </div>
    </div>
  </div>
);
export default AdminReports;