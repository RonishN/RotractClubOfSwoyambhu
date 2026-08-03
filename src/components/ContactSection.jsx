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
              <i className="fa-solid fa-envelope" style={{ fontSize: '1.2rem', color: 'white' }}></i>
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
              <i className="fa-solid fa-location-dot" style={{ fontSize: '1.2rem', color: 'white' }}></i>
            </div>
            <span className="contact-text">
              {lang === 'en'
                ? 'Swoyambhu, Kathmandu, Nepal'
                : <span className="devanagari">स्वयम्भू, काठमाडौं, नेपाल</span>}
            </span>
          </a>
        </div>

        <div className="join-btn-container">
          <a href="https://web.whatsapp.com/send?phone=9779849786214" target="_blank" rel="noreferrer" className="btn">
            {lang === 'en' ? 'Join the Club' : <span className="devanagari">क्लबमा सामेल हुनुहोस्</span>}
          </a>
        </div>
      </div>
    </section>
  );
}
