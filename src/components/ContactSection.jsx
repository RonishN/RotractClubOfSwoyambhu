import React from 'react';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import TraditionalDivider from './TraditionalDivider';

export default function ContactSection() {
  const { lang } = useLang();
  const ref = useFadeIn();

  return (
    <section id="contact" className="lokta-texture" ref={ref}>
      <div className="section-header fade-in">
        <h2 className="section-title">
          {lang === 'en' ? "We'd Love to Have You" : <span className="devanagari">हामीसँग जोडिनुहोस्</span>}
        </h2>
      </div>

      <div className="contact-wrapper fade-in delay-1">
        <p>
          Whether you want to partner with us, ask a question, or become a member of the Rotaract Club of
          Swoyambhu, our doors are always open.
        </p>

        <div className="contact-info">
          {/* Email */}
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=rac.swoyambhu01@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="contact-item"
          >
            <div className="contact-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </div>
            <span className="contact-text">rac.swoyambhu01@gmail.com</span>
          </a>

          {/* Location */}
          <a
            href="https://www.google.com/maps?q=swoyambhu"
            target="_blank"
            rel="noreferrer"
            className="contact-item"
          >
            <div className="contact-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            </div>
            <span className="contact-text">
              {lang === 'en'
                ? 'Swoyambhu, Kathmandu, Nepal'
                : <span className="devanagari">स्वयम्भू, काठमाडौं, नेपाल</span>}
            </span>
          </a>
        </div>

        <div className="join-btn-container">
          <a href="https://wa.me/9779849786214" target="_blank" rel="noreferrer" className="btn">
            {lang === 'en' ? 'Join the Club' : <span className="devanagari">क्लबमा सामेल हुनुहोस्</span>}
          </a>
        </div>
      </div>
    </section>
  );
}
