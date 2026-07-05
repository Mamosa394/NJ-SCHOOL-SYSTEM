// AdminStudents.jsx - CRUD Operations (Update & Delete)
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  GraduationCap, Search, RefreshCw, Eye, Mail, Phone, BookOpen,
  CheckCircle, XCircle, Clock, AlertCircle, DollarSign,
  Shield, ShieldOff, Download, Printer, ArrowLeft,
  Edit, Trash2, Save, X
} from 'lucide-react';
import '../../styles/adminStyles/adminStudents.css';

const AdminStudents = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [approvedStudents, setApprovedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editForm, setEditForm] = useState({});
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
      console.log('📋 Fetching student data...');

      const { data: all, error: allError } = await supabase
        .from('student_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (allError) {
        console.error('❌ Error fetching all students:', allError);
      } else {
        console.log('✅ All students fetched:', all?.length || 0);
        setAllStudents(all || []);
      }

      const { data: pending, error: pendingError } = await supabase
        .from('pending_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (pendingError) {
        console.error('❌ Error fetching pending students:', pendingError);
      } else {
        console.log('✅ Pending students fetched:', pending?.length || 0);
        setPendingStudents(pending || []);
      }

      const { data: approved, error: approvedError } = await supabase
        .from('approved_students')
        .select('*')
        .order('approved_at', { ascending: false });

      if (approvedError) {
        console.error('❌ Error fetching approved students:', approvedError);
      } else {
        console.log('✅ Approved students fetched:', approved?.length || 0);
        setApprovedStudents(approved || []);
      }

    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // =============================================
  // UPDATE OPERATIONS
  // =============================================

  const handleOpenEdit = (student) => {
    console.log('✏️ Opening edit for student:', student.id);
    setEditForm({
      id: student.id,
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      student_number: student.student_number || '',
      birth_date: student.birth_date || '',
      gender: student.gender || '',
      class_type: student.class_type || 'extra',
      subjects: student.subjects || [],
      payment_method: student.payment_method || 'mpesa',
      payment_number: student.payment_number || '',
      payer_name: student.payer_name || '',
      total_amount: student.total_amount || 0,
      registration_status: student.registration_status || 'pending'
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateStudent = async () => {
    setProcessing(true);
    console.log('💾 Updating student:', editForm.id);

    try {
      const updateData = {
        full_name: editForm.full_name,
        email: editForm.email,
        phone: editForm.phone,
        student_number: editForm.student_number,
        birth_date: editForm.birth_date || null,
        gender: editForm.gender,
        class_type: editForm.class_type,
        subjects: editForm.subjects,
        payment_method: editForm.payment_method,
        payment_number: editForm.payment_number,
        payer_name: editForm.payer_name,
        total_amount: parseFloat(editForm.total_amount) || 0,
        registration_status: editForm.registration_status,
        updated_at: new Date().toISOString()
      };

      console.log('📝 Update data:', updateData);

      const { error } = await supabase
        .from('student_registrations')
        .update(updateData)
        .eq('id', editForm.id);

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

      console.log('✅ Student updated successfully');
      setShowEditModal(false);
      setEditForm({});
      fetchAllData();
    } catch (error) {
      console.error('❌ Error updating:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async (studentId, newStatus) => {
    console.log(`🔄 Changing status to ${newStatus} for student:`, studentId);

    try {
      const updateData = {
        registration_status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('student_registrations')
        .update(updateData)
        .eq('id', studentId);

      if (error) {
        console.error('❌ Status update error:', error);
        throw error;
      }

      console.log('✅ Status updated successfully');
      fetchAllData();
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  // =============================================
  // DELETE OPERATION
  // =============================================

  const handleOpenDelete = (student) => {
    console.log('🗑️ Opening delete confirm for student:', student.id);
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    setProcessing(true);
    console.log('🗑️ Deleting student:', selectedStudent.id);

    try {
      const { error } = await supabase
        .from('student_registrations')
        .delete()
        .eq('id', selectedStudent.id);

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Student deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedStudent(null);
      fetchAllData();
    } catch (error) {
      console.error('❌ Error deleting:', error);
    } finally {
      setProcessing(false);
    }
  };

  // =============================================
  // VIEW & EXPORT
  // =============================================

  const handleViewDetails = (student) => {
    console.log('👁️ Viewing student:', student.id);
    setSelectedStudent(student);
    setShowDetails(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    
    const content = `<!DOCTYPE html>
<html>
<head>
  <title>Student Details - ${selectedStudent?.full_name || 'Student'}</title>
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
    <div class="subtitle">Student Details Report</div>
    <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
  </div>
  <div class="section-title">Personal Information</div>
  <table>
    <tbody>
      <tr><th>Full Name</th><td>${selectedStudent?.full_name || 'N/A'}</td></tr>
      <tr><th>Student Number</th><td>${selectedStudent?.student_number || 'N/A'}</td></tr>
      <tr><th>Email</th><td>${selectedStudent?.email || 'N/A'}</td></tr>
      <tr><th>Phone</th><td>${selectedStudent?.phone || 'N/A'}</td></tr>
      <tr><th>Date of Birth</th><td>${selectedStudent?.birth_date || 'N/A'}</td></tr>
      <tr><th>Gender</th><td>${selectedStudent?.gender || 'N/A'}</td></tr>
      <tr><th>Class Type</th><td>${selectedStudent?.class_type === 'extra' ? 'Extra Classes' : selectedStudent?.class_type === 'supplementary' ? 'Supplementary' : 'N/A'}</td></tr>
      <tr><th>Status</th><td><span class="status-badge status-${selectedStudent?.registration_status || 'pending'}">${selectedStudent?.registration_status || 'N/A'}</span></td></tr>
    </tbody>
  </table>
  <div class="section-title">Academic & Payment</div>
  <table>
    <tbody>
      <tr><th>Subjects</th><td>${formatSubjects(selectedStudent?.subjects)}</td></tr>
      <tr><th>Payment Method</th><td>${selectedStudent?.payment_method === 'mpesa' ? 'M-Pesa' : selectedStudent?.payment_method === 'ecocash' ? 'Eco-Cash' : 'N/A'}</td></tr>
      <tr><th>Total Amount</th><td><strong>M${(selectedStudent?.total_amount || 0).toLocaleString()}</strong></td></tr>
      <tr><th>Payer Name</th><td>${selectedStudent?.payer_name || 'N/A'}</td></tr>
      <tr><th>Payment Number</th><td>${selectedStudent?.payment_number || 'N/A'}</td></tr>
      <tr><th>Submitted</th><td>${selectedStudent?.submitted_at ? new Date(selectedStudent.submitted_at).toLocaleDateString() : 'N/A'}</td></tr>
      ${selectedStudent?.approved_at ? `<tr><th>Approved Date</th><td>${new Date(selectedStudent.approved_at).toLocaleString()}</td></tr>` : ''}
      ${selectedStudent?.admin_notes ? `<tr><th>Admin Notes</th><td>${selectedStudent.admin_notes}</td></tr>` : ''}
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
      case 'pending': return pendingStudents;
      case 'approved': return approvedStudents;
      case 'rejected': return allStudents.filter(s => s.registration_status === 'rejected');
      case 'all':
      default: return allStudents;
    }
  };

  const activeData = getActiveData();

  const filteredData = activeData.filter(student => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (student.full_name || '')?.toLowerCase().includes(s) ||
      (student.email || '')?.toLowerCase().includes(s) ||
      (student.student_number || '')?.toLowerCase().includes(s)
    );
  });

  const viewTabs = [
    { key: 'all', label: 'All Students', count: allStudents.length, icon: GraduationCap, color: '#283593' },
    { key: 'pending', label: 'Pending', count: pendingStudents.length, icon: Clock, color: '#f59e0b' },
    { key: 'approved', label: 'Approved', count: approvedStudents.length, icon: CheckCircle, color: '#10b981' },
    { key: 'rejected', label: 'Rejected', count: allStudents.filter(s => s.registration_status === 'rejected').length, icon: XCircle, color: '#ef4444' }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return { label: 'Approved', class: 'std-badge-approved', icon: CheckCircle };
      case 'pending': return { label: 'Pending', class: 'std-badge-pending', icon: Clock };
      case 'rejected': return { label: 'Rejected', class: 'std-badge-rejected', icon: XCircle };
      case 'suspended': return { label: 'Suspended', class: 'std-badge-rejected', icon: ShieldOff };
      default: return { label: status || 'Unknown', class: '', icon: AlertCircle };
    }
  };

  return (
    <div className="std-page">
      <div className="std-page-header">
        <div>
          <h2><GraduationCap size={22} /> Student Management</h2>
          <p>View, edit, update status, and delete student records</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchAllData} className="std-btn-outline">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="std-tabs">
        {viewTabs.map(tab => (
          <button
            key={tab.key}
            className={`std-tab ${activeView === tab.key ? 'active' : ''}`}
            onClick={() => setActiveView(tab.key)}
            style={{ '--tab-color': tab.color, '--tab-bg': `${tab.color}15` }}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
            <span className="std-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="std-card">
        <div className="std-card-header">
          <div className="std-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name, student number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="std-count">{filteredData.length} students</span>
        </div>

        {loading ? (
          <div className="std-loading">
            <RefreshCw size={24} className="std-spinner" />
            <p>Loading students...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="std-empty">
            <GraduationCap size={40} />
            <h3>No {activeView === 'all' ? '' : activeView} students found</h3>
            <p>There are no students to display.</p>
          </div>
        ) : (
          <div className="std-table-wrap">
            <table className="std-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student No.</th>
                  <th>Contact</th>
                  <th>Subjects</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(student => {
                  const statusBadge = getStatusBadge(student.registration_status);
                  const StatusIcon = statusBadge.icon;
                  return (
                    <tr key={student.id}>
                      <td>
                        <div className="std-user">
                          <div className="std-user-avatar" style={{
                            background: student.registration_status === 'approved' ? '#d1fae5' :
                                       student.registration_status === 'pending' ? '#fef3c7' :
                                       student.registration_status === 'rejected' ? '#fee2e2' : '#eef2ff',
                            color: student.registration_status === 'approved' ? '#059669' :
                                  student.registration_status === 'pending' ? '#d97706' :
                                  student.registration_status === 'rejected' ? '#dc2626' : '#283593'
                          }}>
                            {(student.full_name || 'S').charAt(0)}
                          </div>
                          <div className="std-user-info">
                            <span className="std-user-name">{student.full_name || 'Unknown'}</span>
                            <span className="std-user-email">{student.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      <td><code>{student.student_number || 'N/A'}</code></td>
                      <td>
                        <div className="std-contact">
                          <span><Mail size={12} /> {student.email || 'N/A'}</span>
                          <span><Phone size={12} /> {student.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="std-subject-badge">
                          <BookOpen size={14} />
                          {Array.isArray(student.subjects) ? student.subjects.length : 0}
                        </span>
                      </td>
                      <td><strong>M{(student.total_amount || 0).toLocaleString()}</strong></td>
                      <td>{student.submitted_at ? new Date(student.submitted_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`std-badge ${statusBadge.class}`}>
                          <StatusIcon size={12} />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          <button className="std-btn-view" onClick={() => handleViewDetails(student)} title="View">
                            <Eye size={14} />
                          </button>
                          <button className="std-btn-view std-btn-edit" onClick={() => handleOpenEdit(student)} title="Edit">
                            <Edit size={14} />
                          </button>
                          <button className="std-btn-view std-btn-delete" onClick={() => handleOpenDelete(student)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                          {student.registration_status === 'pending' && (
                            <button className="std-btn-view std-btn-approve" onClick={() => handleStatusChange(student.id, 'approved')} title="Approve">
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {student.registration_status === 'approved' && (
                            <button className="std-btn-view std-btn-suspend" onClick={() => handleStatusChange(student.id, 'suspended')} title="Suspend">
                              <ShieldOff size={14} />
                            </button>
                          )}
                          {student.registration_status === 'suspended' && (
                            <button className="std-btn-view std-btn-activate" onClick={() => handleStatusChange(student.id, 'approved')} title="Activate">
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

      {/* View Detail Page */}
      {showDetails && selectedStudent && (
        <div className="std-detail-page" ref={printRef}>
          <div className="std-detail-page-header">
            <button onClick={() => setShowDetails(false)} className="std-back-btn">
              <ArrowLeft size={20} /> Back to List
            </button>
            <div className="std-detail-page-actions">
              <button onClick={handlePrint} className="std-btn-outline"><Printer size={16} /> Print</button>
              <button onClick={handleExportPDF} className="std-btn-outline"><Download size={16} /> Export PDF</button>
              <button onClick={() => { setShowDetails(false); handleOpenEdit(selectedStudent); }} className="std-btn-outline"><Edit size={16} /> Edit</button>
            </div>
          </div>
          <div className="std-detail-page-body">
            <div className="std-detail-page-heading">
              <GraduationCap size={28} />
              <div>
                <h2>Student Details</h2>
                <p>{selectedStudent.full_name} • {selectedStudent.student_number}</p>
              </div>
            </div>
            <div className="std-section">
              <h3 className="std-section-title">Personal Information</h3>
              <table className="std-detail-table">
                <tbody>
                  <tr><td className="std-detail-label">Full Name</td><td className="std-detail-value">{selectedStudent.full_name || 'N/A'}</td><td className="std-detail-label">Student Number</td><td className="std-detail-value"><code>{selectedStudent.student_number || 'N/A'}</code></td></tr>
                  <tr><td className="std-detail-label">Email</td><td className="std-detail-value">{selectedStudent.email || 'N/A'}</td><td className="std-detail-label">Phone</td><td className="std-detail-value">{selectedStudent.phone || 'N/A'}</td></tr>
                  <tr><td className="std-detail-label">Date of Birth</td><td className="std-detail-value">{selectedStudent.birth_date || 'N/A'}</td><td className="std-detail-label">Gender</td><td className="std-detail-value">{selectedStudent.gender || 'N/A'}</td></tr>
                  <tr><td className="std-detail-label">Class Type</td><td className="std-detail-value">{selectedStudent.class_type === 'extra' ? 'Extra Classes' : selectedStudent.class_type === 'supplementary' ? 'Supplementary' : 'N/A'}</td><td className="std-detail-label">Status</td><td className="std-detail-value">{(() => { const badge = getStatusBadge(selectedStudent.registration_status); const Icon = badge.icon; return (<span className={`std-badge ${badge.class}`}><Icon size={12} /> {badge.label}</span>); })()}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="std-section">
              <h3 className="std-section-title">Academic & Payment Information</h3>
              <table className="std-detail-table">
                <tbody>
                  <tr><td className="std-detail-label">Subjects</td><td className="std-detail-value">{formatSubjects(selectedStudent.subjects)}</td><td className="std-detail-label">Payment Method</td><td className="std-detail-value">{selectedStudent.payment_method === 'mpesa' ? 'M-Pesa' : selectedStudent.payment_method === 'ecocash' ? 'Eco-Cash' : 'N/A'}</td></tr>
                  <tr><td className="std-detail-label">Total Amount</td><td className="std-detail-value"><strong>M{(selectedStudent.total_amount || 0).toLocaleString()}</strong></td><td className="std-detail-label">Payer Name</td><td className="std-detail-value">{selectedStudent.payer_name || 'N/A'}</td></tr>
                  <tr><td className="std-detail-label">Payment Number</td><td className="std-detail-value"><code>{selectedStudent.payment_number || 'N/A'}</code></td><td className="std-detail-label">Submitted</td><td className="std-detail-value">{selectedStudent.submitted_at ? new Date(selectedStudent.submitted_at).toLocaleDateString() : 'N/A'}</td></tr>
                  {selectedStudent.approved_at && (<tr><td className="std-detail-label">Approved Date</td><td className="std-detail-value" colSpan="3">{new Date(selectedStudent.approved_at).toLocaleString()}</td></tr>)}
                  {selectedStudent.admin_notes && (<tr><td className="std-detail-label">Admin Notes</td><td className="std-detail-value" colSpan="3">{selectedStudent.admin_notes}</td></tr>)}
                </tbody>
              </table>
            </div>
            {selectedStudent.payment_screenshot_url && (
              <div className="std-section">
                <h3 className="std-section-title">Payment Proof</h3>
                <div className="std-screenshot">
                  <img src={selectedStudent.payment_screenshot_url} alt="Payment proof" onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<p style="padding:2rem;text-align:center;color:#94a3b8;">Payment proof not available</p>'; }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="std-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="std-modal" onClick={e => e.stopPropagation()}>
            <div className="std-modal-header">
              <h2><Edit size={20} /> Edit Student</h2>
              <button onClick={() => setShowEditModal(false)} className="std-modal-close"><X size={20} /></button>
            </div>
            <div className="std-modal-body">
              <div className="std-edit-grid">
                <div className="std-field">
                  <label>Full Name</label>
                  <input type="text" name="full_name" value={editForm.full_name} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Email</label>
                  <input type="email" name="email" value={editForm.email} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Phone</label>
                  <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Student Number</label>
                  <input type="text" name="student_number" value={editForm.student_number} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Date of Birth</label>
                  <input type="date" name="birth_date" value={editForm.birth_date} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Gender</label>
                  <select name="gender" value={editForm.gender} onChange={handleEditChange} className="std-input">
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="std-field">
                  <label>Class Type</label>
                  <select name="class_type" value={editForm.class_type} onChange={handleEditChange} className="std-input">
                    <option value="extra">Extra Classes</option>
                    <option value="supplementary">Supplementary</option>
                  </select>
                </div>
                <div className="std-field">
                  <label>Status</label>
                  <select name="registration_status" value={editForm.registration_status} onChange={handleEditChange} className="std-input">
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div className="std-field">
                  <label>Payment Method</label>
                  <select name="payment_method" value={editForm.payment_method} onChange={handleEditChange} className="std-input">
                    <option value="mpesa">M-Pesa</option>
                    <option value="ecocash">Eco-Cash</option>
                  </select>
                </div>
                <div className="std-field">
                  <label>Payment Number</label>
                  <input type="text" name="payment_number" value={editForm.payment_number} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Payer Name</label>
                  <input type="text" name="payer_name" value={editForm.payer_name} onChange={handleEditChange} className="std-input" />
                </div>
                <div className="std-field">
                  <label>Total Amount (M)</label>
                  <input type="number" name="total_amount" value={editForm.total_amount} onChange={handleEditChange} className="std-input" />
                </div>
              </div>
            </div>
            <div className="std-modal-footer">
              <button onClick={() => setShowEditModal(false)} className="std-btn-outline" disabled={processing}>
                <X size={16} /> Cancel
              </button>
              <button onClick={handleUpdateStudent} className="std-btn-primary" disabled={processing}>
                {processing ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedStudent && (
        <div className="std-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="std-modal std-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="std-modal-header">
              <h2><Trash2 size={20} /> Delete Student</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="std-modal-close"><X size={20} /></button>
            </div>
            <div className="std-modal-body">
              <div style={{ textAlign: 'center', padding: '1rem' }}>
                <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                <h3 style={{ marginBottom: '0.5rem' }}>Are you sure?</h3>
                <p style={{ color: '#64748b', marginBottom: '0.5rem' }}>
                  You are about to permanently delete the student record for:
                </p>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                  {selectedStudent.full_name}
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Student Number: {selectedStudent.student_number}
                </p>
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '1rem' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="std-modal-footer">
              <button onClick={() => setShowDeleteConfirm(false)} className="std-btn-outline" disabled={processing}>
                Cancel
              </button>
              <button onClick={handleDeleteStudent} className="std-btn-danger" disabled={processing}>
                {processing ? 'Deleting...' : <><Trash2 size={16} /> Delete Permanently</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudents;