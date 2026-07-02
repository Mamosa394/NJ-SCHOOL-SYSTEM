import React, { useState, useEffect } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  Shield, UserPlus, Mail, Send, Copy, Check, 
  Trash2, AlertCircle, RefreshCw, XCircle,
  ShieldOff, Crown, UserCog
} from 'lucide-react';

const AdminManageAdmins = ({ currentAdmin }) => {
  const [admins, setAdmins] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [adminLevel, setAdminLevel] = useState('admin');
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAdmins();
    fetchInvitations();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data } = await supabase.rpc('get_all_admins');
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
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
    if (!email) return;
    
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

      const result = data[0] || data;

      if (result.success) {
        setGeneratedCode(result.invitation_code);
        setSuccess(`Invitation created for ${email}`);
        setEmail('');
        fetchInvitations();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setGenerating(false);
    }
  };

  const deactivateAdmin = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this admin?')) return;
    
    try {
      const { data, error } = await supabase
        .rpc('deactivate_admin', { target_user_id: userId });

      const result = data[0] || data;

      if (result.success) {
        setSuccess(result.message);
        fetchAdmins();
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'super_admin': return { icon: Crown, class: 'level-super', label: 'Super Admin' };
      case 'admin': return { icon: Shield, class: 'level-admin', label: 'Admin' };
      case 'moderator': return { icon: UserCog, class: 'level-mod', label: 'Moderator' };
      default: return { icon: Shield, class: '', label: level };
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h2><Shield size={22} /> Manage Administrators</h2>
          <p>Create and manage admin accounts</p>
        </div>
      </div>

      {/* Messages */}
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

      {/* Generate Invitation */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><UserPlus size={18} /> Invite New Admin</h3>
        </div>
        <div className="adm-invite-form">
          <div className="adm-invite-row">
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
              disabled={generating || currentAdmin?.admin_level !== 'super_admin'}
            >
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              {currentAdmin?.admin_level === 'super_admin' && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
            <button
              onClick={generateInvitation}
              disabled={generating || !email}
              className="adm-btn adm-btn-primary"
            >
              {generating ? 'Generating...' : <><Send size={16} /> Generate Code</>}
            </button>
          </div>

          {generatedCode && (
            <div className="adm-generated-code">
              <div className="adm-code-display">
                <code>{generatedCode}</code>
                <button onClick={() => copyCode(generatedCode)} className="adm-btn-icon">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <p className="adm-code-note">
                Share this code with the recipient. It expires in 48 hours.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Admins */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><Shield size={18} /> Current Admins ({admins.length})</h3>
          <button onClick={fetchAdmins} className="adm-btn-icon">
            <RefreshCw size={16} />
          </button>
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
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map(admin => {
                const level = getLevelBadge(admin.admin_level);
                return (
                  <tr key={admin.user_id}>
                    <td>
                      <div className="adm-user-cell">
                        <div className="adm-avatar-sm">{admin.full_name?.charAt(0)}</div>
                        <span>{admin.full_name}</span>
                      </div>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={`adm-level-badge ${level.class}`}>
                        <level.icon size={14} />
                        {level.label}
                      </span>
                    </td>
                    <td>
                      <span className={`adm-status-pill ${admin.is_active ? 'approved' : 'rejected'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{admin.last_login ? new Date(admin.last_login).toLocaleDateString() : 'Never'}</td>
                    <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                    <td>
                      {admin.user_id !== currentAdmin?.user_id && currentAdmin?.admin_level === 'super_admin' && (
                        <button
                          onClick={() => deactivateAdmin(admin.user_id)}
                          className="adm-btn-sm adm-btn-danger"
                          disabled={admin.admin_level === 'super_admin'}
                        >
                          <ShieldOff size={14} /> Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><Mail size={18} /> Pending Invitations ({invitations.filter(i => !i.is_used).length})</h3>
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
                  <td><code>{inv.invitation_code.substring(0, 16)}...</code></td>
                  <td>{inv.admin_level}</td>
                  <td>{new Date(inv.expires_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`adm-status-pill ${inv.is_used ? 'approved' : 'pending'}`}>
                      {inv.is_used ? 'Used' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
              {invitations.length === 0 && (
                <tr><td colSpan="5" className="adm-empty">No invitations</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminManageAdmins;