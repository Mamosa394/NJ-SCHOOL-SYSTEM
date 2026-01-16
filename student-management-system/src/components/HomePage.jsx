import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homepage.css';
import Logo from '../assets/Logo.jpg'; 
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Award,
  ChevronRight,
  Shield,
  Clock,
  Target,
  Star,
  CheckCircle,
  TrendingUp,
  BookMarked,
  UserCheck,
  Trophy
} from 'lucide-react';

const WelcomeNJEC = () => {
  const navigate = useNavigate();
  const [loadingNJEC, setLoadingNJEC] = useState(false);
  const [targetNJEC, setTargetNJEC] = useState('');
  const [fadeInNJEC, setFadeInNJEC] = useState(false);

  useEffect(() => {
    // Trigger initial animation
    setTimeout(() => setFadeInNJEC(true), 100);
  }, []);

  const handleNavigateNJEC = (path) => {
    if (loadingNJEC) return;
    
    setLoadingNJEC(true);
    setTargetNJEC(path);
    
    // Button click animation
    const button = document.querySelector(`[data-njec-path="${path}"]`);
    if (button) {
      button.style.transform = 'scale(0.95)';
    }
    
    setTimeout(() => {
      navigate(path);
    }, 1500);
  };

  const featuresNJEC = [
    { icon: <GraduationCap size={24} />, text: 'Expert Faculty' },
    { icon: <BookOpen size={24} />, text: 'Interactive Classes' },
    { icon: <Users size={24} />, text: 'Personalized Attention' },
    { icon: <Award size={24} />, text: 'Proven Results' },
  ];

  const benefitsNJEC = [
    { icon: <Shield size={20} />, text: 'Secure Platform' },
    { icon: <Clock size={20} />, text: '24/7 Access' },
    { icon: <Target size={20} />, text: 'Goal-Oriented' },
    { icon: <Star size={20} />, text: 'Premium Quality' },
  ];

  const highlightsNJEC = [
    'Personalized Learning Paths',
    'Regular Progress Reports',
    'Interactive Study Materials',
    'Expert Doubt Resolution'
  ];

  const statsNJEC = [
    { icon: <TrendingUp size={20} />, value: '500+', label: 'Students' },
    { icon: <Trophy size={20} />, value: '98%', label: 'Success Rate' },
    { icon: <UserCheck size={20} />, value: '50+', label: 'Expert Tutors' },
    { icon: <BookMarked size={20} />, value: '15+', label: 'Subjects' },
  ];

  return (
    <div className={`njec-welcome-main ${loadingNJEC ? 'njec-blurred-effect' : ''} ${fadeInNJEC ? 'njec-loaded' : ''}`}>
      {/* Animated Background Elements */}
      <div className="njec-bg-shapes">
        <div className="njec-shape njec-shape-1"></div>
        <div className="njec-shape njec-shape-2"></div>
        <div className="njec-shape njec-shape-3"></div>
        <div className="njec-shape njec-shape-4"></div>
      </div>

      <div className="njec-container-wrapper">
        {/* Left Content Section */}
        <div className="njec-content-panel">
          {/* Logo/Brand */}
          <div className="njec-brand-header">
            <div className="njec-logo-wrapper">
              <span className="njec-logo-text">NJEC</span>
              <GraduationCap size={32} className="njec-logo-icon" />
            </div>
            <div className="njec-accent-line"></div>
          </div>

          {/* Main Headline */}
          <div className="njec-headline-section">
            <h1 className="njec-main-headline">
              <span className="njec-gradient-text">NEW JERUSALEM</span>
              <span className="njec-highlight-text">EXTRA CLASSES</span>
            </h1>
            <h2 className="njec-sub-headline">
              Empowering <span className="njec-accent-text">Future Leaders</span> Through Excellence
            </h2>
          </div>

          {/* Description */}
          <div className="njec-description-card">
            <p className="njec-description-text">
              A premier educational platform offering personalized learning experiences, 
              expert mentorship, and comprehensive academic support for students 
              aspiring to achieve remarkable success.
            </p>
          </div>
        
          {/* Features Grid */}
          <div className="njec-features-grid">
            {featuresNJEC.map((feature, index) => (
              <div 
                key={`feature-${index}`} 
                className="njec-feature-card"
                data-njec-delay={index}
              >
                <div className="njec-feature-icon-wrapper">
                  {feature.icon}
                </div>
                <span className="njec-feature-label">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Highlights List */}
          <div className="njec-highlights-section">
            <h3 className="njec-highlights-title">Why Choose NJEC?</h3>
            <div className="njec-highlights-list">
              {highlightsNJEC.map((highlight, index) => (
                <div key={`highlight-${index}`} className="njec-highlight-item">
                  <CheckCircle size={20} className="njec-check-icon" />
                  <span className="njec-highlight-text">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Benefits Bar */}
          <div className="njec-benefits-bar">
            {benefitsNJEC.map((benefit, index) => (
              <div key={`benefit-${index}`} className="njec-benefit-item">
                <div className="njec-benefit-icon">
                  {benefit.icon}
                </div>
                <span className="njec-benefit-text">{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="njec-action-buttons">
            <button
              data-njec-path="/login"
              onClick={() => handleNavigateNJEC('/login')}
              disabled={loadingNJEC}
              className="njec-btn njec-btn-primary"
            >
              <span className="njec-btn-text">
                {loadingNJEC && targetNJEC === '/login' ? 'Redirecting...' : 'Login to Dashboard'}
              </span>
              {loadingNJEC && targetNJEC === '/login' ? (
                <div className="njec-spinner"></div>
              ) : (
                <ChevronRight size={20} className="njec-chevron-icon" />
              )}
            </button>
            
            <button
              data-njec-path="/signup"
              onClick={() => handleNavigateNJEC('/signup')}
              disabled={loadingNJEC}
              className="njec-btn njec-btn-secondary"
            >
              <span className="njec-btn-text">
                {loadingNJEC && targetNJEC === '/signup' ? 'Processing...' : 'Create Account'}
              </span>
              {loadingNJEC && targetNJEC === '/signup' && <div className="njec-spinner njec-spinner-secondary"></div>}
            </button>
          </div>

          {/* Stats/Info */}
          <div className="njec-stats-container">
            {statsNJEC.map((stat, index) => (
              <div key={`stat-${index}`} className="njec-stat-item">
                <div className="njec-stat-icon-wrapper">
                  {stat.icon}
                </div>
                <div className="njec-stat-content">
                  <span className="njec-stat-value">{stat.value}</span>
                  <span className="njec-stat-label">{stat.label}</span>
                </div>
                {index < statsNJEC.length - 1 && (
                  <div className="njec-stat-divider"></div>
                )}
              </div>
            ))}
          </div>

          {/* Trust Badge */}
          <div className="njec-trust-badge">
            <div className="njec-trust-icon-wrapper">
              <Shield size={24} />
            </div>
            <div className="njec-trust-content">
              <span className="njec-trust-title">Trusted & Secure Platform</span>
              <span className="njec-trust-subtitle">Enterprise-grade security & privacy protection</span>
            </div>
          </div>
        </div>

        {/* Right Visual Section - FIXED POSITION */}
        <div className="njec-visual-panel">
          <div className="njec-hero-image-container">
            <div className="njec-image-frame">
              <img 
                src={Logo} 
                alt="New Jerusalem Campus" 
                className="njec-hero-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800";
                }}
              />
              <div className="njec-image-overlay"></div>
              <div className="njec-image-glow"></div>
            </div>
            
            {/* Floating Element */}
            <div className="njec-floating-element">
              <div className="njec-floating-icon">
                <Star size={20} />
              </div>
              <span className="njec-floating-text">Excellence Since 2010</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="njec-dots-decoration"></div>
          <div className="njec-ring-decoration"></div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loadingNJEC && (
        <div className="njec-loading-overlay">
          <div className="njec-loading-content">
            <div className="njec-loading-spinner">
              <div className="njec-spinner-ring njec-spinner-ring-1"></div>
              <div className="njec-spinner-ring njec-spinner-ring-2"></div>
              <div className="njec-spinner-ring njec-spinner-ring-3"></div>
            </div>
            <p className="njec-loading-text">
              Taking you to {targetNJEC === '/login' ? 'Login' : 'Sign Up'}...
            </p>
          </div>
        </div>
      )}

      {/* Bottom Wave Decoration */}
      <div className="njec-wave-decoration">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default WelcomeNJEC;