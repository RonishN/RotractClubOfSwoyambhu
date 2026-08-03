import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, toggleLang } = useLang();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleSectionScroll = (sectionId) => {
    setDrawerOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="mobile-drawer-overlay"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Slide-Up Drawer Menu */}
      <div className={`mobile-bottom-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="drawer-handle" onClick={() => setDrawerOpen(false)}>
          <span className="handle-bar"></span>
        </div>
        <div className="drawer-header">
          <h3>{lang === 'en' ? 'Rotaract Swoyambhu' : 'रोटरेक्ट स्वयम्भू'}</h3>
          <button 
            className="lang-toggle-btn"
            onClick={toggleLang}
          >
            <i className="fa-solid fa-globe" style={{ marginRight: 6 }}></i>
            {lang === 'en' ? 'नेपाली' : 'English'}
          </button>
        </div>
        <div className="drawer-menu-links">
          <button onClick={() => handleSectionScroll('about')}>
            <span className="menu-icon"><i className="fa-solid fa-circle-info" style={{ color: '#79213C' }}></i></span> {lang === 'en' ? 'About Us' : 'हाम्रो बारेमा'}
          </button>
          <button onClick={() => handleSectionScroll('initiatives')}>
            <span className="menu-icon"><i className="fa-solid fa-hand-holding-heart" style={{ color: '#79213C' }}></i></span> {lang === 'en' ? 'Initiatives' : 'पहलहरू'}
          </button>
          <button onClick={() => handleSectionScroll('team')}>
            <span className="menu-icon"><i className="fa-solid fa-users" style={{ color: '#79213C' }}></i></span> {lang === 'en' ? 'Leadership' : 'नेतृत्व'}
          </button>
          <button onClick={() => handleSectionScroll('contact')}>
            <span className="menu-icon"><i className="fa-solid fa-phone" style={{ color: '#79213C' }}></i></span> {lang === 'en' ? 'Contact' : 'सम्पर्क'}
          </button>
          <button onClick={() => handleNav('/admin')}>
            <span className="menu-icon"><i className="fa-solid fa-gear" style={{ color: '#79213C' }}></i></span> {lang === 'en' ? 'Admin Portal' : 'एडमिन पोर्टल'}
          </button>
        </div>
      </div>

      {/* Main Fixed Bottom Nav Bar */}
      <nav className="mobile-bottom-nav-bar" aria-label="Mobile Navigation">
        <button 
          className={`nav-tab ${isActive('/') ? 'active' : ''}`}
          onClick={() => handleNav('/')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="tab-label">{lang === 'en' ? 'Home' : 'गृह'}</span>
        </button>

        <button 
          className={`nav-tab ${isActive('/events') ? 'active' : ''}`}
          onClick={() => handleNav('/events')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span className="tab-label">{lang === 'en' ? 'Events' : 'कार्यक्रमहरू'}</span>
        </button>

        <button 
          className={`nav-tab ${isActive('/gallery') ? 'active' : ''}`}
          onClick={() => handleNav('/gallery')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span className="tab-label">{lang === 'en' ? 'Gallery' : 'ग्यालरी'}</span>
        </button>

        <button 
          className={`nav-tab ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
          onClick={() => handleNav('/admin')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5h-2v-2h2zm0-4h-2V7h2z"/>
          </svg>
          <span className="tab-label">{lang === 'en' ? 'Admin' : 'एडमिन'}</span>
        </button>

        <button 
          className={`nav-tab ${drawerOpen ? 'active' : ''}`}
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
          <span className="tab-label">{lang === 'en' ? 'More' : 'थप'}</span>
        </button>
      </nav>
    </>
  );
}
