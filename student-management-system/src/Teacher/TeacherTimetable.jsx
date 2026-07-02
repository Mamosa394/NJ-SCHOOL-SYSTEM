import React from 'react';
import {
  FaCalendarAlt, FaDownload
} from 'react-icons/fa';
import '../styles/teacher/teacherdashboard.css';

const TeacherTimetable = ({ classes }) => {
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
};

export default TeacherTimetable;