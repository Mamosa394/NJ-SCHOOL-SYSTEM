
// AdminSettings.jsx
import React from 'react';
import { Settings } from 'lucide-react';

const AdminSettings = ({ admin }) => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><Settings size={22} /> Settings</h2>
    </div>
    <div className="adm-card">
      <div className="adm-settings-info">
        <p><strong>Logged in as:</strong> {admin?.full_name}</p>
        <p><strong>Email:</strong> {admin?.email}</p>
        <p><strong>Admin Level:</strong> {admin?.admin_level}</p>
      </div>
    </div>
  </div>
);
export default AdminSettings;
