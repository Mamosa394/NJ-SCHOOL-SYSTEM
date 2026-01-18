import React, { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import '../styles/login.css';
import Logo from "../assets/Logo.jpg"

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // For demo, navigate to dashboard
      navigate('/admin');
    }, 2000);
  };

  const handleForgotPassword = () => {
    // Navigate to forgot password page
    navigate('/forgot-password');
  };

  const handleSocialLogin = (provider) => {
    console.log(`Logging in with ${provider}`);
    // Implement social login logic
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
          {/* Back Button */}
          <button 
            onClick={() => navigate('/')}
            className="njec-back-button"
          >
            ← Back to Home
          </button>

          {/* Logo/Brand */}
          <div className="njec-login-header">
            <div className="njec-login-logo">
              <div className="njec-login-logo-icon">
                <img src= {Logo} className="njec-login-logo-icon"/>
              </div>
              <div className="njec-login-brand">
                <h1>NJEC</h1>
                <span>New Jerusalem Extra Classes</span>
              </div>
            </div>
          </div>

          {/* Form Container */}
          <div className="njec-form-container">
            <div className="njec-form-header">
              <h2>Welcome back</h2>
              <p>Please enter your Account details</p>
            </div>

            <form onSubmit={handleSubmit} className="njec-login-form">
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
                  onClick={() => handleSocialLogin('google')}
                  className="njec-social-button google"
                  disabled={loading}
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('microsoft')}
                  className="njec-social-button microsoft"
                  disabled={loading}
                >
                  <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" />
                  Microsoft
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

            {/* Trust Badge */}
            <div className="njec-login-trust">
              <Shield size={20} />
              <span>Your data is securely protected</span>
            </div>
          </div>
        </div>

        {/* Right Side - Testimonial/Info */}
        <div className="njec-login-info-section">
          <div className="njec-info-card">
            {/* Quote Icon */}
            <div className="njec-quote-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
            </div>

            {/* Testimonial */}
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

            {/* CTA Section */}
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

            {/* Additional Info */}
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

          {/* Decorative Elements */}
          <div className="njec-info-decoration">
            <div className="njec-decoration-dot dot-1"></div>
            <div className="njec-decoration-dot dot-2"></div>
            <div className="njec-decoration-dot dot-3"></div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
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