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
  FaClock
} from "react-icons/fa";
import "../styles/teacherregistration.css";

const TeacherRegistration = ({ onRegistrationComplete }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    qualification: "",
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
        return formData.qualification.trim() !== "";
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

      // Parse subjects into array
      const subjectsArray = formData.subjects
        .split(",")
        .map(s => s.trim())
        .filter(s => s);

      // Check if teacher record already exists
      const { data: existingRecord } = await supabase
        .from('teachers')
        .select('id, approval_status, teacher_id')
        .eq('id', user.id)
        .single();

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('teachers')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            qualification: formData.qualification,
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
        // Insert new record
        const { error } = await supabase
          .from('teachers')
          .insert({
            id: user.id,
            email: user.email,
            full_name: formData.full_name,
            phone: formData.phone,
            qualification: formData.qualification,
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

      // Auto-redirect to dashboard after 2 seconds
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
            </div>
          </div>
          
          <div className="employee-id-display">
            <span className="employee-id-label">Your Teacher ID:</span>
            <span className="employee-id-value">{generatedTeacherId}</span>
          </div>
          
          <p className="success-subtitle">Redirecting to your dashboard...</p>
          <div className="success-progress">
            <div className="success-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of the form JSX (same as before)
  return (
    <div className="registration-page-wrapper">
      <div className="registration-main-container">
        {/* ... form content ... */}
      </div>
    </div>
  );
};

export default TeacherRegistration;