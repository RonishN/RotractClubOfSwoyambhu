import React from 'react';
import { useLang } from '../context/LanguageContext';

export default function Footer() {
  const { lang } = useLang();

  return (
    <footer>
      {/* Saffron gradient glow top border */}
      <div className="footer-saffron-glow" />

      <h2 className="footer-logo">Rotaract Club of Swoyambhu</h2>
      <h2 className="footer-nepali devanagari" style={{ marginTop: '1rem', color: '#e2b3be' }}>
        स्वयम्भू रोटर्याक्ट क्लब
      </h2>

      <p className="affiliation">
        Partner of <span>Rotary International</span><br />
        Bringing young adults together to exchange ideas with leaders in the community, develop
        leadership and professional skills, and have fun through service.
      </p>

      <div className="social-links">
        {/* Facebook */}
        <a href="https://www.facebook.com/racofswoyambhu/" aria-label="Facebook" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-brands fa-facebook-f" style={{ fontSize: '1.15rem' }}></i>
        </a>
        {/* Instagram */}
        <a href="https://www.instagram.com/rac_swoyambhu/" aria-label="Instagram" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fa-brands fa-instagram" style={{ fontSize: '1.2rem' }}></i>
        </a>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Rotaract Club of Swoyambhu. All rights reserved.</p>
      </div>
    </footer>
  );
}
