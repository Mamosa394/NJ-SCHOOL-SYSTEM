import React, { useState, useEffect } from 'react';
import { supabase } from '../../components/supabaseClient';
import { useNavigate } from 'react-router-dom';
import '../../styles/adminStyles/admindashboard.css';
import Logo from '../../assets/Logo.jpg';
import { 
  LayoutDashboard, Users, GraduationCap, CreditCard, 
  CalendarCheck, Bell, Settings, LogOut, Menu, X,
  Search, Plus, Download, Filter, Edit, Trash2, Eye,
  School, UserCheck, BookOpen, TrendingUp, DollarSign,
  ChevronRight, ChevronLeft, RefreshCw, MoreVertical,
  CheckCircle, XCircle, Clock, AlertCircle, FileText,
  BarChart3, PieChart, Activity, Shield, UserCog,
  Mail, Phone, MapPin, Calendar, ArrowUp, ArrowDown,
  ClipboardList, Star, Zap, Crown, ShieldOff, UserPlus,
  Lock, Unlock, Key
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Admin info
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Data states
  const [registrations, setRegistrations] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingRegistrations: 0,
    monthlyRevenue: 0,
    attendanceRate: 0,
    collectionRate: 0
  });

  // Modal states
  const [selectedReg, setSelectedReg] = useState(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLevel, setInviteLevel] = useState('admin');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAdminAccess();
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (currentAdmin) {
      fetchDashboardData();
      if (isSuperAdmin) {
        fetchAdmins();
        fetchInvitations();
      }
    }
  }, [currentAdmin, isSuperAdmin]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Check admin_accounts table (new system)
      const { data: adminData, error: adminError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminData && adminData.is_active) {
        setCurrentAdmin(adminData);
        setIsSuperAdmin(adminData.admin_level === 'super_admin');
        
        // Store in localStorage
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          role: 'admin',
          adminLevel: adminData.admin_level,
          fullName: adminData.full_name
        }));
        return;
      }

      // Fallback: Check profiles table (old system)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setCurrentAdmin({ full_name: 'Administrator', admin_level: 'admin' });
        setIsSuperAdmin(false);
        return;
      }

      // Not an admin
      navigate('/login');
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: regs } = await supabase
        .from('student_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      setRegistrations(regs || []);

      if (regs) {
        const approved = regs.filter(r => r.registration_status === 'approved');
        const pending = regs.filter(r => r.registration_status === 'pending');
        
        setStats(prev => ({
          ...prev,
          totalStudents: approved.length,
          pendingRegistrations: pending.length,
          monthlyRevenue: approved.reduce((sum, r) => sum + (r.total_amount || 0), 0),
          collectionRate: regs.length > 0 
            ? Math.round((approved.length / regs.length) * 100)
            : 0
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    if (!isSuperAdmin) return;
    try {
      const { data } = await supabase.rpc('get_all_admins');
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const fetchInvitations = async () => {
    if (!isSuperAdmin) return;
    try {
      const { data } = await supabase
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const generateInvitation = async () => {
    if (!inviteEmail || !isSuperAdmin) return;
    
    try {
      const { data, error } = await supabase
        .rpc('create_admin_invitation', {
          admin_email: inviteEmail,
          admin_level: inviteLevel
        });

      if (error) throw error;

      const result = data[0] || data;
      if (result.success) {
        setGeneratedCode(result.invitation_code);
        setInviteEmail('');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error generating invitation:', error);
    }
  };

  const deactivateAdmin = async (userId) => {
    if (!isSuperAdmin || !confirm('Deactivate this admin?')) return;
    
    try {
      const { error } = await supabase
        .rpc('deactivate_admin', { target_user_id: userId });
      
      if (error) throw error;
      fetchAdmins();
    } catch (error) {
      console.error('Error deactivating admin:', error);
    }
  };

  const handleApprove = async (id) => {
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'approved',
          admin_notes: adminNotes,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      setShowRegModal(false);
      setAdminNotes('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      const { error } = await supabase
        .from('student_registrations')
        .update({
          registration_status: 'rejected',
          admin_notes: adminNotes
        })
        .eq('id', id);

      if (error) throw error;
      setShowRegModal(false);
      setAdminNotes('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('user');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build navigation items based on admin level
  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList, badge: stats.pendingRegistrations },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'teachers', label: 'Teachers', icon: UserCog },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'events', label: 'Events', icon: Calendar },
    ...(isSuperAdmin ? [
      { id: 'admins', label: 'Manage Admins', icon: Shield },
    ] : []),
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // ============ RENDER OVERVIEW ============
  const renderOverview = () => (
    <div className="adm-overview">
      {/* Welcome Card */}
      <div className="adm-welcome-card">
        <div className="adm-welcome-content">
          <div className="adm-welcome-text">
            <span className="adm-greeting">
              {isSuperAdmin ? (
                <><Crown size={16} className="adm-crown-icon" /> Super Admin</>
              ) : (
                <><Shield size={16} /> Admin</>
              )}
            </span>
            <h2>Welcome back, {currentAdmin?.full_name?.split(' ')[0] || 'Admin'}!</h2>
            <p>Here's your school management overview</p>
          </div>
        </div>
        <div className="adm-welcome-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Row */}
      <div className="adm-stats-row">
        <div className="adm-stat-card">
          <div className="adm-stat-icon-wrap" style={{ background: 'rgba(40, 53, 147, 0.1)', color: '#283593' }}>
            <GraduationCap size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.totalStudents}</span>
            <span className="adm-stat-label">Total Students</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 12%</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon-wrap" style={{ background: 'rgba(0, 184, 148, 0.1)', color: '#00b894' }}>
            <DollarSign size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">M{stats.monthlyRevenue.toLocaleString()}</span>
            <span className="adm-stat-label">Monthly Revenue</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 8%</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon-wrap" style={{ background: 'rgba(243, 156, 18, 0.1)', color: '#f39c12' }}>
            <ClipboardList size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.pendingRegistrations}</span>
            <span className="adm-stat-label">Pending Approvals</span>
          </div>
          <div className="adm-stat-trend"><Clock size={14} /> Review</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon-wrap" style={{ background: 'rgba(108, 92, 231, 0.1)', color: '#6c5ce7' }}>
            <Activity size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.collectionRate}%</span>
            <span className="adm-stat-label">Collection Rate</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 5%</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="adm-main-grid">
        {/* Recent Registrations */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3><ClipboardList size={18} /> Recent Registrations</h3>
            <button onClick={() => setActiveTab('registrations')} className="adm-link-btn">
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="adm-reg-list">
            {registrations.slice(0, 5).map(reg => (
              <div key={reg.id} className="adm-reg-item" onClick={() => { setSelectedReg(reg); setShowRegModal(true); }}>
                <div className="adm-reg-avatar">{reg.full_name?.charAt(0) || 'S'}</div>
                <div className="adm-reg-info">
                  <span className="adm-reg-name">{reg.full_name}</span>
                  <span className="adm-reg-number">{reg.student_number}</span>
                </div>
                <span className={`adm-status-pill ${reg.registration_status}`}>
                  {reg.registration_status === 'pending' && <Clock size={12} />}
                  {reg.registration_status === 'approved' && <CheckCircle size={12} />}
                  {reg.registration_status === 'rejected' && <XCircle size={12} />}
                  {reg.registration_status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3><Zap size={18} /> Quick Actions</h3>
          </div>
          <div className="adm-actions-grid">
            <button className="adm-action-btn" onClick={() => setActiveTab('registrations')}>
              <ClipboardList size={20} />
              <span>Review Registrations</span>
            </button>
            {isSuperAdmin && (
              <button className="adm-action-btn" onClick={() => setShowInviteModal(true)}>
                <UserPlus size={20} />
                <span>Invite Admin</span>
              </button>
            )}
            <button className="adm-action-btn">
              <UserCheck size={20} />
              <span>Add Student</span>
            </button>
            <button className="adm-action-btn">
              <Calendar size={20} />
              <span>Create Event</span>
            </button>
            <button className="adm-action-btn">
              <FileText size={20} />
              <span>Generate Report</span>
            </button>
            <button className="adm-action-btn">
              <DollarSign size={20} />
              <span>Record Payment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ============ RENDER MANAGE ADMINS (Super Admin Only) ============
  const renderManageAdmins = () => {
    if (!isSuperAdmin) {
      return (
        <div className="adm-page">
          <div className="adm-card">
            <div className="adm-empty-lg">
              <Lock size={48} />
              <h3>Access Denied</h3>
              <p>Only Super Admins can manage other administrators.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="adm-page">
        <div className="adm-page-header">
          <div>
            <h2><Shield size={22} /> Manage Administrators</h2>
            <p>Invite and manage admin accounts</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} className="adm-btn-primary">
            <UserPlus size={16} /> Invite Admin
          </button>
        </div>

        {/* Current Admins */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3><Users size={18} /> Current Admins ({admins.length})</h3>
            <button onClick={fetchAdmins} className="adm-btn-icon"><RefreshCw size={16} /></button>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.user_id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-avatar-sm" style={{
                          background: admin.admin_level === 'super_admin' ? 'rgba(255,215,0,0.2)' : 'rgba(40,53,147,0.1)',
                          color: admin.admin_level === 'super_admin' ? '#b8860b' : '#283593'
                        }}>
                          {admin.admin_level === 'super_admin' ? <Crown size={14} /> : admin.full_name?.charAt(0)}
                        </div>
                        <span>{admin.full_name}</span>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`adm-level-badge ${admin.admin_level}`}>
                        {admin.admin_level === 'super_admin' && <Crown size={12} />}
                        {admin.admin_level === 'admin' && <Shield size={12} />}
                        {admin.admin_level === 'moderator' && <UserCog size={12} />}
                        {admin.admin_level}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-status-pill ${admin.is_active ? 'approved' : 'rejected'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>
                      {admin.user_id !== currentAdmin?.user_id && admin.admin_level !== 'super_admin' && (
                        <button onClick={() => deactivateAdmin(admin.user_id)} className="adm-btn-sm adm-btn-danger">
                          <ShieldOff size={14} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="adm-card">
          <div className="adm-card-header">
            <h3><Mail size={18} /> Pending Invitations</h3>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Level</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td><code>{inv.invitation_code?.substring(0, 16)}...</code></td>
                    <td>{inv.admin_level}</td>
                    <td>{new Date(inv.expires_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`adm-status-pill ${inv.is_used ? 'approved' : 'pending'}`}>
                        {inv.is_used ? 'Used' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ============ INVITE ADMIN MODAL ============
  const renderInviteModal = () => (
    <div className="adm-modal-overlay" onClick={() => { setShowInviteModal(false); setGeneratedCode(null); }}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2><UserPlus size={20} /> Invite New Admin</h2>
          <button onClick={() => { setShowInviteModal(false); setGeneratedCode(null); }}>
            <X size={20} />
          </button>
        </div>
        <div className="adm-modal-body">
          <div className="adm-invite-form">
            <div className="adm-field">
              <label>Email Address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@example.com"
                className="adm-input"
              />
            </div>
            <div className="adm-field">
              <label>Admin Level</label>
              <select
                value={inviteLevel}
                onChange={(e) => setInviteLevel(e.target.value)}
                className="adm-select"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            
            {generatedCode ? (
              <div className="adm-generated-code">
                <div className="adm-code-display">
                  <code>{generatedCode}</code>
                  <button onClick={() => copyCode(generatedCode)} className="adm-btn-icon">
                    {copied ? <CheckCircle size={16} /> : <ClipboardList size={16} />}
                  </button>
                </div>
                <p className="adm-code-note">Share this code with the recipient. Expires in 48 hours.</p>
              </div>
            ) : (
              <button onClick={generateInvitation} disabled={!inviteEmail} className="adm-btn-primary adm-btn-full">
                <Key size={16} /> Generate Invitation Code
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ============ REGISTRATION MODAL (same as before) ============
  const renderRegModal = () => (
    <div className="adm-modal-overlay" onClick={() => setShowRegModal(false)}>
      <div className="adm-modal" onClick={e => e.stopPropagation()}>
        <div className="adm-modal-header">
          <h2>Registration Details</h2>
          <button onClick={() => setShowRegModal(false)} className="adm-close-btn">
            <X size={20} />
          </button>
        </div>

        {selectedReg && (
          <div className="adm-modal-body">
            <div className="adm-detail-grid">
              <div className="adm-detail-item"><label>Full Name</label><span>{selectedReg.full_name}</span></div>
              <div className="adm-detail-item"><label>Student Number</label><code>{selectedReg.student_number}</code></div>
              <div className="adm-detail-item"><label>Email</label><span>{selectedReg.email}</span></div>
              <div className="adm-detail-item"><label>Phone</label><span>{selectedReg.phone}</span></div>
              <div className="adm-detail-item"><label>Gender</label><span>{selectedReg.gender}</span></div>
              <div className="adm-detail-item"><label>Class Type</label><span>{selectedReg.class_type}</span></div>
              <div className="adm-detail-item"><label>Payment Method</label><span>{selectedReg.payment_method}</span></div>
              <div className="adm-detail-item"><label>Total Amount</label><strong>M{selectedReg.total_amount?.toLocaleString()}</strong></div>
              <div className="adm-detail-item"><label>Status</label>
                <span className={`adm-status-pill ${selectedReg.registration_status}`}>{selectedReg.registration_status}</span>
              </div>
            </div>

            {selectedReg.payment_screenshot_url && (
              <div className="adm-screenshot-section">
                <h4>Payment Proof</h4>
                <img src={selectedReg.payment_screenshot_url} alt="Payment proof" />
              </div>
            )}

            <div className="adm-notes-section">
              <label>Admin Notes</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes..." rows={3} />
            </div>
          </div>
        )}

        {selectedReg?.registration_status === 'pending' && (
          <div className="adm-modal-actions">
            <button onClick={() => handleReject(selectedReg.id)} className="adm-btn-danger">
              <XCircle size={18} /> Reject
            </button>
            <button onClick={() => handleApprove(selectedReg.id)} className="adm-btn-success">
              <CheckCircle size={18} /> Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ============ REGISTRATIONS VIEW ============
  const renderRegistrations = () => (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2>Student Registrations</h2>
          <p>Review and manage student registration requests</p>
        </div>
        <button onClick={fetchDashboardData} className="adm-btn-outline">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="adm-card">
        <div className="adm-filter-bar">
          <div className="adm-filter-btns">
            {['all', 'pending', 'approved', 'rejected'].map(f => (
              <button key={f} className={`adm-filter-btn ${f === 'all' ? 'active' : ''}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <div className="adm-search-box">
            <Search size={16} />
            <input type="text" placeholder="Search registrations..." />
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th><th>Student No.</th><th>Contact</th>
                <th>Subjects</th><th>Amount</th><th>Date</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg.id}>
                  <td><div className="adm-user-cell"><div className="adm-user-avatar-sm">{reg.full_name?.charAt(0)}</div><span>{reg.full_name}</span></div></td>
                  <td><code>{reg.student_number}</code></td>
                  <td><div className="adm-contact-cell"><small>{reg.email}</small><small>{reg.phone}</small></div></td>
                  <td>{Array.isArray(reg.subjects) ? reg.subjects.length : 0}</td>
                  <td><strong>M{reg.total_amount?.toLocaleString()}</strong></td>
                  <td>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                  <td><span className={`adm-status-pill ${reg.registration_status}`}>{reg.registration_status}</span></td>
                  <td><button className="adm-btn-sm" onClick={() => { setSelectedReg(reg); setShowRegModal(true); }}><Eye size={14} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
const renderPlaceholder = (title, icon) => (
  <div className="adm-page">
    <div className="adm-page-header">
      <h2>{title}</h2>
    </div>
    <div className="adm-card">
      <div className="adm-empty-lg">
        {icon}
        <h3>{title}</h3>
        <p>This section is under development</p>
      </div>
    </div>
  </div>
);

 const renderTabContent = () => {
  switch (activeTab) {
    case 'overview': return renderOverview();
    case 'registrations': return renderRegistrations();
    case 'admins': return renderManageAdmins();
    case 'students': return renderPlaceholder('Student Management', <GraduationCap size={48} />);
    case 'teachers': return renderPlaceholder('Teacher Management', <UserCog size={48} />);
    case 'payments': return renderPlaceholder('Payment Management', <DollarSign size={48} />);
    case 'events': return renderPlaceholder('Events', <Calendar size={48} />);
    case 'reports': return renderPlaceholder('Reports', <BarChart3 size={48} />);
    case 'settings': return renderPlaceholder('Settings', <Settings size={48} />);
    default: return null;
  }
};

  return (
    <div className="adm-app">
      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <img src={Logo} alt="NJEC" className="adm-brand-logo" />
          {sidebarOpen && (
            <div className="adm-brand-text">
              <h2>NJEC Admin</h2>
              <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
            </div>
          )}
          <button className="adm-sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="adm-sidebar-user">
          <div className="adm-user-avatar" style={{
            background: isSuperAdmin ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #283593, #1a237e)'
          }}>
            {isSuperAdmin ? <Crown size={18} /> : <Shield size={18} />}
          </div>
          {sidebarOpen && (
            <div className="adm-user-info">
              <h4>{currentAdmin?.full_name || 'Admin'}</h4>
              <span className={isSuperAdmin ? 'super-admin-badge' : ''}>
                {isSuperAdmin ? 'Super Admin' : 'Administrator'}
              </span>
            </div>
          )}
        </div>

        <nav className="adm-sidebar-nav">
          <span className="adm-nav-section">MAIN MENU</span>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`adm-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.id); if (isMobile) setSidebarOpen(false); }}
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge > 0 && sidebarOpen && <span className="adm-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="adm-sidebar-footer">
            <button onClick={handleLogout} className="adm-logout-btn">
              <LogOut size={18} /><span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>

      {isMobile && sidebarOpen && <div className="adm-overlay" onClick={() => setSidebarOpen(false)}></div>}

      <main className={`adm-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            {!sidebarOpen && <button className="adm-menu-btn" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>}
            <div className="adm-search-global">
              <Search size={16} />
              <input type="text" placeholder="Search anything..." />
            </div>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-notif-btn">
              <Bell size={18} />
              {stats.pendingRegistrations > 0 && <span className="adm-notif-dot">{stats.pendingRegistrations}</span>}
            </button>
            <div className="adm-topbar-user">
              <div className="adm-topbar-avatar" style={{
                background: isSuperAdmin ? 'linear-gradient(135deg, #f39c12, #e67e22)' : 'linear-gradient(135deg, #283593, #1a237e)'
              }}>
                {isSuperAdmin ? <Crown size={14} /> : <Shield size={14} />}
              </div>
              <span>{currentAdmin?.full_name || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="adm-content">{renderTabContent()}</div>
      </main>

      {showRegModal && renderRegModal()}
      {showInviteModal && renderInviteModal()}
    </div>
  );
};

export default AdminDashboard;