import React, { useState, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

export default function CookieConsent() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      // Show popup after a short delay for better UX
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'true');
    // Save current language if they accept
    localStorage.setItem('preferredLang', lang);
    setShow(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'false');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="cookie-consent-banner">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#e2b3be' }}>
          {lang === 'en' ? 'Cookie Consent' : <span className="devanagari">कुकी सहमति</span>}
        </h4>
        <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9, lineHeight: 1.5 }}>
          {lang === 'en' 
            ? 'We use cookies (local storage) to remember your preferences, such as your selected language, to improve your experience on our site.' 
            : <span className="devanagari">हामी तपाईंको अनुभव सुधार गर्न तपाईंको भाषा प्राथमिकता जस्ता कुराहरू सम्झन कुकीहरू (स्थानीय भण्डारण) प्रयोग गर्छौं।</span>}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleDecline}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'var(--white)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {lang === 'en' ? 'Decline' : <span className="devanagari">अस्वीकार</span>}
        </button>
        <button 
          onClick={handleAccept}
          style={{
            background: '#79213C',
            border: 'none',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            transition: 'transform 0.1s, opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
          onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          {lang === 'en' ? 'Accept' : <span className="devanagari">स्वीकार</span>}
        </button>
      </div>
    </div>
  );
}
