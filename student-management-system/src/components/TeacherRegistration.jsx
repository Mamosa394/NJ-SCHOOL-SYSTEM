// src/components/TeacherRegistration.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaBookOpen,
  FaIdBadge,
  FaPhone,
  FaGraduationCap,
  FaCheckCircle,
  FaArrowLeft,
  FaChalkboardTeacher,
  FaSpinner,
  FaUserGraduate,
  FaClock,
  FaHistory,
  FaTimes,
  FaLaptop,
  FaBuilding,
  FaGlobe
} from "react-icons/fa";
import "../styles/teacher/teacherregistration.css";

const TeacherRegistration = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    qualification: "",
    experience: "",
    subjects: "",
    teaching_type: "both"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedTeacherId, setGeneratedTeacherId] = useState("");
  const [isGeneratingId, setIsGeneratingId] = useState(true);
  const totalSteps = 3;

  useEffect(() => {
    generateTeacherId();
  }, []);

  const generateTeacherId = async () => {
    try {
      setIsGeneratingId(true);
      
      const { data: teacherIdData, error: teacherIdError } = await supabase
        .rpc('generate_teacher_id');

      if (teacherIdError) {
        console.error('Error generating teacher ID:', teacherIdError);
        const fallbackId = `NJ${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
        setGeneratedTeacherId(fallbackId);
        return;
      }

      setGeneratedTeacherId(teacherIdData || 'NJ001');

    } catch (error) {
      console.error('Error generating teacher ID:', error);
      const fallbackId = `NJ${Date.now().toString().slice(-3)}`;
      setGeneratedTeacherId(fallbackId);
    } finally {
      setIsGeneratingId(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        return formData.full_name.trim() !== "" && formData.phone.trim() !== "";
      case 2:
        return formData.qualification.trim() !== "" && formData.experience !== "";
      case 3:
        return formData.subjects.trim() !== "" && formData.teaching_type !== "";
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user found");
      }

      const subjectsArray = formData.subjects
        .split(",")
        .map(s => s.trim())
        .filter(s => s);

      const { data: existingRecord } = await supabase
        .from('teachers')
        .select('id, approval_status, teacher_id')
        .eq('id', user.id)
        .single();

      if (existingRecord) {
        const { error } = await supabase
          .from('teachers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            qualification: formData.qualification,
            experience: formData.experience,
            subjects: subjectsArray,
            teaching_type: formData.teaching_type,
            teacher_id: existingRecord.teacher_id || generatedTeacherId,
            registration_completed: true,
            registration_completed_at: new Date().toISOString(),
            approval_status: 'pending',
            rejection_reason: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
          
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert({
            id: user.id,
            email: user.email,
            full_name: formData.full_name,
            phone: formData.phone,
            qualification: formData.qualification,
            experience: formData.experience,
            subjects: subjectsArray,
            teaching_type: formData.teaching_type,
            teacher_id: generatedTeacherId,
            role: 'teacher',
            approval_status: 'pending',
            registration_completed: true,
            registration_completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
        if (error) throw error;
      }

      setSuccess(true);

      setTimeout(() => {
        if (onRegistrationComplete) {
          onRegistrationComplete();
        }
        navigate('/teacher/dashboard');
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTeachingTypeIcon = (type) => {
    switch(type) {
      case 'online': return <FaLaptop />;
      case 'in_person': return <FaBuilding />;
      case 'both': return <FaGlobe />;
      default: return <FaGlobe />;
    }
  };

  const getTeachingTypeDesc = (type) => {
    switch(type) {
      case 'online': return 'Teach remotely via video calls';
      case 'in_person': return 'Teach at physical locations';
      case 'both': return 'Flexible - online & in-person';
      default: return '';
    }
  };

  if (success) {
    return (
      <div className="registration-page-wrapper">
        <div className="registration-success-container">
          <div className="success-animation">
            <FaCheckCircle className="success-icon" />
          </div>
          <h2>Registration Submitted!</h2>
          <p>Your teacher profile has been submitted for approval.</p>
          
          <div className="approval-notice">
            <FaClock className="approval-icon" />
            <div className="approval-text">
              <h3>Pending Approval</h3>
              <p>An administrator will review your profile. You'll be notified once approved.</p>
              <p className="approval-timeframe">This usually takes 24-48 hours</p>
            </div>
          </div>
          
          <div className="employee-id-display">
            <span className="employee-id-label">Your Teacher ID:</span>
            <span className="employee-id-value">{generatedTeacherId}</span>
          </div>
          
          <div className="registration-summary">
            <h3>Registration Summary</h3>
            <ul>
              <li><FaUser /> {formData.full_name}</li>
              <li><FaGraduationCap /> {formData.qualification}</li>
              <li><FaHistory /> {formData.experience} years experience</li>
              <li><FaBookOpen /> {formData.subjects}</li>
            </ul>
          </div>
          
          <p className="success-subtitle">Redirecting to your dashboard...</p>
          <div className="success-progress">
            <div className="success-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page-wrapper">
      <div className="registration-main-container">
        {/* Header */}
        <div className="registration-header">
          <div className="registration-header-icon">
            <FaChalkboardTeacher />
          </div>
          <h1>Teacher Registration</h1>
          <p>Complete your profile to start teaching</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="registration-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* Progress Steps */}
        <div className="registration-steps">
          {[1, 2, 3].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`step-item ${currentStep === step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                <div className="step-number">
                  {currentStep > step ? '✓' : step}
                </div>
                <div className="step-label">
                  {step === 1 ? 'Personal Info' : step === 2 ? 'Qualifications' : 'Subjects'}
                </div>
              </div>
              {index < 2 && <div className={`step-line ${currentStep > step ? 'completed' : ''} ${currentStep === step ? 'active' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <div className="registration-form-container">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            <div className={`form-step ${currentStep === 1 ? 'active' : ''}`}>
              <div className="form-section">
                <h3>
                  <FaUser className="section-icon" />
                  Personal Information
                </h3>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>
                      <FaUser />
                      Full Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <FaPhone />
                      Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+266 5XXX XXXX"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <FaIdBadge />
                      Teacher ID
                    </label>
                    {isGeneratingId ? (
                      <div className="employee-id-input-wrapper">
                        <input
                          type="text"
                          value="Generating..."
                          disabled
                          className="employee-id-input"
                        />
                        <div className="generating-indicator">
                          <FaSpinner className="spinner" />
                          Generating
                        </div>
                      </div>
                    ) : (
                      <div className="employee-id-input-wrapper">
                        <input
                          type="text"
                          value={generatedTeacherId}
                          disabled
                          className="employee-id-input"
                        />
                      </div>
                    )}
                    <span className="form-hint">Auto-generated teacher ID</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Qualifications */}
            <div className={`form-step ${currentStep === 2 ? 'active' : ''}`}>
              <div className="form-section">
                <h3>
                  <FaUserGraduate className="section-icon" />
                  Qualifications & Experience
                </h3>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <FaGraduationCap />
                      Highest Qualification <span className="required">*</span>
                    </label>
                    <select
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select qualification</option>
                      <option value="Certificate">Certificate in Education</option>
                      <option value="Diploma">Diploma in Education</option>
                      <option value="Bachelors">Bachelor's Degree</option>
                      <option value="Masters">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      <FaHistory />
                      Teaching Experience <span className="required">*</span>
                    </label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select experience</option>
                      <option value="0-1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10-15">10-15 years</option>
                      <option value="15+">15+ years</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Subjects & Teaching Type */}
            <div className={`form-step ${currentStep === 3 ? 'active' : ''}`}>
              <div className="form-section">
                <h3>
                  <FaBookOpen className="section-icon" />
                  Subjects & Teaching Preferences
                </h3>
                
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>
                      <FaBookOpen />
                      Subjects You Can Teach <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      name="subjects"
                      value={formData.subjects}
                      onChange={handleChange}
                      placeholder="e.g., Mathematics, English, Physics"
                      required
                    />
                    <span className="form-hint">Separate subjects with commas</span>
                  </div>

                  <div className="form-group full-width">
                    <label>
                      <FaChalkboardTeacher />
                      Teaching Type <span className="required">*</span>
                    </label>
                    <div className="teaching-type-options">
                      {['both', 'online', 'in_person'].map((type) => (
                        <label key={type} className="teaching-type-card">
                          <input
                            type="radio"
                            name="teaching_type"
                            value={type}
                            checked={formData.teaching_type === type}
                            onChange={handleChange}
                          />
                          <div className="teaching-type-content">
                            <span className="teaching-type-icon">
                              {getTeachingTypeIcon(type)}
                            </span>
                            <span className="teaching-type-title">
                              {type === 'both' ? 'Both' : type === 'online' ? 'Online' : 'In-Person'}
                            </span>
                            <span className="teaching-type-desc">
                              {getTeachingTypeDesc(type)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="nav-btn prev-btn"
                >
                  <FaArrowLeft /> Previous
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="nav-btn next-btn"
                  disabled={!validateStep(currentStep)}
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  className="nav-btn submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" /> Submitting...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle /> Submit Registration
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TeacherRegistration;