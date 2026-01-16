import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/signup.css';
import Footer from '../components2/Footer';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
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
  });

  const [adminCount, setAdminCount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animateRedirect, setAnimateRedirect] = useState(false);

  const navigate = useNavigate();

  const subjectsList = [
    "Mathematics", "Biology", "Physics", "Chemistry",
    "Physical Science", "Accounting", "English", "Sesotho"
  ];

  useEffect(() => {
    const getAdminCount = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/admins/count');
        setAdminCount(res.data.count || 0);
      } catch (err) {
        console.error(err);
      }
    };
    getAdminCount();
  }, []);

  const evaluateStrength = (password) => {
    if (password.length < 6) return 'Weak';
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    if (hasSpecial && hasNumbers && hasUpper && hasLower && password.length >= 8) {
      return 'Strong';
    } else if ((hasSpecial || hasNumbers) && password.length >= 6) {
      return 'Medium';
    } else {
      return 'Weak';
    }
  };

  const isStrongPassword = (pwd) => {
    const strongPattern = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
    return strongPattern.test(pwd);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'password') {
      setPasswordStrength(evaluateStrength(value));
    }
    setError('');
    setSuccess('');
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      fullName, email, password, confirmPassword, role,
      studentNumber, phone, parentName, parentPhone, birthDate, subjects
    } = formData;

    if (!fullName || !email || !password || !confirmPassword || !role) {
      return setError('Please fill in all required fields.');
    }

    if (!isStrongPassword(password)) {
      return setError('Password must be at least 8 characters and include a special character.');
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    if (role === 'student' && (!studentNumber || !phone || !parentName || !parentPhone || !birthDate || subjects.length === 0)) {
      return setError('Please complete all student information.');
    }

    if (role === 'admin' && adminCount >= 2) {
      return setError('Admin registration limit reached (only 2 allowed).');
    }

    try {
      await axios.post('http://localhost:5000/api/signup', formData);
      setSuccess('Account created successfully!');
      setIsLoading(true);
      setAnimateRedirect(true);

      setTimeout(() => {
        navigate('/login');
      }, 2000);

      setFormData({
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
      });
      setPasswordStrength('');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed.');
    }
  };

  return (
    <div className="page-container">
      <div className="signup-screen">
        <div className="signup-wrapper">
          <div className="signup-school-name">
            <h1>NEW JERUSALEM EXTRA CLASSES</h1>
          </div>

          <div className="signup-card">
            <h2>Create an Account</h2>
            <form
              onSubmit={handleSubmit}
              className={`signup-form ${animateRedirect ? 'fade-out' : ''}`}
            >
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} />
              <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} />

              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="">-- Select Role --</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin" disabled={adminCount >= 2}>Admin {adminCount >= 2 ? '(Limit Reached)' : ''}</option>
              </select>

              {formData.role === 'student' && (
                <>
                  <input name="studentNumber" placeholder="Student Number" value={formData.studentNumber} onChange={handleChange} />
                  <input name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} />
                  <input name="parentName" placeholder="Parent/Guardian Name" value={formData.parentName} onChange={handleChange} />
                  <input name="parentPhone" placeholder="Parent/Guardian Phone" value={formData.parentPhone} onChange={handleChange} />
                  <input name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
                  <label>Select Subjects:</label>
                  <div className="subjects">
                    {subjectsList.map(subject => (
                      <label key={subject}>
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </>
              )}

              <div className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="toggle-password"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
                {formData.password && (
                  <p className={`strength ${passwordStrength.toLowerCase()}`}>
                    Password Strength: {passwordStrength}
                  </p>
                )}
              </div>

              <input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />

              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
              {isLoading && (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <p>Redirecting to login...</p>
                </div>
              )}

              <button type="submit" disabled={isLoading}>Sign Up</button>
            </form>
          </div>
        </div>

        <div className="bg-blob pink"></div>
        <div className="bg-blob purple"></div>
        <div className="bg-shape circle"></div>
        <div className="bg-shape square"></div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
