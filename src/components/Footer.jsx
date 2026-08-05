import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import logo from '../assets/images/logo.png';

export default function Footer() {
  const { lang } = useLang();
  const navigate = useNavigate();

  const logoTapCount = React.useRef(0);
  const logoTapTimer = React.useRef(null);

  const handleLogoSecretTap = () => {
    logoTapCount.current += 1;
    clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 2000);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      sessionStorage.setItem('adminIntent', '1');
      navigate('/login');
    }
  };

  return (
    <footer className="footer-global footer-mini">
      <div className="footer-mini-inner">
        <div className="footer-mini-brand" onClick={handleLogoSecretTap}>
          <img src={logo} alt="Rotaract Swoyambhu" className="footer-mini-logo" />
          <span className="footer-mini-name">
            {lang === 'en' ? 'Rotaract Club of Swoyambhu' : 'स्वयम्भू रोटर्‍याक्ट क्लब'}
            <small>{lang === 'en' ? 'Service Above Self' : 'सेवा नै धर्म हो'}</small>
          </span>
        </div>

        <nav className="footer-mini-links" aria-label="Footer navigation">
          <Link to="/">{lang === 'en' ? 'Home' : 'गृहपृष्ठ'}</Link>
          <Link to="/events">{lang === 'en' ? 'Events' : 'कार्यक्रमहरू'}</Link>
          <Link to="/gallery">{lang === 'en' ? 'Gallery' : 'ग्यालरी'}</Link>
        </nav>

        <div className="footer-mini-socials">
          <a href="https://www.facebook.com/racofswoyambhu/" aria-label="Facebook" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-facebook-f" />
          </a>
          <a href="https://www.instagram.com/rac_swoyambhu/" aria-label="Instagram" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-instagram" />
          </a>
          <a href="https://web.whatsapp.com/send?phone=9779849786214" aria-label="WhatsApp" target="_blank" rel="noreferrer">
            <i className="fa-brands fa-whatsapp" />
          </a>
        </div>

        <div className="footer-mini-copy">
          &copy; {new Date().getFullYear()}{' '}
          {lang === 'en'
            ? 'Rotaract Club of Swoyambhu. All rights reserved.'
            : 'स्वयम्भू रोटर्याक्ट क्लब। सर्वाधिकार सुरक्षित।'}
        </div>
      </div>
    </footer>
  );
}
