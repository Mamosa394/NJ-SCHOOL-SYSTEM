import React from 'react';
import {
  FaBullhorn, FaPlus
} from 'react-icons/fa';
import '../styles/teacher/teacherdashboard.css';

const TeacherEvents = ({ events }) => {
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
};

export default TeacherEvents;