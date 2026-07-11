// AdminActivation.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { Shield, Key, CheckCircle, AlertCircle, Loader, ArrowRight, LogIn } from 'lucide-react';
import Logo from '../assets/Logo.jpg';
import '../styles/adminStyles/adminActivation.css';

const AdminActivation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || '');
        
        // Check if already an admin
        const { data: adminData } = await supabase
          .from('admin_accounts')
          .select('admin_level, is_active')
          .eq('user_id', user.id)
          .single();

        if (adminData?.is_active) {
          setStatus('info');
          setMessage(`You are already an active ${adminData.admin_level}. Redirecting to dashboard...`);
          setTimeout(() => {
            navigate('/admin', { replace: true });
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleActivate = async () => {
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    if (!code.trim()) {
      setStatus('error');
      setMessage('Please enter the invitation code');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setStatus(null);
    setMessage('');

    try {
      console.log('🔑 Activating admin access...');
      console.log('📧 Email:', email);
      console.log('🔐 Code:', code);

      const { data, error } = await supabase
        .rpc('activate_admin_account', {
          input_email: email,
          input_code: code
        });

      console.log('📋 RPC response:', { data, error });

      if (error) {
        console.error('❌ RPC error:', error);
        throw error;
      }

      const result = data?.[0] || data;

      if (result.success) {
        console.log('✅ Admin access activated!');
        setStatus('success');
        setMessage(result.message || 'Admin access activated successfully!');

        // If user is logged in, sign them out so they can log back in with new permissions
        if (user) {
          setTimeout(async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
            navigate('/login', {
              replace: true,
              state: {
                message: 'Admin access activated! Please log in to access your admin dashboard.'
              }
            });
          }, 2500);
        } else {
          setTimeout(() => {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Admin access activated! Please log in to access your admin dashboard.'
              }
            });
          }, 2500);
        }
      } else {
        console.log('❌ Activation failed:', result.message);
        setStatus('error');
        setMessage(result.message || 'Failed to activate admin access');
      }
    } catch (error) {
      console.error('❌ Activation error:', error);
      setStatus('error');
      setMessage(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleActivate();
    }
  };

  if (checkingAuth) {
    return (
      <div className="act-container">
        <div className="act-loading">
          <Loader size={24} className="act-spinner" />
          <p>Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="act-container">
      <div className="act-wrapper">
        <div className="act-card">
          <div className="act-logo">
            <img src={Logo} alt="NJEC" className="act-logo-img" />
            <div className="act-logo-text">
              <h1>NJEC</h1>
              <span>New Jerusalem Extra Classes</span>
            </div>
          </div>

          <div className="act-icon">
            <Shield size={32} />
          </div>

          <h2 className="act-title">Activate Admin Access</h2>
          <p className="act-subtitle">
            Enter your email address and the invitation code provided by an existing administrator.
          </p>

          {/* Already Admin Info */}
          {status === 'info' && (
            <div className="act-alert act-alert-info">
              <Loader size={18} className="act-spinner" />
              <div>
                <strong>Already an Admin</strong>
                <p>{message}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <div className="act-alert act-alert-success">
              <CheckCircle size={20} />
              <div>
                <strong>Success!</strong>
                <p>{message}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <div className="act-alert act-alert-error">
              <AlertCircle size={20} />
              <div>
                <strong>Activation Failed</strong>
                <p>{message}</p>
              </div>
            </div>
          )}

          {/* Current User Info */}
          {user && (
            <div className="act-user-info">
              <p>
                You are currently logged in as: <strong>{user.email}</strong>
              </p>
              <p className="act-user-note">
                After activation, you will need to log out and log back in.
              </p>
            </div>
          )}

          {!user && (
            <div className="act-user-info">
              <p className="act-user-note">
                You need to have an account first.{' '}
                <a href="/signup" className="act-link">Sign up here</a>
                {' '}if you don't have one, then return to this page.
              </p>
            </div>
          )}

          {/* Form Fields */}
          <div className="act-form">
            <div className="act-field">
              <label className="act-label">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status) setStatus(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="your@email.com"
                disabled={loading || status === 'success'}
                className="act-input"
                autoFocus={!user}
              />
            </div>

            <div className="act-field">
              <label className="act-label">
                <Key size={14} />
                Invitation Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (status) setStatus(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="NJEC-XXXX-XXXX-XXXX"
                disabled={loading || status === 'success'}
                className="act-input act-input-code"
              />
              <p className="act-field-hint">
                Enter the exact code you received, including dashes.
              </p>
            </div>

            <button
              onClick={handleActivate}
              disabled={loading || !email || !code || status === 'success'}
              className="act-btn"
            >
              {loading ? (
                <>
                  <Loader size={18} className="act-spinner" />
                  Activating...
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle size={18} />
                  Redirecting...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Activate Admin Access
                </>
              )}
            </button>
          </div>

          <div className="act-footer">
            <button
              onClick={() => navigate('/login')}
              className="act-footer-btn"
            >
              <LogIn size={14} />
              Go to Login
            </button>
          </div>

          <div className="act-help">
            <h4>How it works:</h4>
            <ol>
              <li>An existing super admin generates an invitation code for your email</li>
              <li>You receive the code via email or message</li>
              <li>Sign up for an account if you don't have one</li>
              <li>Enter your email and the code on this page</li>
              <li>Log out and log back in to access your admin dashboard</li>
            </ol>
            <p className="act-help-note">
              Codes expire after 48 hours. If your code has expired, ask the super admin to generate a new one.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminActivation;