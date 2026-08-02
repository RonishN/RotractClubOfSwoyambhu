import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import logo from '../assets/images/logo.png';
import { checkAdminSession } from '../api/client';

export default function Header() {
  const { lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  const isHomePage = location.pathname === '/';
  const [scrolled, setScrolled] = useState(!isHomePage);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAdminSession()
      .then(() => setIsAdminLoggedIn(true))
      .catch(() => setIsAdminLoggedIn(false));

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
    <header className={isScrolled ? 'scrolled' : ''}>
      <a href="#hero" onClick={scrollTo('hero')} className="logo">
        <img
          src={logo}
          alt="Logo"
          style={{ width: 55, height: 55, objectFit: 'contain', borderRadius: '50%' }}
        />
        <div className="logo-text">
          {lang === 'en' ? (
            <h1>Club of Swoyambhu</h1>
          ) : (
            <h1 className="devanagari" style={{ fontSize: '1rem', margin: 0 }}>
              स्वयम्भू रोटर्याक्ट क्लब
            </h1>
          )}
        </div>
      </a>

      <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav className={mobileMenuOpen ? 'nav-open' : ''}>
        <ul>
          <li>
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              {lang === 'en' ? 'Home' : 'गृहपृष्ठ'}
            </Link>
          </li>
          <li>
            <Link to="/gallery" onClick={() => setMobileMenuOpen(false)}>
              {lang === 'en' ? 'Gallery' : 'ग्यालरी'}
            </Link>
          </li>
          <li>
            <Link to={isAdminLoggedIn ? '/admin' : '/login'} onClick={() => setMobileMenuOpen(false)}>
              {isAdminLoggedIn
                ? (lang === 'en' ? 'Admin' : 'एडमिन')
                : (lang === 'en' ? 'Login' : 'लगइन')}
            </Link>
          </li>
          <li>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }} 
              onClick={() => { toggleLang(); setMobileMenuOpen(false); }}
            >
              <span style={{ opacity: lang === 'en' ? 1 : 0.5, transition: 'opacity 0.2s' }}>EN</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span style={{ opacity: lang === 'ne' ? 1 : 0.5, transition: 'opacity 0.2s', fontFamily: 'var(--font-devanagari)' }}>ने</span>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}
