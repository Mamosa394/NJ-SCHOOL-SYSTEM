import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../components/supabaseClient';
import Logo from '../../assets/Logo.jpg';
import { 
  LayoutDashboard, ClipboardList, GraduationCap, UserCog,
  DollarSign, Calendar, Shield, BarChart3, Settings,
  LogOut, Menu, X, Crown
} from 'lucide-react';

const AdminSidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile, 
  currentAdmin, 
  isSuperAdmin, 
  pendingCount 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    localStorage.removeItem('user');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'registrations', label: 'Registrations', icon: ClipboardList, path: '/admin/registrations', badge: pendingCount },
    { id: 'students', label: 'Students', icon: GraduationCap, path: '/admin/students' },
    { id: 'teachers', label: 'Teachers', icon: UserCog, path: '/admin/teachers' },
    { id: 'payments', label: 'Payments', icon: DollarSign, path: '/admin/payments' },
    { id: 'events', label: 'Events', icon: Calendar, path: '/admin/events' },
    ...(isSuperAdmin ? [{ id: 'admins', label: 'Admins', icon: Shield, path: '/admin/admins' }] : []),
    { id: 'reports', label: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path) => {
    navigate(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="adm-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-brand">
          <img src={Logo} alt="NJEC" className="adm-brand-logo" />
          {sidebarOpen && (
            <div className="adm-brand-text">
              <h2>Admin</h2>
              <span>Control Panel</span>
            </div>
          )}
          <button 
            className="adm-sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <div className="adm-sidebar-user">
          <div 
            className="adm-user-avatar" 
            style={{
              background: isSuperAdmin 
                ? 'linear-gradient(135deg, #f59e0b, #e67e22)' 
                : 'linear-gradient(135deg, #283593, #1a237e)'
            }}
          >
            {isSuperAdmin ? <Crown size={18} /> : <Shield size={18} />}
          </div>
          {sidebarOpen && (
            <div className="adm-user-info">
              <h4>{currentAdmin?.full_name || 'Admin'}</h4>
              <span style={{ color: isSuperAdmin ? '#f59e0b' : '#94a3b8' }}>
                {isSuperAdmin ? 'Super Admin' : 'Administrator'}
              </span>
            </div>
          )}
        </div>

        <nav className="adm-sidebar-nav">
          <span className="adm-nav-section">Navigation</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`adm-nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              <item.icon size={18} />
              {sidebarOpen && <span>{item.label}</span>}
              {item.badge > 0 && sidebarOpen && (
                <span className="adm-nav-badge">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {sidebarOpen && (
          <div className="adm-sidebar-footer">
            <button onClick={handleLogout} className="adm-logout-btn">
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default AdminSidebar;