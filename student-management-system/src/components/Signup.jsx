import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, ArrowRight, AlertCircle, Lock,
  User, Shield, Eye, EyeOff, Sparkles,
  Award, Target, Zap, Users, TrendingUp,
  ChevronRight, CheckCircle, GraduationCap,
  BookOpen, UserCog, ChevronLeft
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/Logo.jpg';
import { supabase } from './supabaseClient';
import '../styles/signup.css';

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Selected role
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Email sign up form state
  const [emailSignUp, setEmailSignUp] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Add this state for sign up method
  const [signUpMethod, setSignUpMethod] = useState(null);

  // Roles data
  const roles = [
    {
      id: 'student',
      label: 'Student',
      icon: BookOpen,
      description: 'Access courses, track progress, and learn at your own pace',
      color: '#2563EB',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
      tableName: 'students'
    },
    {
      id: 'teacher',
      label: 'Teacher',
      icon: GraduationCap,
      description: 'Create courses, manage students, and share knowledge',
      color: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      tableName: 'teachers'
    },
    {
      id: 'parent',
      label: 'Parent',
      icon: Users,
      description: 'Monitor your child\'s progress and communicate with teachers',
      color: '#D97706',
      gradient: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
      tableName: 'parents'
    },
    {
      id: 'admin',
      label: 'Admin',
      icon: UserCog,
      description: 'Manage the platform, users, and oversee operations',
      color: '#4F46E5',
      gradient: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)',
      tableName: 'admins'
    }
  ];

  // Handle Google Sign Up
  const handleGoogleSignUp = async () => {
    if (isLoading) return;
    if (!selectedRole) {
      setErrors({ general: 'Please select a role to continue' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Store the selected role in sessionStorage for retrieval after OAuth redirect
      sessionStorage.setItem('selectedRole', selectedRole);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/signup`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      
    } catch (error) {
      console.error('Google sign up error:', error);
      setErrors({ general: error.message || 'Failed to sign up with Google. Please try again.' });
      setIsLoading(false);
    }
  };

  // Handle Email Sign Up
  const handleEmailSignUp = async () => {
    if (isLoading) return;
    
    // Validate all fields
    const newErrors = {};
    
    if (!emailSignUp.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!emailSignUp.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(emailSignUp.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!emailSignUp.password) {
      newErrors.password = 'Password is required';
    } else if (emailSignUp.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(emailSignUp.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (emailSignUp.password !== emailSignUp.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!emailSignUp.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailSignUp.email,
        password: emailSignUp.password,
        options: {
          data: {
            full_name: emailSignUp.fullName,
            role: selectedRole
          },
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (authError) throw authError;

      // Check if user already exists
      if (authData?.user?.identities?.length === 0) {
        setErrors({ 
          general: 'An account with this email already exists. Please log in instead.' 
        });
        setIsLoading(false);
        return;
      }

      // Step 2: Save to profiles table (common for all roles)
      if (authData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: emailSignUp.email,
            full_name: emailSignUp.fullName,
            role: selectedRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Step 3: Save to role-specific table
        const selectedRoleData = roles.find(r => r.id === selectedRole);
        
        const roleSpecificData = {
          id: authData.user.id,
          email: emailSignUp.email,
          full_name: emailSignUp.fullName,
          role: selectedRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error: roleTableError } = await supabase
          .from(selectedRoleData.tableName)
          .upsert(roleSpecificData, { onConflict: 'id' });

        if (roleTableError) {
          console.error(`Error saving to ${selectedRoleData.tableName}:`, roleTableError);
        }

        // Step 4: Handle email confirmation
        if (authData?.user?.confirmation_sent_at) {
          // Email confirmation required
          setErrors({ 
            success: `✓ Account created as ${selectedRole}! Please check your email to confirm your account.` 
          });
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Please check your email to confirm your account before logging in.' 
              } 
            });
          }, 3000);
        } else {
          // Auto sign-in and redirect to appropriate dashboard
          setErrors({ 
            success: `✓ Account created as ${selectedRole}! Redirecting to dashboard...` 
          });
          
          setTimeout(async () => {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: emailSignUp.email,
              password: emailSignUp.password,
            });
            
            if (!signInError) {
              const routes = {
                admin: '/admindashboard',
                teacher: '/teacherdashboard',
                student: '/studentdashboard',
                parent: '/parentdashboard'
              };
              navigate(routes[selectedRole] || '/studentdashboard', { replace: true });
            } else {
              navigate('/login');
            }
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('Email sign up error:', error);
      setErrors({ general: error.message || 'Failed to create account. Please try again.' });
      setIsLoading(false);
    }
  };

  // Rest of your component stays the same...
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

  const renderRoleSelection = () => (
    <div className="signup-role-section">
      <div className="signup-role-header">
        <h3 className="signup-form-title">Choose Your Role</h3>
        <p className="signup-form-subtitle">
          Select how you want to use NJEC. This will determine your experience and features.
        </p>
      </div>

      <div className="signup-role-grid">
        {roles.map((role) => {
          const IconComponent = role.icon;
          const isSelected = selectedRole === role.id;

          return (
            <button
              key={role.id}
              className={`signup-role-card ${isSelected ? 'selected' : ''}`}
              onClick={() => {
                setSelectedRole(role.id);
                setErrors({});
              }}
              style={{
                '--role-color': role.color,
                '--role-gradient': role.gradient
              }}
              type="button"
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

      {errors.general && (
        <div className="signup-error-message">
          <AlertCircle size={16} />
          <span>{errors.general}</span>
        </div>
      )}

      <div className="signup-role-actions">
        <button
          onClick={() => {
            if (!selectedRole) {
              setErrors({ general: 'Please select a role to continue' });
              return;
            }
            setErrors({});
            setSignUpMethod('email');
          }}
          className={`signup-btn signup-btn-outline ${!selectedRole ? 'disabled' : ''}`}
          disabled={!selectedRole || isLoading}
        >
          <Mail size={20} />
          Continue with Email
        </button>

        <button
          onClick={handleGoogleSignUp}
          className="signup-btn signup-btn-google"
          disabled={isLoading || !selectedRole}
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              <FcGoogle size={24} />
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>

      <div className="signup-login-prompt">
        <p className="signup-login-text">
          Already have an account?{' '}
          <a href="/login" onClick={handleLoginClick} className="signup-login-link">
            Log in
          </a>
        </p>
      </div>
    </div>
  );

  const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
    <div 
      className="signup-feature-card" 
      style={{ 
        animationDelay: `${delay}s`,
        '--gradient': gradient 
      }}
    >
      <div className="signup-feature-card-inner">
        <div className="signup-feature-icon" style={{ background: gradient }}>
          <Icon size={20} />
          <div className="signup-feature-icon-glow"></div>
        </div>
        <div className="signup-feature-content">
          <h4 className="signup-feature-title">{title}</h4>
          <p className="signup-feature-description">{description}</p>
        </div>
      </div>
    </div>
  );

  const features = [
    { icon: Shield, title: 'Secure Platform', description: '256-bit encrypted data', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { icon: Award, title: 'Quality Education', description: 'Certified instructors', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: Target, title: 'Personalized Learning', description: 'Tailored study plans', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { icon: Zap, title: 'Quick Progress', description: 'Accelerated results', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { icon: Users, title: 'Community Support', description: '24/7 student community', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { icon: TrendingUp, title: 'Track Record', description: '95% success rate', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  ];

  return (
    <div className="signup-container">
      <div className="signup-bg">
        <div className="signup-bg-shape signup-bg-shape-1"></div>
        <div className="signup-bg-shape signup-bg-shape-2"></div>
        <div className="signup-bg-shape signup-bg-shape-3"></div>
        <div className="signup-bg-shape signup-bg-shape-4"></div>
      </div>

      <div className="signup-content-wrapper">
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

          <div className="signup-features-grid">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
                delay={index * 0.1}
              />
            ))}
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

        <div className="signup-right-col">
          <div className="signup-form-card">
            {errors.success && (
              <div className="signup-success-message">
                <CheckCircle size={20} />
                <span>{errors.success}</span>
              </div>
            )}

            {!signUpMethod ? (
              renderRoleSelection()
            ) : (
              <div className="signup-email-form">
                <button
                  onClick={() => setSignUpMethod(null)}
                  className="signup-back-btn"
                  disabled={isLoading}
                >
                  <ChevronLeft size={20} />
                  Back to role selection
                </button>

                <div className="signup-form-header">
                  <div className="signup-selected-role-badge" style={{
                    backgroundColor: `${roles.find(r => r.id === selectedRole)?.color}15`,
                    color: roles.find(r => r.id === selectedRole)?.color,
                    borderColor: roles.find(r => r.id === selectedRole)?.color
                  }}>
                    {React.createElement(roles.find(r => r.id === selectedRole)?.icon || BookOpen, { size: 16 })}
                    <span>Registering as {roles.find(r => r.id === selectedRole)?.label}</span>
                  </div>
                  <h3 className="signup-form-title">Create Your Account</h3>
                  <p className="signup-form-subtitle">
                    Fill in your details to get started as a {selectedRole}
                  </p>
                </div>

                <div className="signup-form-fields">
                  <div className="signup-field-group">
                    <label className="signup-field-label">
                      <User size={16} />
                      Full Name
                    </label>
                    <div className="signup-input-wrapper">
                      <input
                        type="text"
                        value={emailSignUp.fullName}
                        onChange={(e) => setEmailSignUp(prev => ({ ...prev, fullName: e.target.value }))}
                        className={`signup-input ${errors.fullName ? 'signup-input-error' : ''}`}
                        placeholder="John Doe"
                        disabled={isLoading}
                      />
                      {errors.fullName && (
                        <div className="signup-field-error">
                          <AlertCircle size={12} />
                          <span>{errors.fullName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="signup-field-group">
                    <label className="signup-field-label">
                      <Mail size={16} />
                      Email Address
                    </label>
                    <div className="signup-input-wrapper">
                      <input
                        type="email"
                        value={emailSignUp.email}
                        onChange={(e) => setEmailSignUp(prev => ({ ...prev, email: e.target.value }))}
                        className={`signup-input ${errors.email ? 'signup-input-error' : ''}`}
                        placeholder="john@example.com"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <div className="signup-field-error">
                          <AlertCircle size={12} />
                          <span>{errors.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="signup-field-group">
                    <label className="signup-field-label">
                      <Lock size={16} />
                      Password
                    </label>
                    <div className="signup-input-wrapper">
                      <div className="signup-password-input">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={emailSignUp.password}
                          onChange={(e) => setEmailSignUp(prev => ({ ...prev, password: e.target.value }))}
                          className={`signup-input ${errors.password ? 'signup-input-error' : ''}`}
                          placeholder="Create a password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="signup-password-toggle"
                          disabled={isLoading}
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
                    </div>
                    <div className="signup-password-hint">
                      <span className={emailSignUp.password.length >= 8 ? 'valid' : ''}>
                        ✓ Min 8 characters
                      </span>
                      <span className={/[A-Z]/.test(emailSignUp.password) ? 'valid' : ''}>
                        ✓ Uppercase letter
                      </span>
                      <span className={/[a-z]/.test(emailSignUp.password) ? 'valid' : ''}>
                        ✓ Lowercase letter
                      </span>
                      <span className={/\d/.test(emailSignUp.password) ? 'valid' : ''}>
                        ✓ Number
                      </span>
                    </div>
                  </div>

                  <div className="signup-field-group">
                    <label className="signup-field-label">
                      <Lock size={16} />
                      Confirm Password
                    </label>
                    <div className="signup-input-wrapper">
                      <div className="signup-password-input">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={emailSignUp.confirmPassword}
                          onChange={(e) => setEmailSignUp(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className={`signup-input ${errors.confirmPassword ? 'signup-input-error' : ''}`}
                          placeholder="Confirm your password"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="signup-password-toggle"
                          disabled={isLoading}
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
                  </div>

                  <div className="signup-terms-group">
                    <label className="signup-checkbox-label">
                      <input
                        type="checkbox"
                        checked={emailSignUp.agreeToTerms}
                        onChange={(e) => setEmailSignUp(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                        className="signup-checkbox"
                        disabled={isLoading}
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

                  <button
                    onClick={handleEmailSignUp}
                    className="signup-btn signup-btn-submit"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <span>Create {selectedRole?.charAt(0).toUpperCase() + selectedRole?.slice(1)} Account</span>
                        <ArrowRight size={20} />
                      </>
                    )}
                  </button>

                  <div className="signup-email-login-prompt">
                    <p className="signup-login-text">
                      Already have an account?{' '}
                      <a href="/login" onClick={handleLoginClick} className="signup-login-link">
                        Sign in
                      </a>
                    </p>
                  </div>
                </div>

                {errors.general && (
                  <div className="signup-error-general">
                    <AlertCircle size={16} />
                    <span>{errors.general}</span>
                  </div>
                )}
              </div>
            )}

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