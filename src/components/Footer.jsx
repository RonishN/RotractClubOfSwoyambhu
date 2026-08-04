import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import logo from '../assets/images/logo.png';
import ReportBugModal from './ReportBugModal';

export default function Footer() {
  const { lang } = useLang();
  const [showBugModal, setShowBugModal] = useState(false);

  return (
    <>
      <footer style={{
        background: '#18050e',
        color: '#FCFBF7',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: '4.5rem',
        paddingBottom: '2rem',
        fontFamily: 'var(--font-sans, sans-serif)'
      }}>
        {/* Top Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, height: '3px',
          background: '#79213C',
          opacity: 0.95
        }} />

        {/* Background Mandala Watermark Pattern */}
        <div style={{
          position: 'absolute',
          right: '-5%',
          bottom: '-15%',
          width: '450px',
          height: '450px',
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #FCFBF7 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />

        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 5%' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3.5rem'
          }}>
            {/* Column 1: Brand & Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem' }}>
                <img
                  src={logo}
                  alt="Rotaract Swoyambhu"
                  style={{ width: 50, height: 50, objectFit: 'contain', borderRadius: '50%', background: 'white', padding: '2px' }}
                />
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700, color: '#FCFBF7' }}>
                    {lang === 'en' ? 'Rotaract Club' : 'रोटर्याक्ट क्लब'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, letterSpacing: '0.5px' }}>
                    {lang === 'en' ? 'of Swoyambhu' : 'स्वयम्भू'}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '0.88rem', color: 'rgba(252, 251, 247, 0.75)', lineHeight: 1.65, margin: '0 0 1.2rem' }}>
                {lang === 'en'
                  ? 'Empowering young leaders, serving local communities, and preserving heritage under Rotary International District 3292.'
                  : 'युवा नेताहरूलाई सबल बनाउँदै, स्थानीय समुदायको सेवा गर्दै र सम्पदाको संरक्षण गर्दै।'}
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FCFBF7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>
                {lang === 'en' ? 'Quick Navigation' : 'नेभिगेसन'}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li>
                  <a href="#hero" style={{ color: 'rgba(252, 251, 247, 0.75)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.75)'}>
                    {lang === 'en' ? 'Home' : 'गृहपृष्ठ'}
                  </a>
                </li>
                <li>
                  <a href="#about" style={{ color: 'rgba(252, 251, 247, 0.75)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.75)'}>
                    {lang === 'en' ? 'About Us' : 'हाम्रो बारेमा'}
                  </a>
                </li>
                <li>
                  <Link to="/events" style={{ color: 'rgba(252, 251, 247, 0.75)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.75)'}>
                    {lang === 'en' ? 'Events & Programs' : 'कार्यक्रमहरू'}
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" style={{ color: 'rgba(252, 251, 247, 0.75)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#f59e0b'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.75)'}>
                    {lang === 'en' ? 'Photo Gallery' : 'ग्यालरी'}
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setShowBugModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'rgba(252, 251, 247, 0.75)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'color 0.2s',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.75)'}
                  >
                    <i className="fa-solid fa-bug" style={{ fontSize: '0.8rem' }} />
                    {lang === 'en' ? 'Report a Bug' : 'समस्या दर्ता'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Affiliation & District */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FCFBF7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>
                {lang === 'en' ? 'Affiliation' : 'सम्बद्धता'}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(252, 251, 247, 0.75)', lineHeight: 1.6, margin: '0 0 1rem' }}>
                Partner of <strong style={{ color: '#FCFBF7' }}>Rotary International</strong><br />
                RID 3292, Nepal & Bhutan
              </p>
              <div style={{
                display: 'inline-block', padding: '6px 12px', background: 'rgba(121, 33, 60, 0.3)',
                borderRadius: '8px', border: '1px solid rgba(121, 33, 60, 0.4)', fontSize: '0.8rem', color: '#e2b3be', fontWeight: 600
              }}>
                Club ID: 217464
              </div>
            </div>

            {/* Column 4: Connect & Socials */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FCFBF7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.2rem' }}>
                {lang === 'en' ? 'Follow Our Journey' : 'सामाजिक सञ्जाल'}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'rgba(252, 251, 247, 0.75)', margin: '0 0 1.2rem' }}>
                Stay connected with our daily stories and initiative updates.
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href="https://www.facebook.com/racofswoyambhu/"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)', color: '#FCFBF7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', transition: 'all 0.3s ease', border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#1877F2';
                    e.currentTarget.style.borderColor = '#1877F2';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa-brands fa-facebook-f" style={{ fontSize: '1.1rem' }} />
                </a>

                <a
                  href="https://www.instagram.com/rac_swoyambhu/"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)', color: '#FCFBF7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', transition: 'all 0.3s ease', border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#79213C';
                    e.currentTarget.style.borderColor = '#79213C';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa-brands fa-instagram" style={{ fontSize: '1.15rem' }} />
                </a>

                <a
                  href="https://web.whatsapp.com/send?phone=9779849786214"
                  aria-label="WhatsApp"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)', color: '#FCFBF7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    textDecoration: 'none', transition: 'all 0.3s ease', border: '1px solid rgba(255, 255, 255, 0.12)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#25D366';
                    e.currentTarget.style.borderColor = '#25D366';
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <i className="fa-brands fa-whatsapp" style={{ fontSize: '1.2rem' }} />
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar Separator & Copyright */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.8rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.84rem',
            color: 'rgba(252, 251, 247, 0.6)'
          }}>
            <div>
              © {new Date().getFullYear()} Rotaract Club of Swoyambhu. All rights reserved.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setShowBugModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(252, 251, 247, 0.6)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: 0,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(252, 251, 247, 0.6)'}
              >
                <i className="fa-solid fa-bug" />
                Report an Issue
              </button>
              <span>•</span>
              <div>
                Crafted with <i className="fa-solid fa-heart" style={{ color: '#79213C', margin: '0 3px' }} /> for Youth Leadership & Community Service
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Report Bug Modal */}
      <ReportBugModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
      />
    </>
  );
}
