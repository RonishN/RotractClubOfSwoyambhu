import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminSession, getAdminContent, logoutAdmin } from '../api/client';
import { useEditMode, EditModeProvider } from '../context/EditModeContext';
import AdminBar from '../components/AdminBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GallerySection from '../components/GallerySection';

function BeforeUnloadGuard() {
  const { isDirty } = useEditMode();
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  return null;
}

export default function GalleryEdit() {
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdminData = useCallback(async () => {
    try {
      const result = await getAdminContent();
      setContent(result.websiteData || {});
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

  if (loading) {
    return (
      <div className="admin-login-bg">
        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 32px', maxWidth: '360px' }}>
          <span className="admin-spinner" style={{ 
            width: '40px', height: '40px', borderWidth: '3px',
            borderColor: 'rgba(226, 0, 122, 0.15)', borderTopColor: 'var(--magenta)' 
          }} />
          <h3 className="serif" style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: 'var(--navy)', margin: 0 }}>
            Opening Gallery Editor
          </h3>
        </div>
      </div>
    );
  }

  return (
    <EditModeProvider initialContent={content || {}}>
      <BeforeUnloadGuard />
      <div className="admin-mode">
        <style>{`
          .admin-mode header { top: 56px !important; }
          .admin-mode main { padding-top: 56px; }
        `}</style>
        <AdminBar
          onSwitchToHistory={() => navigate('/admin')}
          onLogout={() => logoutAdmin().finally(() => navigate('/login'))}
        />
        <Header />
        <main style={{ paddingTop: '50px', minHeight: '80vh' }}>
          <GallerySection content={content || {}} />
        </main>
        <Footer />
      </div>
    </EditModeProvider>
  );
}
