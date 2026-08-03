import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import EventCarousel from '../components/EventCarousel';
import logo from '../assets/images/logo.png';
import { getPublicEvents, subscribeToEvents, unsubscribeToEvents } from '../api/client';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';

export default function EventsPage() {
  const { lang } = useLang();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, UPCOMING, COMPLETED
  const [selectedTag, setSelectedTag] = useState('');

  // Subscribe Modal State
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subMsg, setSubMsg] = useState('');
  const [subErr, setSubErr] = useState('');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  // Lightbox Modal state
  const [lightboxImg, setLightboxImg] = useState(null);

  const ref = useFadeIn(0.15, [loading, selectedCategory, selectedTag, searchTerm]);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Auto-handle unsubscribe if link clicked from email
    const isUnsubParam = searchParams.get('unsubscribe');
    const emailParam = searchParams.get('email');
    if (isUnsubParam) {
      setIsSubscribeModalOpen(true);
      setIsUnsubscribing(true);
      if (emailParam) {
        setSubEmail(emailParam);
      }
    }

    getPublicEvents()
      .then((data) => setEvents(data || []))
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    setSubErr('');
    setSubMsg('');
    if (!subEmail.trim() || !subEmail.includes('@')) {
      setSubErr('Please enter a valid email address.');
      return;
    }
    setSubscribing(true);
    try {
      if (isUnsubscribing) {
        const res = await unsubscribeToEvents(subEmail.trim());
        setSubMsg(res.message || 'Unsubscribed successfully.');
      } else {
        const res = await subscribeToEvents(subEmail.trim());
        setSubMsg(res.message || 'Subscribed successfully!');
      }
      setSubEmail('');
    } catch (err) {
      setSubErr(err.message || 'Action failed.');
    } finally {
      setSubscribing(false);
    }
  };

  const allTags = Array.from(new Set(events.flatMap((e) => e.tags || [])));
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'UPCOMING' && ev.eventDate < todayStr) return false;
    if (selectedCategory === 'COMPLETED' && ev.eventDate >= todayStr) return false;

    if (selectedTag && (!ev.tags || !ev.tags.includes(selectedTag))) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const titleMatch = ev.title?.toLowerCase().includes(q);
      const descMatch = ev.description?.toLowerCase().includes(q);
      const tagMatch = ev.tags?.some((t) => t.toLowerCase().includes(q));
      if (!titleMatch && !descMatch && !tagMatch) return false;
    }

    return true;
  });

  return (
    <>
      <Header />
      <main ref={ref} className="lokta-texture" style={{ paddingTop: '120px', minHeight: '90vh', paddingBottom: '6rem', paddingLeft: '5%', paddingRight: '5%' }}>
        
        {/* Impeccable Hero Section Header with Overline & Warm Contrast */}
        <div className="section-header fade-in" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.22em',
            color: 'var(--saffron)', marginBottom: '8px'
          }}>
            {lang === 'en' ? 'SWOYAMBHU INITIATIVES' : 'स्वयम्भू पहलहरू'}
          </div>
          <h2 className="section-title" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)', lineHeight: 1.15 }}>
            {lang === 'en' ? 'Events & Activities' : <span className="devanagari">कार्यक्रम तथा गतिविधिहरू</span>}
          </h2>
          <p style={{ marginTop: '14px', fontSize: '1.05rem', color: '#475569', maxWidth: 640, margin: '14px auto 0', lineHeight: 1.6 }}>
            {lang === 'en'
              ? 'Explore our community projects, youth fellowship programs, and heritage conservation drives.'
              : 'हाम्रा सामुदायिक प्रयासहरू, युवा फेलोशिप र सांस्कृतिक कार्यक्रमहरू हेर्नुहोस्।'}
          </p>
        </div>

        {/* Impeccable Control Console: Glassmorphism Bar */}
        <div className="fade-in delay-1" style={{
          maxWidth: 1040, margin: '0 auto 3.5rem', background: '#ffffff',
          borderRadius: 24, padding: '24px 30px', boxShadow: '0 12px 35px rgba(28, 43, 76, 0.06)',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: allTags.length > 0 ? 18 : 0 }}>
            {/* Search Bar */}
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search events...' : 'कार्यक्रम खोज्नुहोस्...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 18px 12px 42px', borderRadius: 14,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  fontSize: '0.9rem', color: 'var(--navy)', outline: 'none',
                  transition: 'border-color 0.2s, box-shadow 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--saffron)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(255, 138, 0, 0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>

            {/* Category Filter & Subscribe Button Group */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Category Segmented Control */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 16, gap: 4 }}>
                {[
                  { id: 'ALL', en: 'All', ne: 'सबै' },
                  { id: 'UPCOMING', en: 'Upcoming', ne: 'आगामी' },
                  { id: 'COMPLETED', en: 'Completed', ne: 'सम्पन्न' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '8px 16px', borderRadius: 12, fontSize: '0.84rem', fontWeight: 700,
                      border: 'none',
                      background: selectedCategory === cat.id ? '#ffffff' : 'transparent',
                      color: selectedCategory === cat.id ? 'var(--navy)' : '#64748b',
                      cursor: 'pointer',
                      boxShadow: selectedCategory === cat.id ? '0 3px 8px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    {lang === 'en' ? cat.en : cat.ne}
                  </button>
                ))}
              </div>

              {/* Subscribe Button nicely aligned in the console bar */}
              <button
                onClick={() => {
                  setSubMsg('');
                  setSubErr('');
                  setIsUnsubscribing(false);
                  setIsSubscribeModalOpen(true);
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '9px 18px', borderRadius: 14, fontSize: '0.84rem', fontWeight: 700,
                  background: '#79213C',
                  color: '#ffffff', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(121, 33, 60, 0.3)', transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <i className="fa-solid fa-bell" style={{ fontSize: '0.9rem' }}></i>
                <span>{lang === 'en' ? 'Subscribe' : 'सूचना पाउनुहोस्'}</span>
              </button>
            </div>
          </div>

          {/* Tags Bar */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 6 }}>
                {lang === 'en' ? 'Filter Tags:' : 'ट्यागहरू:'}
              </span>
              <button
                onClick={() => setSelectedTag('')}
                style={{
                  padding: '5px 14px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: selectedTag === '' ? 'var(--navy)' : '#f8fafc',
                  color: selectedTag === '' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s'
                }}
              >
                All
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: '0.76rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: selectedTag === tag ? 'var(--saffron)' : '#f8fafc',
                    color: selectedTag === tag ? '#ffffff' : '#64748b',
                    transition: 'all 0.2s'
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Section - Impeccable Horizontal Rectangle Banner Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--navy)' }}>
            <span className="admin-spinner" style={{ borderTopColor: 'var(--saffron)' }} />
            <p style={{ marginTop: 16, fontWeight: 600, color: '#64748b' }}>Loading events...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: '#fef2f2', color: '#991b1b', borderRadius: 20, maxWidth: 600, margin: '0 auto', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#ffffff', borderRadius: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.03)', maxWidth: 600, margin: '0 auto', border: '1px solid #f1f5f9' }}>
            <div style={{ marginBottom: 14 }}>
              <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '3rem', color: '#79213C' }}></i>
            </div>
            <h3 className="serif" style={{ color: 'var(--navy)', marginBottom: 8, fontSize: '1.4rem' }}>No events found</h3>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>Try adjusting your search query or active filter tags.</p>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '32px',
            maxWidth: 1040, margin: '0 auto'
          }}>
            {filteredEvents.map((ev) => {
              const isPast = ev.eventDate < todayStr;
              return (
                <article
                  key={ev.id}
                  className="event-public-card"
                >
                  {/* Left Column: Landscape Image Carousel Container */}
                  <div className="event-card-media">
                    <EventCarousel pictures={ev.pictures} title={ev.title} onImageClick={(img) => setLightboxImg(img)} height="100%" />
                  </div>

                  {/* Right Column: Content Section */}
                  <div className="event-card-body">
                    <div>
                      {/* Status Pill & Date Badge Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                        <span style={{
                          padding: '5px 14px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
                          background: isPast ? '#f1f5f9' : 'rgba(121, 33, 60, 0.1)', color: isPast ? '#475569' : '#79213C'
                        }}>
                          {isPast ? (lang === 'en' ? 'COMPLETED' : 'सम्पन्न') : (lang === 'en' ? 'UPCOMING' : 'आगामी')}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#64748b', fontSize: '0.88rem', fontWeight: 600 }}>
                          <i className="fa-regular fa-calendar" style={{ color: '#79213C' }}></i>
                          <span>{ev.eventDate} {ev.eventTime ? `@ ${ev.eventTime}` : ''}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 style={{ fontSize: '1.55rem', color: 'var(--navy)', marginBottom: 14, lineHeight: 1.25, fontWeight: 700 }} className="serif">
                        {ev.title}
                      </h3>

                      {/* Description */}
                      {ev.description && (
                        <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.68, marginBottom: 20 }}>
                          {ev.description}
                        </p>
                      )}

                      {/* Attendees */}
                      {ev.attendees && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--navy)', fontSize: '0.84rem', background: '#f8fafc', padding: '8px 14px', borderRadius: 10, marginBottom: 18, border: '1px solid #f1f5f9' }}>
                          <i className="fa-solid fa-users" style={{ color: '#79213C' }}></i>
                          <span>Attendees / Guests: <strong>{ev.attendees}</strong></span>
                        </div>
                      )}

                      {/* Collaborators */}
                      {ev.collaborators && ev.collaborators.length > 0 ? (
                        <div style={{ background: 'rgba(121, 33, 60, 0.04)', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(121, 33, 60, 0.12)', marginBottom: 20 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#79213C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="fa-solid fa-handshake"></i> {lang === 'en' ? 'In Collaboration With' : 'सहकार्यकर्ता संस्थाहरू'}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            {ev.collaborators.map((c, cIdx) => (
                              <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#ffffff', padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(121, 33, 60, 0.2)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                {c.logoUrl ? (
                                  <img src={c.logoUrl} alt={c.name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'contain' }} />
                                ) : (
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#79213C' }}></span>
                                )}
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)' }}>{c.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: 'var(--navy)', fontWeight: 700, background: '#f8fafc', padding: '6px 14px', borderRadius: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                          <img src={logo} alt="Swoyambhu Logo" style={{ width: 22, height: 22, objectFit: 'contain', borderRadius: '50%' }} />
                          <span>Rotaract Club of Swoyambhu</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Footer: Tags on Left, Register Button on Bottom Right */}
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
                      paddingTop: 18, borderTop: '1px solid #f1f5f9', marginTop: 12
                    }}>
                      {/* Tags */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {ev.tags && ev.tags.map((tag) => (
                          <span key={tag} style={{
                            padding: '5px 13px', background: '#f1f5f9', color: 'var(--navy-light)',
                            borderRadius: 16, fontSize: '0.78rem', fontWeight: 600
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Register Button aligned to Bottom Right */}
                      {ev.registrationLink && (
                        <div style={{ marginLeft: 'auto' }}>
                          {ev.registrationClosed ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6,
                              padding: '8px 18px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700,
                              background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5'
                            }}>
                              <i className="fa-solid fa-lock" style={{ marginRight: 4 }}></i> {lang === 'en' ? 'Registration Closed' : 'दर्ता बन्द भयो'}
                            </span>
                          ) : (
                            <a
                              href={ev.registrationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '11px 24px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 700,
                                background: '#79213C',
                                color: '#ffffff', textDecoration: 'none',
                                boxShadow: '0 4px 14px rgba(121, 33, 60, 0.3)', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                letterSpacing: '0.02em'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#561427';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 22px rgba(121, 33, 60, 0.45)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#79213C';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(121, 33, 60, 0.3)';
                              }}
                            >
                              <span>{lang === 'en' ? 'Register Now' : 'दर्ता गर्नुहोस्'}</span>
                              <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.85rem' }}></i>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 16, 36, 0.94)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20, cursor: 'zoom-out'
          }}
        >
          <img
            src={lightboxImg}
            alt="Full size view"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}
          />
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'absolute', top: 24, right: 28, background: 'none',
              border: 'none', color: '#ffffff', fontSize: '2rem', cursor: 'pointer',
              opacity: 0.85, zIndex: 10
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Subscribe Modal */}
      {isSubscribeModalOpen && (
        <div
          onClick={() => setIsSubscribeModalOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(10, 16, 36, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff', borderRadius: 24, padding: '36px 32px',
              maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative', border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => setIsSubscribeModalOpen(false)}
              style={{
                position: 'absolute', top: 18, right: 20, background: '#f1f5f9',
                border: 'none', borderRadius: '50%', width: 32, height: 32,
                fontSize: '0.9rem', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ marginBottom: 12 }}>
                {isUnsubscribing ? (
                  <i className="fa-solid fa-bell-slash" style={{ fontSize: '2.5rem', color: '#ef4444' }}></i>
                ) : (
                  <i className="fa-solid fa-envelope-open-text" style={{ fontSize: '2.5rem', color: '#79213C' }}></i>
                )}
              </div>
              <h3 className="serif" style={{ fontSize: '1.5rem', color: 'var(--navy)', margin: '0 0 8px' }}>
                {isUnsubscribing
                  ? (lang === 'en' ? 'Unsubscribe from Events' : 'सूचनाहरू बन्द गर्नुहोस्')
                  : (lang === 'en' ? 'Subscribe to Upcoming Events' : 'आगामी कार्यक्रमहरूको सूचना पाउनुहोस्')}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                {isUnsubscribing
                  ? (lang === 'en' ? 'Enter your email address to stop receiving event notifications.' : 'सूचनाहरू रोक्न आफ्नो इमेल ठेगाना प्रविष्ट गर्नुहोस्।')
                  : (lang === 'en' ? 'Enter your email address to automatically receive notifications whenever a new event or program is announced.' : 'नयाँ कार्यक्रम वा सूचना प्रकाशित हुँदा आफ्नो इमेलमा तुरुन्त जानकारी प्राप्त गर्नुहोस्।')}
              </p>
            </div>

            {subMsg && (
              <div style={{ background: 'rgba(121, 33, 60, 0.08)', color: '#79213C', border: '1px solid rgba(121, 33, 60, 0.2)', padding: '12px 16px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600, marginBottom: 16, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{subMsg}</span>
              </div>
            )}

            {subErr && (
              <div style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5', padding: '12px 16px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600, marginBottom: 16, textAlign: 'center' }}>
                {subErr}
              </div>
            )}

            <form onSubmit={handleSubscribeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 6 }}>
                  {lang === 'en' ? 'Your Email Address' : 'आफ्नो इमेल ठेगाना'}
                </label>
                <input
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: '1.5px solid #cbd5e1', fontSize: '0.92rem', color: '#0f172a', outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#79213C'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>

              <button
                type="submit"
                disabled={subscribing}
                style={{
                  padding: '13px 24px', borderRadius: 12, border: 'none',
                  background: isUnsubscribing
                    ? '#ef4444'
                    : '#79213C',
                  color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', cursor: subscribing ? 'not-allowed' : 'pointer',
                  boxShadow: isUnsubscribing ? '0 4px 14px rgba(239, 68, 68, 0.35)' : '0 4px 14px rgba(121, 33, 60, 0.35)', transition: 'all 0.2s', marginTop: 6
                }}
              >
                {subscribing
                  ? (isUnsubscribing ? 'Unsubscribing...' : 'Subscribing...')
                  : (isUnsubscribing ? 'Unsubscribe' : (lang === 'en' ? 'Subscribe Now' : 'अहिले नै सदस्यता लिनुहोस्'))}
              </button>
            </form>

            <div style={{ textCenter: 'center', textAlign: 'center', marginTop: 18 }}>
              <button
                type="button"
                onClick={() => {
                  setSubMsg('');
                  setSubErr('');
                  setIsUnsubscribing(!isUnsubscribing);
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isUnsubscribing ? 'Want to subscribe instead?' : 'Already subscribed? Unsubscribe here'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </>
  );
}
