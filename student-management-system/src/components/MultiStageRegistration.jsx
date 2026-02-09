import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MultiStageRegistration.css';
import Logo from '../assets/Logo.jpg';
import { 
  User, BookOpen, CreditCard, CheckCircle, ChevronRight, 
  ArrowLeft, Loader, Shield, GraduationCap, DollarSign,
  Upload, Camera, Phone, Wallet, Check, X, AlertCircle,
  Info, Calendar, Hash, Mail, PhoneCall, FileCheck, Lock,
  Sparkles, Clock, Award, Target, Zap, Users, TrendingUp,
  Home, Settings, HelpCircle, Bell, Star, Award as Trophy,
  Target as Goal, Users as People, TrendingUp as ChartUp
} from 'lucide-react';

const MultiStageRegistration = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercentage, setProgressPercentage] = useState(33);
  const [showSuccess, setShowSuccess] = useState(false);

  // Subject data with prices in Maloti (M)
  const subjects = [
    { id: 'math', name: 'Mathematics', price: 450, description: 'Core mathematics curriculum', icon: '∫', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { id: 'physics', name: 'Physical Science', price: 500, description: 'Physics & Chemistry combined', icon: '⚛', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { id: 'sesotho', name: 'Sesotho', price: 350, description: 'Language & literature studies', icon: '📖', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { id: 'english', name: 'English', price: 400, description: 'English language mastery', icon: '🅰', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { id: 'economics', name: 'Economics', price: 480, description: 'Principles of economics', icon: '📈', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { id: 'accounts', name: 'Accounts', price: 520, description: 'Accounting principles', icon: '💰', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { id: 'biology', name: 'Biology', price: 470, description: 'Biological sciences', icon: '🧬', color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' },
    { id: 'computers', name: 'Computer Studies', price: 490, description: 'Computer literacy & programming', icon: '💻', color: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
    { id: 'geography', name: 'Geography', price: 430, description: 'Earth sciences & mapping', icon: '🗺', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  ];

  // Stage 1: Student Information
  const [studentInfo, setStudentInfo] = useState({
    full_name: '',
    student_number: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: 'Male',
    class_type: 'extra',
  });

  // Stage 2: Subject Selection
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  // Stage 3: Payment Information
  const [paymentInfo, setPaymentInfo] = useState({
    payment_method: 'mpesa',
    payment_number: '',
    payer_name: '',
    screenshot: null,
    screenshotPreview: null,
  });

  // Validation states
  const [errors, setErrors] = useState({});
  const [stageErrors, setStageErrors] = useState({});

  // Calculate total price
  const calculateTotal = () => {
    return selectedSubjects.reduce((total, subjectId) => {
      const subject = subjects.find(s => s.id === subjectId);
      return total + (subject?.price || 0);
    }, 0);
  };

  // Progress tracking
  useEffect(() => {
    const percentage = (currentStage / 3) * 100;
    setProgressPercentage(percentage);
  }, [currentStage]);

  // Handle stage 1 input changes
  const handleStudentInfoChange = (e) => {
    const { name, value } = e.target;
    setStudentInfo(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle subject selection
  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectId)) {
        return prev.filter(id => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  // Handle payment info changes
  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle screenshot upload
  const handleScreenshotUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setStageErrors(prev => ({ ...prev, screenshot: 'File size must be less than 5MB' }));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setStageErrors(prev => ({ ...prev, screenshot: 'Only JPEG, JPG, or PNG files allowed' }));
        return;
      }

      setPaymentInfo(prev => ({
        ...prev,
        screenshot: file,
        screenshotPreview: URL.createObjectURL(file)
      }));
      setStageErrors(prev => ({ ...prev, screenshot: '' }));
    }
  };

  // Validate current stage
  const validateStage = () => {
    const newErrors = {};

    if (currentStage === 1) {
      if (!studentInfo.full_name.trim()) newErrors.full_name = 'Full name is required';
      if (!studentInfo.email.trim()) newErrors.email = 'Email is required';
      if (!studentInfo.student_number.trim()) newErrors.student_number = 'Student number is required';
      if (studentInfo.student_number && !/^\d{9}$/.test(studentInfo.student_number)) {
        newErrors.student_number = 'Student number must be 9 digits';
      }
      if (!studentInfo.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!studentInfo.birth_date) newErrors.birth_date = 'Birth date is required';
    }

    if (currentStage === 2) {
      if (selectedSubjects.length === 0) {
        newErrors.subjects = 'Please select at least one subject';
      }
    }

    if (currentStage === 3) {
      if (!paymentInfo.payment_number.trim()) newErrors.payment_number = 'Payment number is required';
      if (!paymentInfo.payer_name.trim()) newErrors.payer_name = 'Payer name is required';
      if (!paymentInfo.screenshot) newErrors.screenshot = 'Payment screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate to next stage
  const goToNextStage = () => {
    if (validateStage()) {
      if (currentStage < 3) {
        setCurrentStage(prev => prev + 1);
      } else {
        handleFinalSubmit();
      }
    }
  };

  // Navigate to previous stage
  const goToPreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(prev => prev - 1);
    }
  };

  // Final submission
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    
    try {
      const registrationData = {
        ...studentInfo,
        selected_subjects: selectedSubjects,
        total_amount: calculateTotal(),
        grade_level: 'Grade 11',
        payment_method: paymentInfo.payment_method,
        payment_number: paymentInfo.payment_number,
        payer_name: paymentInfo.payer_name,
        enrollment_status: 'pending',
        registration_date: new Date().toISOString(),
        has_payment_proof: !!paymentInfo.screenshot
      };

      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Success
      setShowSuccess(true);

    } catch (error) {
      setStageErrors(prev => ({ 
        ...prev, 
        submission: 'Registration failed. Please try again.' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Loading Spinner Component
  const LoadingSpinner = () => (
    <div className="njec-spinner-container">
      <div className="njec-spinner">
        <div className="njec-spinner-inner">
          <div className="njec-spinner-dot"></div>
          <div className="njec-spinner-dot"></div>
          <div className="njec-spinner-dot"></div>
          <div className="njec-spinner-dot"></div>
        </div>
      </div>
      <p className="njec-spinner-text">Processing...</p>
    </div>
  );

  // Feature Card Component
  const FeatureCard = ({ icon: Icon, title, description, gradient, delay }) => (
    <div 
      className="njec-feature-card" 
      style={{ 
        animationDelay: `${delay}s`
      }}
    >
      <div className="njec-feature-icon" style={{ background: gradient }}>
        <Icon size={28} />
      </div>
      <div className="njec-feature-content">
        <h4 className="njec-feature-title">{title}</h4>
        <p className="njec-feature-description">{description}</p>
      </div>
    </div>
  );

  // Render stage 1: Student Information
  const renderStage1 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon animated-gradient">
          <User size={32} />
        </div>
        <div className="njec-stage-header-text">
          <h3 className="njec-stage-title">Student Information</h3>
          <p className="njec-stage-subtitle">Please provide your personal details to begin the registration process</p>
        </div>
      </div>

      {/* 2x2 Grid for Form Inputs */}
      <div className="njec-form-grid-2x2">
        <div className="njec-form-row">
          <div className="njec-form-group">
            <label className="njec-form-label">
              <User size={18} />
              Full Name *
            </label>
            <div className="njec-input-container">
              <input
                type="text"
                name="full_name"
                value={studentInfo.full_name}
                onChange={handleStudentInfoChange}
                className={`njec-form-input ${errors.full_name ? 'njec-input-error' : ''}`}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.full_name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="njec-form-group">
            <label className="njec-form-label">
              <Hash size={18} />
              Student Number *
            </label>
            <div className="njec-input-container">
              <input
                type="text"
                name="student_number"
                value={studentInfo.student_number}
                onChange={handleStudentInfoChange}
                className={`njec-form-input ${errors.student_number ? 'njec-input-error' : ''}`}
                placeholder="202400123"
                maxLength="9"
              />
              {errors.student_number && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.student_number}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="njec-form-row">
          <div className="njec-form-group">
            <label className="njec-form-label">
              <Mail size={18} />
              Email Address *
            </label>
            <div className="njec-input-container">
              <input
                type="email"
                name="email"
                value={studentInfo.email}
                onChange={handleStudentInfoChange}
                className={`njec-form-input ${errors.email ? 'njec-input-error' : ''}`}
                placeholder="student@example.com"
              />
              {errors.email && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="njec-form-group">
            <label className="njec-form-label">
              <PhoneCall size={18} />
              Phone Number *
            </label>
            <div className="njec-input-container">
              <input
                type="tel"
                name="phone"
                value={studentInfo.phone}
                onChange={handleStudentInfoChange}
                className={`njec-form-input ${errors.phone ? 'njec-input-error' : ''}`}
                placeholder="+266 5012 3456"
              />
              {errors.phone && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="njec-form-row">
          <div className="njec-form-group">
            <label className="njec-form-label">
              <Calendar size={18} />
              Date of Birth *
            </label>
            <div className="njec-input-container">
              <input
                type="date"
                name="birth_date"
                value={studentInfo.birth_date}
                onChange={handleStudentInfoChange}
                className={`njec-form-input ${errors.birth_date ? 'njec-input-error' : ''}`}
              />
              {errors.birth_date && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.birth_date}</span>
                </div>
              )}
            </div>
          </div>

          <div className="njec-form-group">
            <label className="njec-form-label">
              <User size={18} />
              Gender *
            </label>
            <select
              name="gender"
              value={studentInfo.gender}
              onChange={handleStudentInfoChange}
              className="njec-form-select"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Full-width radio group */}
      <div className="njec-form-group njec-full-width">
        <label className="njec-form-label">
          <GraduationCap size={18} />
          Class Type *
        </label>
        <div className="njec-radio-group-2x">
          <label className="njec-radio-label">
            <input
              type="radio"
              name="class_type"
              value="extra"
              checked={studentInfo.class_type === 'extra'}
              onChange={handleStudentInfoChange}
              className="njec-radio-input"
            />
            <span className="njec-radio-custom"></span>
            <span className="njec-radio-text">
              <span className="njec-radio-title">Extra Classes</span>
              <span className="njec-radio-description">Additional learning support</span>
            </span>
          </label>
          <label className="njec-radio-label">
            <input
              type="radio"
              name="class_type"
              value="supplementary"
              checked={studentInfo.class_type === 'supplementary'}
              onChange={handleStudentInfoChange}
              className="njec-radio-input"
            />
            <span className="njec-radio-custom"></span>
            <span className="njec-radio-text">
              <span className="njec-radio-title">Supplementary Classes</span>
              <span className="njec-radio-description">Remedial learning support</span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  // Render stage 2: Subject Selection
  const renderStage2 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon animated-gradient">
          <BookOpen size={32} />
        </div>
        <div className="njec-stage-header-text">
          <h3 className="njec-stage-title">Subject Selection</h3>
          <p className="njec-stage-subtitle">Choose your Grade 11 subjects. Select at least one to continue</p>
        </div>
      </div>

      {errors.subjects && (
        <div className="njec-error-alert">
          <AlertCircle size={20} />
          <span>{errors.subjects}</span>
        </div>
      )}

      {/* 3x3 Grid for Subjects */}
      <div className="njec-subjects-grid-3x3">
        {subjects.map((subject, index) => (
          <div 
            key={subject.id}
            className={`njec-subject-card ${selectedSubjects.includes(subject.id) ? 'njec-subject-selected' : ''}`}
            onClick={() => toggleSubject(subject.id)}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="njec-subject-card-content">
              <div className="njec-subject-icon" style={{ background: subject.color }}>
                <span className="njec-subject-icon-text">{subject.icon}</span>
              </div>
              <div className="njec-subject-info">
                <div className="njec-subject-header">
                  <h4 className="njec-subject-name">{subject.name}</h4>
                  <div className="njec-subject-checkbox">
                    {selectedSubjects.includes(subject.id) ? (
                      <CheckCircle size={20} className="njec-check-icon" />
                    ) : (
                      <div className="njec-checkbox-empty"></div>
                    )}
                  </div>
                </div>
                <p className="njec-subject-description">{subject.description}</p>
                <div className="njec-subject-footer">
                  <div className="njec-subject-price">
                    <DollarSign size={16} />
                    <span>M {subject.price.toLocaleString()}</span>
                  </div>
                  <div className="njec-subject-badge">
                    {subject.price <= 400 ? 'Standard' : subject.price <= 480 ? 'Enhanced' : 'Premium'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="njec-total-summary">
        <div className="njec-summary-header">
          <h4 className="njec-summary-title">Registration Summary</h4>
          <div className="njec-summary-badge">
            <BookOpen size={16} />
            <span>{selectedSubjects.length} Subject{selectedSubjects.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="njec-summary-details">
          <div className="njec-summary-item">
            <span className="njec-summary-label">Selected Subjects</span>
            <span className="njec-summary-value">{selectedSubjects.length}</span>
          </div>
          <div className="njec-summary-item">
            <span className="njec-summary-label">Total Amount</span>
            <span className="njec-summary-value njec-total-amount">M {calculateTotal().toLocaleString()}</span>
          </div>
          <div className="njec-summary-footer">
            <div className="njec-summary-note">
              <Info size={16} />
              <span>All prices include study materials and resources</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render stage 3: Payment Information
  const renderStage3 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon animated-gradient">
          <CreditCard size={32} />
        </div>
        <div className="njec-stage-header-text">
          <h3 className="njec-stage-title">Payment Verification</h3>
          <p className="njec-stage-subtitle">Complete your payment and upload proof for verification</p>
        </div>
      </div>

      <div className="njec-payment-section">
        <div className="njec-payment-methods">
          <h4 className="njec-section-title">
            <Wallet size={20} />
            Select Payment Method
          </h4>
          <div className="njec-payment-options-2x">
            <label className="njec-payment-option">
              <input
                type="radio"
                name="payment_method"
                value="mpesa"
                checked={paymentInfo.payment_method === 'mpesa'}
                onChange={handlePaymentInfoChange}
                className="njec-payment-radio"
              />
              <div className="njec-payment-option-content">
                <div className="njec-payment-icon">
                  <Phone size={24} />
                </div>
                <div className="njec-payment-info">
                  <h5>M-Pesa</h5>
                  <p>Send to: 5012 3456</p>
                  <div className="njec-payment-reference">
                    <span>Reference:</span>
                    <code>{studentInfo.student_number || 'STUDENT#'}</code>
                  </div>
                </div>
              </div>
            </label>

            <label className="njec-payment-option">
              <input
                type="radio"
                name="payment_method"
                value="ecocash"
                checked={paymentInfo.payment_method === 'ecocash'}
                onChange={handlePaymentInfoChange}
                className="njec-payment-radio"
              />
              <div className="njec-payment-option-content">
                <div className="njec-payment-icon">
                  <Wallet size={24} />
                </div>
                <div className="njec-payment-info">
                  <h5>Eco-Cash</h5>
                  <p>Send to: 6012 3456</p>
                  <div className="njec-payment-reference">
                    <span>Reference:</span>
                    <code>{studentInfo.student_number || 'STUDENT#'}</code>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 2x2 Grid for Payment Details */}
        <div className="njec-payment-details">
          <div className="njec-form-grid-2x2">
            <div className="njec-form-row">
              <div className="njec-form-group">
                <label className="njec-form-label">
                  <Phone size={18} />
                  Payment Number *
                </label>
                <div className="njec-input-container">
                  <input
                    type="text"
                    name="payment_number"
                    value={paymentInfo.payment_number}
                    onChange={handlePaymentInfoChange}
                    className={`njec-form-input ${errors.payment_number ? 'njec-input-error' : ''}`}
                    placeholder="Phone number used for payment"
                  />
                  {errors.payment_number && (
                    <div className="njec-error-message">
                      <AlertCircle size={14} />
                      <span>{errors.payment_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="njec-form-group">
                <label className="njec-form-label">
                  <User size={18} />
                  Payer Name *
                </label>
                <div className="njec-input-container">
                  <input
                    type="text"
                    name="payer_name"
                    value={paymentInfo.payer_name}
                    onChange={handlePaymentInfoChange}
                    className={`njec-form-input ${errors.payer_name ? 'njec-input-error' : ''}`}
                    placeholder="Name as shown on payment"
                  />
                  {errors.payer_name && (
                    <div className="njec-error-message">
                      <AlertCircle size={14} />
                      <span>{errors.payer_name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="njec-form-group njec-full-width">
            <label className="njec-form-label">
              <Upload size={18} />
              Payment Proof *
            </label>
            <div className="njec-upload-container">
              <div className="njec-upload-area">
                <input
                  type="file"
                  id="screenshot-upload"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="njec-upload-input"
                />
                <label htmlFor="screenshot-upload" className="njec-upload-label">
                  <div className="njec-upload-icon">
                    <Camera size={40} />
                  </div>
                  <div className="njec-upload-text">
                    <h5>Upload Payment Screenshot</h5>
                    <p>Drag & drop or click to upload your payment confirmation</p>
                    <p className="njec-upload-note">Supports: JPEG, PNG, JPG (Max 5MB)</p>
                  </div>
                </label>
              </div>
              
              {paymentInfo.screenshotPreview && (
                <div className="njec-screenshot-preview">
                  <div className="njec-screenshot-header">
                    <span className="njec-screenshot-title">Uploaded Proof</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentInfo(prev => ({
                          ...prev,
                          screenshot: null,
                          screenshotPreview: null
                        }));
                      }}
                      className="njec-remove-screenshot"
                      aria-label="Remove screenshot"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <img 
                    src={paymentInfo.screenshotPreview} 
                    alt="Payment proof" 
                    className="njec-screenshot-image"
                  />
                </div>
              )}
              {errors.screenshot && (
                <div className="njec-error-message">
                  <AlertCircle size={14} />
                  <span>{errors.screenshot}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2x2 Grid for Final Summary */}
      <div className="njec-final-summary">
        <div className="njec-summary-grid-2x2">
          <div className="njec-summary-card summary-highlight">
            <div className="njec-summary-card-header">
              <FileCheck size={24} />
              <h4>Registration Details</h4>
            </div>
            <div className="njec-summary-card-content">
              <div className="njec-summary-row">
                <span>Student Number</span>
                <strong>{studentInfo.student_number || 'Not provided'}</strong>
              </div>
              <div className="njec-summary-row">
                <span>Total Subjects</span>
                <strong>{selectedSubjects.length}</strong>
              </div>
            </div>
          </div>

          <div className="njec-summary-card summary-highlight">
            <div className="njec-summary-card-header">
              <CreditCard size={24} />
              <h4>Payment Details</h4>
            </div>
            <div className="njec-summary-card-content">
              <div className="njec-summary-row">
                <span>Payment Method</span>
                <span className="njec-payment-badge">
                  {paymentInfo.payment_method === 'mpesa' ? 'M-Pesa' : 'Eco-Cash'}
                </span>
              </div>
              <div className="njec-summary-row">
                <span>Payer Name</span>
                <strong>{paymentInfo.payer_name || 'Not provided'}</strong>
              </div>
            </div>
          </div>

          <div className="njec-summary-card total-card" style={{ gridColumn: '1 / -1' }}>
            <div className="njec-summary-card-content">
              <div className="njec-total-display">
                <div className="njec-total-label">
                  <DollarSign size={24} />
                  <span>Total Amount Due</span>
                </div>
                <div className="njec-total-amount">
                  M {calculateTotal().toLocaleString()}
                </div>
              </div>
              <div className="njec-summary-note">
                <Info size={16} />
                <span>Payment confirmation may take 24-48 hours to process</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => (
    <div className="njec-modal-overlay">
      <div className="njec-success-modal">
        <div className="njec-success-icon animated-success">
          <CheckCircle size={72} />
        </div>
        <div className="njec-success-content">
          <h3 className="njec-success-title">Registration Complete!</h3>
          <p className="njec-success-message">
            Your registration has been successfully submitted and is now pending administrative approval.
            You will receive a confirmation email within 24 hours.
          </p>
          
          {/* 2x2 Grid for Success Details */}
          <div className="njec-success-grid-2x2">
            <div className="njec-success-detail">
              <span className="njec-detail-label">Student Number</span>
              <span className="njec-detail-value">{studentInfo.student_number}</span>
            </div>
            <div className="njec-success-detail">
              <span className="njec-detail-label">Total Subjects</span>
              <span className="njec-detail-value">{selectedSubjects.length}</span>
            </div>
            <div className="njec-success-detail">
              <span className="njec-detail-label">Total Amount</span>
              <span className="njec-detail-value">M {calculateTotal().toLocaleString()}</span>
            </div>
            <div className="njec-success-detail">
              <span className="njec-detail-label">Current Status</span>
              <span className="njec-status-badge">
                <Clock size={14} />
                Pending Approval
              </span>
            </div>
          </div>

          <div className="njec-success-actions">
            <button
              onClick={() => {
                setShowSuccess(false);
                setStudentInfo({
                  full_name: '',
                  student_number: '',
                  email: '',
                  phone: '',
                  birth_date: '',
                  gender: 'Male',
                  class_type: 'extra',
                });
                setSelectedSubjects([]);
                setPaymentInfo({
                  payment_method: 'mpesa',
                  payment_number: '',
                  payer_name: '',
                  screenshot: null,
                  screenshotPreview: null,
                });
                setCurrentStage(1);
                setErrors({});
              }}
              className="njec-btn njec-btn-primary"
            >
              Register Another Student
            </button>
            <button
              onClick={() => setShowSuccess(false)}
              className="njec-btn njec-btn-outline"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Feature cards data
  const features = [
    { icon: Shield, title: 'Secure & Encrypted', description: 'Bank-level security for all your data', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { icon: Trophy, title: 'Quality Education', description: 'Certified instructors & modern curriculum', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: People, title: 'Student Support', description: '24/7 academic support available', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { icon: ChartUp, title: 'Proven Results', description: '95% student satisfaction rate', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { icon: Target, title: 'Focused Learning', description: 'Personalized study plans for each student', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { icon: Zap, title: 'Quick Progress', description: 'Accelerated learning techniques', gradient: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)' },
  ];

  return (
    <div className="njec-registration-container">
      {/* Animated Background */}
      <div className="njec-animated-bg">
        <div className="njec-bg-shape njec-bg-shape-1"></div>
        <div className="njec-bg-shape njec-bg-shape-2"></div>
        <div className="njec-bg-shape njec-bg-shape-3"></div>
        <div className="njec-bg-shape njec-bg-shape-4"></div>
      </div>

      {/* Main Grid Container */}
      <div className="njec-grid-container">
        
        {/* Row 1: Header */}
        <div className="njec-grid-header">
          <div className="njec-logo-section">
            <div className="njec-logo-wrapper">
              <img src={Logo} alt="NJEC Logo" className="njec-logo" />
              <div className="njec-logo-text">
                <h2 className="njec-logo-title">NJEC</h2>
                <p className="njec-logo-subtitle">New Jerusalem Extra Classes</p>
              </div>
            </div>
          </div>
          <div className="njec-header-content">
            <h1 className="njec-main-title">Grade 11 Registration Portal</h1>
            <p className="njec-main-subtitle">
              Complete your registration in three simple steps. All fields marked with * are required.
            </p>
          </div>
        </div>

        {/* Row 2: Main Content Grid - 2x2 Layout */}
        <div className="njec-main-grid-2x2">
          
          {/* Top Left: Progress & Navigation */}
          <div className="njec-grid-section progress-section">
            <div className="njec-progress-section">
              <div className="njec-progress-header">
                <h3 className="njec-progress-title">Registration Progress</h3>
                <span className="njec-progress-percentage">{progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="njec-progress-bar">
                <div 
                  className="njec-progress-fill" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              
              <div className="njec-steps">
                {[1, 2, 3].map(step => (
                  <div 
                    key={step} 
                    className={`njec-step ${currentStage === step ? 'njec-step-active' : ''} ${currentStage > step ? 'njec-step-completed' : ''}`}
                  >
                    <div className="njec-step-indicator">
                      <div className="njec-step-circle">
                        {currentStage > step ? (
                          <Check size={16} />
                        ) : (
                          <span>{step}</span>
                        )}
                      </div>
                      {step < 3 && <div className="njec-step-connector"></div>}
                    </div>
                    <div className="njec-step-content">
                      <div className="njec-step-number">Step {step}</div>
                      <div className="njec-step-name">
                        {step === 1 && 'Student Info'}
                        {step === 2 && 'Subjects'}
                        {step === 3 && 'Payment'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Stage Info */}
            <div className="njec-current-stage">
              <div className="njec-stage-indicator">
                <div className="njec-stage-badge">
                  <Sparkles size={16} />
                  <span>Current Step</span>
                </div>
                <h4 className="njec-stage-name">
                  {currentStage === 1 && 'Student Information'}
                  {currentStage === 2 && 'Subject Selection'}
                  {currentStage === 3 && 'Payment Verification'}
                </h4>
              </div>
              <div className="njec-stage-help">
                <Lock size={16} />
                <span>Your information is protected with 256-bit encryption</span>
              </div>
            </div>
          </div>

          {/* Top Right: Main Form Content */}
          <div className="njec-grid-section form-section">
            <div className="njec-form-container">
              {currentStage === 1 && renderStage1()}
              {currentStage === 2 && renderStage2()}
              {currentStage === 3 && renderStage3()}

              {/* Submission Error */}
              {stageErrors.submission && (
                <div className="njec-submission-error">
                  <AlertCircle size={20} />
                  <span>{stageErrors.submission}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Left: Navigation Buttons */}
          <div className="njec-grid-section navigation-section">
            <div className="njec-navigation-buttons">
              <div className="njec-nav-left">
                {currentStage > 1 && (
                  <button
                    type="button"
                    onClick={goToPreviousStage}
                    className="njec-btn njec-btn-secondary"
                    disabled={isLoading}
                  >
                    <ArrowLeft size={20} />
                    <span>Previous</span>
                  </button>
                )}
              </div>
              
              <div className="njec-nav-right">
                <button
                  type="button"
                  onClick={goToNextStage}
                  className="njec-btn njec-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <span>
                        {currentStage === 3 ? 'Complete Registration' : 'Continue'}
                      </span>
                      <ChevronRight size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Right: Features Grid */}
          <div className="njec-grid-section features-section">
            <div className="njec-features-grid-2x2">
              <div className="njec-features-header">
                <h3 className="njec-features-title">
                  <Goal size={24} />
                  Why Choose NJEC?
                </h3>
                <p className="njec-features-subtitle">Experience excellence in education</p>
              </div>
              <div className="njec-features-container-2x2">
                {features.slice(0, 4).map((feature, index) => (
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
            </div>
          </div>

        </div>   
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="njec-loading-overlay">
          <div className="njec-loading-modal">
            <div className="njec-loading-spinner">
              <div className="njec-loading-circle"></div>
              <div className="njec-loading-circle"></div>
              <div className="njec-loading-circle"></div>
            </div>
            <div className="njec-loading-content">
              <h3 className="njec-loading-title">Submitting Registration</h3>
              <p className="njec-loading-text">Please wait while we process your information...</p>
              <div className="njec-loading-progress">
                <div className="njec-loading-progress-bar"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && <SuccessModal />}
    </div>
  );
};

export default MultiStageRegistration;