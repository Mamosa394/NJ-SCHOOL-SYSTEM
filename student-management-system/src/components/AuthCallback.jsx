// src/components/AuthCallback.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import '../styles/authcallback.css';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing your registration...');

  useEffect(() => {
    handleCallback();
  }, []);

  const getSelectedRole = () => {
    const sessionRole = sessionStorage.getItem('selectedRole');
    const localRole = localStorage.getItem('selectedRole');
    const cookieRole = document.cookie
      .split('; ')
      .find(row => row.startsWith('selectedRole='))
      ?.split('=')[1];
    
    return sessionRole || localRole || cookieRole;
  };

  const handleCallback = async () => {
    try {
      const storedRole = getSelectedRole();
      
      const { data: { session: existingSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (existingSession?.user) {
        if (storedRole && !existingSession.user.user_metadata?.role) {
          existingSession.user.user_metadata = {
            ...existingSession.user.user_metadata,
            role: storedRole
          };
        }
        await processUser(existingSession);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');
      
      if (error) {
        throw new Error(errorDescription || 'Authentication failed');
      }
      
      if (code) {
        setMessage('Exchanging authorization code...');
        
        const authStatePromise = new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            subscription.unsubscribe();
            reject(new Error('Authentication timed out. Please try again.'));
          }, 15000);
          
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (event === 'SIGNED_IN' && newSession?.user) {
                clearTimeout(timeout);
                subscription.unsubscribe();
                
                const currentStoredRole = getSelectedRole();
                if (currentStoredRole && !newSession.user.user_metadata?.role) {
                  newSession.user.user_metadata = {
                    ...newSession.user.user_metadata,
                    role: currentStoredRole
                  };
                }
                resolve(newSession);
              }
            }
          );
        });
        
        try {
          const session = await authStatePromise;
          await processUser(session);
        } catch (timeoutError) {
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          
          if (retrySession?.user) {
            const currentStoredRole = getSelectedRole();
            if (currentStoredRole && !retrySession.user.user_metadata?.role) {
              retrySession.user.user_metadata = {
                ...retrySession.user.user_metadata,
                role: currentStoredRole
              };
            }
            await processUser(retrySession);
          } else {
            throw timeoutError;
          }
        }
        return;
      }
      
      throw new Error('No authentication data found. Please try signing up again.');

    } catch (error) {
      console.error('Auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'An error occurred during authentication');
    }
  };

  const processUser = async (session) => {
    try {
      const user = session.user;
      const storedRole = getSelectedRole();
      const metadataRole = user.user_metadata?.role;
      let role = storedRole || metadataRole || 'student';
      
      const fullName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      [user.user_metadata?.given_name, user.user_metadata?.family_name]
                        .filter(Boolean).join(' ') || 
                      'User';
      
      const email = user.email;
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      const phone = user.user_metadata?.phone || user.phone || '';

      setMessage('Creating your account...');

      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile) {
        sessionStorage.removeItem('selectedRole');
        localStorage.removeItem('selectedRole');
        sessionStorage.removeItem('pendingGoogleSignUp');
        document.cookie = 'selectedRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        const finalRole = existingProfile.role;
        setStatus('success');
        setMessage(`Welcome back! Redirecting to your ${finalRole} dashboard...`);
        
        const routes = {
          admin: '/admindashboard',
          teacher: '/teacherdashboard',
          student: '/studentdashboard',
          parent: '/parentdashboard'
        };
        
        setTimeout(() => {
          navigate(routes[finalRole] || '/studentdashboard', { replace: true });
        }, 1500);
        return;
      }

      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          role: role,
          phone: phone,
          avatar_url: avatarUrl
        }
      });

      const profileData = {
        id: user.id,
        email: email,
        full_name: fullName,
        phone: phone,
        role: role,
        avatar_url: avatarUrl,
        auth_provider: 'google',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' });

      if (profileError) {
        throw new Error('Failed to save profile: ' + profileError.message);
      }

      sessionStorage.removeItem('selectedRole');
      localStorage.removeItem('selectedRole');
      sessionStorage.removeItem('pendingGoogleSignUp');
      document.cookie = 'selectedRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      setStatus('success');
      setMessage(`Account created successfully! Redirecting to your ${role} dashboard...`);

      const routes = {
        admin: '/admindashboard',
        teacher: '/teacherdashboard',
        student: '/studentdashboard',
        parent: '/parentdashboard'
      };

      setTimeout(() => {
        navigate(routes[role] || '/studentdashboard', { replace: true });
      }, 2000);

    } catch (error) {
      console.error('Error processing user:', error);
      setStatus('error');
      setMessage('Failed to create account: ' + error.message);
    }
  };

  return (
    <div className="auth-callback-container">
      <div className="auth-callback-orb auth-callback-orb-1"></div>
      <div className="auth-callback-orb auth-callback-orb-2"></div>
      
      <div className="auth-callback-card">
        {/* Decorative sparkles */}
        <div className="auth-callback-sparkle auth-callback-sparkle-1"></div>
        <div className="auth-callback-sparkle auth-callback-sparkle-2"></div>
        <div className="auth-callback-sparkle auth-callback-sparkle-3"></div>

        {status === 'processing' && (
          <>
            <div className="auth-callback-icon-container">
              <Loader size={48} className="auth-callback-icon-spinner" />
              <div className="auth-callback-icon-pulse processing"></div>
            </div>
            <div className="auth-callback-status processing">
              <span className="auth-callback-status-dot processing"></span>
              Processing
            </div>
            <h2 className="auth-callback-heading">Setting up your account</h2>
            <p className="auth-callback-message">{message}</p>
            <div className="auth-callback-loading-dots">
              <div className="auth-callback-loading-dot"></div>
              <div className="auth-callback-loading-dot"></div>
              <div className="auth-callback-loading-dot"></div>
            </div>
            <div className="auth-callback-progress">
              <div className="auth-callback-progress-bar"></div>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="auth-callback-icon-container">
              <CheckCircle size={48} className="auth-callback-icon-success" />
              <div className="auth-callback-icon-pulse success"></div>
            </div>
            <div className="auth-callback-status success">
              <span className="auth-callback-status-dot success"></span>
              Success
            </div>
            <h2 className="auth-callback-heading success">Success!</h2>
            <p className="auth-callback-message">{message}</p>
            <div className="auth-callback-progress">
              <div className="auth-callback-progress-bar"></div>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-callback-icon-container">
              <AlertCircle size={48} className="auth-callback-icon-error" />
              <div className="auth-callback-icon-pulse error"></div>
            </div>
            <div className="auth-callback-status error">
              <span className="auth-callback-status-dot error"></span>
              Error
            </div>
            <h2 className="auth-callback-heading error">Error</h2>
            <p className="auth-callback-message error">{message}</p>
            <button
              onClick={() => {
                sessionStorage.clear();
                localStorage.clear();
                supabase.auth.signOut();
                navigate('/signup');
              }}
              className="auth-callback-button"
            >
              Back to Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;