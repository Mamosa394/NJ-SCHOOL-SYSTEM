import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/homepage.css';

const Welcome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState('');

  const handleNavigate = (path) => {
    setLoading(true);
    setTarget(path);
    setTimeout(() => {
      navigate(path);
    }, 2000); // 2 seconds delay
  };

  return (
    <div className={`welcome-screen ${loading ? 'blurred' : ''}`}>
      <div className="welcome-content fade-in">
        <h1>NEW JERUSALEM EXTRA CLASSES</h1>
        <h2>Your Future Starts Here</h2>
        <p>
          Welcome to our student portal where you can access your classes, grades, attendance, and much more.
        </p>

        <div className="welcome-buttons">
          <button onClick={() => handleNavigate('/login')} disabled={loading}>
            {loading && target === '/login' ? <div className="spinner"></div> : 'Log In'}
          </button>
          <button onClick={() => handleNavigate('/signup')} disabled={loading}>
            {loading && target === '/signup' ? <div className="spinner"></div> : 'Sign Up'}
          </button>
        </div>
      </div>

      <div className="welcome-image fade-in">
        <img src="/new-jerusalem.png" alt="new-jerusalem" height="400px" />
      </div>

      {loading && <div className="overlay-blur"></div>}
    </div>
  );
};

export default Welcome;
