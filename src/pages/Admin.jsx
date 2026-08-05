import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { checkAdminSession, logoutAdmin } from '../api/client';
import MobileBottomNav from '../components/MobileBottomNav';

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const loadAdminData = useCallback(async () => {
    try {
      const session = await checkAdminSession();
      setCurrentUser({ username: session.username, permissions: session.permissions || [], role: session.role || 'ADMIN' });
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAdminSession()
      .then(() => loadAdminData())
      .catch(() => navigate('/login'));
  }, [navigate, loadAdminData]);

  const logout = () => {
    localStorage.removeItem('rac_admin_session');
    logoutAdmin()
      .catch(() => {})
      .finally(() => {
        navigate('/login');
      });
  };

  if (loading) {
    return null;
  }

  const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

  // Backend sections navigate in the same tab
  const openSection = (path) => {
    navigate(path);
  };

  return (
    <div className="admin-layout-wrapper">
      {/* Mobile Top Header */}
      <div className="admin-mobile-top-bar">
        <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-shield-halved" style={{ color: '#79213C' }} /> Admin Portal
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="admin-btn admin-btn-danger" onClick={logout} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <i className="fa-solid fa-right-from-bracket" style={{ marginRight: 4 }} />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Nav Pills Header — opens sections in a new tab/panel */}
      <div className="admin-mobile-sub-nav">
        <button className={`admin-mobile-pill ${location.pathname === '/admin/edit' ? 'active' : ''}`} onClick={() => openSection('/admin/edit')}>
          <i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} /> Visual Editor
        </button>
        {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('EVENT_MANAGER')) && (
          <button className={`admin-mobile-pill ${isActive('/admin/events')}`} onClick={() => openSection('/admin/events')}>
            <i className="fa-solid fa-calendar-days" style={{ marginRight: 6 }} /> Events
          </button>
        )}
        {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('VIEW_LOGS')) && (
          <button className={`admin-mobile-pill ${isActive('/admin/logs')}`} onClick={() => openSection('/admin/logs')}>
            <i className="fa-solid fa-list-check" style={{ marginRight: 6 }} /> Audit Logs
          </button>
        )}
        {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('ADMIN_CREATOR') || currentUser?.permissions?.includes('ACCOUNT_PASSWORD_RESET') || currentUser?.permissions?.includes('DEACTIVATE_ACCOUNT') || currentUser?.permissions?.includes('DELETE_ACCOUNT')) && (
          <button className={`admin-mobile-pill ${isActive('/admin/manage')}`} onClick={() => openSection('/admin/manage')}>
            <i className="fa-solid fa-users-gear" style={{ marginRight: 6 }} /> Admins
          </button>
        )}
        <button className={`admin-mobile-pill ${isActive('/admin/settings')}`} onClick={() => openSection('/admin/settings')}>
          <i className="fa-solid fa-gear" style={{ marginRight: 6 }} /> Settings
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="admin-sidebar desktop-only">
        <div>
          <div className="admin-sidebar-header">
            <h2 className="serif">Swoyambhu Admin</h2>
          </div>
          
          <div className="admin-nav">
            <button className="admin-nav-item" onClick={() => openSection('/admin/edit')}>
              <i className="fa-solid fa-pen-to-square" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
              <span>Visual Editor</span>
            </button>

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('EVENT_MANAGER')) && (
              <button className={`admin-nav-item ${isActive('/admin/events')}`} onClick={() => openSection('/admin/events')}>
                <i className="fa-solid fa-calendar-days" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
                <span>Events Manager</span>
              </button>
            )}

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('VIEW_LOGS')) && (
              <button className={`admin-nav-item ${isActive('/admin/logs')}`} onClick={() => openSection('/admin/logs')}>
                <i className="fa-solid fa-list-check" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
                <span>Audit Logs</span>
              </button>
            )}

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('ADMIN_CREATOR') || currentUser?.permissions?.includes('ACCOUNT_PASSWORD_RESET') || currentUser?.permissions?.includes('DEACTIVATE_ACCOUNT') || currentUser?.permissions?.includes('DELETE_ACCOUNT')) && (
              <button className={`admin-nav-item ${isActive('/admin/manage')}`} onClick={() => openSection('/admin/manage')}>
                <i className="fa-solid fa-users-gear" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
                <span>Manage Admins</span>
              </button>
            )}

            <button className={`admin-nav-item ${isActive('/admin/settings')}`} onClick={() => openSection('/admin/settings')}>
              <i className="fa-solid fa-gear" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
              <span>Settings</span>
            </button>
          </div>
        </div>
        
        <div className="admin-nav" style={{ paddingTop: 0 }}>
          <button className="admin-nav-item" onClick={() => navigate('/')}>
            <i className="fa-solid fa-house" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
            <span>Back to Home</span>
          </button>
          <button className="admin-nav-item danger" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '15px', width: '20px', textAlign: 'center' }} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="admin-main-content" style={{ paddingBottom: '90px' }}>
        <Outlet context={{ currentUser }} />
      </div>

      <MobileBottomNav />
    </div>
  );
}
