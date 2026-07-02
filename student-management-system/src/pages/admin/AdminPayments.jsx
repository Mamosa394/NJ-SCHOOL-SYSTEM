
// AdminPayments.jsx
import React from 'react';
import { DollarSign } from 'lucide-react';

const AdminPayments = () => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2><DollarSign size={22} /> Payment Management</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        <DollarSign size={48} />
        <h3>Payment Management</h3>
        <p>Full payment management features coming soon.</p>
      </div>
    </div>
  </div>
);
export default AdminPayments;