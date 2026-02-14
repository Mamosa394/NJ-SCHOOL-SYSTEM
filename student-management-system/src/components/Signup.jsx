import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, ArrowRight, AlertCircle, Lock,
  User, Shield, Eye, EyeOff, Sparkles,
  Award, Target, Zap, Users, TrendingUp,
  ChevronRight, CheckCircle
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import Logo from '../assets/Logo.jpg';
import { supabase } from './supabaseClient';
import '../styles/signup.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [signUpMethod, setSignUpMethod] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false); // Prevent multiple redirects
  
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

  // Check for existing session on mount
  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event); // Debug log
      
      if (event === 'SIGNED_IN' && session && !isRedirecting) {
        setIsRedirecting(true);
        handleSuccessfulAuth(session.user);
      }
      
      if (event === 'TOKEN_REFRESHED') {
        // Handle token refresh if needed
        console.log('Token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isRedirecting]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && !isRedirecting) {
        setIsRedirecting(true);
        handleSuccessfulAuth(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleSuccessfulAuth = (user) => {
    // Small delay to ensure state is updated
    setTimeout(() => {
      navigate('/registration', { 
        state: { 
          signUpMethod: user.app_metadata.provider || 'email',
          userEmail: user.email,
          userName: user.user_metadata?.full_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0],
          userId: user.id
        },
        replace: true // Use replace to prevent back navigation to OAuth page
      });
    }, 100);
  };

  // Handle Google Sign Up - FIXED VERSION
  const handleGoogleSignUp = async () => {
    // Prevent double clicks
    if (isLoading || isRedirecting) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Clear any existing session first to avoid conflicts
      await supabase.auth.signOut();
      
      // Small delay to ensure signout completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/registration`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false // Ensure it redirects properly
        }
      });

      if (error) throw error;
      
      // The OAuth redirect will happen automatically
      // The onAuthStateChange listener will handle the redirect back
      
    } catch (error) {
      console.error('Google sign up error:', error);
      setErrors({ general: error.message || 'Failed to sign up with Google. Please try again.' });
      setIsLoading(false);
      setIsRedirecting(false);
    }
  };

  // Handle Email Sign Up
  const handleEmailSignUp = async () => {
    // Prevent double clicks
    if (isLoading || isRedirecting) return;
    
    // Validate form
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
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: emailSignUp.email,
        password: emailSignUp.password,
        options: {
          data: {
            full_name: emailSignUp.fullName,
          },
          emailRedirectTo: `${window.location.origin}/registration`,
        }
      });

      if (error) throw error;

      // Check if user already exists
      if (data?.user?.identities?.length === 0) {
        setErrors({ 
          general: 'An account with this email already exists. Please log in instead.',
          existingUser: true 
        });
        setIsLoading(false);
        return;
      }

      // Check if email confirmation is required
      if (data?.user?.confirmation_sent_at) {
        // Show success message
        setErrors({ 
          success: '✓ Please check your email to confirm your account. Redirecting...' 
        });
        
        // Wait a moment then try to sign in (if auto-confirm is enabled)
        setTimeout(async () => {
          try {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: emailSignUp.email,
              password: emailSignUp.password,
            });
            
            if (!signInError && signInData.user) {
              handleSuccessfulAuth(signInData.user);
            } else {
              // If can't auto sign in, redirect to login
              navigate('/login', { 
                state: { 
                  message: 'Please check your email to confirm your account before logging in.' 
                } 
              });
            }
          } catch (err) {
            navigate('/login', { 
              state: { 
                message: 'Please check your email to confirm your account before logging in.' 
              } 
            });
          }
        }, 3000);
      } else {
        // Direct sign in successful
        handleSuccessfulAuth(data.user);
      }
      
    } catch (error) {
      console.error('Email sign up error:', error);
      setErrors({ general: error.message || 'Failed to create account. Please try again.' });
      setIsLoading(false);
    }
  };

  // Handle Login redirect
  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  // Feature Card Component
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

  // Loading Spinner
  const LoadingSpinner = () => (
    <div className="signup-spinner">
      <div className="signup-spinner-dot"></div>
      <div className="signup-spinner-dot"></div>
      <div className="signup-spinner-dot"></div>
    </div>
  );

  // Features data
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
      {/* Animated Background */}
      <div className="signup-bg">
        <div className="signup-bg-shape signup-bg-shape-1"></div>
        <div className="signup-bg-shape signup-bg-shape-2"></div>
        <div className="signup-bg-shape signup-bg-shape-3"></div>
        <div className="signup-bg-shape signup-bg-shape-4"></div>
      </div>

      {/* Main Content */}
      <div className="signup-content-wrapper">
        {/* Left Column - Features */}
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

        {/* Right Column - Sign Up Form */}
        <div className="signup-right-col">
          <div className="signup-form-card">
            <div className="signup-form-header">
              <h3 className="signup-form-title">Create Account</h3>
              <p className="signup-form-subtitle">
                Sign up to access the Grade 11 Registration Portal
              </p>
            </div>

            {/* Success Message */}
            {errors.success && (
              <div className="signup-success-message">
                <CheckCircle size={20} />
                <span>{errors.success}</span>
              </div>
            )}

            {!signUpMethod ? (
              /* Initial Sign Up Options */
              <div className="signup-options">
                <button
                  onClick={handleGoogleSignUp}
                  className="signup-btn signup-btn-google"
                  disabled={isLoading || isRedirecting}
                >
                  <div className="signup-btn-content">
                    <FcGoogle size={24} />
                    <span>Continue with Google</span>
                  </div>
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <ChevronRight size={20} className="signup-btn-icon" />
                  )}
                </button>

                <div className="signup-divider">
                  <span className="signup-divider-line"></span>
                  <span className="signup-divider-text">or</span>
                  <span className="signup-divider-line"></span>
                </div>

                <button
                  onClick={() => setSignUpMethod('email')}
                  className="signup-btn signup-btn-email"
                  disabled={isLoading || isRedirecting}
                >
                  <div className="signup-btn-content">
                    <Mail size={24} />
                    <span>Continue with Email</span>
                  </div>
                  <ChevronRight size={20} className="signup-btn-icon" />
                </button>

                <div className="signup-login-prompt">
                  <p className="signup-login-text">
                    Already have an account?{' '}
                    <a href="/login" onClick={handleLoginClick} className="signup-login-link">
                      Log in
                    </a>
                  </p>
                </div>
              </div>
            ) : (
              /* Email Sign Up Form */
              <div className="signup-email-form">
                <button
                  onClick={() => setSignUpMethod(null)}
                  className="signup-back-btn"
                  disabled={isLoading}
                >
                  ← Back to options
                </button>

                <div className="signup-form-fields">
                  {/* Full Name */}
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

                  {/* Email */}
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

                  {/* Password */}
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

                  {/* Confirm Password */}
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

                  {/* Terms Agreement */}
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

                  {/* Submit Button */}
                  <button
                    onClick={handleEmailSignUp}
                    className="signup-btn signup-btn-submit"
                    disabled={isLoading}
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

                  {/* Login link for email form */}
                  <div className="signup-email-login-prompt">
                    <p className="signup-login-text">
                      Already have an account?{' '}
                      <a href="/login" onClick={handleLoginClick} className="signup-login-link">
                        Sign in
                      </a>
                    </p>
                  </div>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="signup-error-general">
                    <AlertCircle size={16} />
                    <span>{errors.general}</span>
                  </div>
                )}

                {/* Existing User Suggestion */}
                {errors.existingUser && (
                  <div className="signup-existing-user">
                    <p>
                      <a href="/login" onClick={handleLoginClick} className="signup-login-link">
                        Click here to log in
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}

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

          {/* Help Text */}
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