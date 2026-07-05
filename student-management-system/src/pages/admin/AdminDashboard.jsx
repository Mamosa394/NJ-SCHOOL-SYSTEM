// AdminDashboard.jsx - Complete Fixed Version
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../components/supabaseClient';
import '../../styles/adminStyles/admindashboard.css';
import AdminSidebar from './AdminSidebar';
import { Search, Bell, Menu, Crown, Shield } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    checkAdminAccess();
    fetchPendingCount();
    
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      console.log('🔑 Checking admin access for user:', user.id);

      const { data: adminData, error: adminError } = await supabase
        .from('admin_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🔑 Admin query result:', { 
        found: !!adminData, 
        level: adminData?.admin_level,
        isActive: adminData?.is_active,
        error: adminError?.message 
      });

      if (adminData && adminData.is_active) {
        const superAdmin = adminData.admin_level === 'super_admin';
        console.log('✅ Admin authenticated. isSuperAdmin:', superAdmin);
        
        setCurrentAdmin(adminData);
        setIsSuperAdmin(superAdmin);
        
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          role: 'admin',
          adminLevel: adminData.admin_level,
          fullName: adminData.full_name
        }));
        
        setLoading(false);
        return;
      }

      console.log('❌ No active admin account found');
      localStorage.removeItem('user');
      navigate('/login');
      
    } catch (error) {
      console.error('❌ Auth error:', error);
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const fetchPendingCount = async () => {
    try {
      const { count } = await supabase
        .from('student_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'pending');
      setPendingCount(count || 0);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        background: '#f5f6fa' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            border: '3px solid #e2e8f0', 
            borderTopColor: '#283593', 
            borderRadius: '50%', 
            animation: 'spin 0.7s linear infinite', 
            margin: '0 auto 1rem' 
          }}></div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading admin panel...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  console.log('📄 Rendering AdminDashboard. isSuperAdmin:', isSuperAdmin);

  return (
    <div className="adm-app">
      <AdminSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        currentAdmin={currentAdmin}
        isSuperAdmin={isSuperAdmin}
        pendingCount={pendingCount}
      />

      <main className={`adm-main ${!sidebarOpen ? 'expanded' : ''}`}>
        <header className="adm-topbar">
          <div className="adm-topbar-left">
            {!sidebarOpen && (
              <button className="adm-menu-btn" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
            )}
            <div className="adm-search-global">
              <Search size={16} />
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div className="adm-topbar-right">
            <button className="adm-notif-btn">
              <Bell size={18} />
              {pendingCount > 0 && (
                <span className="adm-notif-dot">{pendingCount}</span>
              )}
            </button>
            <div className="adm-topbar-user">
              <div className="adm-topbar-avatar" style={{
                background: isSuperAdmin 
                  ? 'linear-gradient(135deg, #f59e0b, #e67e22)' 
                  : 'linear-gradient(135deg, #283593, #1a237e)'
              }}>
                {isSuperAdmin ? <Crown size={14} /> : <Shield size={14} />}
              </div>
              <span>{currentAdmin?.full_name || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="adm-content">
          <Outlet context={{ 
            currentAdmin, 
            isSuperAdmin, 
            pendingCount, 
            fetchPendingCount 
          }} />
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;