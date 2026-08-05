import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { checkAdminSession, getAdminContent, logoutAdmin } from '../api/client';
import { useEditMode, EditModeProvider } from '../context/EditModeContext';
import AdminBar from '../components/AdminBar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GallerySection from '../components/GallerySection';

function BeforeUnloadGuard() {
  const { hasChanges: isDirty } = useEditMode();
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
  const { albumId } = useParams();
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

  // Measure the preview header so main content clears BOTH the AdminBar
  // and the fixed site navigation header.
  useEffect(() => {
    const update = () => {
      const header = document.querySelector('.admin-mode header');
      const h = header ? header.offsetHeight : 84;
      document.documentElement.style.setProperty('--edit-header-height', `${h}px`);
    };
    update();
    const t = setTimeout(update, 120);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
    };
  }, [loading]);

  if (loading) return null;

  return (
    <EditModeProvider initialContent={content || {}}>
      <BeforeUnloadGuard />
      <div className="admin-mode">
        <style>{`
          .admin-mode header { top: var(--admin-bar-height, 90px) !important; }
          .admin-mode main { padding-top: calc(var(--admin-bar-height, 90px) + var(--edit-header-height, 84px)); }
        `}</style>
        <AdminBar
          onSwitchToHistory={() => navigate('/admin')}
          onLogout={() => logoutAdmin().finally(() => navigate('/login'))}
        />
        <Header />
          <main style={{ minHeight: '80vh' }}>
            <GallerySection content={content || {}} albumId={albumId || null} />
          </main>
        <Footer />
      </div>
    </EditModeProvider>
  );
}
