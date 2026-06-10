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
  Users,
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

  // Listen for auth changes (Google OAuth)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session && !isRedirecting) {
        setIsRedirecting(true);
        await handleSuccessfulAuth(session.user);
      }
    });

    // Check for existing session
    checkExistingSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !isRedirecting) {
        setIsRedirecting(true);
        await handleSuccessfulAuth(session.user);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const navigateBasedOnRole = (role) => {
    const routes = {
      admin: '/admin/dashboard',
      teacher: '/teacher/dashboard',
      student: '/student/dashboard',
      parent: '/parent/dashboard'
    };
    
    const redirectPath = routes[role] || '/student/dashboard';
    
    setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 100);
  };

  const handleSuccessfulAuth = async (user) => {
    try {
      // Fetch user profile with role from Supabase
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        // If no profile exists, create a basic one and redirect to role selection
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
        // User has a role - redirect to respective dashboard
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
        // User exists but no role selected yet
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

  // Email/Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
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
    }
  };

  // Google Login
  const handleGoogleLogin = async () => {
    if (loading || isRedirecting) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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
      
      // OAuth redirect will happen automatically
      
    } catch (error) {
      console.error('Google login error:', error);
      setErrors({ server: error.message || 'Failed to login with Google' });
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="njec-login-container">
      {/* Background Elements */}
      <div className="njec-login-bg-shapes">
        <div className="njec-login-shape shape-1"></div>
        <div className="njec-login-shape shape-2"></div>
        <div className="njec-login-shape shape-3"></div>
      </div>

      <div className="njec-login-wrapper">
        {/* Left Side - Login Form */}
        <div className="njec-login-form-section">
          <button 
            onClick={() => navigate('/')}
            className="njec-back-button"
          >
            ← Back to Home
          </button>

          <div className="njec-login-header">
            <div className="njec-login-logo">
              <div className="njec-login-logo-icon">
                <img src={Logo} className="njec-login-logo-icon" alt="Logo"/>
              </div>
              <div className="njec-login-brand">
                <h1>NJEC</h1>
                <span>New Jerusalem Extra Classes</span>
              </div>
            </div>
          </div>

          <div className="njec-form-container">
            <div className="njec-form-header">
              <h2>Welcome back</h2>
              <p>Please enter your account details</p>
            </div>

            {errors.server && (
              <div className="njec-error-banner">
                <AlertCircle size={18} />
                <span>{errors.server}</span>
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="njec-login-form">
              {/* Email Field */}
              <div className="njec-form-group">
                <label htmlFor="email" className="njec-form-label">
                  <Mail size={18} />
                  <span>Email</span>
                </label>
                <div className="njec-input-wrapper">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="thabo@gmail.com"
                    className={`njec-input ${errors.email ? 'error' : ''}`}
                    disabled={loading}
                  />
                  {formData.email && !errors.email && (
                    <CheckCircle size={18} className="njec-input-success" />
                  )}
                </div>
                {errors.email && (
                  <span className="njec-error-message">{errors.email}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="njec-form-group">
                <label htmlFor="password" className="njec-form-label">
                  <Lock size={18} />
                  <span>Password</span>
                </label>
                <div className="njec-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="*********"
                    className={`njec-input ${errors.password ? 'error' : ''}`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="njec-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="njec-error-message">{errors.password}</span>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="njec-form-options">
                <label className="njec-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="njec-checkbox-custom"></span>
                  Remember me
                </label>
                
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="njec-forgot-password"
                  disabled={loading}
                >
                  <Key size={16} />
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="njec-submit-button"
                disabled={loading}
              >
                {loading ? (
                  <div className="njec-spinner"></div>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="njec-divider">
                <span>Or continue with</span>
              </div>

              {/* Social Login Buttons */}
              <div className="njec-social-login">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="njec-social-button google"
                  disabled={loading || isRedirecting}
                >
                  <FcGoogle size={20} />
                  Google
                </button>
              </div>

              {/* Registration Link */}
              <div className="njec-registration-link">
                <UserPlus size={18} />
                <span>New registration?</span>
                <Link to="/signup" className="njec-register-link">
                  Create an account
                </Link>
              </div>
            </form>

            <div className="njec-login-trust">
              <Shield size={20} />
              <span>Your data is securely protected</span>
            </div>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="njec-login-info-section">
          <div className="njec-info-card">
            <div className="njec-quote-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>

            <div className="njec-testimonial">
              <h3>What our Students Say</h3>
              <p className="njec-testimonial-text">
                "Search and find more learning resources in one place now. 
                Just enroll in courses and learn at your own pace."
              </p>
              
              <div className="njec-testimonial-author">
                <div className="njec-author-avatar">TT</div>
                <div className="njec-author-info">
                  <h4>Thabo TLou</h4>
                  <p>UI Designer & Student</p>
                </div>
              </div>
            </div>

            <div className="njec-login-cta">
              <h3>Get your learning journey started</h3>
              <p>
                Apply now to access premium courses, expert tutors, and 
                comprehensive learning materials.
              </p>
              <button 
                onClick={() => navigate('/signup')}
                className="njec-cta-button"
              >
                Start Learning Now (Sign Up)
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="njec-additional-info">
              <p>
                Be on the lookout for new courses and learning opportunities 
                to experience the easiest way to advance your education.
              </p>
              <div className="njec-stats">
                <div className="njec-stat">
                  <span className="njec-stat-number">500+</span>
                  <span className="njec-stat-label">Active Students</span>
                </div>
                <div className="njec-stat">
                  <span className="njec-stat-number">98%</span>
                  <span className="njec-stat-label">Satisfaction Rate</span>
                </div>
                <div className="njec-stat">
                  <span className="njec-stat-number">15+</span>
                  <span className="njec-stat-label">Subjects Available</span>
                </div>
              </div>
            </div>
          </div>

          <div className="njec-info-decoration">
            <div className="njec-decoration-dot dot-1"></div>
            <div className="njec-decoration-dot dot-2"></div>
            <div className="njec-decoration-dot dot-3"></div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="njec-login-loading">
          <div className="njec-loading-content">
            <div className="njec-loading-spinner"></div>
            <p>Signing you in...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;