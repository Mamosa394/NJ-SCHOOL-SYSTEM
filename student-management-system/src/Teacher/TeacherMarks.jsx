// src/components/TeacherMarks.jsx
import React, { useState, useEffect } from 'react';
import {
  FaClipboardList, FaSearch, FaDownload,
  FaPlus, FaTrash, FaSave, FaTimes,
  FaBook, FaCheckCircle
} from 'react-icons/fa';
import { supabase } from '../components/supabaseClient';
import '../styles/teacher/teachermarks.css';

const TeacherMarks = ({ teacherData }) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  
  const [showNewAssessment, setShowNewAssessment] = useState(false);
  const [newAssessment, setNewAssessment] = useState({
    title: '',
    type: 'test',
    max_score: 100,
    date: new Date().toISOString().split('T')[0]
  });

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (teacherData?.subjects) {
      setSubjects(teacherData.subjects);
      if (teacherData.subjects.length > 0) {
        setSelectedSubject(teacherData.subjects[0]);
      }
    }
  }, [teacherData]);

  useEffect(() => {
    if (selectedSubject) {
      fetchAssessments();
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedAssessment) {
      fetchStudentsAndMarks();
    }
  }, [selectedAssessment]);

  const fetchAssessments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('teacher_id', teacherData.id)
        .eq('subject', selectedSubject)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssessments(data || []);
      
      if (data && data.length > 0 && !selectedAssessment) {
        setSelectedAssessment(data[0]);
      }
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsAndMarks = async () => {
    try {
      setIsLoading(true);

      const { data: enrolledStudents, error: studentError } = await supabase
        .from('student_subjects')
        .select(`
          student_id,
          students!inner(
            id,
            full_name,
            grade,
            student_id,
            approval_status
          )
        `)
        .eq('subject', selectedSubject)
        .eq('students.approval_status', 'approved');

      if (studentError) throw studentError;

      const { data: existingMarks, error: marksError } = await supabase
        .from('marks')
        .select('*')
        .eq('assessment_id', selectedAssessment.id);

      if (marksError) throw marksError;

      const marksMap = {};
      if (existingMarks) {
        existingMarks.forEach(mark => {
          marksMap[mark.student_id] = mark;
        });
      }

      const formattedStudents = (enrolledStudents || []).map(enrollment => ({
        ...enrollment.students,
        mark: marksMap[enrollment.student_id]?.score ?? '',
        comment: marksMap[enrollment.student_id]?.comment ?? '',
        mark_id: marksMap[enrollment.student_id]?.id ?? null
      }));

      setStudents(formattedStudents);

      const initialMarks = {};
      formattedStudents.forEach(student => {
        initialMarks[student.id] = {
          score: student.mark,
          comment: student.comment,
          mark_id: student.mark_id
        };
      });
      setMarks(initialMarks);

    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: field === 'score' ? Number(value) : value
      }
    }));
  };

  const saveMarks = async () => {
    try {
      setIsLoading(true);
      setSaveMessage(null);

      const updates = [];
      const inserts = [];

      Object.entries(marks).forEach(([studentId, markData]) => {
        if (markData.mark_id) {
          updates.push(
            supabase
              .from('marks')
              .update({
                score: markData.score,
                comment: markData.comment,
                updated_at: new Date().toISOString()
              })
              .eq('id', markData.mark_id)
          );
        } else if (markData.score !== '' && markData.score !== null) {
          inserts.push({
            student_id: studentId,
            assessment_id: selectedAssessment.id,
            subject: selectedSubject,
            teacher_id: teacherData.id,
            score: markData.score,
            comment: markData.comment,
            created_at: new Date().toISOString()
          });
        }
      });

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('marks').insert(inserts);
        if (insertError) throw insertError;
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }

      setSaveMessage({ type: 'success', text: 'Marks saved successfully!' });
      await fetchStudentsAndMarks();
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('Error saving marks:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to save marks' });
    } finally {
      setIsLoading(false);
    }
  };

  const createAssessment = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('assessments')
        .insert({
          ...newAssessment,
          subject: selectedSubject,
          teacher_id: teacherData.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setAssessments(prev => [data, ...prev]);
      setSelectedAssessment(data);
      setShowNewAssessment(false);
      setNewAssessment({
        title: '',
        type: 'test',
        max_score: 100,
        date: new Date().toISOString().split('T')[0]
      });

      setSaveMessage({ type: 'success', text: 'Assessment created successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('Error creating assessment:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to create assessment' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAssessment = async (assessmentId) => {
    if (!window.confirm('Are you sure you want to delete this assessment and all its marks?')) return;

    try {
      setIsLoading(true);
      await supabase.from('marks').delete().eq('assessment_id', assessmentId);
      
      const { error } = await supabase.from('assessments').delete().eq('id', assessmentId);
      if (error) throw error;

      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      if (selectedAssessment?.id === assessmentId) {
        setSelectedAssessment(null);
        setStudents([]);
        setMarks({});
      }

      setSaveMessage({ type: 'success', text: 'Assessment deleted!' });
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error('Error deleting assessment:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to delete assessment' });
    } finally {
      setIsLoading(false);
    }
  };

  const exportMarks = () => {
    if (!students.length || !selectedAssessment) return;

    let csv = 'Student Name,Student ID,Grade,Score,Comment\n';
    students.forEach(student => {
      csv += `"${student.full_name}","${student.student_id}","${student.grade}","${marks[student.id]?.score || ''}","${marks[student.id]?.comment || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedSubject}_${selectedAssessment.title}_marks.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getAverageScore = () => {
    if (!students.length) return 0;
    const scores = Object.values(marks)
      .filter(m => m.score !== '' && m.score !== null)
      .map(m => Number(m.score));
    if (scores.length === 0) return 0;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="premium-content-area">
      <div className="premium-content-scroll">
        
        {saveMessage && (
          <div className={`marks-message ${saveMessage.type}`}>
            {saveMessage.type === 'success' ? <FaCheckCircle /> : <FaTimes />}
            {saveMessage.text}
          </div>
        )}

        {/* Header Card */}
        <div className="marks-card">
          <div className="marks-card-header">
            <h2 className="marks-title"><FaClipboardList /> Marks Management</h2>
            <div className="marks-header-actions">
              <button className="marks-btn marks-btn-outline" onClick={exportMarks} disabled={!selectedAssessment}>
                <FaDownload /> Export
              </button>
              <button className="marks-btn marks-btn-primary" onClick={() => setShowNewAssessment(true)}>
                <FaPlus /> New Assessment
              </button>
            </div>
          </div>

          {/* Selectors */}
          <div className="marks-selectors">
            <div className="marks-selector-group">
              <label className="marks-label">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => { setSelectedSubject(e.target.value); setSelectedAssessment(null); }}
                className="marks-select"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div className="marks-selector-group">
              <label className="marks-label">Select Assessment</label>
              <select
                value={selectedAssessment?.id || ''}
                onChange={(e) => {
                  const assessment = assessments.find(a => a.id === e.target.value);
                  setSelectedAssessment(assessment);
                }}
                className="marks-select"
              >
                <option value="">-- Select Assessment --</option>
                {assessments.map(assessment => (
                  <option key={assessment.id} value={assessment.id}>
                    {assessment.title} ({assessment.type}) - {new Date(assessment.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* New Assessment Form */}
        {showNewAssessment && (
          <div className="marks-card">
            <div className="marks-card-header">
              <h3 className="marks-subtitle"><FaPlus /> Create New Assessment</h3>
              <button className="marks-btn marks-btn-cancel" onClick={() => setShowNewAssessment(false)}>
                <FaTimes /> Cancel
              </button>
            </div>
            <div className="marks-form-grid">
              <div className="marks-form-group">
                <label className="marks-label">Assessment Title</label>
                <input type="text" value={newAssessment.title} onChange={(e) => setNewAssessment(prev => ({ ...prev, title: e.target.value }))} className="marks-input" placeholder="e.g., Mid-Term Test" />
              </div>
              <div className="marks-form-group">
                <label className="marks-label">Type</label>
                <select value={newAssessment.type} onChange={(e) => setNewAssessment(prev => ({ ...prev, type: e.target.value }))} className="marks-select">
                  <option value="test">Test</option>
                  <option value="exam">Exam</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="marks-form-group">
                <label className="marks-label">Max Score</label>
                <input type="number" value={newAssessment.max_score} onChange={(e) => setNewAssessment(prev => ({ ...prev, max_score: Number(e.target.value) }))} className="marks-input" min="1" />
              </div>
              <div className="marks-form-group">
                <label className="marks-label">Date</label>
                <input type="date" value={newAssessment.date} onChange={(e) => setNewAssessment(prev => ({ ...prev, date: e.target.value }))} className="marks-input" />
              </div>
            </div>
            <div className="marks-form-actions">
              <button className="marks-btn marks-btn-success" onClick={createAssessment} disabled={!newAssessment.title || isLoading}>
                <FaSave /> {isLoading ? 'Creating...' : 'Create Assessment'}
              </button>
            </div>
          </div>
        )}

        {/* Marks Entry */}
        {selectedAssessment && (
          <div className="marks-card">
            <div className="marks-card-header">
              <div className="marks-assessment-info">
                <h3 className="marks-subtitle"><FaBook /> {selectedAssessment.title}</h3>
                <p className="marks-assessment-meta">
                  <span>{selectedAssessment.type?.toUpperCase()}</span>
                  <span className="marks-meta-sep">•</span>
                  <span>Max: {selectedAssessment.max_score}</span>
                  <span className="marks-meta-sep">•</span>
                  <span>{new Date(selectedAssessment.date).toLocaleDateString()}</span>
                  <span className="marks-meta-sep">•</span>
                  <span>Students: {students.length}</span>
                  <span className="marks-meta-sep">•</span>
                  <span>Average: {getAverageScore()}%</span>
                </p>
              </div>
              <div className="marks-card-actions">
                <button className="marks-btn marks-btn-success" onClick={saveMarks} disabled={isLoading}>
                  <FaSave /> {isLoading ? 'Saving...' : 'Save All Marks'}
                </button>
                <button className="marks-btn marks-btn-danger" onClick={() => deleteAssessment(selectedAssessment.id)} disabled={isLoading}>
                  <FaTrash />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="marks-search">
              <FaSearch className="marks-search-icon" />
              <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="marks-search-input" />
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="marks-loading">
                <div className="marks-spinner"></div>
                <p>Loading students...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="marks-table-wrapper">
                <table className="marks-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>ID</th>
                      <th>Grade</th>
                      <th className="marks-th-center">Score (/{selectedAssessment.max_score})</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <td>
                          <div className="marks-student-cell">
                            <div className="marks-student-avatar">
                              {student.full_name?.charAt(0) || 'S'}
                            </div>
                            <span className="marks-student-name">{student.full_name}</span>
                          </div>
                        </td>
                        <td className="marks-td-id">{student.student_id}</td>
                        <td className="marks-td-grade">{student.grade}</td>
                        <td className="marks-td-center">
                          <input
                            type="number"
                            value={marks[student.id]?.score ?? ''}
                            onChange={(e) => handleMarkChange(student.id, 'score', e.target.value)}
                            className="marks-score-input"
                            min="0"
                            max={selectedAssessment.max_score}
                            placeholder="-"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={marks[student.id]?.comment ?? ''}
                            onChange={(e) => handleMarkChange(student.id, 'comment', e.target.value)}
                            className="marks-comment-input"
                            placeholder="Add comment..."
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <FaClipboardList />
                <p>No students found for this subject</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherMarks;