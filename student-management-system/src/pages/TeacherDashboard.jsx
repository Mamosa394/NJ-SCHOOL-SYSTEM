import React, { useState, useEffect } from 'react';
import '../styles/teacherdashboard.css';
import {
  FaHome,
  FaClipboardList,
  FaBook,
  FaUserCheck,
  FaCalendarAlt,
  FaBullhorn,
  FaChalkboardTeacher,
  FaFileUpload,
  FaChartLine,
  FaUsers,
  FaBell,
  FaCog,
  FaSearch,
  FaPlus,
  FaDownload,
  FaEdit,
  FaTrash,
  FaEye,
  FaClock,
  FaUserGraduate,
  FaBars,
  FaTimes,
  FaSchool,
  FaBookOpen,
  FaFileAlt,
  FaCalendarCheck,
  FaGraduationCap
} from 'react-icons/fa';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    attendanceRate: 0,
    materialsCount: 0,
    upcomingClasses: 0
  });

  useEffect(() => {
    // Simulated data - replace with actual API calls
    const mockStudents = [
      { id: 1, name: 'Thabiso M.', grade: 'Grade 11', marks: { test1: 85, test2: 78, test3: 92, test4: 88 }, comment: 'Excellent work', improvement: 'Focus on algebra' },
      { id: 2, name: 'Relebohile S.', grade: 'Grade 11', marks: { test1: 72, test2: 68, test3: 75, test4: 70 }, comment: 'Good progress', improvement: 'Practice more problems' },
      { id: 3, name: 'Kagiso L.', grade: 'Grade 12', marks: { test1: 95, test2: 88, test3: 92, test4: 90 }, comment: 'Outstanding', improvement: 'Challenge with advanced topics' },
      { id: 4, name: 'Nthabiseng M.', grade: 'Grade 11', marks: { test1: 68, test2: 72, test3: 65, test4: 70 }, comment: 'Needs improvement', improvement: 'Review basic concepts' },
      { id: 5, name: 'Sipho D.', grade: 'Grade 10', marks: { test1: 82, test2: 85, test3: 78, test4: 80 }, comment: 'Steady progress', improvement: 'Work on time management' },
      { id: 6, name: 'Lerato K.', grade: 'Grade 12', marks: { test1: 90, test2: 92, test3: 88, test4: 91 }, comment: 'Exceptional work', improvement: 'Prepare for finals' },
    ];

    const mockMaterials = [
      { id: 1, title: 'Term 1 Chemistry Notes', subject: 'Chemistry', date: '2024-03-15', type: 'pdf', size: '2.4 MB', downloads: 45 },
      { id: 2, title: 'Physics Lab Manual', subject: 'Physics', date: '2024-03-10', type: 'pdf', size: '3.1 MB', downloads: 38 },
      { id: 3, title: 'Mathematics Practice Problems', subject: 'Mathematics', date: '2024-03-05', type: 'doc', size: '1.8 MB', downloads: 52 },
      { id: 4, title: 'Biology Study Guide', subject: 'Biology', date: '2024-03-01', type: 'pdf', size: '4.2 MB', downloads: 41 },
      { id: 5, title: 'Science Fair Guidelines', subject: 'General Science', date: '2024-02-28', type: 'pdf', size: '1.5 MB', downloads: 36 },
    ];

    const mockAttendance = [
      { id: 1, name: 'Thabiso M.', date: '2024-03-15', status: 'Present', timeIn: '08:15', timeOut: '15:30', subject: 'Mathematics' },
      { id: 2, name: 'Relebohile S.', date: '2024-03-15', status: 'Absent', timeIn: '--:--', timeOut: '--:--', subject: 'Mathematics', reason: 'Sick' },
      { id: 3, name: 'Kagiso L.', date: '2024-03-15', status: 'Present', timeIn: '08:05', timeOut: '15:45', subject: 'Physics' },
      { id: 4, name: 'Nthabiseng M.', date: '2024-03-15', status: 'Late', timeIn: '09:30', timeOut: '15:35', subject: 'Chemistry', reason: 'Traffic' },
      { id: 5, name: 'Sipho D.', date: '2024-03-15', status: 'Present', timeIn: '08:20', timeOut: '15:25', subject: 'Biology' },
      { id: 6, name: 'Lerato K.', date: '2024-03-15', status: 'Present', timeIn: '08:10', timeOut: '15:40', subject: 'Mathematics' },
    ];

    const mockClasses = [
      { id: 1, subject: 'Mathematics', time: '08:00 - 09:00', day: 'Monday', room: 'Room 101', grade: 'Grade 11' },
      { id: 2, subject: 'Physics', time: '09:15 - 10:15', day: 'Monday', room: 'Lab 3', grade: 'Grade 12' },
      { id: 3, subject: 'Chemistry', time: '10:30 - 11:30', day: 'Monday', room: 'Lab 2', grade: 'Grade 11' },
      { id: 4, subject: 'Mathematics', time: '08:00 - 09:00', day: 'Tuesday', room: 'Room 101', grade: 'Grade 12' },
      { id: 5, subject: 'Biology', time: '09:15 - 10:15', day: 'Tuesday', room: 'Lab 1', grade: 'Grade 10' },
      { id: 6, subject: 'Physics', time: '10:30 - 11:30', day: 'Tuesday', room: 'Lab 3', grade: 'Grade 11' },
    ];

    const mockEvents = [
      { id: 1, title: 'Parent-Teacher Conference', date: 'March 25, 2024', time: '14:00 - 16:00', location: 'Main Hall', type: 'meeting' },
      { id: 2, title: 'Science Fair Judging', date: 'April 5, 2024', time: '10:00 - 14:00', location: 'Science Building', type: 'academic' },
      { id: 3, title: 'Department Meeting', date: 'March 18, 2024', time: '15:00 - 16:30', location: 'Conference Room', type: 'staff' },
      { id: 4, title: 'Relebohile S. Birthday', date: 'July 28, 2024', time: 'All Day', location: 'Classroom', type: 'birthday' },
      { id: 5, title: 'Term Examination', date: 'March 30, 2024', time: '09:00 - 12:00', location: 'Exam Hall', type: 'exam' },
    ];

    setStudents(mockStudents);
    setMaterials(mockMaterials);
    setAttendance(mockAttendance);
    setClasses(mockClasses);
    setEvents(mockEvents);

    // Calculate statistics
    setStats({
      totalStudents: mockStudents.length,
      attendanceRate: Math.round((mockAttendance.filter(a => a.status === 'Present').length / mockAttendance.length) * 100),
      materialsCount: mockMaterials.length,
      upcomingClasses: mockClasses.filter(c => c.day === 'Monday').length
    });

    // Check mobile view
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="teacher-overview-grid">
            {/* Welcome Section */}
            <div className="teacher-welcome-card">
              <div className="teacher-welcome-content">
                <h2>Welcome back, Ms. Smith!</h2>
                <p>Mathematics & Physics Teacher • Grade 11-12</p>
                <div className="teacher-welcome-stats">
                  <div className="teacher-welcome-stat">
                    <span className="teacher-welcome-stat-label">Today's Schedule</span>
                    <span className="teacher-welcome-stat-value">3 Classes</span>
                  </div>
                  <div className="teacher-welcome-stat">
                    <span className="teacher-welcome-stat-label">Pending Grading</span>
                    <span className="teacher-welcome-stat-value">24 Assignments</span>
                  </div>
                </div>
              </div>
              <div className="teacher-welcome-avatar">
                <FaChalkboardTeacher />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="teacher-stat-cards">
              <div className="teacher-stat-card">
                <div className="teacher-stat-icon students">
                  <FaUserGraduate />
                </div>
                <div className="teacher-stat-info">
                  <h3>Total Students</h3>
                  <p className="teacher-stat-value">{stats.totalStudents}</p>
                  <span className="teacher-stat-trend">Across all classes</span>
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-icon attendance">
                  <FaUserCheck />
                </div>
                <div className="teacher-stat-info">
                  <h3>Attendance Rate</h3>
                  <p className="teacher-stat-value">{stats.attendanceRate}%</p>
                  <span className="teacher-stat-trend">Today: {attendance.filter(a => a.status === 'Present').length}/{attendance.length}</span>
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-icon materials">
                  <FaBook />
                </div>
                <div className="teacher-stat-info">
                  <h3>Materials</h3>
                  <p className="teacher-stat-value">{stats.materialsCount}</p>
                  <span className="teacher-stat-trend">{materials.reduce((acc, mat) => acc + mat.downloads, 0)} total downloads</span>
                </div>
              </div>

              <div className="teacher-stat-card">
                <div className="teacher-stat-icon schedule">
                  <FaCalendarAlt />
                </div>
                <div className="teacher-stat-info">
                  <h3>Today's Classes</h3>
                  <p className="teacher-stat-value">{stats.upcomingClasses}</p>
                  <span className="teacher-stat-trend">Next: Mathematics (08:00)</span>
                </div>
              </div>
            </div>

            {/* Today's Classes */}
            <div className="teacher-dashboard-card">
              <div className="teacher-card-header">
                <h2><FaClock /> Today's Schedule</h2>
                <button className="teacher-view-all-btn">View Full Timetable</button>
              </div>
              <div className="teacher-classes-list">
                {classes.slice(0, 3).map(cls => (
                  <div key={cls.id} className="teacher-class-item">
                    <div className="teacher-class-time">
                      <span className="teacher-class-hour">{cls.time}</span>
                      <span className="teacher-class-day">{cls.day}</span>
                    </div>
                    <div className="teacher-class-details">
                      <h4>{cls.subject}</h4>
                      <p className="teacher-class-grade">{cls.grade} • {cls.room}</p>
                    </div>
                    <div className="teacher-class-status">
                      <span className="teacher-status-badge upcoming">Upcoming</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="teacher-dashboard-card">
              <div className="teacher-card-header">
                <h2><FaClipboardList /> Quick Actions</h2>
              </div>
              <div className="teacher-quick-actions">
                <button className="teacher-quick-action">
                  <FaClipboardList />
                  <span>Enter Marks</span>
                </button>
                <button className="teacher-quick-action">
                  <FaUserCheck />
                  <span>Take Attendance</span>
                </button>
                <button className="teacher-quick-action">
                  <FaBook />
                  <span>Upload Materials</span>
                </button>
                <button className="teacher-quick-action">
                  <FaCalendarAlt />
                  <span>View Schedule</span>
                </button>
                <button className="teacher-quick-action">
                  <FaBullhorn />
                  <span>Post Announcement</span>
                </button>
                <button className="teacher-quick-action">
                  <FaChartLine />
                  <span>View Reports</span>
                </button>
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="teacher-dashboard-card">
              <div className="teacher-card-header">
                <h2><FaFileUpload /> Recent Materials</h2>
                <button className="teacher-view-all-btn">View All</button>
              </div>
              <div className="teacher-materials-list">
                {materials.slice(0, 3).map(material => (
                  <div key={material.id} className="teacher-material-item">
                    <div className="teacher-material-icon">
                      <FaFileAlt />
                    </div>
                    <div className="teacher-material-details">
                      <h4>{material.title}</h4>
                      <p className="teacher-material-subject">{material.subject} • {material.date}</p>
                      <div className="teacher-material-meta">
                        <span className="teacher-material-type">{material.type.toUpperCase()}</span>
                        <span className="teacher-material-size">{material.size}</span>
                        <span className="teacher-material-downloads">{material.downloads} downloads</span>
                      </div>
                    </div>
                    <button className="teacher-action-btn small">
                      <FaDownload />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="teacher-dashboard-card">
              <div className="teacher-card-header">
                <h2><FaBullhorn /> Upcoming Events</h2>
                <button className="teacher-view-all-btn">View Calendar</button>
              </div>
              <div className="teacher-events-list">
                {events.slice(0, 3).map(event => (
                  <div key={event.id} className="teacher-event-item">
                    <div className="teacher-event-date">
                      <span className="teacher-event-day">{new Date(event.date).getDate()}</span>
                      <span className="teacher-event-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="teacher-event-details">
                      <h4>{event.title}</h4>
                      <p className="teacher-event-time">{event.time} • {event.location}</p>
                      <span className={`teacher-event-type ${event.type}`}>{event.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'marks':
        return (
          <div className="teacher-dashboard-card full-view">
            <div className="teacher-card-header">
              <h2><FaClipboardList /> Student Marks Management</h2>
              <div className="teacher-header-actions">
                <div className="teacher-search-box">
                  <FaSearch />
                  <input type="text" placeholder="Search students..." />
                </div>
                <button className="teacher-primary-btn">
                  <FaDownload /> Export Grades
                </button>
                <button className="teacher-secondary-btn">
                  <FaPlus /> Add Assignment
                </button>
              </div>
            </div>

            <div className="teacher-table-wrapper">
              <div className="teacher-marks-table">
                <div className="teacher-table-header">
                  <div className="teacher-table-col">Student</div>
                  <div className="teacher-table-col">Grade</div>
                  <div className="teacher-table-col">Test 1</div>
                  <div className="teacher-table-col">Test 2</div>
                  <div className="teacher-table-col">Test 3</div>
                  <div className="teacher-table-col">Test 4</div>
                  <div className="teacher-table-col">Average</div>
                  <div className="teacher-table-col">Comment</div>
                  <div className="teacher-table-col">Improvement</div>
                  <div className="teacher-table-col">Actions</div>
                </div>
                {students.map(student => {
                  const marks = Object.values(student.marks);
                  const average = marks.length > 0 ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(1) : 0;
                  
                  return (
                    <div key={student.id} className="teacher-table-row">
                      <div className="teacher-table-col" data-label="Student">
                        <div className="teacher-student-info">
                          <div className="teacher-student-avatar">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <strong>{student.name}</strong>
                            <div className="teacher-student-grade">{student.grade}</div>
                          </div>
                        </div>
                      </div>
                      <div className="teacher-table-col" data-label="Grade">
                        {student.grade}
                      </div>
                      <div className="teacher-table-col" data-label="Test 1">
                        <input 
                          type="number" 
                          defaultValue={student.marks.test1}
                          className="teacher-grade-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Test 2">
                        <input 
                          type="number" 
                          defaultValue={student.marks.test2}
                          className="teacher-grade-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Test 3">
                        <input 
                          type="number" 
                          defaultValue={student.marks.test3}
                          className="teacher-grade-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Test 4">
                        <input 
                          type="number" 
                          defaultValue={student.marks.test4}
                          className="teacher-grade-input"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Average">
                        <span className={`teacher-grade-average ${average >= 80 ? 'excellent' : average >= 70 ? 'good' : average >= 60 ? 'average' : 'poor'}`}>
                          {average}%
                        </span>
                      </div>
                      <div className="teacher-table-col" data-label="Comment">
                        <input 
                          type="text" 
                          defaultValue={student.comment}
                          className="teacher-comment-input"
                          placeholder="Add comment..."
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Improvement">
                        <input 
                          type="text" 
                          defaultValue={student.improvement}
                          className="teacher-improvement-input"
                          placeholder="Suggest improvement..."
                        />
                      </div>
                      <div className="teacher-table-col" data-label="Actions">
                        <div className="teacher-action-buttons">
                          <button className="teacher-action-btn small">
                            <FaEdit /> Update
                          </button>
                          <button className="teacher-action-btn small">
                            <FaEye /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="teacher-table-scroll-hint">
                ← Scroll horizontally to see more →
              </div>
            </div>

            <div className="teacher-table-footer">
              <button className="teacher-primary-btn">
                Save All Changes
              </button>
              <div className="teacher-records-info">
                Showing {students.length} students • Last saved: Today, 10:30 AM
              </div>
            </div>
          </div>
        );

      case 'materials':
        return (
          <div className="teacher-dashboard-card full-view">
            <div className="teacher-card-header">
              <h2><FaBook /> Learning Materials</h2>
              <div className="teacher-header-actions">
                <div className="teacher-search-box">
                  <FaSearch />
                  <input type="text" placeholder="Search materials..." />
                </div>
                <button className="teacher-primary-btn">
                  <FaPlus /> Upload New
                </button>
              </div>
            </div>

            {/* Upload Form */}
            <div className="teacher-upload-card">
              <h3>Upload New Material</h3>
              <form className="teacher-upload-form">
                <div className="teacher-form-row">
                  <div className="teacher-form-group">
                    <label>Title</label>
                    <input type="text" placeholder="e.g. Term 1 Chemistry Notes" />
                  </div>
                  <div className="teacher-form-group">
                    <label>Subject</label>
                    <select>
                      <option>Mathematics</option>
                      <option>Physics</option>
                      <option>Chemistry</option>
                      <option>Biology</option>
                      <option>General Science</option>
                    </select>
                  </div>
                </div>
                <div className="teacher-form-row">
                  <div className="teacher-form-group">
                    <label>Description</label>
                    <textarea placeholder="Brief description of the material..." rows="3"></textarea>
                  </div>
                </div>
                <div className="teacher-form-row">
                  <div className="teacher-form-group">
                    <label>File</label>
                    <div className="teacher-file-upload">
                      <FaFileUpload />
                      <span>Choose file or drag & drop</span>
                      <input type="file" />
                    </div>
                  </div>
                  <div className="teacher-form-group">
                    <label>Access Level</label>
                    <select>
                      <option>All Students</option>
                      <option>Specific Grade</option>
                      <option>Private</option>
                    </select>
                  </div>
                </div>
                <div className="teacher-form-actions">
                  <button type="submit" className="teacher-primary-btn">
                    Upload Material
                  </button>
                  <button type="button" className="teacher-secondary-btn">
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Materials Grid */}
            <div className="teacher-materials-grid">
              {materials.map(material => (
                <div key={material.id} className="teacher-material-card">
                  <div className="teacher-material-card-header">
                    <div className="teacher-material-card-icon">
                      <FaFileAlt />
                    </div>
                    <div className="teacher-material-card-actions">
                      <button className="teacher-action-btn small">
                        <FaDownload />
                      </button>
                      <button className="teacher-action-btn small">
                        <FaEdit />
                      </button>
                      <button className="teacher-action-btn small danger">
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="teacher-material-card-content">
                    <h4>{material.title}</h4>
                    <p className="teacher-material-card-subject">{material.subject}</p>
                    <div className="teacher-material-card-meta">
                      <span className="teacher-material-card-date">{material.date}</span>
                      <span className="teacher-material-card-size">{material.size}</span>
                      <span className="teacher-material-card-type">{material.type.toUpperCase()}</span>
                    </div>
                    <div className="teacher-material-card-footer">
                      <span className="teacher-material-card-downloads">
                        {material.downloads} downloads
                      </span>
                      <button className="teacher-action-btn small">
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'attendance':
        return (
          <div className="teacher-dashboard-card full-view">
            <div className="teacher-card-header">
              <h2><FaUserCheck /> Attendance Management</h2>
              <div className="teacher-header-actions">
                <div className="teacher-date-filter">
                  <input type="date" defaultValue="2024-03-15" />
                </div>
                <button className="teacher-primary-btn">
                  <FaDownload /> Export Report
                </button>
                <button className="teacher-secondary-btn">
                  <FaPlus /> Take Attendance
                </button>
              </div>
            </div>

            <div className="teacher-attendance-summary">
              <div className="teacher-summary-item">
                <span className="teacher-summary-label">Present Today</span>
                <span className="teacher-summary-value success">
                  {attendance.filter(a => a.status === 'Present').length}
                </span>
              </div>
              <div className="teacher-summary-item">
                <span className="teacher-summary-label">Absent</span>
                <span className="teacher-summary-value warning">
                  {attendance.filter(a => a.status === 'Absent').length}
                </span>
              </div>
              <div className="teacher-summary-item">
                <span className="teacher-summary-label">Late</span>
                <span className="teacher-summary-value info">
                  {attendance.filter(a => a.status === 'Late').length}
                </span>
              </div>
              <div className="teacher-summary-item">
                <span className="teacher-summary-label">Rate</span>
                <span className="teacher-summary-value">
                  {stats.attendanceRate}%
                </span>
              </div>
            </div>

            <div className="teacher-table-wrapper">
              <div className="teacher-attendance-table">
                <div className="teacher-table-header">
                  <div className="teacher-table-col">Student</div>
                  <div className="teacher-table-col">Date</div>
                  <div className="teacher-table-col">Subject</div>
                  <div className="teacher-table-col">Time In</div>
                  <div className="teacher-table-col">Time Out</div>
                  <div className="teacher-table-col">Status</div>
                  <div className="teacher-table-col">Notes</div>
                  <div className="teacher-table-col">Actions</div>
                </div>
                {attendance.map(record => (
                  <div key={record.id} className="teacher-table-row">
                    <div className="teacher-table-col" data-label="Student">
                      <strong>{record.name}</strong>
                    </div>
                    <div className="teacher-table-col" data-label="Date">
                      {record.date}
                    </div>
                    <div className="teacher-table-col" data-label="Subject">
                      {record.subject}
                    </div>
                    <div className="teacher-table-col" data-label="Time In">
                      {record.timeIn}
                    </div>
                    <div className="teacher-table-col" data-label="Time Out">
                      {record.timeOut}
                    </div>
                    <div className="teacher-table-col" data-label="Status">
                      <span className={`teacher-status-badge ${record.status === 'Present' ? 'present' : 
                                      record.status === 'Absent' ? 'absent' : 'late'}`}>
                        {record.status}
                      </span>
                    </div>
                    <div className="teacher-table-col" data-label="Notes">
                      {record.reason || '-'}
                    </div>
                    <div className="teacher-table-col" data-label="Actions">
                      <button className="teacher-action-btn small">
                        <FaEdit /> Update
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="teacher-table-scroll-hint">
                ← Scroll horizontally to see more →
              </div>
            </div>

            <div className="teacher-attendance-actions">
              <div className="teacher-attendance-bulk">
                <h3>Quick Attendance Update</h3>
                <div className="teacher-bulk-actions">
                  <button className="teacher-action-btn success">
                    Mark All Present
                  </button>
                  <button className="teacher-action-btn warning">
                    Mark All Absent
                  </button>
                  <button className="teacher-action-btn">
                    Reset Today
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'timetable':
        return (
          <div className="teacher-dashboard-card full-view">
            <div className="teacher-card-header">
              <h2><FaCalendarAlt /> Teaching Schedule</h2>
              <div className="teacher-header-actions">
                <select className="teacher-week-select">
                  <option>This Week</option>
                  <option>Next Week</option>
                  <option>This Month</option>
                </select>
                <button className="teacher-primary-btn">
                  <FaDownload /> Export Schedule
                </button>
              </div>
            </div>

            <div className="teacher-timetable-container">
              <div className="teacher-timetable-header">
                <div className="teacher-timetable-cell time">Time</div>
                <div className="teacher-timetable-cell">Monday</div>
                <div className="teacher-timetable-cell">Tuesday</div>
                <div className="teacher-timetable-cell">Wednesday</div>
                <div className="teacher-timetable-cell">Thursday</div>
                <div className="teacher-timetable-cell">Friday</div>
              </div>
              
              <div className="teacher-timetable-body">
                {/* Time slots */}
                {['08:00-09:00', '09:15-10:15', '10:30-11:30', '11:45-12:45', '14:00-15:00'].map(time => (
                  <div key={time} className="teacher-timetable-row">
                    <div className="teacher-timetable-cell time">{time}</div>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => {
                      const cls = classes.find(c => c.day === day && c.time.startsWith(time.split('-')[0]));
                      return (
                        <div key={day} className="teacher-timetable-cell">
                          {cls ? (
                            <div className="teacher-class-slot">
                              <strong>{cls.subject}</strong>
                              <span className="teacher-class-grade">{cls.grade}</span>
                              <span className="teacher-class-room">{cls.room}</span>
                            </div>
                          ) : (
                            <span className="teacher-free-slot">Free</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="teacher-upcoming-classes">
              <h3>Upcoming Classes</h3>
              <div className="teacher-classes-grid">
                {classes.slice(0, 4).map(cls => (
                  <div key={cls.id} className="teacher-class-card">
                    <div className="teacher-class-card-header">
                      <span className="teacher-class-card-day">{cls.day}</span>
                      <span className="teacher-class-card-time">{cls.time}</span>
                    </div>
                    <div className="teacher-class-card-content">
                      <h4>{cls.subject}</h4>
                      <p className="teacher-class-card-details">
                        {cls.grade} • {cls.room}
                      </p>
                    </div>
                    <div className="teacher-class-card-actions">
                      <button className="teacher-action-btn small">
                        Prepare
                      </button>
                      <button className="teacher-action-btn small">
                        Materials
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="teacher-dashboard-card full-view">
            <div className="teacher-card-header">
              <h2><FaBullhorn /> Events & Announcements</h2>
              <div className="teacher-header-actions">
                <button className="teacher-primary-btn">
                  <FaPlus /> Create Event
                </button>
                <button className="teacher-secondary-btn">
                  <FaBullhorn /> Post Announcement
                </button>
              </div>
            </div>

            <div className="teacher-events-grid">
              {events.map(event => (
                <div key={event.id} className="teacher-event-card">
                  <div className="teacher-event-card-header">
                    <div className="teacher-event-card-date">
                      <span className="teacher-event-card-day">{new Date(event.date).getDate()}</span>
                      <span className="teacher-event-card-month">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    </div>
                    <div className="teacher-event-card-type">
                      <span className={`teacher-event-type-badge ${event.type}`}>
                        {event.type}
                      </span>
                    </div>
                  </div>
                  <div className="teacher-event-card-content">
                    <h3>{event.title}</h3>
                    <p className="teacher-event-card-time">{event.time}</p>
                    <p className="teacher-event-card-location">{event.location}</p>
                    <div className="teacher-event-card-actions">
                      <button className="teacher-action-btn small">
                        Details
                      </button>
                      <button className="teacher-action-btn small">
                        Remind
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="teacher-birthdays-section">
              <h3>Student Birthdays</h3>
              <div className="teacher-birthdays-list">
                <div className="teacher-birthday-item">
                  <div className="teacher-birthday-avatar">
                    RS
                  </div>
                  <div className="teacher-birthday-details">
                    <h4>Relebohile S.</h4>
                    <p className="teacher-birthday-date">July 28 • Grade 11</p>
                    <span className="teacher-birthday-reminder">3 days remaining</span>
                  </div>
                  <button className="teacher-action-btn small">
                    Send Greeting
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: <FaHome /> },
    { id: 'marks', label: 'Marks', icon: <FaClipboardList /> },
    { id: 'materials', label: 'Materials', icon: <FaBook /> },
    { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
    { id: 'timetable', label: 'Timetable', icon: <FaCalendarAlt /> },
    { id: 'events', label: 'Events', icon: <FaBullhorn /> },
  ];

  return (
    <div className="teacher-dashboard-container">
      {/* Sidebar */}
      <aside className={`teacher-sidebar ${sidebarOpen ? 'open' : 'closed'} ${isMobile ? 'mobile' : ''}`}>
        <div className="teacher-sidebar-header">
          <div className="teacher-sidebar-logo">
            <FaChalkboardTeacher />
            <span className="teacher-school-name">Teacher Portal</span>
          </div>
          <button className="teacher-sidebar-toggle" onClick={toggleSidebar}>
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <div className="teacher-user-profile">
          <div className="teacher-user-avatar">
            MS
          </div>
          <div className="teacher-user-info">
            <h3>Ms. Smith</h3>
            <p className="teacher-user-role">Mathematics & Physics Teacher</p>
            <p className="teacher-user-subject">Grades 11-12</p>
          </div>
        </div>

        <nav className="teacher-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`teacher-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setSidebarOpen(false);
              }}
            >
              <span className="teacher-nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="teacher-nav-label">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="teacher-sidebar-footer">
          <div className="teacher-quick-links">
            <h4><FaCog /> Quick Settings</h4>
            <button className="teacher-sidebar-btn">
              <FaBell /> Notifications
            </button>
            <button className="teacher-sidebar-btn">
              <FaUsers /> Student Reports
            </button>
            <button className="teacher-sidebar-btn">
              <FaChartLine /> Performance
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`teacher-main-content ${!sidebarOpen ? 'expanded' : ''}`}>
        <div className="teacher-content-header">
          <button className="teacher-mobile-toggle" onClick={toggleSidebar}>
            <FaBars />
          </button>
          <div className="teacher-header-content">
            <h1 className="teacher-welcome-heading">
              Teacher Dashboard
            </h1>
            <p className="teacher-welcome-subtitle">
              Manage your classes, students, and teaching materials
            </p>
          </div>
          <div className="teacher-header-actions">
            <div className="teacher-date-display">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <button className="teacher-notification-btn">
              <FaBell />
              <span className="teacher-notification-count">2</span>
            </button>
          </div>
        </div>

        <div className="teacher-content-body">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;