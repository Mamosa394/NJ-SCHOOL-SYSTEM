import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Eye, Download, 
  Search, Filter, ChevronDown, Clock,
  AlertCircle, FileText, User, Calendar,
  Mail, Phone, BookOpen, CreditCard,
  Users, RefreshCw, LogOut, Menu, X,
  Settings, BarChart3, Home, Shield,
  GraduationCap, DollarSign, ChevronLeft,
  ChevronRight, Printer, Mail as MailIcon,
  MessageSquare, ThumbsUp, ThumbsDown,
  Loader, Bell, UserCheck, UserX
} from 'lucide-react';
import { supabase } from '../components/supabaseClient';
import '../styles/adminStyles/AdminVerification.css';

const AdminVerification = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({ show: false, type: '', student: null });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [adminUser, setAdminUser] = useState(null);

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
    paymentsPending: 0,
    paymentsVerified: 0
  });

  // Get current admin user on mount
  useEffect(() => {
    getCurrentUser();
  }, []);

  // Fetch students on mount and filter change
  useEffect(() => {
    fetchStudents();
  }, [filter]);

  // Update stats when students change
  useEffect(() => {
    calculateStats();
  }, [students]);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setAdminUser(user);
    } catch (error) {
      console.error('Error getting user:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('students')
        .select(`
          *,
          payments(
            id,
            amount,
            payment_method,
            payment_number,
            payer_name,
            payment_proof_url,
            status,
            created_at,
            verified_at,
            verified_by
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('enrollment_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setStudents(data || []);
      
      // Clear selected student if not in current filter
      if (selectedStudent && !data?.some(s => s.id === selectedStudent.id)) {
        setSelectedStudent(null);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      showNotification('error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const paymentsPending = students.reduce((acc, student) => 
      acc + (student.payments?.filter(p => p.status === 'pending').length || 0), 0
    );
    const paymentsVerified = students.reduce((acc, student) => 
      acc + (student.payments?.filter(p => p.status === 'verified').length || 0), 0
    );

    setStats({
      pending: students.filter(s => s.enrollment_status === 'pending').length,
      approved: students.filter(s => s.enrollment_status === 'approved').length,
      rejected: students.filter(s => s.enrollment_status === 'rejected').length,
      total: students.length,
      paymentsPending,
      paymentsVerified
    });
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  // ==================== STUDENT APPROVAL/REJECTION ====================
  const updateStudentStatus = async (studentId, status, feedback = '') => {
    try {
      setProcessingAction(true);
      
      // Only include columns that exist in your students table
      const updates = {
        enrollment_status: status,
        // Remove admin_feedback if column doesn't exist
        // Add reviewed_at if you added it, otherwise remove
      };

      // If you added the columns, uncomment these:
      // updates.reviewed_at = new Date().toISOString();
      // updates.reviewed_by = adminUser?.id;
      
      // If you want to store feedback, you can add it as a note in another table
      // or add the column first

      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', studentId);

      if (error) throw error;

      // Update local state
      setStudents(students.map(s => 
        s.id === studentId ? { ...s, enrollment_status: status } : s
      ));

      if (selectedStudent?.id === studentId) {
        setSelectedStudent({ ...selectedStudent, enrollment_status: status });
      }

      setFeedbackModal({ show: false, type: '', student: null });
      
      showNotification(
        'success', 
        `Student ${status === 'approved' ? 'approved' : 'rejected'} successfully`
      );

      // Store feedback in a separate table if needed
      if (feedback && status === 'rejected') {
        await saveRejectionFeedback(studentId, feedback);
      }

    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('error', 'Failed to update student status');
    } finally {
      setProcessingAction(false);
    }
  };

  // Optional: Store rejection feedback in a separate table
  const saveRejectionFeedback = async (studentId, feedback) => {
    try {
      const { error } = await supabase
        .from('rejection_feedback') // Create this table if needed
        .insert([{
          student_id: studentId,
          feedback,
          created_at: new Date().toISOString(),
          created_by: adminUser?.id
        }]);

      if (error) console.error('Error saving feedback:', error);
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  // ==================== PAYMENT VERIFICATION ====================
  const updatePaymentStatus = async (paymentId, status) => {
    try {
      setProcessingAction(true);
      
      const updates = {
        status,
        verified_at: new Date().toISOString(),
        verified_by: adminUser?.id
      };

      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId);

      if (error) throw error;

      // Refresh data to show updated status
      await fetchStudents();
      
      showNotification(
        'success', 
        `Payment ${status === 'verified' ? 'verified' : 'rejected'} successfully`
      );

    } catch (error) {
      console.error('Error updating payment:', error);
      showNotification('error', 'Failed to update payment status');
    } finally {
      setProcessingAction(false);
    }
  };

  // ==================== BULK OPERATIONS ====================
  const bulkApproveStudents = async (studentIds) => {
    try {
      setProcessingAction(true);
      
      const updates = {
        enrollment_status: 'approved',
        // reviewed_at: new Date().toISOString(), // Uncomment if column exists
        // reviewed_by: adminUser?.id // Uncomment if column exists
      };

      const { error } = await supabase
        .from('students')
        .update(updates)
        .in('id', studentIds);

      if (error) throw error;

      await fetchStudents();
      showNotification('success', `${studentIds.length} students approved successfully`);

    } catch (error) {
      console.error('Error in bulk approve:', error);
      showNotification('error', 'Failed to approve students');
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_number?.includes(searchTerm) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="admin-verification">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {processingAction && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Processing...</p>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={32} />
            {!sidebarCollapsed && <span>NJEC Admin</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <Home size={20} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </a>
          <a href="#" className="nav-item">
            <Users size={20} />
            {!sidebarCollapsed && <span>Students</span>}
            {stats.pending > 0 && (
              <span className="nav-badge">{stats.pending}</span>
            )}
          </a>
          <a href="#" className="nav-item">
            <CreditCard size={20} />
            {!sidebarCollapsed && <span>Payments</span>}
            {stats.paymentsPending > 0 && (
              <span className="nav-badge">{stats.paymentsPending}</span>
            )}
          </a>
          <a href="#" className="nav-item">
            <BarChart3 size={20} />
            {!sidebarCollapsed && <span>Reports</span>}
          </a>
          <a href="#" className="nav-item">
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">
              {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="admin-details">
                <span className="admin-name">Admin</span>
                <span className="admin-role">{adminUser?.email || 'Administrator'}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="nav-left">
            <h1>Verification Dashboard</h1>
            <span className="date-display">{new Date().toLocaleDateString()}</span>
          </div>

          <div className="nav-right">
            <button className="icon-btn" onClick={() => fetchStudents()}>
              <RefreshCw size={20} />
            </button>
            <button className="icon-btn">
              <Bell size={20} />
              {stats.pending > 0 && <span className="notification-badge">{stats.pending}</span>}
            </button>
            <div className="user-menu">
              <span className="user-name">{adminUser?.email?.split('@')[0] || 'Admin'}</span>
              <div className="user-avatar">
                {adminUser?.email?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="content-area">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatsCard
              icon={Clock}
              title="Pending Review"
              value={stats.pending}
              color="#f59e0b"
              onClick={() => setFilter('pending')}
              active={filter === 'pending'}
            />
            <StatsCard
              icon={CheckCircle}
              title="Approved"
              value={stats.approved}
              color="#10b981"
              onClick={() => setFilter('approved')}
              active={filter === 'approved'}
            />
            <StatsCard
              icon={XCircle}
              title="Rejected"
              value={stats.rejected}
              color="#ef4444"
              onClick={() => setFilter('rejected')}
              active={filter === 'rejected'}
            />
            <StatsCard
              icon={CreditCard}
              title="Payments Pending"
              value={stats.paymentsPending}
              color="#3b82f6"
              onClick={() => {}}
            />
          </div>

          {/* Search and Filter Bar */}
          <div className="search-filter-bar">
            <div className="search-container">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
                <span className="filter-count">{stats.total}</span>
              </button>
              <button 
                className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
                <span className="filter-count">{stats.pending}</span>
              </button>
              <button 
                className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
                onClick={() => setFilter('approved')}
              >
                Approved
                <span className="filter-count">{stats.approved}</span>
              </button>
              <button 
                className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
                onClick={() => setFilter('rejected')}
              >
                Rejected
                <span className="filter-count">{stats.rejected}</span>
              </button>
            </div>
          </div>

          {/* Split View */}
          <div className="split-view">
            {/* Student List Panel */}
            <div className="student-list-panel">
              <div className="panel-header">
                <h3>Students ({filteredStudents.length})</h3>
                <div className="panel-actions">
                  {filter === 'pending' && filteredStudents.length > 0 && (
                    <button 
                      className="bulk-action-btn"
                      onClick={() => bulkApproveStudents(filteredStudents.map(s => s.id))}
                    >
                      <ThumbsUp size={16} />
                      Approve All
                    </button>
                  )}
                  <button className="export-btn">
                    <Download size={16} />
                    Export
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No students found"
                  description="Try adjusting your filters or search term"
                />
              ) : (
                <div className="student-cards">
                  {filteredStudents.map(student => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      isSelected={selectedStudent?.id === student.id}
                      onClick={() => setSelectedStudent(student)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Student Details Panel */}
            <div className="student-details-panel">
              {selectedStudent ? (
                <StudentDetails
                  student={selectedStudent}
                  onApprove={() => setFeedbackModal({ 
                    show: true, 
                    type: 'approve', 
                    student: selectedStudent 
                  })}
                  onReject={() => setFeedbackModal({ 
                    show: true, 
                    type: 'reject', 
                    student: selectedStudent 
                  })}
                  onVerifyPayment={updatePaymentStatus}
                  onRefresh={fetchStudents}
                  adminUser={adminUser}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No student selected"
                  description="Select a student from the list to review their application"
                  className="no-selection"
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      {feedbackModal.show && (
        <FeedbackModal
          type={feedbackModal.type}
          student={feedbackModal.student}
          onConfirm={(reason) => updateStudentStatus(
            feedbackModal.student.id,
            feedbackModal.type === 'approve' ? 'approved' : 'rejected',
            reason
          )}
          onCancel={() => setFeedbackModal({ show: false, type: '', student: null })}
          processing={processingAction}
        />
      )}
    </div>
  );
};

// ==================== SUB-COMPONENTS ====================

const StatsCard = ({ icon: Icon, title, value, color, onClick, active }) => (
  <div 
    className={`stats-card ${active ? 'active' : ''}`}
    onClick={onClick}
    style={{ '--stats-color': color }}
  >
    <div className="stats-icon" style={{ background: `${color}20`, color }}>
      <Icon size={24} />
    </div>
    <div className="stats-info">
      <span className="stats-value">{value}</span>
      <span className="stats-title">{title}</span>
    </div>
  </div>
);

const StudentCard = ({ student, isSelected, onClick }) => {
  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div 
      className={`student-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="student-card-header">
        <div className="student-avatar">
          {student.full_name?.charAt(0).toUpperCase()}
        </div>
        <div className="student-info">
          <h4>{student.full_name}</h4>
          <span className="student-id">{student.student_number}</span>
        </div>
        <div className={`status-indicator ${student.enrollment_status}`}>
          {getStatusIcon(student.enrollment_status)}
        </div>
      </div>

      <div className="student-card-body">
        <div className="info-row">
          <Mail size={14} />
          <span>{student.email}</span>
        </div>
        <div className="info-row">
          <Phone size={14} />
          <span>{student.phone}</span>
        </div>
        <div className="info-row">
          <GraduationCap size={14} />
          <span>{student.grade_level}</span>
        </div>
      </div>

      <div className="student-card-footer">
        <div className="payment-summary">
          {student.payments?.length > 0 ? (
            <div className={`payment-badge ${student.payments[0].status}`}>
              <DollarSign size={12} />
              <span>Payment: {student.payments[0].status}</span>
            </div>
          ) : (
            <span className="no-payment">No payment</span>
          )}
        </div>
        <span className="review-date">
          {new Date(student.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const StudentDetails = ({ student, onApprove, onReject, onVerifyPayment, onRefresh, adminUser }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const handleVerifyPayment = async (paymentId, status) => {
    setVerifyingPayment(true);
    await onVerifyPayment(paymentId, status);
    setVerifyingPayment(false);
  };

  return (
    <div className="details-content">
      <div className="details-header">
        <div className="header-left">
          <h2>Application Review</h2>
          <div className="student-meta">
            <span className="student-id-badge">ID: {student.student_number}</span>
            <span className={`status-badge-large ${student.enrollment_status}`}>
              {student.enrollment_status}
            </span>
          </div>
        </div>
        <div className="header-actions">
          {student.enrollment_status === 'pending' && (
            <>
              <button className="btn btn-success" onClick={onApprove}>
                <ThumbsUp size={16} />
                Approve
              </button>
              <button className="btn btn-danger" onClick={onReject}>
                <ThumbsDown size={16} />
                Reject
              </button>
            </>
          )}
          <button className="btn btn-outline" onClick={onRefresh}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className="details-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          Payment
        </button>
        <button 
          className={`tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          Documents
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="details-grid">
          <InfoCard
            icon={User}
            title="Personal Information"
            items={[
              { label: 'Full Name', value: student.full_name },
              { label: 'Email', value: student.email },
              { label: 'Phone', value: student.phone },
              { label: 'Date of Birth', value: new Date(student.birth_date).toLocaleDateString() },
              { label: 'Gender', value: student.gender }
            ]}
          />

          <InfoCard
            icon={GraduationCap}
            title="Academic Information"
            items={[
              { label: 'Grade Level', value: student.grade_level },
              { label: 'Student Number', value: student.student_number },
              { 
                label: 'Subjects', 
                value: student.subjects,
                type: 'tags'
              }
            ]}
          />
        </div>
      )}

      {activeTab === 'payment' && (
        <div className="payment-section">
          {student.payments?.length > 0 ? (
            student.payments.map(payment => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                onVerify={() => handleVerifyPayment(payment.id, 'verified')}
                onReject={() => handleVerifyPayment(payment.id, 'rejected')}
                verifying={verifyingPayment}
              />
            ))
          ) : (
            <EmptyState
              icon={CreditCard}
              title="No Payment Found"
              description="This student hasn't submitted any payment yet"
            />
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="documents-section">
          {student.payments?.some(p => p.payment_proof_url) ? (
            student.payments.map(payment => (
              payment.payment_proof_url && (
                <DocumentCard
                  key={payment.id}
                  title="Payment Proof"
                  url={payment.payment_proof_url}
                  date={payment.created_at}
                />
              )
            ))
          ) : (
            <EmptyState
              icon={FileText}
              title="No Documents"
              description="No documents have been uploaded"
            />
          )}
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ icon: Icon, title, items }) => (
  <div className="info-card">
    <div className="info-card-header">
      <Icon size={18} />
      <h3>{title}</h3>
    </div>
    <div className="info-card-content">
      {items.map((item, index) => (
        <div key={index} className="info-row">
          <span className="info-label">{item.label}</span>
          {item.type === 'tags' ? (
            <div className="tags-container">
              {item.value?.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          ) : (
            <span className="info-value">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const PaymentCard = ({ payment, onVerify, onReject, verifying }) => {
  const [showProof, setShowProof] = useState(false);

  return (
    <div className="payment-card">
      <div className="payment-card-header">
        <h3>Payment Details</h3>
        <div className={`payment-status-large ${payment.status}`}>
          {payment.status}
        </div>
      </div>

      <div className="payment-card-body">
        <div className="payment-info-grid">
          <div className="payment-info-item">
            <span className="label">Amount</span>
            <span className="value">M {payment.amount?.toLocaleString()}</span>
          </div>
          <div className="payment-info-item">
            <span className="label">Method</span>
            <span className="value">{payment.payment_method}</span>
          </div>
          <div className="payment-info-item">
            <span className="label">Reference</span>
            <span className="value">{payment.payment_number}</span>
          </div>
          <div className="payment-info-item">
            <span className="label">Payer</span>
            <span className="value">{payment.payer_name}</span>
          </div>
          <div className="payment-info-item">
            <span className="label">Date</span>
            <span className="value">{new Date(payment.created_at).toLocaleString()}</span>
          </div>
        </div>

        {payment.payment_proof_url && (
          <div className="payment-proof-section">
            <button 
              className="view-proof-btn"
              onClick={() => setShowProof(!showProof)}
            >
              <Eye size={16} />
              {showProof ? 'Hide Proof' : 'View Proof'}
            </button>
            
            {showProof && (
              <div className="proof-preview">
                <img 
                  src={payment.payment_proof_url} 
                  alt="Payment proof"
                  onClick={() => window.open(payment.payment_proof_url, '_blank')}
                />
                <div className="proof-actions">
                  <a href={payment.payment_proof_url} download>
                    <Download size={16} />
                    Download
                  </a>
                  <a href={payment.payment_proof_url} target="_blank" rel="noopener noreferrer">
                    <Eye size={16} />
                    View Full
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {payment.status === 'pending' && (
          <div className="payment-actions">
            <button 
              className="btn btn-success" 
              onClick={onVerify}
              disabled={verifying}
            >
              {verifying ? <Loader size={16} className="spinning" /> : <CheckCircle size={16} />}
              Verify Payment
            </button>
            <button 
              className="btn btn-danger" 
              onClick={onReject}
              disabled={verifying}
            >
              <XCircle size={16} />
              Reject Payment
            </button>
          </div>
        )}

        {payment.verified_at && (
          <div className="verification-info">
            <small>
              Verified on {new Date(payment.verified_at).toLocaleString()}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

const DocumentCard = ({ title, url, date }) => (
  <div className="document-card">
    <div className="document-icon">
      <FileText size={24} />
    </div>
    <div className="document-info">
      <h4>{title}</h4>
      <span>{new Date(date).toLocaleDateString()}</span>
    </div>
    <div className="document-actions">
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Eye size={16} />
        View
      </a>
      <a href={url} download>
        <Download size={16} />
        Download
      </a>
    </div>
  </div>
);

const EmptyState = ({ icon: Icon, title, description, className = '' }) => (
  <div className={`empty-state ${className}`}>
    <Icon size={48} />
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

const FeedbackModal = ({ type, student, onConfirm, onCancel, processing }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{type === 'approve' ? 'Approve Application' : 'Reject Application'}</h3>
          <button className="close-btn" onClick={onCancel} disabled={processing}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p>
            {type === 'approve' 
              ? `Are you sure you want to approve ${student?.full_name}'s application?`
              : `Please provide a reason for rejecting ${student?.full_name}'s application (optional):`
            }
          </p>

          {type === 'reject' && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              disabled={processing}
              autoFocus
            />
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-outline" 
            onClick={onCancel}
            disabled={processing}
          >
            Cancel
          </button>
          <button 
            className={`btn ${type === 'approve' ? 'btn-success' : 'btn-danger'}`}
            onClick={() => onConfirm(reason)}
            disabled={processing}
          >
            {processing ? (
              <>
                <Loader size={16} className="spinning" />
                Processing...
              </>
            ) : (
              type === 'approve' ? 'Approve' : 'Reject'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminVerification;