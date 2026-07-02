// src/components/SignUp.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  AlertCircle,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle,
  BookOpen,
  GraduationCap,
  Users,
  Shield,
  Phone
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/Logo.jpg';
import { supabase } from './supabaseClient';
import '../styles/signup.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState({});

  const roles = [
    {
      id: 'student',
      label: 'Student',
      icon: BookOpen,
      color: '#2563EB'
    },
    {
      id: 'teacher',
      label: 'Teacher',
      icon: GraduationCap,
      color: '#059669'
    },
    {
      id: 'parent',
      label: 'Parent',
      icon: Users,
      color: '#D97706'
    }
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    return newErrors;
  };

  const clearStoredRoleData = () => {
    sessionStorage.removeItem('selectedRole');
    localStorage.removeItem('selectedRole');
    document.cookie = 'selectedRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    sessionStorage.removeItem('pendingGoogleSignUp');
  };

  const handleSignUp = async () => {
    if (isLoading) return;

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setErrors({ server: 'An account with this email already exists. Please log in instead.' });
        } else {
          setErrors({ server: authError.message });
        }
        setIsLoading(false);
        return;
      }

      if (authData?.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
            auth_provider: 'email',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
      }

      setErrors({
        success: `Account created as ${formData.role}! Please check your email to confirm.`
      });

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Account created! Please log in to continue.' }
        });
      }, 2500);

    } catch (error) {
      console.error('Sign up error:', error);
      setErrors({ server: error.message || 'Failed to create account.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (isGoogleLoading) return;

    if (!formData.role) {
      setErrors({ role: 'Please select a role first' });
      return;
    }

    setIsGoogleLoading(true);
    setErrors({});

    try {
      await supabase.auth.signOut();

      const role = formData.role;
      sessionStorage.setItem('selectedRole', role);
      localStorage.setItem('selectedRole', role);
      sessionStorage.setItem('pendingGoogleSignUp', 'true');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/authcallback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account'
          }
        }
      });

      if (error) {
        clearStoredRoleData();
        throw error;
      }

    } catch (error) {
      console.error('Google sign up error:', error);
      clearStoredRoleData();
      setErrors({ server: error.message || 'Failed to sign up with Google. Please try again.' });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">

        {/* ========== LEFT BRAND PANEL ========== */}
        <div className="signup-brand-panel">
          <div className="signup-brand-content">

            <div className="signup-brand-header-row">
              <div className="signup-logo-section">
                <div className="signup-logo-img">
                  <img src={Logo} alt="Logo" />
                </div>
                <div className="signup-brand-text">
                  <h1>NJEC</h1>
                  <span>New Jerusalem Extra Classes</span>
                </div>
              </div>
              <button onClick={() => navigate('/')} className="signup-back-btn">
                ← Back to Home
              </button>
            </div>

            <div className="signup-brand-body">
              <div className="signup-testimonial-compact">
                <div className="signup-quote-icon">"</div>
                <p className="signup-testimonial-text">
                  Join thousands of students who are already excelling with NJEC's premium education platform.
                </p>
                <div className="signup-testimonial-person">
                  <div className="signup-person-avatar">TT</div>
                  <div className="signup-person-details">
                    <span className="signup-person-name">Thabo Tlou</span>
                    <span className="signup-person-role">UI Designer & Student</span>
                  </div>
                </div>
              </div>

              <div className="signup-stats-compact">
                <div className="signup-stat-item">
                  <span className="signup-stat-value">5000+</span>
                  <span className="signup-stat-desc">Students</span>
                </div>
                <div className="signup-stat-divider"></div>
                <div className="signup-stat-item">
                  <span className="signup-stat-value">95%</span>
                  <span className="signup-stat-desc">Success Rate</span>
                </div>
                <div className="signup-stat-divider"></div>
                <div className="signup-stat-item">
                  <span className="signup-stat-value">50+</span>
                  <span className="signup-stat-desc">Expert Tutors</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========== RIGHT FORM PANEL ========== */}
        <div className="signup-form-panel">
          <div className="signup-form-content">

            <div className="signup-form-header">
              <h2>Create your account</h2>
              <p>Choose your role and fill in your details</p>
            </div>

            {/* Success Message */}
            {errors.success && (
              <div className="signup-success-alert">
                <CheckCircle size={16} />
                <span>{errors.success}</span>
              </div>
            )}

            {/* Error Message */}
            {errors.server && (
              <div className="signup-error-alert">
                <AlertCircle size={16} />
                <span>{errors.server}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="signup-form">

              {/* ========== ROLE SELECTION - 3 COLUMNS ========== */}
              <div className="signup-input-group">
                <label className="signup-input-label">
                  <Users size={16} />
                  I am a
                </label>
                <div className="signup-role-grid">
                  {roles.map((role) => {
                    const IconComponent = role.icon;
                    const isSelected = formData.role === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, role: role.id }));
                          setErrors(prev => ({ ...prev, role: undefined }));
                        }}
                        disabled={isLoading || isGoogleLoading}
                        className={`signup-role-card ${isSelected ? 'selected' : ''}`}
                        style={{ '--role-color': role.color }}
                      >
                        <IconComponent size={18} color={isSelected ? '#fff' : role.color} />
                        <span>{role.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.role && (
                  <span className="signup-error-text">{errors.role}</span>
                )}
              </div>

              {/* ========== FULL NAME & EMAIL - SIDE BY SIDE ========== */}
              <div className="signup-row-2col">
                <div className="signup-input-group">
                  <label className="signup-input-label">
                    <User size={16} />
                    Full Name
                  </label>
                  <div className="signup-input-field">
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`signup-input ${errors.fullName ? 'input-error' : ''}`}
                      placeholder="Enter your full name"
                      disabled={isLoading || isGoogleLoading}
                    />
                    {formData.fullName && !errors.fullName && (
                      <CheckCircle size={16} className="signup-input-check" />
                    )}
                  </div>
                  {errors.fullName && (
                    <span className="signup-error-text">{errors.fullName}</span>
                  )}
                </div>

                <div className="signup-input-group">
                  <label className="signup-input-label">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <div className="signup-input-field">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`signup-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="you@example.com"
                      disabled={isLoading || isGoogleLoading}
                    />
                    {formData.email && !errors.email && (
                      <CheckCircle size={16} className="signup-input-check" />
                    )}
                  </div>
                  {errors.email && (
                    <span className="signup-error-text">{errors.email}</span>
                  )}
                </div>
              </div>

              {/* ========== PHONE NUMBER - FULL WIDTH ========== */}
              <div className="signup-input-group">
                <label className="signup-input-label">
                  <Phone size={16} />
                  Phone Number
                  <span className="signup-label-optional">(Optional)</span>
                </label>
                <div className="signup-input-field">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="signup-input"
                    placeholder="+266 5XXX XXXX"
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
              </div>

              {/* ========== PASSWORD & CONFIRM PASSWORD - SIDE BY SIDE ========== */}
              <div className="signup-row-2col">
                <div className="signup-input-group">
                  <label className="signup-input-label">
                    <Lock size={16} />
                    Password
                  </label>
                  <div className="signup-input-field">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`signup-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="Create a password"
                      disabled={isLoading || isGoogleLoading}
                    />
                    <button
                      type="button"
                      className="signup-password-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="signup-error-text">{errors.password}</span>
                  )}
                </div>

                <div className="signup-input-group">
                  <label className="signup-input-label">
                    <Lock size={16} />
                    Confirm Password
                  </label>
                  <div className="signup-input-field">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`signup-input ${errors.confirmPassword ? 'input-error' : ''}`}
                      placeholder="Confirm your password"
                      disabled={isLoading || isGoogleLoading}
                    />
                    <button
                      type="button"
                      className="signup-password-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading || isGoogleLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="signup-error-text">{errors.confirmPassword}</span>
                  )}
                </div>
              </div>

              {/* ========== TERMS ========== */}
              <div className="signup-options-row">
                <label className="signup-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    disabled={isLoading || isGoogleLoading}
                  />
                  <span className="signup-checkbox-visual"></span>
                  <span className="signup-terms-text">
                    I agree to the{' '}
                    <a href="/terms" className="signup-terms-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="signup-terms-link">Privacy Policy</a>
                  </span>
                </label>
              </div>
              {errors.agreeToTerms && (
                <span className="signup-error-text">{errors.agreeToTerms}</span>
              )}

              {/* ========== SUBMIT BUTTON ========== */}
              <button
                type="submit"
                className="signup-submit-btn"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <div className="signup-btn-spinner"></div>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* ========== DIVIDER ========== */}
              <div className="signup-separator">
                <span>or continue with</span>
              </div>

              {/* ========== GOOGLE SIGN UP ========== */}
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="signup-google-btn"
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="signup-btn-spinner"></div>
                ) : (
                  <>
                    <FcGoogle size={18} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* ========== LOGIN LINK ========== */}
              <div className="signup-register-prompt">
                <span>Already have an account?</span>
                <Link to="/login" className="signup-register-link">
                  Log in
                </Link>
              </div>

            </form>

            {/* ========== SECURITY BADGE ========== */}
            <div className="signup-security-badge">
              <Shield size={16} />
              <span>Your data is securely protected</span>
            </div>

          </div>
        </div>
      </div>

      {/* ========== LOADING OVERLAY ========== */}
      {(isLoading || isGoogleLoading) && (
        <div className="signup-overlay-loading">
          <div className="signup-loading-box">
            <div className="signup-loading-animation"></div>
            <p>Creating your account...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;