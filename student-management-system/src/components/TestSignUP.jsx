import React, { useState } from 'react';
import axios from 'axios';

const StudentRegistration = () => {
  // Initial empty form state
  const [formData, setFormData] = useState({
    // Personal Information
    full_name: '',
    student_number: '',
    email: '',
    password: 'Student@123', // Default password
    confirm_password: 'Student@123',
    phone: '',
    birth_date: '',
    gender: 'Male',
    
    // Academic Information
    enrollment_status: 'active',
    grade_level: 'Grade 10',
    grade_numeric: 10,
    subjects: 'Mathematics,English,Science',
    
    // Contact Information
    home_address: '',
    parent_name: '',
    parent_phone: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [logMessages, setLogMessages] = useState([]);

  // Method to generate random student data for testing
  const generateRandomStudent = () => {
    const firstNames = ['Lerato', 'Kagiso', 'Thandiwe', 'Sipho', 'Naledi', 'Bongani', 'Zanele', 'Tumelo', 'Refilwe', 'Kgosi'];
    const lastNames = ['Mohapi', 'Nkosi', 'Mthembu', 'Dlamini', 'Khumalo', 'Zulu', 'Mokoena', 'Sithole', 'Mofokeng', 'Pele'];
    const subjectsList = [
      'Mathematics,Physics,Chemistry',
      'English,History,Geography',
      'Biology,Life Sciences,Agricultural Sciences',
      'Business Studies,Economics,Accounting',
      'Computer Science,Information Technology,Design',
      'Arts,Drama,Music'
    ];
    const cities = ['Maseru', 'Johannesburg', 'Pretoria', 'Durban', 'Cape Town', 'Bloemfontein', 'Polokwane', 'Nelspruit', 'Kimberley'];
    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'school.edu.ls', 'student.co.za'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    const randomNum = Math.floor(Math.random() * 1000);
    const currentYear = new Date().getFullYear();
    const studentNum = `${currentYear}${String(randomNum).padStart(3, '0')}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domains[Math.floor(Math.random() * domains.length)]}`;
    
    // Generate random birth date (14-18 years old)
    const currentYearBirth = new Date().getFullYear();
    const birthYear = currentYearBirth - (14 + Math.floor(Math.random() * 5));
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const birthDate = `${birthYear}-${birthMonth}-${birthDay}`;
    
    // Generate random phone number
    const phone = `+266${Math.floor(Math.random() * 9000000 + 1000000)}`;
    const parentPhone = `+266${Math.floor(Math.random() * 9000000 + 1000000)}`;
    
    // Select random grade
    const grades = ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    const gradeLevel = grades[Math.floor(Math.random() * grades.length)];
    const gradeNumeric = parseInt(gradeLevel.replace('Grade ', ''));
    
    // Select random subjects
    const subjects = subjectsList[Math.floor(Math.random() * subjectsList.length)];
    
    // Generate address
    const streetNumber = Math.floor(Math.random() * 100) + 1;
    const city = cities[Math.floor(Math.random() * cities.length)];
    const homeAddress = `${streetNumber} ${firstName} Street, ${city}`;
    
    // Parent name
    const parentName = `Mr./Mrs. ${lastName}`;
    
    // Common password
    const password = 'Student@123';

    // Update form with generated data
    const newFormData = {
      full_name: fullName,
      student_number: studentNum,
      email: email,
      password: password,
      confirm_password: password,
      phone: phone,
      birth_date: birthDate,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      enrollment_status: 'active',
      grade_level: gradeLevel,
      grade_numeric: gradeNumeric,
      subjects: subjects,
      home_address: homeAddress,
      parent_name: parentName,
      parent_phone: parentPhone
    };

    setFormData(newFormData);
    
    // Clear any existing errors
    setErrors({});
    
    // Add log message
    addLogMessage(`✅ Generated random student: ${fullName} (${studentNum})`);
    
    // Validate the generated data
    setTimeout(() => {
      const isValid = validateGeneratedData(newFormData);
      if (isValid) {
        addLogMessage('✅ Generated data passed validation');
      }
    }, 100);
  };

  // Validate generated data without showing errors
  const validateGeneratedData = (data) => {
    const newErrors = {};
    
    // Basic validation
    if (!data.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!data.student_number.trim()) newErrors.student_number = 'Student number is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    
    // Email validation
    if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Student number validation (9 digits)
    if (data.student_number && !/^\d{9}$/.test(data.student_number)) {
      newErrors.student_number = 'Student number must be 9 digits';
    }
    
    return Object.keys(newErrors).length === 0;
  };

  // Add log message
  const addLogMessage = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogMessages(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  // Handle input changes
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

  // Validate form with more lenient rules for testing
  const validateForm = () => {
    const newErrors = {};
    
    // Only validate truly required fields
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    
    // Email validation - simple check
    if (formData.email && !formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    }
    
    // Student number - accept any format for testing
    if (!formData.student_number.trim()) {
      newErrors.student_number = 'Student number is required';
    }
    
    // Set errors and return validation result
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    
    if (isValid) {
      addLogMessage('✅ Form validation passed');
    } else {
      addLogMessage('❌ Form validation failed: ' + Object.keys(newErrors).join(', '));
    }
    
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setRegistrationResult(null);
    
    // Clear previous logs
    setLogMessages([]);
    addLogMessage('🚀 Starting registration process...');
    addLogMessage(`📝 Student: ${formData.full_name}`);
    addLogMessage(`📧 Email: ${formData.email}`);
    addLogMessage(`#️⃣ Student #: ${formData.student_number}`);

    // Validate form
    if (!validateForm()) {
      addLogMessage('❌ Registration aborted: Form validation failed');
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API
      const registrationData = {
        ...formData,
        // Convert subjects string to array if it exists
        subjects: formData.subjects ? 
          formData.subjects.split(',').map(s => s.trim()).filter(s => s) : 
          [],
        // Set grade_numeric based on grade_level
        grade_numeric: parseInt(formData.grade_level.replace('Grade ', '')) || 10
      };
      
      // Remove confirm_password from the data sent to API
      delete registrationData.confirm_password;

      addLogMessage('📤 Sending registration request to server...');
      addLogMessage('📊 Data being sent: ' + JSON.stringify({
        full_name: registrationData.full_name,
        email: registrationData.email,
        student_number: registrationData.student_number,
        grade_level: registrationData.grade_level
      }, null, 2));
      
      // Make API call to your registration endpoint
      // NOTE: You need to adjust the URL based on your actual backend
      const apiUrl = 'http://localhost:5000/api/students'; // or '/api/auth/register' based on your setup
      addLogMessage(`🔗 Calling API: ${apiUrl}`);
      
      const response = await axios.post(
        apiUrl,
        registrationData,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      addLogMessage('✅ Registration successful!');
      addLogMessage('📋 Server response: ' + JSON.stringify(response.data, null, 2));
      
      setSuccess(true);
      setRegistrationResult(response.data);
      
      // Reset form after successful registration (keep password for convenience)
      setFormData(prev => ({
        ...prev,
        full_name: '',
        student_number: '',
        email: '',
        // Keep the same password for next registration
        home_address: '',
        parent_name: '',
        parent_phone: ''
      }));

      // Show success details
      if (response.data.data) {
        addLogMessage(`🎓 Student Created: ${response.data.data.full_name}`);
        addLogMessage(`📧 Email: ${response.data.data.email}`);
        addLogMessage(`#️⃣ Student #: ${response.data.data.student_number}`);
        addLogMessage(`📚 Grade: ${response.data.data.grade_level}`);
      }

    } catch (error) {
      addLogMessage('❌ Registration failed!');
      
      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data?.error || error.response.data?.message || 'Server error';
        addLogMessage(`📡 Server Error (${error.response.status}): ${errorMsg}`);
        setRegistrationResult({ 
          success: false, 
          error: `Server Error ${error.response.status}: ${errorMsg}` 
        });
        
        // Log full error for debugging
        console.error('Server Error Details:', error.response.data);
      } else if (error.request) {
        // No response received
        addLogMessage('❌ No response from server. Possible issues:');
        addLogMessage('  1. Backend server is not running');
        addLogMessage('  2. Wrong API endpoint URL');
        addLogMessage('  3. Network connectivity issue');
        addLogMessage(`  4. CORS policy blocking the request`);
        setRegistrationResult({ 
          success: false, 
          error: 'Cannot connect to server. Make sure backend is running on localhost:5000' 
        });
      } else {
        // Other errors
        addLogMessage(`⚠️ Error: ${error.message}`);
        setRegistrationResult({ success: false, error: error.message });
      }
    } finally {
      setLoading(false);
      addLogMessage('🏁 Registration process completed');
    }
  };

  // Quick fill button for common test cases
  const quickFill = (type) => {
    const testCases = {
      basic: {
        full_name: 'Test Student',
        student_number: '202400001',
        email: 'test.student@example.com',
        password: 'Student@123',
        confirm_password: 'Student@123',
        phone: '+26650123456',
        birth_date: '2008-01-15',
        gender: 'Male',
        enrollment_status: 'active',
        grade_level: 'Grade 10',
        subjects: 'Mathematics,English,Science',
        home_address: '123 Test Street, Maseru',
        parent_name: 'Test Parent',
        parent_phone: '+26650123457'
      },
      minimal: {
        full_name: 'Minimal Student',
        student_number: '202400002',
        email: 'minimal@example.com',
        password: 'Student@123',
        confirm_password: 'Student@123',
        gender: 'Female',
        enrollment_status: 'active',
        grade_level: 'Grade 11'
      }
    };
    
    setFormData(prev => ({
      ...prev,
      ...testCases[type]
    }));
    
    setErrors({});
    addLogMessage(`✅ Filled with ${type} test data`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🎓 Student Registration Test</h2>
        <p>Test registration endpoint with random or custom student data</p>
      </div>

      <div style={styles.controls}>
        <div style={styles.buttonGroup}>
          <button 
            onClick={generateRandomStudent}
            style={styles.generateButton}
          >
            🎲 Generate Random Student
          </button>
          <button 
            onClick={() => quickFill('basic')}
            style={styles.testButton}
          >
            📝 Basic Test Case
          </button>
          <button 
            onClick={() => quickFill('minimal')}
            style={styles.testButton}
          >
            🎯 Minimal Test Case
          </button>
        </div>
        <small style={styles.note}>
          Use these buttons to quickly populate form with test data
        </small>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          {/* Left Column - Required Fields */}
          <div style={styles.formColumn}>
            <h3 style={styles.columnTitle}>Required Information</h3>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter full name"
                style={{
                  ...styles.input,
                  ...(errors.full_name ? styles.inputError : {})
                }}
              />
              {errors.full_name && (
                <div style={styles.errorText}>{errors.full_name}</div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Student Number *
              </label>
              <input
                type="text"
                name="student_number"
                value={formData.student_number}
                onChange={handleChange}
                placeholder="9-digit number"
                style={{
                  ...styles.input,
                  ...(errors.student_number ? styles.inputError : {})
                }}
              />
              {errors.student_number && (
                <div style={styles.errorText}>{errors.student_number}</div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@example.com"
                style={{
                  ...styles.input,
                  ...(errors.email ? styles.inputError : {})
                }}
              />
              {errors.email && (
                <div style={styles.errorText}>{errors.email}</div>
              )}
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Right Column - Optional Fields */}
          <div style={styles.formColumn}>
            <h3 style={styles.columnTitle}>Additional Information</h3>
            
            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Grade Level
              </label>
              <select
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                style={styles.select}
              >
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Subjects (comma separated)
              </label>
              <input
                type="text"
                name="subjects"
                value={formData.subjects}
                onChange={handleChange}
                placeholder="Mathematics, English, Science"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+266XXXXXXXX"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Home Address
              </label>
              <input
                type="text"
                name="home_address"
                value={formData.home_address}
                onChange={handleChange}
                placeholder="Street, City"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.formActions}>
          <button 
            type="submit" 
            style={styles.submitButton}
            disabled={loading}
          >
            {loading ? '⏳ Registering...' : '🚀 Register Student'}
          </button>
          
          <div style={styles.actionButtons}>
            <button 
              type="button" 
              onClick={() => {
                setFormData({
                  full_name: '',
                  student_number: '',
                  email: '',
                  password: 'Student@123',
                  confirm_password: 'Student@123',
                  phone: '',
                  birth_date: '',
                  gender: 'Male',
                  enrollment_status: 'active',
                  grade_level: 'Grade 10',
                  grade_numeric: 10,
                  subjects: 'Mathematics,English,Science',
                  home_address: '',
                  parent_name: '',
                  parent_phone: ''
                });
                setErrors({});
                addLogMessage('🧹 Form cleared');
              }}
              style={styles.clearButton}
            >
              Clear Form
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                // Test the current form data
                const isValid = validateForm();
                if (isValid) {
                  addLogMessage('✅ Form is ready for submission');
                }
              }}
              style={styles.validateButton}
            >
              Validate Form
            </button>
          </div>
        </div>
      </form>

      {/* Log Messages Panel */}
      <div style={styles.logPanel}>
        <div style={styles.logHeader}>
          <h3>Registration Log</h3>
          <button 
            onClick={() => setLogMessages([])}
            style={styles.clearLogButton}
          >
            Clear Log
          </button>
        </div>
        <div style={styles.logContainer}>
          {logMessages.length === 0 ? (
            <div style={styles.emptyLog}>
              <p>📋 No logs yet.</p>
              <p>Click "Generate Random Student" and then "Register Student" to test.</p>
              <p>Make sure your backend server is running on localhost:5000</p>
            </div>
          ) : (
            logMessages.map((msg, idx) => (
              <div 
                key={idx} 
                style={{
                  ...styles.logMessage,
                  ...(msg.includes('✅') ? styles.logSuccess : {}),
                  ...(msg.includes('❌') ? styles.logError : {}),
                  ...(msg.includes('⚠️') ? styles.logWarning : {})
                }}
              >
                {msg}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Debug Information */}
      <div style={styles.debugPanel}>
        <h3>🛠️ Debug Information</h3>
        <div style={styles.debugGrid}>
          <div>
            <h4>Form Data:</h4>
            <pre style={styles.code}>
              {JSON.stringify({
                full_name: formData.full_name,
                student_number: formData.student_number,
                email: formData.email,
                grade_level: formData.grade_level,
                has_password: !!formData.password
              }, null, 2)}
            </pre>
          </div>
          <div>
            <h4>Validation Errors:</h4>
            <pre style={styles.code}>
              {JSON.stringify(errors, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div style={styles.statusPanel}>
        <h4>🔗 Backend Connection</h4>
        <p>Make sure your Node.js backend is running:</p>
        <code style={styles.codeBlock}>node index.js</code>
        <p>Expected API endpoint: <code>http://localhost:5000/api/students</code></p>
        {registrationResult && !success && (
          <div style={styles.connectionError}>
            <p><strong>Connection Issue Detected:</strong></p>
            <p>{registrationResult.error}</p>
            <p>Check if:</p>
            <ul>
              <li>Backend server is running</li>
              <li>Port 5000 is not blocked</li>
              <li>API route exists in your backend</li>
              <li>No CORS issues (check browser console)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    border: '1px solid #dee2e6'
  },
  controls: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  buttonGroup: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  generateButton: {
    padding: '12px 24px',
    backgroundColor: '#6f42c1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  testButton: {
    padding: '12px 20px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  note: {
    color: '#666',
    fontSize: '12px',
    display: 'block',
    marginTop: '10px'
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
    border: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '40px',
    marginBottom: '30px'
  },
  formColumn: {
    flex: 1
  },
  columnTitle: {
    color: '#2c3e50',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px',
    marginBottom: '20px',
    fontSize: '18px'
  },
  fieldGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#495057',
    fontSize: '14px'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    transition: 'border-color 0.3s'
  },
  inputError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff5f5'
  },
  select: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  errorText: {
    color: '#dc3545',
    fontSize: '12px',
    marginTop: '5px',
    paddingLeft: '5px'
  },
  formActions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginTop: '40px',
    paddingTop: '20px',
    borderTop: '1px solid #dee2e6'
  },
  submitButton: {
    padding: '15px 50px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'all 0.3s',
    minWidth: '200px'
  },
  actionButtons: {
    display: 'flex',
    gap: '15px'
  },
  clearButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  validateButton: {
    padding: '10px 20px',
    backgroundColor: '#ffc107',
    color: '#212529',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  logPanel: {
    backgroundColor: '#1a1a1a',
    color: '#f8f9fa',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px'
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  clearLogButton: {
    padding: '5px 15px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  logContainer: {
    maxHeight: '300px',
    overflowY: 'auto',
    fontFamily: 'monospace',
    fontSize: '13px',
    padding: '15px',
    backgroundColor: '#000',
    borderRadius: '4px'
  },
  logMessage: {
    marginBottom: '8px',
    padding: '5px 10px',
    borderRadius: '3px',
    borderLeft: '3px solid #6c757d'
  },
  logSuccess: {
    backgroundColor: '#d4edda20',
    borderLeftColor: '#28a745',
    color: '#28a745'
  },
  logError: {
    backgroundColor: '#f8d7da20',
    borderLeftColor: '#dc3545',
    color: '#dc3545'
  },
  logWarning: {
    backgroundColor: '#fff3cd20',
    borderLeftColor: '#ffc107',
    color: '#ffc107'
  },
  emptyLog: {
    color: '#6c757d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: '30px',
    lineHeight: '1.6'
  },
  debugPanel: {
    backgroundColor: '#e9ecef',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '30px'
  },
  debugGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginTop: '15px'
  },
  code: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    fontSize: '12px',
    overflow: 'auto',
    maxHeight: '200px',
    border: '1px solid #dee2e6'
  },
  statusPanel: {
    backgroundColor: '#d1ecf1',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #bee5eb',
    color: '#0c5460'
  },
  codeBlock: {
    backgroundColor: '#f8f9fa',
    padding: '8px 12px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
    display: 'inline-block',
    margin: '10px 0'
  },
  connectionError: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '6px',
    marginTop: '15px',
    border: '1px solid #f5c6cb'
  }
};

// Add hover effects
Object.assign(styles.generateButton, {
  ':hover': {
    backgroundColor: '#5a32a3',
    transform: 'translateY(-2px)'
  }
});

Object.assign(styles.testButton, {
  ':hover': {
    backgroundColor: '#138496',
    transform: 'translateY(-2px)'
  }
});

Object.assign(styles.submitButton, {
  ':hover': {
    backgroundColor: '#218838',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  },
  ':disabled': {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none'
  }
});

export default StudentRegistration;