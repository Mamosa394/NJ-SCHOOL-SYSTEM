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
  Phone,
  Calendar,
  BookOpen,
  Users,
  Key,
  CheckCircle,
  Loader2,
  AlertCircle,
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
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    parentName: '',
    parentPhone: '',
    birthDate: '',
    subjects: [],
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

  const subjectsList = [
    "Mathematics", "Biology", "Physics", "Chemistry",
    "Physical Science", "Accounting", "English", "Sesotho"
  ];

  const roles = [
    { value: 'student', label: 'Student' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'parent', label: 'Parent' },
    { value: 'admin', label: 'Admin' }
  ];

  useEffect(() => {
    const getAdminCount = async () => {
      try {
        // Simulate API call
        setTimeout(() => {
          setAdminCount(1); // Example: 1 admin already exists
        }, 500);
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  };

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
    
    // Student-specific validations
    if (formData.role === 'student') {
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.parentName) newErrors.parentName = 'Parent name is required';
      if (!formData.parentPhone) newErrors.parentPhone = 'Parent phone is required';
      if (!formData.birthDate) newErrors.birthDate = 'Birth date is required';
      if (formData.subjects.length === 0) newErrors.subjects = 'Please select at least one subject';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setLoadingProgress(0);
    
    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
    
    // Simulate API call
    setTimeout(() => {
      clearInterval(progressInterval);
      setLoading(false);
      setSignupSuccess(true);
      
      // Show success message for 3 seconds, then redirect
      setTimeout(() => {
        setRedirecting(true);
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      }, 3000);
      
    }, 2000);
  };

  const handleSocialSignup = (provider) => {
    console.log(`Signing up with ${provider}`);
    // Implement social signup logic
  };

  return (
    <>
      <div className="njec-signup-container">
        {/* Background Elements */}
        <div className="njec-signup-bg-shapes">
          <div className="njec-signup-shape njec-shape-1"></div>
          <div className="njec-signup-shape njec-shape-2"></div>
          <div className="njec-signup-shape njec-shape-3"></div>
        </div>

        <div className="njec-signup-wrapper">
          {/* Left Side - Signup Form */}
          <div className="njec-signup-form-section">
            {/* Back Button */}
            <button 
              onClick={() => navigate('/')}
              className="njec-signup-back-button"
            >
              <ArrowLeft size={18} />
              Back to Home
            </button>

            {/* Logo/Brand */}
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

            {/* Form Container */}
            <div className="njec-signup-form-container">
              <div className="njec-signup-form-header">
                <h2>Create Account</h2>
                <p>Please fill in your details to register</p>
              </div>

              <form onSubmit={handleSubmit} className="njec-signup-form">
                {/* Full Name */}
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

                {/* Email */}
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

                {/* Role Selection */}
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

                {/* Student Specific Information */}
                {formData.role === 'student' && (
                  <div className="njec-student-info-section">
                    <h4 className="njec-student-info-title">
                      <GraduationCap size={18} />
                      Student Information
                    </h4>
                    
                    {/* Phone & Student Number */}
                    <div className="njec-signup-form-grid">
                      <div className="njec-signup-form-group">
                        <label htmlFor="phone" className="njec-signup-form-label">
                          <Phone size={16} />
                          <span>Phone Number</span>
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+27 12 345 6789"
                          className={`njec-signup-input ${errors.phone ? 'error' : ''}`}
                          disabled={loading}
                        />
                        {errors.phone && (
                          <span className="njec-signup-error-message">{errors.phone}</span>
                        )}
                      </div>

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
                    </div>

                    {/* Parent Information */}
                    <div className="njec-signup-form-grid">
                      <div className="njec-signup-form-group">
                        <label htmlFor="parentName" className="njec-signup-form-label">
                          <User size={16} />
                          <span>Parent/Guardian Name</span>
                        </label>
                        <input
                          type="text"
                          id="parentName"
                          name="parentName"
                          value={formData.parentName}
                          onChange={handleChange}
                          placeholder="Parent/guardian full name"
                          className={`njec-signup-input ${errors.parentName ? 'error' : ''}`}
                          disabled={loading}
                        />
                        {errors.parentName && (
                          <span className="njec-signup-error-message">{errors.parentName}</span>
                        )}
                      </div>

                      <div className="njec-signup-form-group">
                        <label htmlFor="parentPhone" className="njec-signup-form-label">
                          <Phone size={16} />
                          <span>Parent/Guardian Phone</span>
                        </label>
                        <input
                          type="tel"
                          id="parentPhone"
                          name="parentPhone"
                          value={formData.parentPhone}
                          onChange={handleChange}
                          placeholder="+27 12 345 6789"
                          className={`njec-signup-input ${errors.parentPhone ? 'error' : ''}`}
                          disabled={loading}
                        />
                        {errors.parentPhone && (
                          <span className="njec-signup-error-message">{errors.parentPhone}</span>
                        )}
                      </div>
                    </div>

                    {/* Birth Date */}
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

                    {/* Subjects */}
                    <div className="njec-signup-form-group">
                      <label className="njec-signup-form-label">
                        <BookOpen size={18} />
                        <span>Select Subjects</span>
                      </label>
                      <div className="njec-subjects-grid">
                        {subjectsList.map(subject => (
                          <label key={subject} className="njec-subject-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.subjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              disabled={loading}
                            />
                            <span>{subject}</span>
                          </label>
                        ))}
                      </div>
                      {errors.subjects && (
                        <span className="njec-signup-error-message">{errors.subjects}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Password */}
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

                {/* Confirm Password */}
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

                {/* Terms and Conditions */}
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

                {/* Submit Button */}
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

                {/* Divider */}
                <div className="njec-signup-divider">
                  <span>Or continue with</span>
                </div>

                {/* Social Signup Buttons */}
                <div className="njec-signup-social">
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('google')}
                    className="njec-signup-social-button google"
                    disabled={loading}
                  >
                    <img src="https://www.google.com/favicon.ico" alt="Google" />
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSocialSignup('microsoft')}
                    className="njec-signup-social-button microsoft"
                    disabled={loading}
                  >
                    <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" />
                    Microsoft
                  </button>
                </div>

                {/* Login Link */}
                <div className="njec-login-link-section">
                  <User size={18} />
                  <span>Already have an account?</span>
                  <Link to="/login" className="njec-login-link">
                    Sign in here
                  </Link>
                </div>
              </form>

              {/* Trust Badge */}
              <div className="njec-signup-trust">
                <Shield size={20} />
                <span>Your data is securely protected</span>
              </div>
            </div>
          </div>

          {/* Right Side - Testimonial/Info */}
          <div className="njec-signup-info-section">
            <div className="njec-signup-info-card">
              {/* Quote Icon */}
              <div className="njec-signup-quote-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                </svg>
              </div>

              {/* Testimonial */}
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

              {/* CTA Section */}
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

              {/* Additional Info */}
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

            {/* Decorative Elements */}
            <div className="njec-signup-info-decoration">
              <div className="njec-signup-decoration-dot njec-signup-dot-1"></div>
              <div className="njec-signup-decoration-dot njec-signup-dot-2"></div>
              <div className="njec-signup-decoration-dot njec-signup-dot-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
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

      {/* Success Overlay */}
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
                <div className="njec-signup-progress-fill"></div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;