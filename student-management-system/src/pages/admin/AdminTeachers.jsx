// AdminTeachers.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  UserCog, Search, RefreshCw, Eye, Mail, Phone, BookOpen,
  CheckCircle, XCircle, Clock, AlertCircle, GraduationCap,
  History, Shield, ShieldOff, Award, Download,
  Printer, ArrowLeft
} from 'lucide-react';
import '../../styles/adminStyles/adminTeachers.css';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [approvedTeachers, setApprovedTeachers] = useState([]);
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    fetchAllData();
  }, [activeView]);

  const formatSubjects = (subjects) => {
    if (!subjects) return 'N/A';
    if (typeof subjects === 'string' && subjects.includes(',')) return subjects;
    if (Array.isArray(subjects)) return subjects.join(', ');
    if (typeof subjects === 'string' && subjects.startsWith('[')) {
      try {
        const parsed = JSON.parse(subjects);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch (e) {}
    }
    if (typeof subjects === 'string') {
      const cleaned = subjects.replace(/[\[\]"]/g, '').replace(/\s+/g, ' ').trim();
      if (cleaned.includes(' ') && !cleaned.includes(',')) {
        return cleaned.split(' ').map(s => s.trim()).filter(Boolean).join(', ');
      }
      return cleaned;
    }
    return String(subjects);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching teacher data...');

      const { data: allTeachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (teachersError) {
        console.error('❌ Error fetching teachers:', teachersError);
      } else {
        console.log('✅ Teachers fetched:', allTeachers?.length || 0);
        setTeachers(allTeachers || []);
      }

      const { data: pending, error: pendingError } = await supabase
        .from('pending_teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('❌ Error fetching pending teachers:', pendingError);
      } else {
        console.log('✅ Pending teachers fetched:', pending?.length || 0);
        setPendingTeachers(pending || []);
      }

      const { data: approved, error: approvedError } = await supabase
        .from('approved_teachers')
        .select('*')
        .order('approved_at', { ascending: false });

      if (approvedError) {
        console.error('❌ Error fetching approved teachers:', approvedError);
      } else {
        console.log('✅ Approved teachers fetched:', approved?.length || 0);
        setApprovedTeachers(approved || []);
      }

      const { data: history, error: historyError } = await supabase
        .from('teacher_approval_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (historyError) {
        console.error('❌ Error fetching approval history:', historyError);
      } else {
        console.log('✅ Approval history fetched:', history?.length || 0);
        setApprovalHistory(history || []);
      }

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedTeacher) return;
    setProcessing(true);
    console.log('✅ Approving teacher:', selectedTeacher.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData = {
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null
      };

      console.log('📝 Update data:', updateData);

      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', selectedTeacher.id);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      const { error: historyError } = await supabase
        .from('teacher_approval_history')
        .insert({
          teacher_id: selectedTeacher.id,
          teacher_name: selectedTeacher.full_name || 'Unknown',
          teacher_email: selectedTeacher.email || 'N/A',
          action: 'approved',
          admin_notes: adminNotes || null,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('❌ History error:', historyError);
      }

      console.log('✅ Teacher approved successfully');
      setAdminNotes('');
      setShowDetails(false);
      fetchAllData();
    } catch (error) {
      console.error('❌ Error approving:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTeacher) return;
    setProcessing(true);
    console.log('❌ Rejecting teacher:', selectedTeacher.id);

    try {
      const updateData = {
        approval_status: 'rejected',
        rejection_reason: adminNotes || null
      };

      console.log('📝 Update data:', updateData);

      const { error } = await supabase
        .from('teachers')
        .update(updateData)
        .eq('id', selectedTeacher.id);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      const { error: historyError } = await supabase
        .from('teacher_approval_history')
        .insert({
          teacher_id: selectedTeacher.id,
          teacher_name: selectedTeacher.full_name || 'Unknown',
          teacher_email: selectedTeacher.email || 'N/A',
          action: 'rejected',
          admin_notes: adminNotes || null,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('❌ History error:', historyError);
      }

      console.log('✅ Teacher rejected');
      setAdminNotes('');
      setShowDetails(false);
      fetchAllData();
    } catch (error) {
      console.error('❌ Error rejecting:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspend = async (teacherId) => {
    if (!confirm('Suspend this teacher?')) return;
    console.log('⏸️ Suspending teacher:', teacherId);

    try {
      await supabase
        .from('teachers')
        .update({ approval_status: 'suspended' })
        .eq('id', teacherId);

      fetchAllData();
    } catch (error) {
      console.error('❌ Error suspending:', error);
    }
  };

  const handleActivate = async (teacherId) => {
    console.log('✅ Activating teacher:', teacherId);

    try {
      await supabase
        .from('teachers')
        .update({ approval_status: 'approved' })
        .eq('id', teacherId);

      fetchAllData();
    } catch (error) {
      console.error('❌ Error activating:', error);
    }
  };

  const handleViewDetails = (teacher) => {
    console.log('👁️ Viewing teacher:', teacher.id);
    setSelectedTeacher(teacher);
    setShowDetails(true);
    setAdminNotes('');
  };

  const handlePrint = () => {
    console.log('🖨️ Printing teacher details');
    window.print();
  };

  const handleExportPDF = () => {
    console.log('📄 Exporting teacher details as PDF');

    const printWindow = window.open('', '_blank');
    
    const content = `<!DOCTYPE html>
<html>
<head>
  <title>Teacher Details - ${selectedTeacher?.full_name || 'Teacher'}</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 2.5rem; color: #1e293b; line-height: 1.7; max-width: 900px; margin: 0 auto; }
    .header { border-bottom: 3px solid #283593; padding-bottom: 1.25rem; margin-bottom: 2rem; }
    .logo { font-size: 1.5rem; font-weight: 800; color: #283593; }
    .subtitle { font-size: 0.85rem; color: #64748b; margin-top: 0.3rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: #283593; margin: 1.75rem 0 0.85rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; text-transform: uppercase; letter-spacing: 0.06em; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    tr { border-bottom: 1px solid #f1f5f9; }
    tr:last-child { border-bottom: none; }
    th { padding: 0.7rem 1rem; text-align: left; background: #f8fafc; font-weight: 600; color: #64748b; font-size: 0.8rem; width: 30%; border-right: 1px solid #e2e8f0; }
    td { padding: 0.7rem 1rem; font-size: 0.85rem; color: #1e293b; }
    .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize; }
    .status-approved { background: #ecfdf5; color: #047857; }
    .status-pending { background: #fffbeb; color: #b45309; }
    .status-rejected { background: #fef2f2; color: #b91c1c; }
    .footer { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0; font-size: 0.78rem; color: #94a3b8; text-align: center; }
    @media print { body { padding: 0.5rem; } @page { margin: 1.5cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">NJEC - New Jerusalem Extra Classes</div>
    <div class="subtitle">Teacher Details Report</div>
    <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
  </div>
  <div class="section-title">Personal Information</div>
  <table>
    <tbody>
      <tr><th>Full Name</th><td>${selectedTeacher?.full_name || 'N/A'}</td></tr>
      <tr><th>Email Address</th><td>${selectedTeacher?.email || 'N/A'}</td></tr>
      <tr><th>Phone Number</th><td>${selectedTeacher?.phone || 'N/A'}</td></tr>
      <tr><th>Status</th><td><span class="status-badge status-${selectedTeacher?.approval_status || 'pending'}">${selectedTeacher?.approval_status || 'N/A'}</span></td></tr>
      ${selectedTeacher?.days_waiting ? `<tr><th>Days Waiting</th><td>${selectedTeacher.days_waiting} days</td></tr>` : ''}
    </tbody>
  </table>
  <div class="section-title">Professional Information</div>
  <table>
    <tbody>
      <tr><th>Subjects</th><td>${formatSubjects(selectedTeacher?.subjects)}</td></tr>
      <tr><th>Qualification</th><td>${selectedTeacher?.qualification || 'N/A'}</td></tr>
      <tr><th>Teaching Type</th><td>${selectedTeacher?.teaching_type || 'N/A'}</td></tr>
      <tr><th>Registration</th><td>${selectedTeacher?.registration_completed ? 'Completed' : 'Pending'}</td></tr>
      <tr><th>Date Joined</th><td>${selectedTeacher?.created_at ? new Date(selectedTeacher.created_at).toLocaleDateString() : 'N/A'}</td></tr>
      ${selectedTeacher?.approved_at ? `<tr><th>Approved Date</th><td>${new Date(selectedTeacher.approved_at).toLocaleString()}</td></tr>` : ''}
      ${selectedTeacher?.rejection_reason ? `<tr><th>Rejection Reason</th><td>${selectedTeacher.rejection_reason}</td></tr>` : ''}
    </tbody>
  </table>
  <div class="footer">
    <p>This is an official document generated by NJEC.</p>
    <p>New Jerusalem Extra Classes &copy; ${new Date().getFullYear()}. All Rights Reserved.</p>
  </div>
</body>
</html>`;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 1000);
  };

  const getActiveData = () => {
    switch (activeView) {
      case 'pending': return pendingTeachers;
      case 'approved': return approvedTeachers;
      case 'all':
      default: return teachers;
    }
  };

  const activeData = getActiveData();

  const filteredData = activeData.filter(teacher => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (teacher.full_name || '')?.toLowerCase().includes(s) ||
      (teacher.email || '')?.toLowerCase().includes(s) ||
      (formatSubjects(teacher.subjects) || '')?.toLowerCase().includes(s)
    );
  });

  const viewTabs = [
    { key: 'all', label: 'All Teachers', count: teachers.length, icon: UserCog, color: '#283593' },
    { key: 'pending', label: 'Pending', count: pendingTeachers.length, icon: Clock, color: '#f59e0b' },
    { key: 'approved', label: 'Approved', count: approvedTeachers.length, icon: CheckCircle, color: '#10b981' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { label: 'Approved', class: 'tch-badge-approved', icon: CheckCircle };
      case 'pending': return { label: 'Pending', class: 'tch-badge-pending', icon: Clock };
      case 'rejected': return { label: 'Rejected', class: 'tch-badge-rejected', icon: XCircle };
      case 'suspended': return { label: 'Suspended', class: 'tch-badge-rejected', icon: ShieldOff };
      default: return { label: status || 'Unknown', class: '', icon: AlertCircle };
    }
  };

  return (
    <div className="tch-page">
      <div className="tch-page-header">
        <div>
          <h2><UserCog size={22} /> Teacher Management</h2>
          <p>Manage teachers, approvals, and assignments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchAllData} className="tch-btn-outline">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowHistory(true)} className="tch-btn-outline">
            <History size={16} /> History
          </button>
        </div>
      </div>

      <div className="tch-tabs">
        {viewTabs.map(tab => (
          <button
            key={tab.key}
            className={`tch-tab ${activeView === tab.key ? 'active' : ''}`}
            onClick={() => setActiveView(tab.key)}
            style={{ '--tab-color': tab.color, '--tab-bg': `${tab.color}15` }}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            <span className="tch-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="tch-card">
        <div className="tch-card-header">
          <div className="tch-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, email, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="tch-count">{filteredData.length} teachers</span>
        </div>

        {loading ? (
          <div className="tch-loading">
            <RefreshCw size={24} className="tch-spinner" />
            <p>Loading teachers...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="tch-empty">
            <UserCog size={40} />
            <h3>No {activeView === 'all' ? '' : activeView} teachers found</h3>
            <p>There are no teachers to display.</p>
          </div>
        ) : (
          <div className="tch-table-wrap">
            <table className="tch-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Contact</th>
                  <th>Subjects</th>
                  <th>Qualification</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(teacher => {
                  const statusBadge = getStatusBadge(teacher.approval_status);
                  const StatusIcon = statusBadge.icon;
                  return (
                    <tr key={teacher.id}>
                      <td>
                        <div className="tch-user">
                          <div className="tch-user-avatar" style={{
                            background: teacher.approval_status === 'approved' ? '#d1fae5' :
                                       teacher.approval_status === 'pending' ? '#fef3c7' :
                                       teacher.approval_status === 'rejected' ? '#fee2e2' : '#eef2ff',
                            color: teacher.approval_status === 'approved' ? '#059669' :
                                  teacher.approval_status === 'pending' ? '#d97706' :
                                  teacher.approval_status === 'rejected' ? '#dc2626' : '#283593'
                          }}>
                            {(teacher.full_name || 'T').charAt(0)}
                          </div>
                          <div className="tch-user-info">
                            <span className="tch-user-name">{teacher.full_name || 'Unknown'}</span>
                            <span className="tch-user-email">{teacher.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tch-contact">
                          <span><Mail size={12} /> {teacher.email || 'N/A'}</span>
                          <span><Phone size={12} /> {teacher.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="tch-subject-badge">
                          <BookOpen size={14} />
                          {formatSubjects(teacher.subjects)}
                        </span>
                      </td>
                      <td>
                        <span className="tch-meta">
                          <Award size={14} />
                          {teacher.qualification || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="tch-meta">
                          {teacher.teaching_type || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`tch-badge ${statusBadge.class}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                          {teacher.days_waiting && teacher.approval_status === 'pending' && (
                            <span style={{ marginLeft: '4px', opacity: 0.7 }}>({teacher.days_waiting}d)</span>
                          )}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button className="tch-btn-view" onClick={() => handleViewDetails(teacher)}>
                            <Eye size={14} /> View
                          </button>
                          {teacher.approval_status === 'approved' && (
                            <button className="tch-btn-view tch-btn-suspend" onClick={() => handleSuspend(teacher.id)}>
                              <ShieldOff size={14} />
                            </button>
                          )}
                          {teacher.approval_status === 'suspended' && (
                            <button className="tch-btn-view tch-btn-activate" onClick={() => handleActivate(teacher.id)}>
                              <Shield size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Page */}
      {showDetails && selectedTeacher && (
        <div className="tch-detail-page" ref={printRef}>
          <div className="tch-detail-page-header">
            <button onClick={() => setShowDetails(false)} className="tch-back-btn">
              <ArrowLeft size={20} />
              Back to List
            </button>
            <div className="tch-detail-page-actions">
              <button onClick={handlePrint} className="tch-btn-outline">
                <Printer size={16} /> Print
              </button>
              <button onClick={handleExportPDF} className="tch-btn-outline">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>

          <div className="tch-detail-page-body">
            <div className="tch-detail-page-heading">
              <GraduationCap size={28} />
              <div>
                <h2>Teacher Details</h2>
                <p>{selectedTeacher.full_name} • {selectedTeacher.email}</p>
              </div>
            </div>

            <div className="tch-section">
              <h3 className="tch-section-title">Personal Information</h3>
              <table className="tch-detail-table">
                <tbody>
                  <tr>
                    <td className="tch-detail-label">Full Name</td>
                    <td className="tch-detail-value">{selectedTeacher.full_name || 'N/A'}</td>
                    <td className="tch-detail-label">Email</td>
                    <td className="tch-detail-value">{selectedTeacher.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="tch-detail-label">Phone</td>
                    <td className="tch-detail-value">{selectedTeacher.phone || 'N/A'}</td>
                    <td className="tch-detail-label">Status</td>
                    <td className="tch-detail-value">
                      {(() => {
                        const badge = getStatusBadge(selectedTeacher.approval_status);
                        const Icon = badge.icon;
                        return (
                          <span className={`tch-badge ${badge.class}`}>
                            <Icon size={12} /> {badge.label}
                            {selectedTeacher.days_waiting && selectedTeacher.approval_status === 'pending' && (
                              <span> ({selectedTeacher.days_waiting} days waiting)</span>
                            )}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="tch-section">
              <h3 className="tch-section-title">Professional Information</h3>
              <table className="tch-detail-table">
                <tbody>
                  <tr>
                    <td className="tch-detail-label">Subjects</td>
                    <td className="tch-detail-value">{formatSubjects(selectedTeacher.subjects)}</td>
                    <td className="tch-detail-label">Qualification</td>
                    <td className="tch-detail-value">{selectedTeacher.qualification || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="tch-detail-label">Teaching Type</td>
                    <td className="tch-detail-value">{selectedTeacher.teaching_type || 'N/A'}</td>
                    <td className="tch-detail-label">Registration</td>
                    <td className="tch-detail-value">
                      {selectedTeacher.registration_completed ? '✅ Completed' : '⏳ Pending'}
                    </td>
                  </tr>
                  <tr>
                    <td className="tch-detail-label">Joined</td>
                    <td className="tch-detail-value">
                      {selectedTeacher.created_at ? new Date(selectedTeacher.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="tch-detail-label">Teacher ID</td>
                    <td className="tch-detail-value">
                      <code style={{ fontSize: '0.75rem' }}>{selectedTeacher.teacher_id || selectedTeacher.id}</code>
                    </td>
                  </tr>
                  {selectedTeacher.approved_at && (
                    <tr>
                      <td className="tch-detail-label">Approved Date</td>
                      <td className="tch-detail-value" colSpan="3">
                        {new Date(selectedTeacher.approved_at).toLocaleString()}
                      </td>
                    </tr>
                  )}
                  {selectedTeacher.rejection_reason && (
                    <tr>
                      <td className="tch-detail-label">Rejection Reason</td>
                      <td className="tch-detail-value" colSpan="3">{selectedTeacher.rejection_reason}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedTeacher.approval_status === 'pending' && (
              <div className="tch-section">
                <h3 className="tch-section-title">Review Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this teacher (will be saved as rejection reason if rejected)..."
                  className="tch-textarea"
                />
              </div>
            )}
          </div>

          {selectedTeacher.approval_status === 'pending' && (
            <div className="tch-detail-page-footer">
              <button onClick={handleReject} className="tch-btn-danger" disabled={processing}>
                <XCircle size={18} /> Reject Teacher
              </button>
              <button onClick={handleApprove} className="tch-btn-success" disabled={processing}>
                {processing ? 'Processing...' : <><CheckCircle size={18} /> Approve Teacher</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="tch-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="tch-modal" onClick={e => e.stopPropagation()}>
            <div className="tch-modal-header">
              <h2><History size={20} /> Approval History</h2>
              <button onClick={() => setShowHistory(false)} className="tch-modal-close">
                <XCircle size={22} />
              </button>
            </div>
            <div className="tch-modal-body">
              {approvalHistory.length === 0 ? (
                <div className="tch-empty">
                  <History size={40} />
                  <h3>No history</h3>
                  <p>No approval actions have been recorded yet.</p>
                </div>
              ) : (
                <div className="tch-table-wrap">
                  <table className="tch-table">
                    <thead>
                      <tr>
                        <th>Teacher</th>
                        <th>Email</th>
                        <th>Action</th>
                        <th>Notes</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvalHistory.map(record => (
                        <tr key={record.id}>
                          <td><strong>{record.teacher_name || 'N/A'}</strong></td>
                          <td>{record.teacher_email || 'N/A'}</td>
                          <td>
                            <span className={`tch-badge ${record.action === 'approved' ? 'tch-badge-approved' : 'tch-badge-rejected'}`}>
                              {record.action === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {record.action}
                            </span>
                          </td>
                          <td>{record.admin_notes || '-'}</td>
                          <td>{record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeachers;