// AdminManageAdmins.jsx - Complete with Activation Link
import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../components/supabaseClient';
import { 
  Shield, UserPlus, Mail, Copy, Check, 
  AlertCircle, RefreshCw, XCircle,
  ShieldOff, Crown, UserCog, Eye, Search,
  Key, Download, Printer, ArrowLeft,
  History, Activity
} from 'lucide-react';
import '../../styles/adminStyles/adminManageAdmins.css';

const AdminManageAdmins = () => {
  const { currentAdmin, isSuperAdmin } = useOutletContext();
  
  console.log('🔑 AdminManageAdmins - isSuperAdmin:', isSuperAdmin);
  console.log('🔑 AdminManageAdmins - currentAdmin:', currentAdmin);

  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adminLevel, setAdminLevel] = useState('admin');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [processing, setProcessing] = useState(false);
  const printRef = useRef(null);

  const activationLink = `${window.location.origin}/admin/activate`;

  useEffect(() => {
    console.log('🔄 AdminManageAdmins mounted, isSuperAdmin:', isSuperAdmin);
    if (isSuperAdmin) {
      fetchAllData();
    }
  }, [isSuperAdmin]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      console.log('📋 Fetching admin data...');
      await Promise.all([
        fetchAdmins(),
        fetchInvitations(),
        fetchActivityLog()
      ]);
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase.rpc('get_all_admins');
      if (error) {
        console.error('❌ Error fetching admins:', error);
      } else {
        console.log('✅ Admins fetched:', data?.length || 0);
        setAdmins(data || []);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching invitations:', error);
      } else {
        console.log('✅ Invitations fetched:', data?.length || 0);
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Error fetching activity log:', error);
      } else {
        console.log('✅ Activity log fetched:', data?.length || 0);
        setActivityLog(data || []);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const generateInvitation = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccess(null);
    setGeneratedCode(null);

    try {
      const { data, error: rpcError } = await supabase
        .rpc('create_admin_invitation', {
          admin_email: email,
          admin_level: adminLevel
        });

      if (rpcError) throw rpcError;

      const result = data?.[0] || data;

      if (result.success) {
        setGeneratedCode(result.invitation_code);
        setSuccess(`Invitation created for ${email}`);
        setEmail('');
        fetchInvitations();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('❌ Error generating invitation:', error);
      setError(error.message || 'Failed to generate invitation');
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyActivationLink = () => {
    navigator.clipboard.writeText(activationLink);
    setSuccess('Activation link copied to clipboard!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const revokeInvitation = async (invitationId) => {
    if (!confirm('Revoke this invitation?')) return;
    console.log('🗑️ Revoking invitation:', invitationId);

    try {
      const { error } = await supabase
        .from('admin_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      console.log('✅ Invitation revoked');
      setSuccess('Invitation revoked successfully');
      fetchInvitations();
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed to revoke invitation');
    }
  };

  const handleDeactivateAdmin = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this admin? They will lose all access.')) return;
    setProcessing(true);
    console.log('🔒 Deactivating admin:', userId);

    try {
      const { data, error } = await supabase
        .rpc('deactivate_admin', { target_user_id: userId });

      const result = data?.[0] || data;

      if (result.success) {
        setSuccess(result.message);
        fetchAdmins();
        fetchActivityLog();
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message || 'Failed to deactivate admin');
    } finally {
      setProcessing(false);
    }
  };

  const handleReactivateAdmin = async (userId) => {
    if (!confirm('Reactivate this admin?')) return;
    setProcessing(true);
    console.log('🔓 Reactivating admin:', userId);

    try {
      const { error } = await supabase
        .from('admin_accounts')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Admin reactivated');
      setSuccess('Admin reactivated successfully');
      fetchAdmins();
      fetchActivityLog();
    } catch (error) {
      console.error('❌ Error:', error);
      setError('Failed to reactivate admin');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
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
  <title>Admin Details - ${selectedAdmin?.full_name || 'Admin'}</title>
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
    .status-active { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: #ecfdf5; color: #047857; }
    .status-inactive { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; background: #fef2f2; color: #b91c1c; }
    .footer { margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0; font-size: 0.78rem; color: #94a3b8; text-align: center; }
    @media print { body { padding: 0.5rem; } @page { margin: 1.5cm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">NJEC - New Jerusalem Extra Classes</div>
    <div class="subtitle">Administrator Details Report</div>
    <div class="subtitle">Generated: ${new Date().toLocaleString()}</div>
  </div>
  <div class="section-title">Admin Information</div>
  <table>
    <tbody>
      <tr><th>Full Name</th><td>${selectedAdmin?.full_name || 'N/A'}</td></tr>
      <tr><th>Email</th><td>${selectedAdmin?.email || 'N/A'}</td></tr>
      <tr><th>Admin Level</th><td>${selectedAdmin?.admin_level || 'N/A'}</td></tr>
      <tr><th>Status</th><td><span class="${selectedAdmin?.is_active ? 'status-active' : 'status-inactive'}">${selectedAdmin?.is_active ? 'Active' : 'Inactive'}</span></td></tr>
      <tr><th>Last Login</th><td>${selectedAdmin?.last_login ? new Date(selectedAdmin.last_login).toLocaleString() : 'Never'}</td></tr>
      <tr><th>Created</th><td>${selectedAdmin?.created_at ? new Date(selectedAdmin.created_at).toLocaleString() : 'N/A'}</td></tr>
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

  const filteredAdmins = admins.filter(admin => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (admin.full_name || '')?.toLowerCase().includes(s) ||
      (admin.email || '')?.toLowerCase().includes(s) ||
      (admin.admin_level || '')?.toLowerCase().includes(s)
    );
  });

  const getLevelBadge = (level) => {
    switch (level) {
      case 'super_admin': return { icon: Crown, class: 'adm-badge-super', label: 'Super Admin' };
      case 'admin': return { icon: Shield, class: 'adm-badge-admin', label: 'Admin' };
      case 'moderator': return { icon: UserCog, class: 'adm-badge-mod', label: 'Moderator' };
      default: return { icon: Shield, class: '', label: level };
    }
  };

  const activeInvitations = invitations.filter(i => !i.is_used);
  const usedInvitations = invitations.filter(i => i.is_used);

  if (!isSuperAdmin) {
    console.log('🚫 Access denied - isSuperAdmin is:', isSuperAdmin);
    return (
      <div className="adm-page">
        <div className="adm-card">
          <div className="adm-empty-lg">
            <Shield size={48} />
            <h3>Access Restricted</h3>
            <p>Only Super Admins can manage administrators.</p>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
              Your admin level: {currentAdmin?.admin_level || 'unknown'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  console.log('✅ Rendering full admin management page');

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2><Shield size={22} /> Manage Administrators</h2>
          <p>Create invitations, manage admins, and view activity logs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchAllData} className="adm-btn-outline">
            <RefreshCw size={16} /> Refresh
          </button>
          <button onClick={() => setShowHistory(true)} className="adm-btn-outline">
            <History size={16} /> Activity Log
          </button>
        </div>
      </div>

      {error && (
        <div className="adm-alert adm-alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><XCircle size={14} /></button>
        </div>
      )}
      {success && (
        <div className="adm-alert adm-alert-success">
          <Check size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><XCircle size={14} /></button>
        </div>
      )}

      {/* Invitation Card */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><UserPlus size={18} /> Invite New Administrator</h3>
        </div>
        <div className="adm-card-body">
          <p className="adm-card-desc">
            Generate a secure invitation code for a new administrator. Share the activation link and code with the recipient. They must sign up first, then visit the activation page to enter their email and code.
          </p>
          
          {/* Activation Link Info */}
          <div className="adm-activation-link-box">
            <p className="adm-activation-link-label">
              <Key size={14} /> Admin Activation Page:
            </p>
            <div className="adm-activation-link-row">
              <code className="adm-activation-link-url">
                {activationLink}
              </code>
              <button 
                onClick={copyActivationLink} 
                className="adm-btn-icon"
                title="Copy activation link"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="adm-activation-link-hint">
              Share this link with anyone who needs to activate admin access. They must have an invitation code and an existing account.
            </p>
          </div>

          {/* Invite Form */}
          <div className="adm-invite-row" style={{ marginTop: '1rem' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="adm-input"
              disabled={generating}
            />
            <select
              value={adminLevel}
              onChange={(e) => setAdminLevel(e.target.value)}
              className="adm-select"
              disabled={generating}
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <button
              onClick={generateInvitation}
              disabled={generating || !email}
              className="adm-btn-primary"
            >
              {generating ? (
                'Generating...'
              ) : (
                <><Key size={16} /> Generate Code</>
              )}
            </button>
          </div>

          {/* Generated Code */}
          {generatedCode && (
            <div className="adm-code-box">
              <div className="adm-code-row">
                <code>{generatedCode}</code>
                <button onClick={() => copyCode(generatedCode)} className="adm-btn-icon">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="adm-code-hint">
                Share this code with the recipient. They need to use this code on the activation page. Expires in 48 hours.
              </p>
              
              {/* Instructions for recipient */}
              <div className="adm-activation-instructions">
                <p className="adm-activation-instructions-title">Instructions for recipient:</p>
                <ol className="adm-activation-steps">
                  <li>Sign up for an account at <strong>{window.location.origin}/signup</strong> (if you don't have one)</li>
                  <li>Visit <strong>{activationLink}</strong></li>
                  <li>Enter your email and the invitation code above</li>
                  <li>Click "Activate Admin Access"</li>
                  <li>Log out and log back in to access your admin dashboard</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Admins */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><Shield size={18} /> Current Administrators ({filteredAdmins.length})</h3>
          <div className="adm-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search admins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="adm-loading">
            <RefreshCw size={24} className="adm-spinner" />
            <p>Loading admins...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="adm-empty">No administrators found</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map(admin => {
                  const level = getLevelBadge(admin.admin_level);
                  const LevelIcon = level.icon;
                  return (
                    <tr key={admin.user_id}>
                      <td>
                        <div className="adm-user-cell">
                          <div className="adm-avatar-sm" style={{
                            background: admin.admin_level === 'super_admin' ? '#fefce8' :
                                       admin.admin_level === 'admin' ? '#eef2ff' : '#f5f3ff',
                            color: admin.admin_level === 'super_admin' ? '#a16207' :
                                  admin.admin_level === 'admin' ? '#283593' : '#6d28d9'
                          }}>
                            {admin.admin_level === 'super_admin' ? <Crown size={14} /> : (admin.full_name || 'A').charAt(0)}
                          </div>
                          <span className="adm-user-name">{admin.full_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td><span className="adm-email">{admin.email}</span></td>
                      <td>
                        <span className={`adm-level-badge ${level.class}`}>
                          <LevelIcon size={12} />
                          {level.label}
                        </span>
                      </td>
                      <td>
                        <span className={`adm-status-pill ${admin.is_active ? 'active' : 'inactive'}`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}</td>
                      <td>{admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            className="adm-btn-sm"
                            onClick={() => handleViewDetails(admin)}
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          {admin.user_id !== currentAdmin?.user_id && (
                            admin.is_active ? (
                              <button
                                onClick={() => handleDeactivateAdmin(admin.user_id)}
                                className="adm-btn-sm adm-btn-danger"
                                disabled={admin.admin_level === 'super_admin' || processing}
                                title="Deactivate"
                              >
                                <ShieldOff size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivateAdmin(admin.user_id)}
                                className="adm-btn-sm adm-btn-success"
                                disabled={processing}
                                title="Reactivate"
                              >
                                <Shield size={14} />
                              </button>
                            )
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

      {/* Pending Invitations */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><Mail size={18} /> Pending Invitations ({activeInvitations.length})</h3>
        </div>
        {activeInvitations.length === 0 ? (
          <div className="adm-empty">No pending invitations</div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Code</th>
                  <th>Level</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeInvitations.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td><code>{inv.invitation_code?.substring(0, 16)}...</code></td>
                    <td>
                      <span className={`adm-level-badge ${getLevelBadge(inv.admin_level).class}`}>
                        {inv.admin_level}
                      </span>
                    </td>
                    <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td>
                      <span style={{ color: new Date(inv.expires_at) < new Date() ? '#ef4444' : '#64748b' }}>
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => revokeInvitation(inv.id)}
                        className="adm-btn-sm adm-btn-danger"
                        title="Revoke"
                      >
                        <XCircle size={14} /> Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Used Invitations */}
      {usedInvitations.length > 0 && (
        <div className="adm-card">
          <div className="adm-card-header">
            <h3><Check size={18} /> Used Invitations ({usedInvitations.length})</h3>
          </div>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Level</th>
                  <th>Used At</th>
                </tr>
              </thead>
              <tbody>
                {usedInvitations.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td>
                      <span className={`adm-level-badge ${getLevelBadge(inv.admin_level).class}`}>
                        {inv.admin_level}
                      </span>
                    </td>
                    <td>{inv.used_at ? new Date(inv.used_at).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Detail Page */}
      {showDetails && selectedAdmin && (
        <div className="adm-detail-page" ref={printRef}>
          <div className="adm-detail-page-header">
            <button onClick={() => setShowDetails(false)} className="adm-back-btn">
              <ArrowLeft size={20} /> Back to List
            </button>
            <div className="adm-detail-page-actions">
              <button onClick={handlePrint} className="adm-btn-outline">
                <Printer size={16} /> Print
              </button>
              <button onClick={handleExportPDF} className="adm-btn-outline">
                <Download size={16} /> Export PDF
              </button>
            </div>
          </div>
          <div className="adm-detail-page-body">
            <div className="adm-detail-page-heading">
              <Shield size={28} />
              <div>
                <h2>Administrator Details</h2>
                <p>{selectedAdmin.full_name} • {selectedAdmin.email}</p>
              </div>
            </div>
            <div className="adm-section">
              <h3 className="adm-section-title">Admin Information</h3>
              <table className="adm-detail-table">
                <tbody>
                  <tr>
                    <td className="adm-detail-label">Full Name</td>
                    <td className="adm-detail-value">{selectedAdmin.full_name || 'N/A'}</td>
                    <td className="adm-detail-label">Email</td>
                    <td className="adm-detail-value">{selectedAdmin.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="adm-detail-label">Admin Level</td>
                    <td className="adm-detail-value">
                      {(() => {
                        const badge = getLevelBadge(selectedAdmin.admin_level);
                        const Icon = badge.icon;
                        return (
                          <span className={`adm-level-badge ${badge.class}`}>
                            <Icon size={12} /> {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="adm-detail-label">Status</td>
                    <td className="adm-detail-value">
                      <span className={`adm-status-pill ${selectedAdmin.is_active ? 'active' : 'inactive'}`}>
                        {selectedAdmin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="adm-detail-label">Last Login</td>
                    <td className="adm-detail-value">
                      {selectedAdmin.last_login ? new Date(selectedAdmin.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="adm-detail-label">Created</td>
                    <td className="adm-detail-value">
                      {selectedAdmin.created_at ? new Date(selectedAdmin.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showHistory && (
        <div className="adm-modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2><History size={20} /> Admin Activity Log</h2>
              <button onClick={() => setShowHistory(false)} className="adm-modal-close">
                <XCircle size={22} />
              </button>
            </div>
            <div className="adm-modal-body">
              {activityLog.length === 0 ? (
                <div className="adm-empty">
                  <Activity size={40} />
                  <h3>No activity recorded</h3>
                  <p>Admin actions will appear here.</p>
                </div>
              ) : (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Details</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.map(log => (
                        <tr key={log.id}>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600, background: '#eef2ff', color: '#283593' }}>
                              {log.action}
                            </span>
                          </td>
                          <td>
                            <small style={{ color: '#64748b' }}>
                              {typeof log.details === 'object' 
                                ? JSON.stringify(log.details) 
                                : log.details || '-'}
                            </small>
                          </td>
                          <td>{log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}</td>
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

export default AdminManageAdmins;