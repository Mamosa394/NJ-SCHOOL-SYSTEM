import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Shield,
  UserPlus,
  Key,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { supabase } from './supabaseClient';
import '../styles/login.css';
import Logo from "../assets/Logo.jpg"

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Listen for auth changes (Google OAuth)
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !isLoggingIn && !isRedirecting) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profile?.role) {
            setIsRedirecting(true);
            navigateBasedOnRole(profile.role);
          } else {
            await supabase.auth.signOut();
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        await supabase.auth.signOut();
        localStorage.removeItem('user');
      }
    };

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session && isLoggingIn && !isRedirecting) {
        setIsRedirecting(true);
        await handleSuccessfulAuth(session.user);
      }
      
      if (event === 'SIGNED_OUT') {
        setIsLoggingIn(false);
        setIsRedirecting(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isLoggingIn, isRedirecting, navigate]);

  useEffect(() => {
    return () => {
      if (!isLoggingIn && !isRedirecting) {
        supabase.auth.signOut().catch(console.error);
        localStorage.removeItem('user');
      }
    };
  }, [isLoggingIn, isRedirecting]);

  const navigateBasedOnRole = (role) => {
    const routes = {
      admin: '/admindashboard',
      teacher: '/teacherdashboard',
      student: '/studentdashboard',
      parent: '/parentdashboard'
    };
    
    const redirectPath = routes[role] || '/select-role';
    
    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 100);
  };

  const handleSuccessfulAuth = async (user) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!insertError) {
          navigate('/select-role', { 
            state: { 
              userId: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name || ''
            },
            replace: true 
          });
          return;
        }
      }

      if (profile && profile.role) {
        const userData = {
          id: user.id,
          email: user.email,
          role: profile.role,
          fullName: profile.full_name || user.user_metadata?.full_name || '',
          avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || ''
        };

        localStorage.setItem('user', JSON.stringify(userData));
        navigateBasedOnRole(profile.role);
      } else {
        navigate('/select-role', { 
          state: { 
            userId: user.id,
            email: user.email,
            fullName: profile?.full_name || user.user_metadata?.full_name || ''
          },
          replace: true 
        });
      }
    } catch (error) {
      console.error('Error in successful auth:', error);
      setErrors({ 
        server: 'Error processing authentication. Please try again.' 
      });
      setIsRedirecting(false);
      setIsLoggingIn(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setIsLoggingIn(true);
    setErrors({});
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw error;
      }

      if (data.user) {
        await handleSuccessfulAuth(data.user);
      }
    } catch (error) {
      console.error("Login Error:", error);
      setErrors({ server: error.message });
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || isRedirecting) return;
    
    setLoading(true);
    setIsLoggingIn(true);
    setErrors({});
    
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('user');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/login`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({ server: error.message || 'Failed to login with Google' });
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        
        {/* Left Panel - Brand Info with Gradient Background Image Setup */}
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            
            {/* Top Row: Logo & Escape Trigger */}
            <div className="auth-brand-header-row">
              <div className="auth-logo-section">
                <div className="auth-logo-img">
                  <img src={Logo} alt="Logo" />
                </div>
                <div className="auth-brand-text">
                  <h1>NJEC</h1>
                  <span>New Jerusalem Extra Classes</span>
                </div>
              </div>
              
              <button onClick={() => navigate('/')} className="auth-back-btn">
                ← Back to Home
              </button>
            </div>
            
            {/* Lower Area: Your Text/Components Overlaying Image */}
            <div className="auth-brand-body">
              <div className="auth-testimonial-compact">
                <div className="auth-quote-icon">"</div>
                <p className="auth-testimonial-text">
                  Search and find more learning resources in one place now. Just enroll in courses and learn at your own pace.
                </p>
                <div className="auth-testimonial-person">
                  <div className="auth-person-avatar">TT</div>
                  <div className="auth-person-details">
                    <span className="auth-person-name">Thabo TLou</span>
                    <span className="auth-person-role">UI Designer & Student</span>
                  </div>
                </div>
              </div>
              
              <div className="auth-stats-compact">
                <div className="auth-stat-item">
                  <span className="auth-stat-value">500+</span>
                  <span className="auth-stat-desc">Students</span>
                </div>
                <div className="auth-stat-divider"></div>
                <div className="auth-stat-item">
                  <span className="auth-stat-value">98%</span>
                  <span className="auth-stat-desc">Satisfaction</span>
                </div>
                <div className="auth-stat-divider"></div>
                <div className="auth-stat-item">
                  <span className="auth-stat-value">15+</span>
                  <span className="auth-stat-desc">Subjects</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="auth-form-panel">
          <div className="auth-form-content">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Please enter your account details</p>
            </div>

            {errors.server && (
              <div className="auth-error-alert">
                <AlertCircle size={16} />
                <span>{errors.server}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="auth-form">
              {/* Email Field */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  <Mail size={16} />
                  Email
                </label>
                <div className="auth-input-field">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="thabo@gmail.com"
                    className={`auth-input ${errors.email ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                  {formData.email && !errors.email && (
                    <CheckCircle size={16} className="auth-input-check" />
                  )}
                </div>
                {errors.email && (
                  <span className="auth-error-text">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="auth-input-group">
                <label className="auth-input-label">
                  <Lock size={16} />
                  Password
                </label>
                <div className="auth-input-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className={`auth-input ${errors.password ? 'input-error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-password-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="auth-error-text">{errors.password}</span>
                )}
              </div>

              {/* Options Row */}
              <div className="auth-options-row">
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="auth-checkbox-visual"></span>
                  Remember me
                </label>
                
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="auth-forgot-link"
                  disabled={loading}
                >
                  <Key size={14} />
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <div className="auth-btn-spinner"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="auth-separator">
                <span>Or continue with</span>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="auth-google-btn"
                disabled={loading || isRedirecting}
              >
                <FcGoogle size={18} />
                Google
              </button>

              {/* Register Link */}
              <div className="auth-register-prompt">
                <UserPlus size={16} />
                <span>New registration?</span>
                <Link to="/signup" className="auth-register-link">
                  Create an account
                </Link>
              </div>
            </form>

            <div className="auth-security-badge">
              <Shield size={16} />
              <span>Your data is securely protected</span>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="auth-overlay-loading">
          <div className="auth-loading-box">
            <div className="auth-loading-animation"></div>
            <p>Signing you in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;