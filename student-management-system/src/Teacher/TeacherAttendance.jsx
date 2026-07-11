// src/components/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import {
  FaUserCheck, FaDownload, FaPlus, FaEdit, FaSave, FaTimes,
  FaCalendarAlt, FaClock, FaStickyNote, FaCheck, FaTimesCircle,
  FaClock as FaClockIcon, FaClipboardList, FaSpinner
} from 'react-icons/fa';
import '../styles/teacher/teacherattendance.css';

const TeacherAttendance = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0,
    attendanceRate: 0
  });
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchAttendanceRecords();
    fetchStats();
  }, []);

  // FIXED: Better error handling and token management
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      setMessage({ type: 'error', text: 'Authentication token not found. Please log in again.' });
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchSubjects = async () => {
    try {
      console.log('Fetching subjects...');
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/teacher/attendance/subjects', { headers });
      
      console.log('Subjects response status:', response.status);
      
      const data = await response.json();
      console.log('Subjects data:', data);
      
      if (response.ok) {
        const subjectList = data.subjects || [];
        console.log('Setting subjects:', subjectList);
        setSubjects(subjectList);
        
        if (subjectList.length === 0) {
          setMessage({ 
            type: 'warning', 
            text: 'No subjects found. Please check your teacher profile.' 
          });
        }
      } else {
        console.error('Failed to fetch subjects:', data);
        setMessage({ type: 'error', text: data.message || 'Failed to load subjects' });
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setMessage({ type: 'error', text: 'Network error while loading subjects' });
    }
  };

  const fetchStudents = async (subjectName) => {
    if (!subjectName) {
      setStudents([]);
      setAttendanceData([]);
      return;
    }

    try {
      setLoading(true);
      setStudents([]);
      setAttendanceData([]);
      
      console.log('Fetching students for subject:', subjectName);
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(
        `/api/teacher/attendance/students?subject_name=${encodeURIComponent(subjectName)}`,
        { headers }
      );
      
      console.log('Students response status:', response.status);
      const result = await response.json();
      console.log('Students data:', result);
      
      if (response.ok) {
        if (result.students && result.students.length > 0) {
          console.log(`Loaded ${result.students.length} students`);
          setStudents(result.students);
          
          const initialAttendance = result.students.map(student => ({
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
            text: `Loaded ${result.students.length} students for ${subjectName}` 
          });
        } else {
          console.log('No students found for subject:', subjectName);
          setMessage({ 
            type: 'warning', 
            text: `No students found for ${subjectName}. Students may not be registered for this subject.` 
          });
          setStudents([]);
          setAttendanceData([]);
        }
      } else {
        console.error('Error response:', result);
        setMessage({ type: 'error', text: result.message || 'Failed to load students' });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage({ type: 'error', text: 'Network error while loading students' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      console.log('Fetching attendance records...');
      const headers = getAuthHeaders();
      if (!headers) return;

      let url = '/api/teacher/attendance/records';
      const params = new URLSearchParams();
      
      if (filterDate) params.append('date', filterDate);
      if (filterSubject) params.append('subject_name', filterSubject);
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, { headers });
      console.log('Records response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Records data:', data);
        setAttendanceRecords(data.records || []);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/teacher/attendance/stats', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSubjectChange = (subjectName) => {
    console.log('Subject selected:', subjectName);
    setSelectedSubject(subjectName);
    if (subjectName) {
      fetchStudents(subjectName);
    } else {
      setStudents([]);
      setAttendanceData([]);
    }
  };

  // ... rest of your component methods remain the same ...

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
      setMessage({ type: 'error', text: 'Please select a subject and load students' });
      return;
    }

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const payload = {
        subject_name: selectedSubject,
        date: attendanceDate,
        records: attendanceData
      };

      console.log('Submitting attendance:', payload);

      const response = await fetch('/api/teacher/attendance/submit', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      console.log('Submit result:', result);

      if (response.ok) {
        setMessage({ type: 'success', text: result.message });
        fetchAttendanceRecords();
        fetchStats();
        setTimeout(() => {
          setShowAttendanceForm(false);
          setSelectedSubject('');
          setStudents([]);
          setAttendanceData([]);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (recordId, updates) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/teacher/attendance/record/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Record updated successfully' });
        fetchAttendanceRecords();
        fetchStats();
        setEditingRecord(null);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update record' });
    }
  };

  const handleExportReport = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

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
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to export report' });
    }
  };

  const handleFilterApply = () => {
    fetchAttendanceRecords();
  };

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
        <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
          <strong>Debug Info:</strong><br/>
          Subjects loaded: {subjects.length}<br/>
          Students loaded: {students.length}<br/>
          Records loaded: {safeRecords.length}<br/>
          Selected subject: {selectedSubject || 'None'}<br/>
          Token present: {localStorage.getItem('token') ? 'Yes' : 'No'}
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
              <p style={{ color: 'orange', fontSize: '14px' }}>
                No subjects available. Please ensure your teacher profile has subjects assigned.
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
              <p>No students found for this subject.</p>
              <p className="teacher-empty-subtitle">
                Possible reasons:
                <ul>
                  <li>No students are registered for {selectedSubject}</li>
                  <li>Students haven't been approved yet</li>
                  <li>Class type mismatch between teacher and students</li>
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
              <div key={record.id} className="teacher-table-row">
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
                    onClick={() => setEditingRecord(editingRecord?.id === record.id ? null : record)}
                  >
                    <FaEdit /> Edit
                  </button>
                </div>

                {/* Edit Form */}
                {editingRecord?.id === record.id && (
                  <div className="teacher-edit-form">
                    <select
                      defaultValue={record.status}
                      onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
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
                      onChange={(e) => setEditingRecord({...editingRecord, time_in: e.target.value})}
                      className="teacher-time-input"
                    />
                    <input
                      type="text"
                      defaultValue={record.notes || ''}
                      onChange={(e) => setEditingRecord({...editingRecord, notes: e.target.value})}
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
              </div>
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