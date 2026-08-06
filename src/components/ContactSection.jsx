import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import useFadeIn from '../hooks/useFadeIn';
import { subscribeToEvents } from '../api/client';
import EditableImage from './EditableImage';
import EditableField from './EditableField';
import StupaSkyline from './StupaSkyline';
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

  const infoRow = {
    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.2rem',
    background: '#FFFFFF', borderRadius: '16px', border: '1.5px solid #E9D9BD',
    textDecoration: 'none', color: '#2B121C', transition: 'all 0.3s ease',
    boxShadow: '0 8px 22px rgba(79, 18, 34, 0.07)'
  };

  const infoRowHover = {
    borderColor: 'rgba(223, 169, 46, 0.7)',
    transform: 'translateY(-2px)',
    boxShadow: '0 14px 32px rgba(79, 18, 34, 0.13)'
  };

  const infoChip = {
    width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
    background: 'linear-gradient(135deg, #7A1F34 0%, #9E2C46 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 6px 16px rgba(122, 31, 52, 0.3)'
  };

  return (
    <section id="contact" className="lokta-texture contact-heritage" ref={ref} style={{
      position: 'relative', overflow: 'hidden', padding: '8rem 5% 11rem',
      background: 'linear-gradient(180deg, #F2DEB4 0%, #EBD2A3 14%, #FBEFDA 46%, #FAF3E6 100%)',
      color: '#2B121C'
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

      <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="contact-split">

          {/* Dark maroon visual column */}
          <div className="contact-visual fade-in" style={{ position: 'relative' }}>
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

          {/* Light content column */}
          <div className="contact-content">
            <div className="section-header fade-in" style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.28em',
                color: '#B8532A', background: 'rgba(238, 127, 19, 0.08)',
                padding: '0.5rem 1.3rem', borderRadius: '999px',
                border: '1px solid rgba(238, 127, 19, 0.3)', marginBottom: '1rem'
              }}>
                <i className="fa-solid fa-hands-holding" style={{ fontSize: '0.72rem' }} />
                {lang === 'en' ? 'Connect & Grow With Us' : 'हामीसँग जोडिनुहोस्'}
              </span>
              <h2 className="section-title" style={{ margin: 0 }}>
                {lang === 'en' ? "We'd Love to Have You" : <span className="devanagari">हामीसँग जोडिनुहोस्</span>}
              </h2>
              <p style={{
                maxWidth: '540px', margin: '1rem 0 0', color: '#6B4F38', fontSize: '1rem', lineHeight: 1.7
              }}>
                {lang === 'en'
                  ? 'Partner on a project, ask a question, or become a proud member of Rotaract Swoyambhu — our doors and hearts are always open.'
                  : 'परियोजनामा सहकार्य गर्न, सोधपुछ गर्न वा रोटर्याक्ट स्वयम्भूको सदस्य बन्न — हाम्रा ढोकाहरू सधैं खुला छन्।'}
              </p>
            </div>

            {/* Two cards: contact / newsletter */}
            <div className="contact-cards fade-in delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Card 1 — message + contact */}
              <div className="contact-card">
                <div className="contact-card-head">
                  <i className="fa-solid fa-message" />
                  <span>{lang === 'en' ? 'Say hello' : 'नमस्ते भन्नुहोस्'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=rac.swoyambhu01@gmail.com"
                    target="_blank"
                    rel="noreferrer"
                    style={infoRow}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, infoRowHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, infoRow)}
                  >
                    <div style={infoChip}>
                      <i className="fa-solid fa-envelope" style={{ fontSize: '1.1rem', color: '#FFF6E9' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#8A6A52', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                        {lang === 'en' ? 'Email' : 'इमेल'}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4F1222', marginTop: '2px' }}>
                        rac.swoyambhu01@gmail.com
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://www.google.com/maps?q=swoyambhu"
                    target="_blank"
                    rel="noreferrer"
                    style={infoRow}
                    onMouseEnter={(e) => Object.assign(e.currentTarget.style, infoRowHover)}
                    onMouseLeave={(e) => Object.assign(e.currentTarget.style, infoRow)}
                  >
                    <div style={infoChip}>
                      <i className="fa-solid fa-location-dot" style={{ fontSize: '1.1rem', color: '#FFF6E9' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#8A6A52', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>
                        {lang === 'en' ? 'Location' : 'ठेगाना'}
                      </div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#4F1222', marginTop: '2px' }}>
                        {lang === 'en' ? 'Swoyambhu, Kathmandu, Nepal' : 'स्वयम्भू, काठमाडौं, नेपाल'}
                      </div>
                    </div>
                  </a>
                  <a
                    href="https://web.whatsapp.com/send?phone=9779849786214"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      padding: '1rem 1.6rem', borderRadius: '999px',
                      background: 'linear-gradient(135deg, #EE7F13 0%, #DFA92E 100%)',
                      color: '#4F1222', textDecoration: 'none', fontWeight: 800, fontSize: '0.98rem',
                      boxShadow: '0 10px 26px rgba(238, 127, 19, 0.35)', transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 16px 38px rgba(238, 127, 19, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 26px rgba(238, 127, 19, 0.35)';
                    }}
                  >
                    <i className="fa-solid fa-user-plus" style={{ fontSize: '1.05rem' }} />
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
                <p style={{ fontSize: '0.88rem', color: '#6B4F38', margin: '0 0 1rem', lineHeight: 1.6 }}>
                  {lang === 'en'
                    ? 'Get notified whenever we announce new programs, drives or workshops.'
                    : 'नयाँ कार्यक्रम, अभियान वा कार्यशाला घोषणा हुँदा सूचना पाउनुहोस्।'}
                </p>

                {message && (
                  <div style={{ background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#15803d', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-circle-check" /> {message}
                  </div>
                )}
                {error && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#b91c1c', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-triangle-exclamation" /> {error}
                  </div>
                )}

                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '0.6rem' }}>
                  <input
                    type="email"
                    placeholder={lang === 'en' ? 'Your email...' : 'तपाईंको इमेल...'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      flex: 1, minWidth: 0, padding: '12px 16px', borderRadius: '999px',
                      background: '#FBF5E9', border: '1.5px solid #E9D9BD',
                      color: '#2B121C', fontSize: '0.92rem', outline: 'none', transition: 'all 0.2s'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#EE7F13'; e.target.style.background = '#FFFFFF'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#E9D9BD'; e.target.style.background = '#FBF5E9'; }}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flexShrink: 0, padding: '12px 20px', borderRadius: '999px', border: 'none',
                      background: 'linear-gradient(135deg, #7A1F34 0%, #5A1326 100%)',
                      color: '#FFF6E9', fontWeight: 800, fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 8px 22px rgba(122, 31, 52, 0.3)', transition: 'all 0.25s ease',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(122, 31, 52, 0.45)'; } }}
                    onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(122, 31, 52, 0.3)'; } }}
                  >
                    {loading ? <span>{lang === 'en' ? '…' : '…'}</span> : <><span>{lang === 'en' ? 'Subscribe' : 'सदस्यता'}</span><i className="fa-solid fa-paper-plane" /></>}
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
