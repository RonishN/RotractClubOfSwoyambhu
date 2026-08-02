import React from 'react';
import { useLang } from '../context/LanguageContext';

export default function Footer() {
  const { lang } = useLang();

  return (
    <footer>
      {/* Saffron gradient glow top border */}
      <div className="footer-saffron-glow" />

      <h2 className="footer-logo">Rotaract Club of Swoyambhu</h2>
      <h2 className="footer-nepali devanagari" style={{ marginTop: '1rem', color: 'var(--saffron)' }}>
        स्वयम्भू रोटर्याक्ट क्लब
      </h2>

      <p className="affiliation">
        Partner of <span>Rotary International</span><br />
        Bringing young adults together to exchange ideas with leaders in the community, develop
        leadership and professional skills, and have fun through service.
      </p>

      <div className="social-links">
        {/* Facebook */}
        <a href="https://www.facebook.com/racofswoyambhu/" aria-label="Facebook" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24">
            <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
          </svg>
        </a>
        {/* Instagram */}
        <a href="https://www.instagram.com/rac_swoyambhu/" aria-label="Instagram" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 24 24">
            <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
          </svg>
        </a>
      </div>

      <div className="footer-bottom">
        <p>© 2026 Rotaract Club of Swoyambhu. All rights reserved.</p>
      </div>
    </footer>
  );
}
