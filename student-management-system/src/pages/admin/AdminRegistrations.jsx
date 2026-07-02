import React, { useState, useEffect } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  Eye, CheckCircle, XCircle, Search, Filter,
  RefreshCw, Clock, Mail, Phone, BookOpen
} from 'lucide-react';

const AdminRegistrations = ({ onUpdate }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('registration_status', filter);
      }

      const { data } = await query;
      setRegistrations(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'approved',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString()
        })
        .eq('id', selectedReg.id);

      if (error) throw error;

      setShowModal(false);
      setAdminNotes('');
      fetchRegistrations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'rejected',
          admin_notes: adminNotes
        })
        .eq('id', selectedReg.id);

      if (error) throw error;

      setShowModal(false);
      setAdminNotes('');
      fetchRegistrations();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRegs = registrations.filter(reg => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      reg.full_name?.toLowerCase().includes(s) ||
      reg.student_number?.toLowerCase().includes(s) ||
      reg.email?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2>Student Registrations</h2>
          <p>Review and manage registration requests</p>
        </div>
        <button onClick={fetchRegistrations} className="adm-btn-outline">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="adm-card">
        <div className="adm-filter-bar">
          <div className="adm-filter-tabs">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                className={`adm-filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="adm-search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Number</th>
                <th>Contact</th>
                <th>Subjects</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegs.map(reg => (
                <tr key={reg.id}>
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-avatar-sm">{reg.full_name?.charAt(0)}</div>
                      <span>{reg.full_name}</span>
                    </div>
                  </td>
                  <td><code>{reg.student_number}</code></td>
                  <td>
                    <small>{reg.email}<br/>{reg.phone}</small>
                  </td>
                  <td>{Array.isArray(reg.subjects) ? reg.subjects.length : 0}</td>
                  <td><strong>M{reg.total_amount?.toLocaleString()}</strong></td>
                  <td>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`adm-status-pill ${reg.registration_status}`}>
                      {reg.registration_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="adm-btn-sm"
                      onClick={() => { setSelectedReg(reg); setShowModal(true); }}
                    >
                      <Eye size={14} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRegs.length === 0 && (
                <tr><td colSpan="8" className="adm-empty">No registrations found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedReg && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Registration Details</h2>
              <button onClick={() => setShowModal(false)}><XCircle size={20} /></button>
            </div>
            <div className="adm-modal-body">
              <div className="adm-detail-grid">
                <div><label>Name</label><span>{selectedReg.full_name}</span></div>
                <div><label>Student No.</label><code>{selectedReg.student_number}</code></div>
                <div><label>Email</label><span>{selectedReg.email}</span></div>
                <div><label>Phone</label><span>{selectedReg.phone}</span></div>
                <div><label>Gender</label><span>{selectedReg.gender}</span></div>
                <div><label>Class Type</label><span>{selectedReg.class_type}</span></div>
                <div><label>Payment Method</label><span>{selectedReg.payment_method}</span></div>
                <div><label>Amount</label><strong>M{selectedReg.total_amount?.toLocaleString()}</strong></div>
              </div>

              {selectedReg.payment_screenshot_url && (
                <div className="adm-screenshot">
                  <h4>Payment Proof</h4>
                  <img src={selectedReg.payment_screenshot_url} alt="Payment" />
                </div>
              )}

              <div className="adm-notes">
                <label>Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes..."
                />
              </div>
            </div>

            {selectedReg.registration_status === 'pending' && (
              <div className="adm-modal-actions">
                <button onClick={handleReject} className="adm-btn-danger" disabled={processing}>
                  <XCircle size={18} /> Reject
                </button>
                <button onClick={handleApprove} className="adm-btn-success" disabled={processing}>
                  <CheckCircle size={18} /> Approve
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrations;