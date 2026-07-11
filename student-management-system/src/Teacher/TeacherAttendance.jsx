import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserCheck, FaDownload, FaPlus, FaEdit, FaSave, FaTimes,
  FaCalendarAlt, FaClock, FaStickyNote, FaCheck, FaTimesCircle,
  FaClock as FaClockIcon, FaClipboardList, FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher/teacherattendance.css';

const TeacherAttendance = () => {
  // State
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    present: 0, absent: 0, late: 0, excused: 0,
    total: 0, attendanceRate: 0
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // =============================================
  // AUTH HELPER - Uses Supabase session
  // =============================================
  const getAuthHeaders = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        throw new Error('Failed to get session');
      }
      
      if (!session?.access_token) {
        console.error('No active session found');
        throw new Error('No active session');
      }
      
      return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };
    } catch (error) {
      console.error('Auth error:', error);
      setMessage({ 
        type: 'error', 
        text: 'Session expired or not found. Please log in again.' 
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
      throw error;
    }
  }, []);

  // =============================================
  // API CALLS
  // =============================================
  const apiCall = useCallback(async (url, options = {}) => {
    const headers = await getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });
    
    if (response.status === 401) {
      setMessage({ 
        type: 'error', 
        text: 'Session expired. Please log in again.' 
      });
      setTimeout(() => window.location.href = '/login', 2000);
      throw new Error('Unauthorized');
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  }, [getAuthHeaders]);

  // =============================================
  // FETCH SUBJECTS
  // =============================================
  const fetchSubjects = useCallback(async () => {
    try {
      console.log('📚 Fetching subjects...');
      const data = await apiCall('/api/teacher/attendance/subjects');
      
      console.log('✅ Subjects received:', data);
      
      const subjectList = data.subjects || [];
      setSubjects(subjectList);
      
      if (subjectList.length === 0) {
        setMessage({ 
          type: 'warning', 
          text: 'No subjects found in your approved teacher profile. Please contact an administrator.' 
        });
      } else {
        console.log(`📚 Loaded ${subjectList.length} subjects:`, 
          subjectList.map(s => s.subject_name).join(', '));
      }
      
      return subjectList;
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      if (!message.text) {
        setMessage({ 
          type: 'error', 
          text: 'Failed to load subjects. Please try again.' 
        });
      }
      return [];
    }
  }, [apiCall, message.text]);

  // =============================================
  // FETCH STUDENTS FOR SUBJECT
  // =============================================
  const fetchStudents = useCallback(async (subjectName) => {
    if (!subjectName) {
      setStudents([]);
      setAttendanceData([]);
      return;
    }

    try {
      setLoading(true);
      console.log(`👥 Fetching students for subject: ${subjectName}`);
      
      const data = await apiCall(
        `/api/teacher/attendance/students?subject_name=${encodeURIComponent(subjectName)}`
      );
      
      console.log('✅ Students received:', data);
      
      if (data.students && data.students.length > 0) {
        setStudents(data.students);
        
        // Initialize attendance data
        const initialAttendance = data.students.map(student => ({
          student_id: student.student_id,
          student_name: student.full_name,
          student_number: student.student_number || '',
          email: student.email || '',
          class_type: student.class_type || 'regular',
          status: 'present',
          time_in: '',
          notes: ''
        }));
        
        setAttendanceData(initialAttendance);
        setMessage({ 
          type: 'success', 
          text: `Loaded ${data.students.length} students for ${subjectName}` 
        });
      } else {
        console.warn('⚠️ No students found for subject:', subjectName);
        setStudents([]);
        setAttendanceData([]);
        setMessage({ 
          type: 'warning', 
          text: `No students found for ${subjectName}. Check if students are registered for this subject.` 
        });
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      setStudents([]);
      setAttendanceData([]);
      if (!message.text) {
        setMessage({ 
          type: 'error', 
          text: error.message || 'Failed to load students' 
        });
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall, message.text]);

  // =============================================
  // FETCH ATTENDANCE RECORDS
  // =============================================
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      console.log('📋 Fetching attendance records...');
      
      let url = '/api/teacher/attendance/records';
      const params = new URLSearchParams();
      
      if (filterDate) params.append('date', filterDate);
      if (filterSubject) params.append('subject_name', filterSubject);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const data = await apiCall(url);
      console.log(`✅ Records received: ${data.records?.length || 0}`);
      
      setAttendanceRecords(data.records || []);
    } catch (error) {
      console.error('❌ Error fetching records:', error);
      setAttendanceRecords([]);
    }
  }, [apiCall, filterDate, filterSubject]);

  // =============================================
  // FETCH STATISTICS
  // =============================================
  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall('/api/teacher/attendance/stats');
      setStats(data.stats || {
        present: 0, absent: 0, late: 0, excused: 0,
        total: 0, attendanceRate: 0
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  }, [apiCall]);

  // =============================================
  // INITIALIZATION
  // =============================================
  useEffect(() => {
    const initialize = async () => {
      try {
        setInitializing(true);
        
        // Verify session exists
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session');
          setMessage({ 
            type: 'error', 
            text: 'No active session. Please log in.' 
          });
          setTimeout(() => window.location.href = '/login', 2000);
          return;
        }
        
        setSessionChecked(true);
        
        // Load data
        await Promise.all([
          fetchSubjects(),
          fetchAttendanceRecords(),
          fetchStats()
        ]);
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setInitializing(false);
      }
    };
    
    initialize();
  }, [fetchSubjects, fetchAttendanceRecords, fetchStats]);

  // =============================================
  // HANDLERS
  // =============================================
  const handleSubjectChange = (subjectName) => {
    console.log('📖 Subject selected:', subjectName);
    setSelectedSubject(subjectName);
    if (subjectName) {
      fetchStudents(subjectName);
    } else {
      setStudents([]);
      setAttendanceData([]);
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.student_id === studentId 
          ? { ...item, [field]: value }
          : item
      )
    );
  };

  const handleMarkAll = (status) => {
    setAttendanceData(prev => 
      prev.map(item => ({
        ...item,
        status: status
      }))
    );
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubject || attendanceData.length === 0) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a subject and load students' 
      });
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        subject_name: selectedSubject,
        date: attendanceDate,
        records: attendanceData
      };

      console.log('📝 Submitting attendance:', payload);

      const data = await apiCall('/api/teacher/attendance/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      console.log('✅ Attendance submitted:', data);
      
      setMessage({ type: 'success', text: data.message });
      
      // Refresh data
      await Promise.all([
        fetchAttendanceRecords(),
        fetchStats()
      ]);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setShowAttendanceForm(false);
        setSelectedSubject('');
        setStudents([]);
        setAttendanceData([]);
        setMessage({ type: '', text: '' });
      }, 2000);
      
    } catch (error) {
      console.error('❌ Submit error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to submit attendance' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (recordId, updates) => {
    try {
      await apiCall(`/api/teacher/attendance/record/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      setMessage({ type: 'success', text: 'Record updated successfully' });
      await Promise.all([
        fetchAttendanceRecords(),
        fetchStats()
      ]);
      setEditingRecord(null);
      
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to update record' });
    }
  };

  const handleExportReport = async () => {
    try {
      const headers = await getAuthHeaders();
      
      let url = '/api/teacher/attendance/export';
      const params = new URLSearchParams();
      
      if (filterDate) params.append('date', filterDate);
      if (filterSubject) params.append('subject_name', filterSubject);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `attendance_report_${filterDate || new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        setMessage({ type: 'success', text: 'Report downloaded successfully' });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export report' });
    }
  };

  const handleFilterApply = () => {
    fetchAttendanceRecords();
  };

  // =============================================
  // RENDER
  // =============================================
  if (initializing) {
    return (
      <div className="teacher-attendance-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: '20px'
        }}>
          <FaSpinner className="teacher-spinner" style={{ fontSize: '48px', color: '#4F46E5' }} />
          <h3>Loading Attendance Module...</h3>
          <p style={{ color: '#6B7280' }}>Verifying session and loading data</p>
        </div>
      </div>
    );
  }

  if (!sessionChecked) {
    return (
      <div className="teacher-attendance-container">
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '400px',
          gap: '20px'
        }}>
          <FaExclamationTriangle style={{ fontSize: '48px', color: '#F59E0B' }} />
          <h3>Session Check Failed</h3>
          <p style={{ color: '#6B7280' }}>Unable to verify your session. Please try logging in again.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 24px',
              background: '#4F46E5',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const safeRecords = Array.isArray(attendanceRecords) ? attendanceRecords : [];

  return (
    <div className="teacher-attendance-container">
      {/* Header */}
      <div className="teacher-card-header">
        <h2><FaUserCheck /> Attendance Management</h2>
        <div className="teacher-header-actions">
          <div className="teacher-date-filter">
            <FaCalendarAlt />
            <input 
              type="date" 
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="teacher-date-input"
            />
          </div>
          <button className="teacher-primary-btn" onClick={handleExportReport}>
            <FaDownload /> Export Report
          </button>
          <button 
            className="teacher-secondary-btn"
            onClick={() => setShowAttendanceForm(!showAttendanceForm)}
          >
            <FaPlus /> {showAttendanceForm ? 'Close Form' : 'Take Attendance'}
          </button>
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          background: '#f0f0f0', 
          padding: '10px', 
          margin: '10px 0', 
          fontSize: '12px',
          borderRadius: '8px'
        }}>
          <strong>🐛 Debug Info:</strong><br/>
          Subjects loaded: {subjects.length}<br/>
          Students loaded: {students.length}<br/>
          Records loaded: {safeRecords.length}<br/>
          Selected subject: {selectedSubject || 'None'}<br/>
          Session: {sessionChecked ? '✅ Active' : '❌ Not checked'}
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <div className={`teacher-message ${message.type}`}>
          {message.text}
          <button 
            className="teacher-message-close"
            onClick={() => setMessage({ type: '', text: '' })}
          >
            <FaTimes />
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="teacher-attendance-summary">
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Present Today</span>
          <span className="teacher-summary-value success">{stats.present}</span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Absent</span>
          <span className="teacher-summary-value warning">{stats.absent}</span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Late</span>
          <span className="teacher-summary-value info">{stats.late}</span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Excused</span>
          <span className="teacher-summary-value excused">{stats.excused}</span>
        </div>
        <div className="teacher-summary-item">
          <span className="teacher-summary-label">Rate</span>
          <span className="teacher-summary-value">{stats.attendanceRate}%</span>
        </div>
      </div>

      {/* Take Attendance Form */}
      {showAttendanceForm && (
        <div className="teacher-attendance-form">
          <h3><FaClipboardList /> Mark Attendance for {attendanceDate}</h3>
          
          <div className="teacher-form-group">
            <label>Select Subject:</label>
            <select 
              value={selectedSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="teacher-select"
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject.subject_name}>
                  {subject.subject_name}
                </option>
              ))}
            </select>
            {subjects.length === 0 && (
              <p style={{ color: '#F59E0B', fontSize: '14px', marginTop: '8px' }}>
                ⚠️ No subjects available. Your teacher profile may not be approved or subjects not assigned.
              </p>
            )}
          </div>

          {loading && (
            <div className="teacher-loading">
              <FaSpinner className="teacher-spinner" />
              <p>Loading students...</p>
            </div>
          )}

          {!loading && selectedSubject && students.length === 0 && (
            <div className="teacher-empty-state">
              <FaExclamationTriangle style={{ fontSize: '48px', color: '#F59E0B' }} />
              <p>No students found for this subject.</p>
              <p className="teacher-empty-subtitle">
                Possible reasons:
                <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                  <li>No students registered for {selectedSubject}</li>
                  <li>Students pending approval</li>
                  <li>Class type mismatch (online vs in-person)</li>
                </ul>
              </p>
            </div>
          )}

          {students.length > 0 && (
            <>
              <div className="teacher-bulk-actions">
                <button className="teacher-action-btn success" onClick={() => handleMarkAll('present')}>
                  <FaCheck /> Mark All Present
                </button>
                <button className="teacher-action-btn warning" onClick={() => handleMarkAll('absent')}>
                  <FaTimesCircle /> Mark All Absent
                </button>
                <button className="teacher-action-btn info" onClick={() => handleMarkAll('late')}>
                  <FaClockIcon /> Mark All Late
                </button>
                <button className="teacher-action-btn excused" onClick={() => handleMarkAll('excused')}>
                  <FaClipboardList /> Mark All Excused
                </button>
              </div>

              <div className="teacher-attendance-list">
                {students.map((student, index) => (
                  <div key={student.student_id} className="teacher-attendance-item">
                    <div className="teacher-student-info">
                      <span className="teacher-student-number">{index + 1}.</span>
                      <div className="teacher-student-details">
                        <span className="teacher-student-name">{student.full_name}</span>
                        {student.student_number && (
                          <span className="teacher-student-reg">{student.student_number}</span>
                        )}
                        <span className="teacher-student-class">{student.class_type}</span>
                      </div>
                    </div>
                    
                    <div className="teacher-attendance-controls">
                      <select
                        value={attendanceData[index]?.status || 'present'}
                        onChange={(e) => handleAttendanceChange(student.student_id, 'status', e.target.value)}
                        className={`teacher-status-select ${attendanceData[index]?.status || 'present'}`}
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="late">Late</option>
                        <option value="excused">Excused</option>
                      </select>
                      
                      <div className="teacher-input-wrapper">
                        <FaClock className="teacher-input-icon" />
                        <input
                          type="time"
                          value={attendanceData[index]?.time_in || ''}
                          onChange={(e) => handleAttendanceChange(student.student_id, 'time_in', e.target.value)}
                          className="teacher-time-input"
                        />
                      </div>
                      
                      <div className="teacher-input-wrapper">
                        <FaStickyNote className="teacher-input-icon" />
                        <input
                          type="text"
                          value={attendanceData[index]?.notes || ''}
                          onChange={(e) => handleAttendanceChange(student.student_id, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="teacher-notes-input"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="teacher-form-actions">
                <button 
                  className="teacher-submit-btn"
                  onClick={handleSubmitAttendance}
                  disabled={loading}
                >
                  <FaSave /> {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
                <button 
                  className="teacher-cancel-btn"
                  onClick={() => {
                    setShowAttendanceForm(false);
                    setSelectedSubject('');
                    setStudents([]);
                    setAttendanceData([]);
                    setMessage({ type: '', text: '' });
                  }}
                >
                  <FaTimes /> Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="teacher-filters">
        <div className="teacher-filter-group">
          <label>Date:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="teacher-date-input"
          />
        </div>
        <div className="teacher-filter-group">
          <label>Subject:</label>
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="teacher-select"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject, index) => (
              <option key={index} value={subject.subject_name}>
                {subject.subject_name}
              </option>
            ))}
          </select>
        </div>
        <button className="teacher-apply-filter-btn" onClick={handleFilterApply}>
          Apply Filters
        </button>
      </div>

      {/* Attendance Records Table */}
      <div className="teacher-table-wrapper">
        <div className="teacher-attendance-table">
          <div className="teacher-table-header">
            <div className="teacher-table-col">Student</div>
            <div className="teacher-table-col">Student #</div>
            <div className="teacher-table-col">Date</div>
            <div className="teacher-table-col">Subject</div>
            <div className="teacher-table-col">Time In</div>
            <div className="teacher-table-col">Status</div>
            <div className="teacher-table-col">Notes</div>
            <div className="teacher-table-col">Actions</div>
          </div>
          
          {safeRecords.length > 0 ? (
            safeRecords.map(record => (
              <React.Fragment key={record.id}>
                <div className="teacher-table-row">
                  <div className="teacher-table-col" data-label="Student">
                    <strong>{record.student_name}</strong>
                  </div>
                  <div className="teacher-table-col" data-label="Student #">
                    {record.student_number || '-'}
                  </div>
                  <div className="teacher-table-col" data-label="Date">
                    {record.date}
                  </div>
                  <div className="teacher-table-col" data-label="Subject">
                    {record.subject_name}
                  </div>
                  <div className="teacher-table-col" data-label="Time In">
                    {record.time_in || '-'}
                  </div>
                  <div className="teacher-table-col" data-label="Status">
                    <span className={`teacher-status-badge ${record.status}`}>
                      {record.status}
                    </span>
                  </div>
                  <div className="teacher-table-col" data-label="Notes">
                    {record.notes || '-'}
                  </div>
                  <div className="teacher-table-col" data-label="Actions">
                    <button 
                      className="teacher-action-btn small edit"
                      onClick={() => setEditingRecord(
                        editingRecord?.id === record.id ? null : record
                      )}
                    >
                      <FaEdit /> Edit
                    </button>
                  </div>
                </div>

                {/* Edit Form */}
                {editingRecord?.id === record.id && (
                  <div className="teacher-edit-form">
                    <select
                      defaultValue={record.status}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord, 
                        status: e.target.value
                      })}
                      className="teacher-status-select"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="excused">Excused</option>
                    </select>
                    <input
                      type="time"
                      defaultValue={record.time_in || ''}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord, 
                        time_in: e.target.value
                      })}
                      className="teacher-time-input"
                    />
                    <input
                      type="text"
                      defaultValue={record.notes || ''}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord, 
                        notes: e.target.value
                      })}
                      placeholder="Notes"
                      className="teacher-notes-input"
                    />
                    <button 
                      className="teacher-save-btn"
                      onClick={() => handleUpdateRecord(record.id, {
                        status: editingRecord.status,
                        time_in: editingRecord.time_in,
                        notes: editingRecord.notes
                      })}
                    >
                      <FaSave /> Save
                    </button>
                    <button 
                      className="teacher-cancel-btn"
                      onClick={() => setEditingRecord(null)}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="teacher-empty-state">
              <FaCalendarAlt className="teacher-empty-icon" />
              <p>No attendance records found</p>
              <p className="teacher-empty-subtitle">
                Click "Take Attendance" to start marking attendance
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherAttendance;