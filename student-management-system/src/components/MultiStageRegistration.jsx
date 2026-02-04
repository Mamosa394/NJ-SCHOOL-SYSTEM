import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/MultiStageRegistration.css';
import Logo from '../assets/Logo.jpg';
import { 
  User, BookOpen, CreditCard, CheckCircle, ChevronRight, 
  ArrowLeft, Loader, Shield, GraduationCap, DollarSign,
  Upload, Camera, Phone, Wallet, Check, X, AlertCircle
} from 'lucide-react';

const MultiStageRegistration = () => {
  const [currentStage, setCurrentStage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState('pending');
  const [progressPercentage, setProgressPercentage] = useState(33);
  const [showSuccess, setShowSuccess] = useState(false);

  // Subject data with prices in Maloti (M)
  const subjects = [
    { id: 'math', name: 'Mathematics', price: 450, description: 'Core mathematics for Grade 11' },
    { id: 'physics', name: 'Physical Science', price: 500, description: 'Physics and Chemistry combined' },
    { id: 'sesotho', name: 'Sesotho', price: 350, description: 'Sesotho language and literature' },
    { id: 'english', name: 'English', price: 400, description: 'English language and literature' },
    { id: 'economics', name: 'Economics', price: 480, description: 'Principles of economics' },
    { id: 'accounts', name: 'Accounts', price: 520, description: 'Accounting principles and practices' },
    { id: 'biology', name: 'Biology', price: 470, description: 'Biological sciences' },
  ];

  // Stage 1: Student Information
  const [studentInfo, setStudentInfo] = useState({
    full_name: '',
    student_number: '',
    email: '',
    password: 'Student@123',
    confirm_password: 'Student@123',
    phone: '',
    birth_date: '',
    gender: 'Male',
    grade_level: 'Grade 11',
    class_type: 'extra', // 'extra' or 'supplementary'
  });

  // Stage 2: Subject Selection
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [registrationType, setRegistrationType] = useState('extra'); // 'extra' or 'supplementary'
  
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
  const updateProgress = () => {
    const percentage = (currentStage / 3) * 100;
    setProgressPercentage(percentage);
  };

  useEffect(() => {
    updateProgress();
  }, [currentStage]);

  // Handle stage 1 input changes
  const handleStudentInfoChange = (e) => {
    const { name, value } = e.target;
    setStudentInfo(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
      if (studentInfo.phone && !/^\+?[\d\s\-()]{10,}$/.test(studentInfo.phone)) {
        newErrors.phone = 'Enter a valid phone number';
      }
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
      // Prepare final data
      const registrationData = {
        // Student information
        ...studentInfo,
        
        // Academic information
        selected_subjects: selectedSubjects,
        registration_type: registrationType,
        total_amount: calculateTotal(),
        grade_level: 'Grade 11', // Fixed for now
        
        // Payment information
        payment_method: paymentInfo.payment_method,
        payment_number: paymentInfo.payment_number,
        payer_name: paymentInfo.payer_name,
        
        // System fields
        enrollment_status: 'pending',
        registration_date: new Date().toISOString(),
        
        // We'll handle screenshot upload separately
        has_payment_proof: !!paymentInfo.screenshot
      };

      // Log to MongoDB (commented for now)
      /*
      await axios.post('http://localhost:5000/api/logs/registration', {
        action: 'registration_started',
        student_email: studentInfo.email,
        student_number: studentInfo.student_number,
        timestamp: new Date().toISOString(),
        data: registrationData
      });
      */

      // Submit to main registration endpoint
      const response = await axios.post(
        'http://localhost:5000/api/students/register',
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      // Upload screenshot if exists
      if (paymentInfo.screenshot) {
        const formData = new FormData();
        formData.append('screenshot', paymentInfo.screenshot);
        formData.append('student_id', response.data.data?.id || studentInfo.student_number);
        formData.append('registration_id', response.data.registration_id);

        /*
        await axios.post(
          'http://localhost:5000/api/students/upload-payment-proof',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        */
      }

      // Success
      setRegistrationStatus('submitted');
      setShowSuccess(true);

      // Log success
      /*
      await axios.post('http://localhost:5000/api/logs/registration', {
        action: 'registration_completed',
        student_email: studentInfo.email,
        student_number: studentInfo.student_number,
        status: 'pending_approval',
        timestamp: new Date().toISOString()
      });
      */

    } catch (error) {
      // Log error
      /*
      await axios.post('http://localhost:5000/api/logs/errors', {
        action: 'registration_failed',
        student_email: studentInfo.email,
        student_number: studentInfo.student_number,
        error: error.response?.data || error.message,
        timestamp: new Date().toISOString()
      });
      */

      setStageErrors(prev => ({ 
        ...prev, 
        submission: error.response?.data?.error || 'Registration failed. Please try again.' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Render stage 1: Student Information
  const renderStage1 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon">
          <User size={28} />
        </div>
        <div>
          <h3 className="njec-stage-title">Student Information</h3>
          <p className="njec-stage-subtitle">Enter your personal details</p>
        </div>
      </div>

      <div className="njec-form-grid">
        <div className="njec-form-group">
          <label className="njec-form-label">Full Name *</label>
          <input
            type="text"
            name="full_name"
            value={studentInfo.full_name}
            onChange={handleStudentInfoChange}
            className={`njec-form-input ${errors.full_name ? 'njec-input-error' : ''}`}
            placeholder="Enter your full name"
          />
          {errors.full_name && <div className="njec-error-message">{errors.full_name}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Student Number *</label>
          <input
            type="text"
            name="student_number"
            value={studentInfo.student_number}
            onChange={handleStudentInfoChange}
            className={`njec-form-input ${errors.student_number ? 'njec-input-error' : ''}`}
            placeholder="202400123 (9 digits)"
            maxLength="9"
          />
          {errors.student_number && <div className="njec-error-message">{errors.student_number}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Email Address *</label>
          <input
            type="email"
            name="email"
            value={studentInfo.email}
            onChange={handleStudentInfoChange}
            className={`njec-form-input ${errors.email ? 'njec-input-error' : ''}`}
            placeholder="student@example.com"
          />
          {errors.email && <div className="njec-error-message">{errors.email}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={studentInfo.phone}
            onChange={handleStudentInfoChange}
            className={`njec-form-input ${errors.phone ? 'njec-input-error' : ''}`}
            placeholder="+266 5012 3456"
          />
          {errors.phone && <div className="njec-error-message">{errors.phone}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Birth Date *</label>
          <input
            type="date"
            name="birth_date"
            value={studentInfo.birth_date}
            onChange={handleStudentInfoChange}
            className={`njec-form-input ${errors.birth_date ? 'njec-input-error' : ''}`}
          />
          {errors.birth_date && <div className="njec-error-message">{errors.birth_date}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Gender *</label>
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

        <div className="njec-form-group njec-full-width">
          <label className="njec-form-label">Class Type *</label>
          <div className="njec-radio-group">
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
              <span className="njec-radio-text">Extra Classes</span>
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
              <span className="njec-radio-text">Supplementary Classes</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  // Render stage 2: Subject Selection
  const renderStage2 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon">
          <BookOpen size={28} />
        </div>
        <div>
          <h3 className="njec-stage-title">Subject Selection</h3>
          <p className="njec-stage-subtitle">Choose your Grade 11 subjects</p>
        </div>
      </div>

      {errors.subjects && (
        <div className="njec-error-alert">
          <AlertCircle size={20} />
          <span>{errors.subjects}</span>
        </div>
      )}

      <div className="njec-subjects-grid">
        {subjects.map(subject => (
          <div 
            key={subject.id}
            className={`njec-subject-card ${selectedSubjects.includes(subject.id) ? 'njec-subject-selected' : ''}`}
            onClick={() => toggleSubject(subject.id)}
          >
            <div className="njec-subject-checkbox">
              {selectedSubjects.includes(subject.id) ? (
                <CheckCircle size={24} className="njec-check-icon" />
              ) : (
                <div className="njec-checkbox-empty"></div>
              )}
            </div>
            <div className="njec-subject-info">
              <h4 className="njec-subject-name">{subject.name}</h4>
              <p className="njec-subject-description">{subject.description}</p>
              <div className="njec-subject-price">
                <DollarSign size={16} />
                <span>M {subject.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="njec-total-summary">
        <div className="njec-total-item">
          <span className="njec-total-label">Selected Subjects:</span>
          <span className="njec-total-value">{selectedSubjects.length}</span>
        </div>
        <div className="njec-total-item">
          <span className="njec-total-label">Total Amount:</span>
          <span className="njec-total-value njec-total-amount">M {calculateTotal().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  // Render stage 3: Payment Information
  const renderStage3 = () => (
    <div className="njec-stage-content">
      <div className="njec-stage-header">
        <div className="njec-stage-icon">
          <CreditCard size={28} />
        </div>
        <div>
          <h3 className="njec-stage-title">Payment Information</h3>
          <p className="njec-stage-subtitle">Provide payment proof for verification</p>
        </div>
      </div>

      <div className="njec-payment-methods">
        <label className="njec-payment-method">
          <input
            type="radio"
            name="payment_method"
            value="mpesa"
            checked={paymentInfo.payment_method === 'mpesa'}
            onChange={handlePaymentInfoChange}
            className="njec-payment-radio"
          />
          <div className="njec-payment-method-content">
            <Phone size={24} />
            <div>
              <h4>M-Pesa</h4>
              <p>Send to: 5012 3456</p>
            </div>
          </div>
        </label>

        <label className="njec-payment-method">
          <input
            type="radio"
            name="payment_method"
            value="ecocash"
            checked={paymentInfo.payment_method === 'ecocash'}
            onChange={handlePaymentInfoChange}
            className="njec-payment-radio"
          />
          <div className="njec-payment-method-content">
            <Wallet size={24} />
            <div>
              <h4>Eco-Cash</h4>
              <p>Send to: 6012 3456</p>
            </div>
          </div>
        </label>
      </div>

      <div className="njec-form-grid">
        <div className="njec-form-group">
          <label className="njec-form-label">Payment Number *</label>
          <input
            type="text"
            name="payment_number"
            value={paymentInfo.payment_number}
            onChange={handlePaymentInfoChange}
            className={`njec-form-input ${errors.payment_number ? 'njec-input-error' : ''}`}
            placeholder="Phone number used for payment"
          />
          {errors.payment_number && <div className="njec-error-message">{errors.payment_number}</div>}
        </div>

        <div className="njec-form-group">
          <label className="njec-form-label">Payer Name *</label>
          <input
            type="text"
            name="payer_name"
            value={paymentInfo.payer_name}
            onChange={handlePaymentInfoChange}
            className={`njec-form-input ${errors.payer_name ? 'njec-input-error' : ''}`}
            placeholder="Name as shown on payment"
          />
          {errors.payer_name && <div className="njec-error-message">{errors.payer_name}</div>}
        </div>

        <div className="njec-form-group njec-full-width">
          <label className="njec-form-label">Payment Screenshot *</label>
          <div className="njec-upload-area">
            <input
              type="file"
              id="screenshot-upload"
              accept="image/*"
              onChange={handleScreenshotUpload}
              className="njec-upload-input"
            />
            <label htmlFor="screenshot-upload" className="njec-upload-label">
              <Upload size={24} />
              <div>
                <h4>Upload Payment Proof</h4>
                <p>JPEG, PNG or JPG (Max 5MB)</p>
              </div>
            </label>
            
            {paymentInfo.screenshotPreview && (
              <div className="njec-screenshot-preview">
                <img 
                  src={paymentInfo.screenshotPreview} 
                  alt="Payment proof" 
                  className="njec-screenshot-image"
                />
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
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
          {errors.screenshot && <div className="njec-error-message">{errors.screenshot}</div>}
        </div>
      </div>

      <div className="njec-payment-summary">
        <h4 className="njec-summary-title">Registration Summary</h4>
        <div className="njec-summary-details">
          <div className="njec-summary-item">
            <span>Total Subjects:</span>
            <span>{selectedSubjects.length}</span>
          </div>
          <div className="njec-summary-item">
            <span>Total Amount:</span>
            <span className="njec-summary-amount">M {calculateTotal().toLocaleString()}</span>
          </div>
          <div className="njec-summary-item">
            <span>Payment Method:</span>
            <span className="njec-payment-method-badge">
              {paymentInfo.payment_method === 'mpesa' ? 'M-Pesa' : 'Eco-Cash'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Success Modal
  const SuccessModal = () => (
    <div className="njec-modal-overlay">
      <div className="njec-success-modal">
        <div className="njec-success-icon">
          <CheckCircle size={64} />
        </div>
        <h3 className="njec-success-title">Registration Submitted!</h3>
        <p className="njec-success-message">
          Your registration has been received and is pending admin approval.
          You will be notified via email once approved.
        </p>
        <div className="njec-success-details">
          <div className="njec-success-detail">
            <span>Student Number:</span>
            <strong>{studentInfo.student_number}</strong>
          </div>
          <div className="njec-success-detail">
            <span>Total Subjects:</span>
            <strong>{selectedSubjects.length}</strong>
          </div>
          <div className="njec-success-detail">
            <span>Status:</span>
            <span className="njec-status-pending">Pending Approval</span>
          </div>
        </div>
        <button
          onClick={() => {
            setShowSuccess(false);
            // Reset form
            setStudentInfo({
              full_name: '',
              student_number: '',
              email: '',
              password: 'Student@123',
              confirm_password: 'Student@123',
              phone: '',
              birth_date: '',
              gender: 'Male',
              grade_level: 'Grade 11',
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
      </div>
    </div>
  );

  return (
    <div className="njec-registration-container">
      {/* Background Elements */}
      <div className="njec-bg-shapes">
        <div className="njec-shape njec-shape-1"></div>
        <div className="njec-shape njec-shape-2"></div>
        <div className="njec-shape njec-shape-3"></div>
      </div>

      <div className="njec-registration-wrapper">
        {/* Left Side - Brand & Progress */}
        <div className="njec-sidebar">
          <div className="njec-brand-section">
            <div className="njec-logo-display">
              <img src={Logo} alt="NJEC Logo" className="njec-logo-image" />
              <div className="njec-logo-text">
                <h2>NJEC</h2>
                <p>New Jerusalem Extra Classes</p>
              </div>
            </div>
            <div className="njec-accent-line"></div>
          </div>

          {/* Progress Tracker */}
          <div className="njec-progress-tracker">
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
                  <div className="njec-step-circle">
                    {currentStage > step ? (
                      <Check size={16} />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>
                  <div className="njec-step-label">
                    {step === 1 && 'Student Info'}
                    {step === 2 && 'Subjects'}
                    {step === 3 && 'Payment'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Stage Info */}
          <div className="njec-stage-info">
            <div className="njec-stage-indicator">
              <div className="njec-stage-number">Step {currentStage} of 3</div>
              <div className="njec-stage-name">
                {currentStage === 1 && 'Student Information'}
                {currentStage === 2 && 'Subject Selection'}
                {currentStage === 3 && 'Payment Verification'}
              </div>
            </div>
            <div className="njec-stage-help">
              <Shield size={20} />
              <span>Your information is secure and encrypted</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form Content */}
        <div className="njec-main-content">
          {/* Header */}
          <div className="njec-content-header">
            <h1 className="njec-main-title">Student Registration</h1>
            <p className="njec-main-subtitle">
              Complete all 3 steps to register for Grade 11 classes
            </p>
          </div>

          {/* Form Container */}
          <div className="njec-form-container">
            {currentStage === 1 && renderStage1()}
            {currentStage === 2 && renderStage2()}
            {currentStage === 3 && renderStage3()}

            {/* Error Display */}
            {stageErrors.submission && (
              <div className="njec-submission-error">
                <AlertCircle size={20} />
                <span>{stageErrors.submission}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="njec-navigation-buttons">
              {currentStage > 1 && (
                <button
                  type="button"
                  onClick={goToPreviousStage}
                  className="njec-btn njec-btn-secondary"
                  disabled={isLoading}
                >
                  <ArrowLeft size={20} />
                  <span>Previous Step</span>
                </button>
              )}
              
              <button
                type="button"
                onClick={goToNextStage}
                className="njec-btn njec-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="njec-spinner" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {currentStage === 3 ? 'Submit Registration' : 'Continue to Next Step'}
                    </span>
                    {currentStage < 3 && <ChevronRight size={20} />}
                  </>
                )}
              </button>
            </div>

            {/* Stage Indicator */}
            <div className="njec-stage-indicator-mobile">
              <div className="njec-stage-dots">
                {[1, 2, 3].map(step => (
                  <div 
                    key={step}
                    className={`njec-stage-dot ${currentStage === step ? 'njec-stage-dot-active' : ''} ${currentStage > step ? 'njec-stage-dot-completed' : ''}`}
                  ></div>
                ))}
              </div>
              <div className="njec-stage-text">
                Step {currentStage} of 3
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="njec-info-cards">
            <div className="njec-info-card">
              <GraduationCap size={24} />
              <div>
                <h4>Grade 11 Classes</h4>
                <p>Specialized curriculum for Grade 11 students</p>
              </div>
            </div>
            <div className="njec-info-card">
              <Shield size={24} />
              <div>
                <h4>Secure Registration</h4>
                <p>256-bit SSL encryption for all data</p>
              </div>
            </div>
            <div className="njec-info-card">
              <CheckCircle size={24} />
              <div>
                <h4>Admin Approval</h4>
                <p>Registration pending admin verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="njec-loading-overlay">
          <div className="njec-loading-content">
            <div className="njec-loading-logo">
              <img src={Logo} alt="NJEC" />
            </div>
            <div className="njec-loading-spinner">
              <div className="njec-spinner-ring"></div>
              <div className="njec-spinner-ring njec-spinner-ring-2"></div>
              <div className="njec-spinner-ring njec-spinner-ring-3"></div>
            </div>
            <p className="njec-loading-text">Processing your registration...</p>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && <SuccessModal />}
    </div>
  );
};

export default MultiStageRegistration;