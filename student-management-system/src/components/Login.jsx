import React, { useState } from 'react';
import axios from 'axios';
import '../styles/login.css';
import Footer from '../components2/Footer';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/login', formData);
      const { role } = res.data;

      setTimeout(() => {
        if (role === 'admin') navigate('/admin-dashboard');
        else if (role === 'teacher') navigate('/teacher-dashboard');
        else if (role === 'student') navigate('/StudentDashboard');
        else if (role === 'parent') navigate('/parent-dashboard');
        else setError('Unknown user role.');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper-outer">
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>NEW JERUSALEM EXTRA CLASSES</h1>
          </div>

          <div className="login-card">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              {error && <p className="login-error">{error}</p>}

              {loading && (
                <div className="login-spinner-box">
                  <div className="login-spinner"></div>
                  <p>Logging in...</p>
                </div>
              )}

              <button type="submit" disabled={loading}>Login</button>
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

export default Login;
