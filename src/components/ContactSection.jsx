import React, { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import { subscribeToEvents } from '../api/client';

export default function ContactSection() {
  const { lang } = useLang();
  const ref = useFadeIn();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    <section id="contact" style={{ position: 'relative', overflow: 'hidden', padding: '6rem 5% 5rem', background: 'linear-gradient(135deg, #1e0912 0%, #3d0c1b 50%, #15050b 100%)', color: '#FCFBF7' }} ref={ref}>
      {/* Primary Glow Background Effect */}
      <div style={{
        position: 'absolute', top: '-150px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(121, 33, 60, 0.5) 0%, rgba(180, 58, 93, 0.15) 50%, transparent 80%)',
        filter: 'blur(60px)', pointerEvents: 'none'
      }} />

      <div style={{ maxWidth: '1140px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        {/* Main Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{
            fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px',
            color: '#b33a5d', background: 'rgba(179, 58, 93, 0.15)', padding: '6px 16px', borderRadius: '20px',
            border: '1px solid rgba(179, 58, 93, 0.3)', display: 'inline-block', marginBottom: '1rem'
          }}>
            {lang === 'en' ? 'Connect & Grow With Us' : 'हामीसँग जोडिनुहोस्'}
          </span>
          <h2 style={{ fontSize: '2.4rem', fontWeight: 800, color: '#FCFBF7', margin: 0, fontFamily: 'var(--font-sans-bold)' }}>
            {lang === 'en' ? "We'd Love to Have You" : <span className="devanagari">हामीसँग जोडिनुहोस्</span>}
          </h2>
          <p style={{ maxWidth: '640px', margin: '1rem auto 0', color: 'rgba(252, 251, 247, 0.8)', fontSize: '1.02rem', lineHeight: 1.6 }}>
            {lang === 'en'
              ? 'Whether you want to partner on a community project, ask a question, or become a proud member of Rotaract Swoyambhu — our doors and hearts are always open.'
              : 'चाहे तपाईं कुनै सामाजिक परियोजनामा सहकार्य गर्न चाहनुहुन्छ, सोधपुछ गर्न चाहनुहुन्छ वा रोटर्याक्ट स्वयम्भूको सदस्य बन्न चाहनुहुन्छ — हाम्रा ढोकाहरू सधैं खुला छन्।'}
          </p>
        </div>

        {/* 2-Column Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', alignItems: 'stretch' }}>
          
          {/* Left Column: Direct Contact & Info Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', justifyContent: 'center' }}>
            
            {/* Email Card */}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=rac.swoyambhu01@gmail.com"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none', color: '#FCFBF7', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--primary-lighter, #b33a5d)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #79213C, #b33a5d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(121, 33, 60, 0.4)'
              }}>
                <i className="fa-solid fa-envelope" style={{ fontSize: '1.3rem', color: '#ffffff' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(252, 251, 247, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  {lang === 'en' ? 'Send Us an Email' : 'इमेल गर्नुहोस्'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FCFBF7', marginTop: '2px' }}>
                  rac.swoyambhu01@gmail.com
                </div>
              </div>
            </a>

            {/* Location Card */}
            <a
              href="https://www.google.com/maps?q=swoyambhu"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.05)', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.1)',
                textDecoration: 'none', color: '#FCFBF7', transition: 'all 0.3s ease', backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'var(--primary-lighter, #b33a5d)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '50px', height: '50px', borderRadius: '14px', background: 'linear-gradient(135deg, #79213C, #b33a5d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 16px rgba(121, 33, 60, 0.4)'
              }}>
                <i className="fa-solid fa-location-dot" style={{ fontSize: '1.3rem', color: '#ffffff' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(252, 251, 247, 0.6)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  {lang === 'en' ? 'Our Location' : 'हाम्रो ठेगाना'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#FCFBF7', marginTop: '2px' }}>
                  {lang === 'en' ? 'Swoyambhu, Kathmandu, Nepal' : 'स्वयम्भू, काठमाडौं, नेपाल'}
                </div>
              </div>
            </a>

            {/* Register to Club CTA */}
            <a
              href="https://web.whatsapp.com/send?phone=9779849786214"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                padding: '1.1rem 1.8rem', borderRadius: '18px', background: 'linear-gradient(135deg, #79213C, #b33a5d)',
                color: '#ffffff', textDecoration: 'none', fontWeight: 800, fontSize: '1rem',
                boxShadow: '0 8px 24px rgba(121, 33, 60, 0.4)', transition: 'all 0.3s ease', marginTop: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(121, 33, 60, 0.6)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #962d4c, #b33a5d)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(121, 33, 60, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #79213C, #b33a5d)';
              }}
            >
              <i className="fa-solid fa-user-plus" style={{ fontSize: '1.1rem' }} />
              <span>{lang === 'en' ? 'Register to Club' : 'क्लबमा दर्ता हुनुहोस्'}</span>
            </a>

          </div>

          {/* Right Column: Newsletter & Event Alerts Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '2.5rem 2rem', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FCFBF7', margin: '0 0 0.5rem', fontFamily: 'var(--font-sans-bold)' }}>
                {lang === 'en' ? 'Stay Updated With Events' : 'कार्यक्रमका अद्यावधिकहरू पाउनुहोस्'}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(252, 251, 247, 0.7)', margin: 0, lineHeight: 1.5 }}>
                {lang === 'en'
                  ? 'Subscribe to get instant email notifications whenever we announce new youth programs, community service drives, or workshops.'
                  : 'नयाँ कार्यक्रमहरू वा कार्यशालाहरू घोषणा हुँदा इमेलमा सूचना प्राप्त गर्न सदस्यता लिनुहोस्।'}
              </p>
            </div>

            {message && (
              <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ade80', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-check" /> {message}
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-triangle-exclamation" /> {error}
              </div>
            )}

            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  placeholder={lang === 'en' ? 'Enter your email address...' : 'आफ्नो इमेल राख्नुहोस्...'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '14px 18px', borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#FCFBF7', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#b33a5d'; e.target.style.background = 'rgba(255, 255, 255, 0.12)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'; e.target.style.background = 'rgba(255, 255, 255, 0.08)'; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px 24px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #79213C, #b33a5d)',
                  color: '#ffffff', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 6px 20px rgba(121, 33, 60, 0.4)', transition: 'all 0.25s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(121, 33, 60, 0.6)'; e.currentTarget.style.background = 'linear-gradient(135deg, #962d4c, #b33a5d)'; } }}
                onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 33, 60, 0.4)'; e.currentTarget.style.background = 'linear-gradient(135deg, #79213C, #b33a5d)'; } }}
              >
                {loading ? (
                  <span>{lang === 'en' ? 'Subscribing...' : 'सदस्यता लिइँदैछ...'}</span>
                ) : (
                  <>
                    <span>{lang === 'en' ? 'Subscribe For Updates' : 'सदस्यता लिनुहोस्'}</span>
                    <i className="fa-solid fa-paper-plane" style={{ fontSize: '0.88rem' }} />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
