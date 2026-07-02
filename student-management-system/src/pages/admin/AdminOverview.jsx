import React, { useState, useEffect } from 'react';
import { supabase } from '../../components/supabaseClient';
import { 
  Users, GraduationCap, DollarSign, ClipboardList,
  TrendingUp, ArrowUp, ArrowDown, Activity, Calendar,
  CheckCircle, XCircle, Clock, Eye
} from 'lucide-react';

const AdminOverview = ({ admin }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingRegistrations: 0,
    monthlyRevenue: 0,
    attendanceRate: 0,
    totalEvents: 0
  });
  const [recentRegistrations, setRecentRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get registration stats
      const { data: regs, count: regCount } = await supabase
        .from('student_registrations')
        .select('*', { count: 'exact' })
        .order('submitted_at', { ascending: false });

      if (regs) {
        setRecentRegistrations(regs.slice(0, 5));
        
        const approved = regs.filter(r => r.registration_status === 'approved');
        const pending = regs.filter(r => r.registration_status === 'pending');
        const revenue = approved.reduce((sum, r) => sum + (r.total_amount || 0), 0);

        setStats(prev => ({
          ...prev,
          totalStudents: approved.length,
          pendingRegistrations: pending.length,
          monthlyRevenue: revenue,
        }));
      }

      // Get teachers count from profiles
      const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'teacher');

      setStats(prev => ({
        ...prev,
        totalTeachers: teacherCount || 0,
        totalEvents: 5, // Placeholder
        attendanceRate: 92, // Placeholder
      }));

    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="adm-loading-sm">Loading overview...</div>;
  }

  return (
    <div className="adm-overview">
      {/* Welcome */}
      <div className="adm-welcome-card">
        <div>
          <h2>Welcome back, {admin?.full_name?.split(' ')[0] || 'Admin'}!</h2>
          <p>Here's what's happening with your school today.</p>
        </div>
        <div className="adm-welcome-date">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="adm-stats-grid">
        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: 'rgba(40,53,147,0.1)', color: '#283593' }}>
            <GraduationCap size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.totalStudents}</span>
            <span className="adm-stat-label">Total Students</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 12%</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: 'rgba(0,184,148,0.1)', color: '#00b894' }}>
            <DollarSign size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">M{stats.monthlyRevenue.toLocaleString()}</span>
            <span className="adm-stat-label">Monthly Revenue</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 8%</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: 'rgba(243,156,18,0.1)', color: '#f39c12' }}>
            <ClipboardList size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.pendingRegistrations}</span>
            <span className="adm-stat-label">Pending Approvals</span>
          </div>
          <div className="adm-stat-trend warning"><Clock size={14} /> Review</div>
        </div>

        <div className="adm-stat-card">
          <div className="adm-stat-icon" style={{ background: 'rgba(108,92,231,0.1)', color: '#6c5ce7' }}>
            <Users size={22} />
          </div>
          <div className="adm-stat-info">
            <span className="adm-stat-value">{stats.totalTeachers}</span>
            <span className="adm-stat-label">Teachers</span>
          </div>
          <div className="adm-stat-trend up"><ArrowUp size={14} /> 2</div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="adm-card">
        <div className="adm-card-header">
          <h3><ClipboardList size={18} /> Recent Registrations</h3>
        </div>
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Student No.</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentRegistrations.map(reg => (
                <tr key={reg.id}>
                  <td>
                    <div className="adm-user-cell">
                      <div className="adm-avatar-sm">{reg.full_name?.charAt(0)}</div>
                      <span>{reg.full_name}</span>
                    </div>
                  </td>
                  <td><code>{reg.student_number}</code></td>
                  <td>M{reg.total_amount?.toLocaleString()}</td>
                  <td>{new Date(reg.submitted_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`adm-status-pill ${reg.registration_status}`}>
                      {reg.registration_status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentRegistrations.length === 0 && (
                <tr><td colSpan="5" className="adm-empty">No registrations yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;