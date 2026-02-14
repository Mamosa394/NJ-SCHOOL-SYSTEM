import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff,
  Shield,
  User,
  // Phone, // Removed as per request
  Calendar,
  BookOpen,
  Users,
  Key,
  CheckCircle,
  Loader2,
  // AlertCircle, // Unused
  ArrowLeft,
  GraduationCap,
  ChevronRight
} from 'lucide-react';

import '../styles/signup.css';
import Logo from "../assets/Logo.jpg";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    studentNumber: '',
    // phone: '', // Removed
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    // parentName: '', // Removed
    // parentPhone: '', // Removed
    birthDate: '',
    // subjects: [], // Removed
    acceptTerms: false
  });

  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: '', text: '' });
  const [errors, setErrors] = useState({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Removed subjectsList array

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    const getAdminCount = async () => {
      try {
        // Fetch actual admin count from Supabase if needed, or keep simulation
        setAdminCount(1); 
      } catch (err) {
        console.error(err);
      }
    };
    getAdminCount();
  }, []);

  const evaluatePasswordStrength = (password) => {
    if (password.length === 0) return { level: '', text: '' };
    if (password.length < 6) return { level: 'weak', text: 'Weak password' };
    
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    
    const score = [hasSpecial, hasNumbers, hasUpper, hasLower, password.length >= 8]
      .filter(Boolean).length;
    
    if (score >= 4) return { level: 'strong', text: 'Strong password' };
    if (score >= 3) return { level: 'medium', text: 'Medium password' };
    return { level: 'weak', text: 'Weak password' };
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (name === 'password') {
      setPasswordStrength(evaluatePasswordStrength(value));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Removed handleSubjectToggle function

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.role) newErrors.role = 'Please select a role';
    if (formData.role === 'admin' && adminCount >= 2) {
      newErrors.role = 'Admin registration limit reached';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    if (formData.role === 'student') {
      // Removed checks for phone, parent details, and subjects
      if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setLoadingProgress(20); // Start progress
    
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      setLoadingProgress(60);

      // 2. If Role is Student, save to students table
      if (formData.role === 'student' && authData.user) {
        const { error: dbError } = await supabase
          .from('students')
          .insert([{
            id: authData.user.id,
            full_name: formData.fullName,
            student_number: formData.studentNumber,
            email: formData.email,
            // phone: formData.phone, // Removed
            birth_date: formData.birthDate,
            // parent_name: formData.parentName, // Removed
            // parent_phone: formData.parentPhone, // Removed
            // subjects: formData.subjects, // Removed
            enrollment_status: 'active'
          }]);

        if (dbError) throw dbError;
      }

      setLoadingProgress(100);
      setLoading(false);
      setSignupSuccess(true);
      
      setTimeout(() => {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }, 3000);

    } catch (err) {
      setLoading(false);
      setErrors({ form: err.message });
      alert(err.message); // Direct feedback for errors
    }
  };

  // Removed handleSocialSignup function

  return (
    <>
      <div className="njec-signup-container">
        <div className="njec-signup-bg-shapes">
          <div className="njec-signup-shape njec-shape-1"></div>
          <div className="njec-signup-shape njec-shape-2"></div>
          <div className="njec-signup-shape njec-shape-3"></div>
        </div>

        <div className="njec-signup-wrapper">
          <div className="njec-signup-form-section">
            <button 
              onClick={() => navigate('/')}
              className="njec-signup-back-button"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>

            <div className="njec-signup-header">
              <div className="njec-signup-logo">
                <div className="njec-signup-logo-icon">
                  <img src={Logo} alt="NJEC Logo" />
                </div>
                <div className="njec-signup-brand">
                  <h1>NJEC</h1>
                  <span>New Jerusalem Extra Classes</span>
                </div>
              </div>
            </div>

            <div className="njec-signup-form-container">
              <div className="njec-signup-form-header">
                <h2>Create Account</h2>
                <p>Please fill in your details to register</p>
              </div>

              <form onSubmit={handleSubmit} className="njec-signup-form">
                <div className="njec-signup-form-group">
                  <label htmlFor="fullName" className="njec-signup-form-label">
                    <User size={18} />
                    <span>Full Name</span>
                  </label>
                  <div className="njec-signup-input-wrapper">
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={`njec-signup-input ${errors.fullName ? 'error' : formData.fullName ? 'success' : ''}`}
                      disabled={loading}
                    />
                    {formData.fullName && !errors.fullName && (
                      <CheckCircle size={18} className="njec-signup-input-success" />
                    )}
                  </div>
                  {errors.fullName && (
                    <span className="njec-signup-error-message">{errors.fullName}</span>
                  )}
                </div>

                <div className="njec-signup-form-group">
                  <label htmlFor="email" className="njec-signup-form-label">
                    <Mail size={18} />
                    <span>Email</span>
                  </label>
                  <div className="njec-signup-input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="thabo@gmail.com"
                      className={`njec-signup-input ${errors.email ? 'error' : formData.email ? 'success' : ''}`}
                      disabled={loading}
                    />
                    {formData.email && !errors.email && (
                      <CheckCircle size={18} className="njec-signup-input-success" />
                    )}
                  </div>
                  {errors.email && (
                    <span className="njec-signup-error-message">{errors.email}</span>
                  )}
                </div>

                <div className="njec-signup-form-group">
                  <label htmlFor="role" className="njec-signup-form-label">
                    <Users size={18} />
                    <span>Role</span>
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={`njec-signup-select ${errors.role ? 'error' : ''}`}
                    disabled={loading || (formData.role === 'admin' && adminCount >= 2)}
                  >
                    <option value="">Select your role</option>
                    {roles.map(role => (
                      <option 
                        key={role.value} 
                        value={role.value}
                        disabled={role.value === 'admin' && adminCount >= 2}
                      >
                        {role.label} {role.value === 'admin' && adminCount >= 2 ? '(Limit Reached)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <span className="njec-signup-error-message">{errors.role}</span>
                  )}
                </div>

                {formData.role === 'student' && (
                  <div className="njec-student-info-section">
                    <h4 className="njec-student-info-title">
                      <GraduationCap size={18} />
                      Student Information
                    </h4>
                    
                    {/* Simplified Student Info Grid - Removed Phone, Parent Name, Parent Phone */}
                    <div className="njec-signup-form-grid">
                      <div className="njec-signup-form-group">
                        <label htmlFor="studentNumber" className="njec-signup-form-label">
                          <BookOpen size={16} />
                          <span>Student Number</span>
                        </label>
                        <input
                          type="text"
                          id="studentNumber"
                          name="studentNumber"
                          value={formData.studentNumber}
                          onChange={handleChange}
                          placeholder="Optional"
                          className="njec-signup-input"
                          disabled={loading}
                        />
                      </div>

                      <div className="njec-signup-form-group">
                        <label htmlFor="birthDate" className="njec-signup-form-label">
                          <Calendar size={18} />
                          <span>Birth Date</span>
                        </label>
                        <input
                          type="date"
                          id="birthDate"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className={`njec-signup-input ${errors.birthDate ? 'error' : ''}`}
                          disabled={loading}
                        />
                        {errors.birthDate && (
                          <span className="njec-signup-error-message">{errors.birthDate}</span>
                        )}
                      </div>
                    </div>
                    {/* Subjects selection removed */}
                  </div>
                )}

                <div className="njec-signup-form-group">
                  <label htmlFor="password" className="njec-signup-form-label">
                    <Lock size={18} />
                    <span>Password</span>
                  </label>
                  <div className="njec-signup-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      className={`njec-signup-input ${errors.password ? 'error' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="njec-signup-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password && (
                    <div className="njec-signup-password-strength">
                      <div className="njec-signup-strength-meter">
                        <div className={`njec-signup-strength-fill ${passwordStrength.level}`}></div>
                      </div>
                      <div className={`njec-signup-strength-text ${passwordStrength.level}`}>
                        {passwordStrength.text}
                      </div>
                    </div>
                  )}
                  {errors.password && (
                    <span className="njec-signup-error-message">{errors.password}</span>
                  )}
                </div>

                <div className="njec-signup-form-group">
                  <label htmlFor="confirmPassword" className="njec-signup-form-label">
                    <Key size={18} />
                    <span>Confirm Password</span>
                  </label>
                  <div className="njec-signup-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      className={`njec-signup-input ${errors.confirmPassword ? 'error' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="njec-signup-password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="njec-signup-error-message">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="njec-signup-terms">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="acceptTerms">
                    I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <span className="njec-signup-error-message">{errors.acceptTerms}</span>
                )}

                <button
                  type="submit"
                  className="njec-signup-submit-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="njec-signup-spinner" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {/* Social Login and Divider Removed */}

                <div className="njec-login-link-section">
                  <User size={18} />
                  <span>Already have an account?</span>
                  <Link to="/login" className="njec-login-link">
                    Sign in here
                  </Link>
                </div>
              </form>

              <div className="njec-signup-trust">
                <Shield size={20} />
                <span>Your data is securely protected</span>
              </div>
            </div>
          </div>

          <div className="njec-signup-info-section">
            <div className="njec-signup-info-card">
              <div className="njec-signup-quote-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>

              <div className="njec-signup-testimonial">
                <h3>What our Students Say</h3>
                <p className="njec-signup-testimonial-text">
                  "Search and find more learning resources in one place now. 
                  Just enroll in courses and learn at your own pace."
                </p>
                
                <div className="njec-signup-testimonial-author">
                  <div className="njec-signup-author-avatar">TT</div>
                  <div className="njec-signup-author-info">
                    <h4>Thabo TLou</h4>
                    <p>UI Designer & Student</p>
                  </div>
                </div>
              </div>

              <div className="njec-signup-cta">
                <h3>Get your learning journey started</h3>
                <p>
                  Apply now to access premium courses, expert tutors, and 
                  comprehensive learning materials.
                </p>
                <button 
                  onClick={() => navigate('/courses')}
                  className="njec-signup-cta-button"
                >
                  Browse Available Courses
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="njec-signup-additional-info">
                <p>
                  Be on the lookout for new courses and learning opportunities 
                  to experience the easiest way to advance your education.
                </p>
                <div className="njec-signup-stats">
                  <div className="njec-signup-stat">
                    <span className="njec-signup-stat-number">500+</span>
                    <span className="njec-signup-stat-label">Active Students</span>
                  </div>
                  <div className="njec-signup-stat">
                    <span className="njec-signup-stat-number">98%</span>
                    <span className="njec-signup-stat-label">Satisfaction Rate</span>
                  </div>
                  <div className="njec-signup-stat">
                    <span className="njec-signup-stat-number">15+</span>
                    <span className="njec-signup-stat-label">Subjects Available</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="njec-signup-info-decoration">
              <div className="njec-signup-decoration-dot njec-signup-dot-1"></div>
              <div className="njec-signup-decoration-dot njec-signup-dot-2"></div>
              <div className="njec-signup-decoration-dot njec-signup-dot-3"></div>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="njec-signup-loading">
          <div className="njec-signup-loading-content">
            <div className="njec-signup-loading-spinner"></div>
            <h3 className="njec-signup-loading-text">Creating Your Account</h3>
            <p className="njec-signup-loading-subtext">
              Please wait while we set up your account...
            </p>
            <div className="njec-signup-progress-bar">
              <div 
                className="njec-signup-progress-fill"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {signupSuccess && (
        <div className="njec-signup-success">
          <div className="njec-signup-success-content">
            <div className="njec-signup-success-icon">
              <CheckCircle size={40} />
            </div>
            <h3>Account Created Successfully!</h3>
            <p>
              Your account has been created. {redirecting ? 
              'Redirecting to login...' : 
              'You will be redirected to the login page shortly.'}
            </p>
            {!redirecting && (
              <div className="njec-signup-progress-bar">
                <div className="njec-signup-progress-fill" style={{ width: '100%' }}></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;