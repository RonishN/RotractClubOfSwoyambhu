import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminSession, getAdminContent, logoutAdmin } from '../api/client';
import { useEditMode, EditModeProvider } from '../context/EditModeContext';
import AdminBar from '../components/AdminBar';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import TeamSection from '../components/TeamSection';
import InitiativesSection from '../components/InitiativesSection';
import EventsSection from '../components/EventsSection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

export default function AdminEdit() {
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

  if (loading) {
    return (
      <div className="admin-login-bg">
        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 32px', maxWidth: '360px' }}>
          <span className="admin-spinner" style={{ 
            width: '40px', 
            height: '40px', 
            borderWidth: '3px',
            borderColor: 'rgba(121, 33, 60, 0.15)',
            borderTopColor: 'var(--magenta)' 
          }} />
          <h3 className="serif" style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: 'var(--navy)', margin: 0 }}>
            Opening Visual Editor
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Fetching content from database...
          </p>
        </div>
      </div>
    );
  }

  return (
    // EditModeProvider is the single source of truth for all editable content.
    // Sections read from `draft` (context) in edit mode, and from `content`
    // (prop) in read-only mode. The `initialContent` seeds the draft once.
    <EditModeProvider initialContent={content || {}}>
      <BeforeUnloadGuard />
      <div className="admin-mode">
        <style>{`
          /* Dynamically push Header and main below the AdminBar */
          .admin-mode header {
            top: var(--admin-bar-height, 90px) !important;
          }
          .admin-mode main {
            padding-top: calc(var(--admin-bar-height, 90px) + var(--edit-header-height, 84px));
          }
        `}</style>

        <AdminBar
          onSwitchToHistory={() => navigate('/admin')}
          onLogout={() => {
            logoutAdmin().finally(() => {
              navigate('/login');
            });
          }}
        />

        <Header />
        <main>
          <HeroSection  content={content || {}} isLoading={false} />
          <AboutSection content={content || {}} isLoading={false} />
          <TeamSection  content={content || {}} />
          <InitiativesSection content={content || {}} />
          <EventsSection      content={content || {}} />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </EditModeProvider>
  );
}

/**
 * BeforeUnloadGuard — warns before tab close ONLY when the user is actively
 * in edit mode with unsaved changes. Checking isEditMode prevents the dialog
 * from firing during Vite HMR reloads, normal navigation, or any time
 * hasChanges briefly flips true outside of an active edit session.
 */
function BeforeUnloadGuard() {
  const { isEditMode, hasChanges } = useEditMode();
  const shouldWarn = isEditMode && hasChanges;

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldWarn]);

  return null;
}
