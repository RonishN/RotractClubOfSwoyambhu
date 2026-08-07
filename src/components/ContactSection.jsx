import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import useFadeIn from '../hooks/useFadeIn';
import { subscribeToEvents } from '../api/client';
import EditableImage from './EditableImage';
import EditableField from './EditableField';
import StupaSkyline from './StupaSkyline';
import ThangkaCorner from './ThangkaCorner';
import heroImage from '../assets/images/heroimage.jpg';

export default function ContactSection({ content, isLoading = false }) {
  const { lang } = useLang();
  const { draft, updateDraftField } = useEditMode();
  const ref = useFadeIn();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasDraft = draft && Object.keys(draft).length > 0;
  const displayContent = hasDraft ? draft : (content || {});
  const contactImage = displayContent.contactImage || heroImage;
  const contactQuoteEn = displayContent.contactQuoteEn || 'Service Above Self — in the shadow of the Swoyambhu Stupa.';
  const contactQuoteNe = displayContent.contactQuoteNe || 'स्वार्थ भन्दा माथि सेवा — स्वयम्भू स्तूपको छहारीमा।';

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!email || !email.includes('@')) {
      setError(lang === 'en' ? 'Please enter a valid email address.' : 'कृपया एउटा वैध इमेल ठेगाना राख्नुहोस्।');
      return;
    }

    setLoading(true);
    try {
      const res = await subscribeToEvents(email.trim());
      setMessage(res?.message || (lang === 'en' ? 'Subscribed successfully! We will keep you updated.' : 'सफलतापूर्वक सदस्यता लिइयो!'));
      setEmail('');
    } catch (err) {
      setError(err?.message || (lang === 'en' ? 'Failed to subscribe. Please try again.' : 'सदस्यता लिन असफल भयो।'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="lokta-texture contact-heritage" ref={ref} style={{
      position: 'relative', overflow: 'hidden', padding: '8rem 5% 11rem'
    }}>
      {/* Gold ornament separating us from the Events section */}
      <svg className="contact-ornament" viewBox="0 0 220 24" width="220" height="24" aria-hidden="true" style={{ display: 'block', margin: '0 auto 2.6rem' }}>
        <line x1="0" y1="12" x2="86" y2="12" stroke="#C98A2B" strokeWidth="1.5" />
        <line x1="134" y1="12" x2="220" y2="12" stroke="#C98A2B" strokeWidth="1.5" />
        <rect x="105" y="5" width="10" height="10" fill="#EE7F13" transform="rotate(45 110 10)" />
        <rect x="94" y="10" width="5" height="5" fill="#DFA92E" transform="rotate(45 96.5 12.5)" />
        <rect x="121" y="10" width="5" height="5" fill="#DFA92E" transform="rotate(45 123.5 12.5)" />
      </svg>

      {/* Swoyambhu stupa skyline — melts into the maroon footer below */}
      <div className="contact-skyline-wrap" aria-hidden="true">
        <StupaSkyline />
      </div>

      <ThangkaCorner className="thangka-corner--tr" size={150} />

      <div className="contact-shell">
        <div className="contact-split">

          {/* Stupa image banner (full-width on mobile with the quote overlaid) */}
          <div className="contact-visual fade-in">
            <div className="contact-visual-frame">
              {isLoading ? (
                <div className="sk brand" style={{ position: 'absolute', inset: 0 }} />
              ) : (
                <EditableImage
                  src={contactImage}
                  alt={lang === 'en' ? 'Swoyambhu Stupa' : 'स्वयम्भू स्तूप'}
                  className="contact-visual-img"
                  style={{ borderRadius: '24px' }}
                  onChange={(url) => updateDraftField('contactImage', url)}
                  cropType="portrait"
                  fixedRatio={3 / 4}
                />
              )}
              <div className="contact-visual-shade" />
              <div className="contact-visual-mandala" aria-hidden="true">
                <span className="mandala-wheel"><span></span><span></span><span></span></span>
              </div>
              <div className="contact-visual-quote">
                <span className="contact-visual-quote-big">"</span>
                <span className="contact-visual-quote-text">
                  <EditableField field={lang === 'en' ? 'contactQuoteEn' : 'contactQuoteNe'}>
                    {lang === 'en' ? contactQuoteEn : <span className="devanagari">{contactQuoteNe}</span>}
                  </EditableField>
                </span>
              </div>
            </div>
            <div className="contact-visual-caption">
              <span>{lang === 'en' ? 'Swoyambhu, Kathmandu' : 'स्वयम्भू, काठमाडौं'}</span>
              <span>Rotary International District 3292</span>
            </div>
          </div>

          {/* Content: heading + contact cards */}
          <div className="contact-content">
            <div className="contact-head numbered-head numbered-head-left fade-in">
              <span className="numbered-num">06</span>
              <span className="contact-kicker">
                <i className="fa-solid fa-hands-holding" />
                {lang === 'en' ? 'Connect & Grow With Us' : 'हामीसँग जोडिनुहोस्'}
              </span>
              <h2 className="section-title">
                {lang === 'en' ? "We'd Love to Have You" : <span className="devanagari">हामीसँग जोडिनुहोस्</span>}
              </h2>
              <p className="contact-lead">
                {lang === 'en'
                  ? 'Partner on a project, ask a question, or become a proud member of Rotaract Swoyambhu — our doors and hearts are always open.'
                  : 'परियोजनामा सहकार्य गर्न, सोधपुछ गर्न वा रोटर्याक्ट स्वयम्भूको सदस्य बन्न — हाम्रा ढोकाहरू सधैं खुला छन्।'}
              </p>
            </div>

            {/* Two cards: contact / newsletter */}
            <div className="contact-cards fade-in delay-1">

              {/* Card 1 — message + contact */}
              <div className="contact-card">
                <div className="contact-card-head">
                  <i className="fa-solid fa-message" />
                  <span>{lang === 'en' ? 'Say hello' : 'नमस्ते भन्नुहोस्'}</span>
                </div>
                <div className="contact-card-body">
                  <a
                    className="contact-info-row"
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=rac.swoyambhu01@gmail.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="contact-info-chip">
                      <i className="fa-solid fa-envelope" />
                    </div>
                    <div className="contact-info-text">
                      <div className="contact-info-label">{lang === 'en' ? 'Email' : 'इमेल'}</div>
                      <div className="contact-info-value">rac.swoyambhu01@gmail.com</div>
                    </div>
                  </a>
                  <a
                    className="contact-info-row"
                    href="https://www.google.com/maps?q=swoyambhu"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <div className="contact-info-chip">
                      <i className="fa-solid fa-location-dot" />
                    </div>
                    <div className="contact-info-text">
                      <div className="contact-info-label">{lang === 'en' ? 'Location' : 'ठेगाना'}</div>
                      <div className="contact-info-value">
                        {lang === 'en' ? 'Swoyambhu, Kathmandu, Nepal' : 'स्वयम्भू, काठमाडौं, नेपाल'}
                      </div>
                    </div>
                  </a>
                  <a
                    className="contact-register-btn"
                    href="https://web.whatsapp.com/send?phone=9779849786214"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <i className="fa-solid fa-user-plus" />
                    <span>{lang === 'en' ? 'Register to Club' : 'क्लबमा दर्ता हुनुहोस्'}</span>
                  </a>
                </div>
              </div>

              {/* Card 2 — compact newsletter */}
              <div className="contact-card">
                <div className="contact-card-head">
                  <i className="fa-solid fa-bell" />
                  <span>{lang === 'en' ? 'Event alerts' : 'कार्यक्रम सूचना'}</span>
                </div>
                <p className="contact-newsletter-hint">
                  {lang === 'en'
                    ? 'Get notified whenever we announce new programs, drives or workshops.'
                    : 'नयाँ कार्यक्रम, अभियान वा कार्यशाला घोषणा हुँदा सूचना पाउनुहोस्।'}
                </p>

                {message && (
                  <div className="contact-alert success">
                    <i className="fa-solid fa-circle-check" /> {message}
                  </div>
                )}
                {error && (
                  <div className="contact-alert error">
                    <i className="fa-solid fa-triangle-exclamation" /> {error}
                  </div>
                )}

                <form className="contact-newsletter-form" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    className="contact-newsletter-input"
                    placeholder={lang === 'en' ? 'Your email...' : 'तपाईंको इमेल...'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="contact-newsletter-btn" disabled={loading}>
                    {loading
                      ? <span>{lang === 'en' ? '…' : '…'}</span>
                      : <><span>{lang === 'en' ? 'Subscribe' : 'सदस्यता'}</span><i className="fa-solid fa-paper-plane" /></>}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
