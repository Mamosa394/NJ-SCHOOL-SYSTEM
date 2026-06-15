import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import '../styles/MultiStageRegistration.css';
import Logo from '../assets/Logo.jpg';
import { 
  User, BookOpen, CreditCard, CheckCircle, ChevronRight, 
  ArrowLeft, Upload, Camera, Phone, Wallet, Check, X, AlertCircle,
  Info, Calendar, Hash, Mail, PhoneCall, FileCheck, Lock,
  Sparkles, Clock, GraduationCap
} from 'lucide-react';

const MultiStageRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStage, setCurrentStage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const subjects = [
    { id: 'math_core', name: 'Mathematics Core', price: 180 },
    { id: 'math_extended', name: 'Mathematics Extended', price: 180 },
    { id: 'physics', name: 'Physics', price: 180 },
    { id: 'chemistry', name: 'Chemistry', price: 180 },
    { id: 'physical_science', name: 'Physical Science', price: 360 },
    { id: 'sesotho', name: 'Sesotho', price: 180 },
    { id: 'english', name: 'English', price: 180 },
    { id: 'accounting', name: 'Accounting', price: 180 },
    { id: 'biology', name: 'Biology', price: 180 },
  ];

  const [studentInfo, setStudentInfo] = useState({
    full_name: '',
    student_number: '',
    email: '',
    phone: '',
    birth_date: '',
    gender: 'Male',
    class_type: 'extra',
  });

  const [selectedSubjects, setSelectedSubjects] = useState([]);
  
  const [paymentInfo, setPaymentInfo] = useState({
    payment_method: 'mpesa',
    payment_number: '',
    payer_name: '',
    screenshot: null,
    screenshotPreview: null,
    screenshotUrl: null,
  });

  const [errors, setErrors] = useState({});
  const [stageErrors, setStageErrors] = useState({});

  useEffect(() => {
    const getUser = async () => {
      setIsAuthLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: { user } } = await supabase.auth.getUser();
        
        setSession(session);
        setUser(user);
        
        if (!user) {
          navigate('/signup');
          return;
        }

        setStudentInfo(prev => ({
          ...prev,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || prev.full_name
        }));

        if (location.state) {
          const { userEmail, userName } = location.state;
          setStudentInfo(prev => ({
            ...prev,
            email: userEmail || prev.email,
            full_name: userName || prev.full_name
          }));
        }
      } catch (error) {
        console.error('Error getting user:', error);
        navigate('/signup');
      } finally {
        setIsAuthLoading(false);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate('/signup');
    });

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const calculateTotal = () => {
    return selectedSubjects.reduce((total, subjectId) => {
      const subject = subjects.find(s => s.id === subjectId);
      return total + (subject?.price || 0);
    }, 0);
  };

  const handleStudentInfoChange = (e) => {
    const { name, value } = e.target;
    setStudentInfo(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const toggleSubject = (subjectId) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handlePaymentInfoChange = (e) => {
    const { name, value } = e.target;
    setPaymentInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStageErrors(prev => ({ ...prev, screenshot: 'File size must be less than 5MB' }));
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setStageErrors(prev => ({ ...prev, screenshot: 'Only JPEG, JPG, or PNG files allowed' }));
      return;
    }

    setIsUploading(true);
    setStageErrors(prev => ({ ...prev, screenshot: '' }));
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-payment.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment_screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_screenshots')
        .getPublicUrl(fileName);

      setPaymentInfo(prev => ({
        ...prev,
        screenshot: file,
        screenshotPreview: URL.createObjectURL(file),
        screenshotUrl: publicUrl
      }));
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setStageErrors(prev => ({ ...prev, screenshot: 'Failed to upload. Please try again.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveScreenshot = async () => {
    if (paymentInfo.screenshotUrl) {
      try {
        const filePath = paymentInfo.screenshotUrl.split('/').slice(-2).join('/');
        await supabase.storage.from('payment_screenshots').remove([filePath]);
      } catch (error) {
        console.error('Error deleting screenshot:', error);
      }
    }

    setPaymentInfo(prev => ({
      ...prev,
      screenshot: null,
      screenshotPreview: null,
      screenshotUrl: null
    }));
    setUploadSuccess(false);
  };

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
      if (!paymentInfo.screenshotUrl && !paymentInfo.screenshot) newErrors.screenshot = 'Payment screenshot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStage = () => {
    if (validateStage()) {
      if (currentStage < 3) {
        setCurrentStage(prev => prev + 1);
        window.scrollTo(0, 0);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const goToPreviousStage = () => {
    if (currentStage > 1) {
      setCurrentStage(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setStageErrors({});
    
    try {
      if (!user || !session) {
        setStageErrors(prev => ({ ...prev, submission: 'Please log in to continue.' }));
        setTimeout(() => navigate('/signup'), 2000);
        return;
      }

      // Get or create profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      let profileId;

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: studentInfo.email,
            full_name: studentInfo.full_name,
            phone: studentInfo.phone,
            role: 'student',
          }])
          .select('id')
          .single();

        if (createProfileError) throw createProfileError;
        profileId = newProfile.id;
      }

      // Prepare registration data
      const registrationData = {
        user_id: user.id,
        profile_id: profileId,
        full_name: studentInfo.full_name,
        student_number: studentInfo.student_number,
        email: studentInfo.email,
        phone: studentInfo.phone,
        birth_date: studentInfo.birth_date || null,
        gender: studentInfo.gender,
        class_type: studentInfo.class_type,
        subjects: selectedSubjects,
        payment_method: paymentInfo.payment_method,
        payment_number: paymentInfo.payment_number,
        payer_name: paymentInfo.payer_name,
        payment_screenshot_url: paymentInfo.screenshotUrl || null,
        registration_status: 'pending',
        total_amount: calculateTotal(),
      };

      // Check if registration already exists
      const { data: existingReg } = await supabase
        .from('student_registrations')
        .select('id, registration_status')
        .eq('user_id', user.id)
        .single();

      if (existingReg) {
        if (existingReg.registration_status !== 'pending') {
          throw new Error('Cannot modify a registration that has already been processed.');
        }
        
        const { error } = await supabase
          .from('student_registrations')
          .update(registrationData)
          .eq('id', existingReg.id)
          .eq('registration_status', 'pending');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_registrations')
          .insert([registrationData]);

        if (error) throw error;
      }

      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          is_registered: true,
          student_number: studentInfo.student_number,
          registration_status: 'pending'
        }
      });

      setShowSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.code === '23505') {
        setStageErrors(prev => ({ ...prev, submission: 'This student number is already registered.' }));
      } else {
        setStageErrors(prev => ({ ...prev, submission: error.message || 'Registration failed. Please try again.' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="reg-loading">
        <div className="reg-spinner"></div>
        <p>Loading your information...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="reg-error">
        <AlertCircle size={48} />
        <h3>Not Authenticated</h3>
        <p>Please sign up or log in to continue.</p>
        <button onClick={() => navigate('/signup')} className="reg-btn reg-btn-primary">
          Go to Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="reg-container">
      {/* Header */}
      <div className="reg-header">
        <div className="reg-logo">
          <img src={Logo} alt="NJEC" />
          <div>
            <h2>NJEC Registration</h2>
            <p>Complete your registration in 3 easy steps</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="reg-progress-container">
        <div className="reg-progress-steps">
          {[1, 2, 3].map(step => (
            <div key={step} className={`reg-step ${currentStage >= step ? 'active' : ''} ${currentStage > step ? 'completed' : ''}`}>
              <div className="reg-step-circle">
                {currentStage > step ? <Check size={16} /> : step}
              </div>
              <span>{step === 1 ? 'Info' : step === 2 ? 'Subjects' : 'Payment'}</span>
            </div>
          ))}
        </div>
        <div className="reg-progress-bar">
          <div className="reg-progress-fill" style={{ width: `${(currentStage / 3) * 100}%` }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="reg-main">
        <div className="reg-card">
          {/* Stage 1: Student Information */}
          {currentStage === 1 && (
            <div className="reg-stage">
              <h3><User size={20} /> Student Information</h3>
              <p className="reg-stage-desc">Please provide your personal details</p>
              
              <div className="reg-form-grid">
                <div className="reg-field">
                  <label><User size={14} /> Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    value={studentInfo.full_name}
                    onChange={handleStudentInfoChange}
                    className={errors.full_name ? 'error' : ''}
                    placeholder="Enter your full name"
                  />
                  {errors.full_name && <span className="reg-error-text">{errors.full_name}</span>}
                </div>

                <div className="reg-field">
                  <label><Mail size={14} /> Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={studentInfo.email}
                    readOnly
                    className="readonly"
                  />
                </div>

                <div className="reg-field">
                  <label><Hash size={14} /> Student Number *</label>
                  <input
                    type="text"
                    name="student_number"
                    value={studentInfo.student_number}
                    onChange={handleStudentInfoChange}
                    className={errors.student_number ? 'error' : ''}
                    placeholder="202400123"
                    maxLength="9"
                  />
                  {errors.student_number && <span className="reg-error-text">{errors.student_number}</span>}
                </div>

                <div className="reg-field">
                  <label><PhoneCall size={14} /> Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={studentInfo.phone}
                    onChange={handleStudentInfoChange}
                    className={errors.phone ? 'error' : ''}
                    placeholder="+266 5012 3456"
                  />
                  {errors.phone && <span className="reg-error-text">{errors.phone}</span>}
                </div>

                <div className="reg-field">
                  <label><Calendar size={14} /> Date of Birth *</label>
                  <input
                    type="date"
                    name="birth_date"
                    value={studentInfo.birth_date}
                    onChange={handleStudentInfoChange}
                    className={errors.birth_date ? 'error' : ''}
                  />
                  {errors.birth_date && <span className="reg-error-text">{errors.birth_date}</span>}
                </div>

                <div className="reg-field">
                  <label><User size={14} /> Gender *</label>
                  <select name="gender" value={studentInfo.gender} onChange={handleStudentInfoChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="reg-field reg-full">
                  <label><GraduationCap size={14} /> Class Type *</label>
                  <div className="reg-radio-group">
                    <label className={`reg-radio ${studentInfo.class_type === 'extra' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="class_type"
                        value="extra"
                        checked={studentInfo.class_type === 'extra'}
                        onChange={handleStudentInfoChange}
                      />
                      <span>Extra Classes</span>
                    </label>
                    <label className={`reg-radio ${studentInfo.class_type === 'supplementary' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="class_type"
                        value="supplementary"
                        checked={studentInfo.class_type === 'supplementary'}
                        onChange={handleStudentInfoChange}
                      />
                      <span>Supplementary Classes</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stage 2: Subject Selection */}
          {currentStage === 2 && (
            <div className="reg-stage">
              <h3><BookOpen size={20} /> Select Subjects</h3>
              <p className="reg-stage-desc">Choose at least one subject to continue</p>
              
              {errors.subjects && (
                <div className="reg-alert-error">
                  <AlertCircle size={16} />
                  <span>{errors.subjects}</span>
                </div>
              )}

              <div className="reg-subjects-grid">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    className={`reg-subject-card ${selectedSubjects.includes(subject.id) ? 'selected' : ''}`}
                    onClick={() => toggleSubject(subject.id)}
                  >
                    <div className="reg-subject-check">
                      {selectedSubjects.includes(subject.id) && <Check size={16} />}
                    </div>
                    <h4>{subject.name}</h4>
                    <span className="reg-subject-price">M{subject.price}</span>
                  </div>
                ))}
              </div>

              <div className="reg-summary-box">
                <div className="reg-summary-row">
                  <span>Selected: {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''}</span>
                  <strong>Total: M{calculateTotal().toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: Payment */}
          {currentStage === 3 && (
            <div className="reg-stage">
              <h3><CreditCard size={20} /> Payment Verification</h3>
              <p className="reg-stage-desc">Complete payment and upload proof</p>

              <div className="reg-payment-methods">
                <h4>Payment Method</h4>
                <div className="reg-radio-group">
                  <label className={`reg-radio ${paymentInfo.payment_method === 'mpesa' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="mpesa"
                      checked={paymentInfo.payment_method === 'mpesa'}
                      onChange={handlePaymentInfoChange}
                    />
                    <span>M-Pesa (5012 3456)</span>
                  </label>
                  <label className={`reg-radio ${paymentInfo.payment_method === 'ecocash' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="ecocash"
                      checked={paymentInfo.payment_method === 'ecocash'}
                      onChange={handlePaymentInfoChange}
                    />
                    <span>Eco-Cash (6012 3456)</span>
                  </label>
                </div>
                <p className="reg-reference">Reference: <code>{studentInfo.student_number || 'STUDENT#'}</code></p>
              </div>

              <div className="reg-form-grid">
                <div className="reg-field">
                  <label><Phone size={14} /> Payment Number *</label>
                  <input
                    type="text"
                    name="payment_number"
                    value={paymentInfo.payment_number}
                    onChange={handlePaymentInfoChange}
                    className={errors.payment_number ? 'error' : ''}
                    placeholder="Phone number used"
                  />
                  {errors.payment_number && <span className="reg-error-text">{errors.payment_number}</span>}
                </div>

                <div className="reg-field">
                  <label><User size={14} /> Payer Name *</label>
                  <input
                    type="text"
                    name="payer_name"
                    value={paymentInfo.payer_name}
                    onChange={handlePaymentInfoChange}
                    className={errors.payer_name ? 'error' : ''}
                    placeholder="Name on payment"
                  />
                  {errors.payer_name && <span className="reg-error-text">{errors.payer_name}</span>}
                </div>
              </div>

              <div className="reg-upload-section">
                <label>Payment Screenshot *</label>
                {!paymentInfo.screenshotPreview && !isUploading && (
                  <div className="reg-upload-area">
                    <input
                      type="file"
                      id="screenshot"
                      accept="image/*"
                      onChange={handleScreenshotUpload}
                      disabled={isUploading}
                    />
                    <label htmlFor="screenshot" className="reg-upload-label">
                      <Camera size={32} />
                      <span>Click to upload payment proof</span>
                      <small>JPEG, PNG, JPG (Max 5MB)</small>
                    </label>
                  </div>
                )}

                {isUploading && (
                  <div className="reg-upload-loading">
                    <div className="reg-spinner"></div>
                    <span>Uploading...</span>
                  </div>
                )}

                {paymentInfo.screenshotPreview && (
                  <div className="reg-preview">
                    <div className="reg-preview-header">
                      <CheckCircle size={16} className="reg-success-icon" />
                      <span>Uploaded successfully</span>
                      <button onClick={handleRemoveScreenshot} className="reg-remove-btn">
                        <X size={16} />
                      </button>
                    </div>
                    <img src={paymentInfo.screenshotPreview} alt="Payment proof" />
                  </div>
                )}

                {errors.screenshot && <span className="reg-error-text">{errors.screenshot}</span>}
              </div>

              <div className="reg-summary-box">
                <div className="reg-summary-row">
                  <span>Total Amount Due</span>
                  <strong>M{calculateTotal().toLocaleString()}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {stageErrors.submission && (
            <div className="reg-alert-error">
              <AlertCircle size={16} />
              <span>{stageErrors.submission}</span>
            </div>
          )}

          {/* Navigation */}
          <div className="reg-navigation">
            {currentStage > 1 ? (
              <button onClick={goToPreviousStage} className="reg-btn reg-btn-secondary" disabled={isLoading}>
                <ArrowLeft size={18} />
                Back
              </button>
            ) : (
              <div></div>
            )}
            
            <button onClick={goToNextStage} className="reg-btn reg-btn-primary" disabled={isLoading}>
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  {currentStage === 3 ? 'Complete Registration' : 'Continue'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="reg-modal-overlay">
          <div className="reg-modal">
            <div className="reg-modal-icon">
              <CheckCircle size={64} />
            </div>
            <h2>Registration Complete!</h2>
            <p>Your registration has been submitted and is pending approval. You will be notified once it's reviewed.</p>
            <div className="reg-modal-details">
              <div><span>Student Number:</span> <strong>{studentInfo.student_number}</strong></div>
              <div><span>Subjects:</span> <strong>{selectedSubjects.length}</strong></div>
              <div><span>Total:</span> <strong>M{calculateTotal().toLocaleString()}</strong></div>
              <div><span>Status:</span> <span className="reg-status-pending"><Clock size={14} /> Pending Approval</span></div>
            </div>
            <button onClick={() => { setShowSuccess(false); navigate('/studentdashboard'); }} className="reg-btn reg-btn-primary">
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="reg-modal-overlay">
          <div className="reg-modal">
            <div className="reg-spinner-lg"></div>
            <h3>Submitting Registration...</h3>
            <p>Please wait while we process your information</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiStageRegistration;