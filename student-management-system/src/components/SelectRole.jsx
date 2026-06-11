import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  GraduationCap, 
  BookOpen, 
  Users,
  ArrowRight,
  Check
} from 'lucide-react';
import { supabase } from './supabaseClient';
import '../styles/select-role.css';

const SelectRole = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email, fullName } = location.state || {};
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      description: 'Platform management & oversight',
      color: '#4F46E5'
    },
    {
      id: 'teacher',
      label: 'Teacher',
      icon: GraduationCap,
      description: 'Create & manage courses',
      color: '#059669'
    },
    {
      id: 'student',
      label: 'Student',
      icon: BookOpen,
      description: 'Learn & track progress',
      color: '#2563EB'
    },
    {
      id: 'parent',
      label: 'Parent',
      icon: Users,
      description: 'Monitor student progress',
      color: '#D97706'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update the user's profile with selected role
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          role: selectedRole,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (updateError) throw updateError;

      // Save user data to localStorage
      const userData = {
        id: userId,
        email: email,
        role: selectedRole,
        fullName: fullName
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Redirect based on role
      const routes = {
        admin: '/admin/dashboard',
        teacher: '/teacher/dashboard',
        student: '/student/dashboard',
        parent: '/parent/dashboard'
      };
      
      navigate(routes[selectedRole], { replace: true });
    } catch (error) {
      console.error('Error updating role:', error);
      setError('Failed to set role. Please try again.');
      setLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, roleId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRoleSelect(roleId);
    }
  };

  return (
    <div className="njec-role-container">
      {/* Background Shapes */}
      <div className="njec-role-bg-shapes">
        <div className="njec-role-shape shape-1"></div>
        <div className="njec-role-shape shape-2"></div>
        <div className="njec-role-shape shape-3"></div>
      </div>

      <div className="njec-role-card">
        {/* Header */}
        <div className="njec-role-header">
          <div className="njec-role-welcome">
            <span className="njec-role-greeting">Welcome{fullName ? `, ${fullName.split(' ')[0]}` : ''}! 👋</span>
          </div>
          <h1 className="njec-role-title">Select Your Role</h1>
          <p className="njec-role-subtitle">
            Choose your role to access the appropriate dashboard and features
          </p>
        </div>

        {/* Role Selection Grid */}
        <div className="njec-role-grid">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;

            return (
              <button
                key={role.id}
                className={`njec-role-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleRoleSelect(role.id)}
                onKeyDown={(e) => handleKeyDown(e, role.id)}
                aria-pressed={isSelected}
                aria-label={`Select ${role.label} role`}
                tabIndex={0}
              >
                <div className="njec-role-icon-wrapper">
                  <div 
                    className="njec-role-icon"
                    style={{ 
                      '--role-color': role.color,
                      backgroundColor: isSelected ? role.color : `${role.color}10`
                    }}
                  >
                    <IconComponent 
                      size={32} 
                      color={isSelected ? '#FFFFFF' : role.color}
                    />
                  </div>
                  {isSelected && (
                    <div className="njec-role-check">
                      <Check size={16} color="#FFFFFF" />
                    </div>
                  )}
                </div>
                
                <div className="njec-role-info">
                  <h3 className="njec-role-name">{role.label}</h3>
                  <p className="njec-role-description">{role.description}</p>
                </div>

                {isSelected && (
                  <div className="njec-role-selected-indicator" />
                )}
              </button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="njec-role-error">
            <span>{error}</span>
          </div>
        )}

        {/* Description */}
        <div className="njec-role-footer-text">
          <p>You can change your role later from your account settings</p>
        </div>

        {/* Continue Button */}
        <button
          className={`njec-role-continue-btn ${selectedRole ? 'active' : ''}`}
          onClick={handleContinue}
          disabled={!selectedRole || loading}
        >
          {loading ? (
            <div className="njec-role-spinner"></div>
          ) : (
            <>
              <span>Continue to Dashboard</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>

        {/* Progress Indicator */}
        <div className="njec-role-progress">
          <div className="njec-role-progress-dot active"></div>
          <div className="njec-role-progress-dot"></div>
          <div className="njec-role-progress-dot"></div>
          <div className="njec-role-progress-dot"></div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;