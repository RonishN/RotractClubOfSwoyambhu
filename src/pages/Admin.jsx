import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { checkAdminSession, logoutAdmin } from '../api/client';

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
    logoutAdmin()
      .catch(() => {})
      .finally(() => {
        navigate('/login');
      });
  };

  if (loading) {
    return null; // GlobalLoading overlay handles the loading state
  }

  const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

  return (
    <div className="admin-layout-wrapper">
      <div className="admin-sidebar">
        <div>
          <div className="admin-sidebar-header">
            <h2 className="serif">Swoyambhu Admin</h2>
          </div>
          
          <div className="admin-nav">
            <button className="admin-nav-item" onClick={() => navigate('/admin/edit')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Visual Editor</span>
            </button>

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('EVENT_MANAGER')) && (
              <button className={`admin-nav-item ${isActive('/admin/events')}`} onClick={() => navigate('/admin/events')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                <span>Events Manager</span>
              </button>
            )}

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('VIEW_LOGS')) && (
              <button className={`admin-nav-item ${isActive('/admin/logs')}`} onClick={() => navigate('/admin/logs')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>Audit Logs</span>
              </button>
            )}

            {(currentUser?.role === 'SUPERADMIN' || currentUser?.permissions?.includes('ADMIN_CREATOR') || currentUser?.permissions?.includes('ACCOUNT_PASSWORD_RESET') || currentUser?.permissions?.includes('DEACTIVATE_ACCOUNT') || currentUser?.permissions?.includes('DELETE_ACCOUNT')) && (
              <button className={`admin-nav-item ${isActive('/admin/manage')}`} onClick={() => navigate('/admin/manage')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Manage Admins</span>
              </button>
            )}

            <button className={`admin-nav-item ${isActive('/admin/settings')}`} onClick={() => navigate('/admin/settings')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
        
        <div className="admin-nav" style={{ paddingTop: 0 }}>
          <button className="admin-nav-item danger" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="admin-main-content">
        <Outlet context={{ currentUser }} />
      </div>
    </div>
  );
}
