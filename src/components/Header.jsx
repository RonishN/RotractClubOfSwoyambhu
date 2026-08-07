import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import logo from '../assets/images/logo.png';
import { checkAdminSession } from '../api/client';

export default function Header() {
  const { lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  // Start from the last-known status so the Admin link never flickers away
  // while the background session check completes on each page navigation.
  // (The session cookie is HttpOnly, so it can't be read client-side.)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => localStorage.getItem('rac_admin_session') === '1');

  const isHomePage = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHomePage);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAdminSession()
      .then(() => {
        localStorage.setItem('rac_admin_session', '1');
        setIsAdminLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem('rac_admin_session');
        setIsAdminLoggedIn(false);
      });

    const handleScroll = () => {
      if (!isHomePage) {
        setScrolled(true);
        return;
      }
      const hero = document.getElementById('hero');
      if (hero) {
        setScrolled(window.scrollY > hero.offsetHeight - 80);
      } else {
        setScrolled(window.scrollY > 20);
      }
    };
    
    // Initial check
    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    setMobileMenuOpen(false); // Close menu on click
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const target = document.getElementById(id);
        if (target) {
          const headerHeight = document.querySelector('header')?.offsetHeight || 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 300);
    }
  };

  const isScrolled = !isHomePage || scrolled;

  return (
    <>
      <header className={isScrolled ? 'scrolled' : ''}>
        <a href="#hero" onClick={scrollTo('hero')} className="logo">
          <img
            src={logo}
            alt="Logo"
            style={{ width: 55, height: 55, objectFit: 'contain', borderRadius: '50%' }}
          />
          <div className="logo-text">
            {lang === 'en' ? (
              <h1>Rotaract Club of Swoyambhu</h1>
            ) : (
              <h1 className="devanagari" style={{ fontSize: '1rem', margin: 0 }}>
                स्वयम्भू रोटर्याक्ट क्लब
              </h1>
            )}
          </div>
        </a>

        <nav className={mobileMenuOpen ? 'nav-open' : ''}>
          <ul>
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                {lang === 'en' ? 'Home' : 'गृहपृष्ठ'}
              </Link>
            </li>
            <li>
              <Link to="/events" onClick={() => setMobileMenuOpen(false)}>
                {lang === 'en' ? 'Events' : 'कार्यक्रमहरू'}
              </Link>
            </li>
            <li>
              <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>
                {lang === 'en' ? 'Gallery' : 'ग्यालरी'}
              </Link>
            </li>
            {isAdminLoggedIn && (
              <li>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                  {lang === 'en' ? 'Admin' : 'एडमिन'}
                </Link>
              </li>
            )}
            <li>
              <div
                className="lang-switch"
                role="switch"
                aria-checked={lang === 'ne'}
                aria-label={lang === 'en' ? 'Switch language' : 'भाषा बदल्नुहोस्'}
                onClick={() => { toggleLang(); setMobileMenuOpen(false); }}
              >
                <span className={`lang-opt ${lang === 'en' ? 'active' : ''}`}>EN</span>
                <span className={`lang-opt ${lang === 'ne' ? 'active' : ''}`} style={{ fontFamily: 'var(--font-devanagari)' }}>ने</span>
              </div>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
