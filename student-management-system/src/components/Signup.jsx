// src/components/SignUp.jsx - Complete with prominent role selection
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, ArrowRight, AlertCircle, Lock,
  User, Eye, EyeOff, CheckCircle,
  BookOpen, GraduationCap, Users, UserCog,
  Shield, Sparkles, Phone
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
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: '',
    agreeToTerms: false
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Roles data with descriptions
  const roles = [
    {
      id: 'student',
      label: 'Student',
      icon: BookOpen,
      description: 'Access courses, track progress, and learn at your own pace',
      color: '#2563EB',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
    },
    {
      id: 'teacher',
      label: 'Teacher',
      icon: GraduationCap,
      description: 'Create courses, manage students, and share knowledge',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
    },
    {
      id: 'parent',
      label: 'Parent',
      icon: Users,
      description: 'Monitor your child\'s progress and communicate with teachers',
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
    },

  ];

  // Validate form
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
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  // Helper function to clear stored role data
  const clearStoredRoleData = () => {
    sessionStorage.removeItem('selectedRole');
    localStorage.removeItem('selectedRole');
    document.cookie = 'selectedRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    sessionStorage.removeItem('pendingGoogleSignUp');
  };

  // Handle Sign Up
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
      // Create user in Supabase
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
          setErrors({ general: 'An account with this email already exists. Please log in instead.' });
        } else {
          setErrors({ general: authError.message });
        }
        setIsLoading(false);
        return;
      }

      // Save to profiles table
      if (authData?.user) {
        const { error: profileError } = await supabase
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

        if (profileError) {
          console.error('Profile creation error:', profileError);
          console.warn('User created but profile save failed:', profileError);
        }
      }

      // Success
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
      setErrors({ general: error.message || 'Failed to create account.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    if (isGoogleLoading) return;
    
    if (!formData.role) {
      setErrors({ role: 'Please select a role first' });
      // Scroll to role section for better UX
      const roleSection = document.querySelector('.signup-role-section');
      if (roleSection) {
        roleSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setIsGoogleLoading(true);
    setErrors({});
    
    try {
      // Clear any existing auth state
      await supabase.auth.signOut();
      
      // Store role in MULTIPLE places for redundancy
      // This ensures the role survives the OAuth redirect
      const role = formData.role;
      
      // 1. sessionStorage
      sessionStorage.setItem('selectedRole', role);
      
      // 2. localStorage (persists across tabs and browser restarts)
      localStorage.setItem('selectedRole', role);
      
      // 3. Cookie (works across subdomains if needed)
      document.cookie = `selectedRole=${role}; path=/; max-age=3600; SameSite=Lax`;
      
      // 4. Flag to indicate pending Google signup
      sessionStorage.setItem('pendingGoogleSignUp', 'true');
      
      console.log('=== GOOGLE SIGNUP INITIATED ===');
      console.log('Role selected:', role);
      console.log('Role stored in: sessionStorage, localStorage, and cookie');
      console.log('Redirect URL:', `${window.location.origin}/authcallback`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
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
        console.error('Google OAuth error:', error);
        // Clean up stored data on error
        clearStoredRoleData();
        throw error;
      }
      
      console.log('OAuth initiated successfully, redirecting to Google...');
      // The page will redirect to Google, so no need to do anything else here
      
    } catch (error) {
      console.error('Google sign up error:', error);
      // Clean up stored data on error
      clearStoredRoleData();
      setErrors({ general: error.message || 'Failed to sign up with Google. Please try again.' });
      setIsGoogleLoading(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  const LoadingSpinner = () => (
    <div className="signup-spinner">
      <div className="signup-spinner-dot"></div>
      <div className="signup-spinner-dot"></div>
      <div className="signup-spinner-dot"></div>
    </div>
  );

  return (
    <div className="signup-container">
      <div className="signup-bg">
        <div className="signup-bg-shape signup-bg-shape-1"></div>
        <div className="signup-bg-shape signup-bg-shape-2"></div>
        <div className="signup-bg-shape signup-bg-shape-3"></div>
        <div className="signup-bg-shape signup-bg-shape-4"></div>
      </div>

      <div className="signup-content-wrapper">
        {/* Left Column */}
        <div className="signup-left-col">
          <div className="signup-brand">
            <div className="signup-logo-wrapper">
              <img src={Logo} alt="NJEC Logo" className="signup-logo" />
              <div className="signup-logo-text">
                <h1 className="signup-logo-title">NJEC</h1>
                <p className="signup-logo-subtitle">New Jerusalem Extra Classes</p>
              </div>
            </div>
            <h2 className="signup-welcome-title">Welcome!</h2>
            <p className="signup-welcome-text">
              Join thousands of students who are already excelling with NJEC's premium education platform.
            </p>
          </div>

          <div className="signup-stats">
            <div className="signup-stat-item">
              <span className="signup-stat-number">5000+</span>
              <span className="signup-stat-label">Active Students</span>
            </div>
            <div className="signup-stat-item">
              <span className="signup-stat-number">95%</span>
              <span className="signup-stat-label">Success Rate</span>
            </div>
            <div className="signup-stat-item">
              <span className="signup-stat-number">50+</span>
              <span className="signup-stat-label">Expert Tutors</span>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="signup-right-col">
          <div className="signup-form-card">
            {/* Success Message */}
            {errors.success && (
              <div className="signup-success-message">
                <CheckCircle size={20} />
                <span>{errors.success}</span>
              </div>
            )}

            {/* General Error Message */}
            {errors.general && (
              <div className="signup-error-message">
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="signup-form-header">
              <h3 className="signup-form-title">Create Your Account</h3>
              <p className="signup-form-subtitle">
                Choose your role and fill in your details
              </p>
            </div>

            <div className="signup-form-fields">
              
              {/* ========== ROLE SELECTION - PROMINENT ========== */}
              <div className="signup-role-section">
                <div className="signup-role-header">
                  <h4 className="signup-role-heading">Choose Your Role</h4>
                  <p className="signup-role-subheading">
                    Select how you want to use NJEC
                  </p>
                </div>

                <div className="signup-role-grid">
                  {roles.map((role) => {
                    const IconComponent = role.icon;
                    const isSelected = formData.role === role.id;

                    return (
                      <button
                        key={role.id}
                        className={`signup-role-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, role: role.id }));
                          setErrors(prev => ({ ...prev, role: undefined }));
                        }}
                        style={{
                          '--role-color': role.color,
                          '--role-gradient': role.gradient
                        }}
                        type="button"
                        disabled={isLoading || isGoogleLoading}
                      >
                        <div className="signup-role-icon-wrapper">
                          <div 
                            className="signup-role-icon"
                            style={{ 
                              backgroundColor: isSelected ? role.color : `${role.color}15`
                            }}
                          >
                            <IconComponent 
                              size={28} 
                              color={isSelected ? '#FFFFFF' : role.color}
                            />
                          </div>
                          {isSelected && (
                            <div className="signup-role-check">
                              <CheckCircle size={20} color="#FFFFFF" />
                            </div>
                          )}
                        </div>
                        
                        <div className="signup-role-info">
                          <h4 className="signup-role-name">{role.label}</h4>
                          <p className="signup-role-desc">{role.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {errors.role && (
                  <div className="signup-error-message">
                    <AlertCircle size={16} />
                    <span>{errors.role}</span>
                  </div>
                )}
              </div>

              {/* ========== FULL NAME ========== */}
              <div className="signup-field-group">
                <label className="signup-field-label">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  className={`signup-input ${errors.fullName ? 'signup-input-error' : ''}`}
                  placeholder="Enter your full name"
                  disabled={isLoading || isGoogleLoading}
                />
                {errors.fullName && (
                  <div className="signup-field-error">
                    <AlertCircle size={12} />
                    <span>{errors.fullName}</span>
                  </div>
                )}
              </div>

              {/* ========== EMAIL ========== */}
              <div className="signup-field-group">
                <label className="signup-field-label">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`signup-input ${errors.email ? 'signup-input-error' : ''}`}
                  placeholder="you@example.com"
                  disabled={isLoading || isGoogleLoading}
                />
                {errors.email && (
                  <div className="signup-field-error">
                    <AlertCircle size={12} />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* ========== PHONE (OPTIONAL) ========== */}
              <div className="signup-field-group">
                <label className="signup-field-label">
                  <Phone size={16} />
                  Phone Number <span style={{color: '#9ca3af', fontWeight: 400}}>(Optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="signup-input"
                  placeholder="+266 5XXX XXXX"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>

              {/* ========== PASSWORD ========== */}
              <div className="signup-field-group">
                <label className="signup-field-label">
                  <Lock size={16} />
                  Password
                </label>
                <div className="signup-password-input">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={`signup-input ${errors.password ? 'signup-input-error' : ''}`}
                    placeholder="Create a password"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="signup-password-toggle"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="signup-field-error">
                    <AlertCircle size={12} />
                    <span>{errors.password}</span>
                  </div>
                )}
                <div className="signup-password-hint">
                  <span className={formData.password.length >= 8 ? 'valid' : ''}>✓ Min 8 characters</span>
                  <span className={/[A-Z]/.test(formData.password) ? 'valid' : ''}>✓ Uppercase letter</span>
                  <span className={/[a-z]/.test(formData.password) ? 'valid' : ''}>✓ Lowercase letter</span>
                  <span className={/\d/.test(formData.password) ? 'valid' : ''}>✓ Number</span>
                </div>
              </div>

              {/* ========== CONFIRM PASSWORD ========== */}
              <div className="signup-field-group">
                <label className="signup-field-label">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="signup-password-input">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`signup-input ${errors.confirmPassword ? 'signup-input-error' : ''}`}
                    placeholder="Confirm your password"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="signup-password-toggle"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="signup-field-error">
                    <AlertCircle size={12} />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
              </div>

              {/* ========== TERMS ========== */}
              <div className="signup-terms-group">
                <label className="signup-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.agreeToTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="signup-checkbox"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <span className="signup-checkbox-custom"></span>
                  <span className="signup-checkbox-text">
                    I agree to the{' '}
                    <a href="/terms" className="signup-link">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" className="signup-link">Privacy Policy</a>
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <div className="signup-field-error">
                    <AlertCircle size={12} />
                    <span>{errors.agreeToTerms}</span>
                  </div>
                )}
              </div>

              {/* ========== SUBMIT ========== */}
              <button
                onClick={handleSignUp}
                className="signup-btn signup-btn-submit"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* ========== GOOGLE SIGN UP ========== */}
              <div className="signup-divider">
                <span className="signup-divider-line"></span>
                <span className="signup-divider-text">or</span>
                <span className="signup-divider-line"></span>
              </div>

              <button
                onClick={handleGoogleSignUp}
                className="signup-btn signup-btn-google"
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <FcGoogle size={24} />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {/* Google sign up note */}
              <p className="signup-google-note">
                <AlertCircle size={12} />
                <span>You must select a role above before using Google sign up</span>
              </p>

              {/* ========== LOGIN LINK ========== */}
              <div className="signup-login-prompt">
                <p className="signup-login-text">
                  Already have an account?{' '}
                  <a href="/login" onClick={handleLoginClick} className="signup-login-link">
                    Log in
                  </a>
                </p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="signup-trust-badges">
              <div className="signup-trust-item">
                <Shield size={14} />
                <span>256-bit Encryption</span>
              </div>
              <div className="signup-trust-item">
                <CheckCircle size={14} />
                <span>GDPR Compliant</span>
              </div>
              <div className="signup-trust-item">
                <Sparkles size={14} />
                <span>Secure Platform</span>
              </div>
            </div>
          </div>

          <p className="signup-help-text">
            By signing up, you agree to receive important updates about your registration.
            You can unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;