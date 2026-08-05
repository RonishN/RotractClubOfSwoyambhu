import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import EventCarousel from '../components/EventCarousel';
import logo from '../assets/images/logo.png';
import { getPublicEvents, getPublicContent, subscribeToEvents, unsubscribeToEvents } from '../api/client';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';

export default function EventsPage() {
  const { lang } = useLang();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // ALL, UPCOMING, COMPLETED

  // Subscribe Modal State
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subMsg, setSubMsg] = useState('');
  const [subErr, setSubErr] = useState('');
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);

  // Lightbox Modal state
  const [lightboxImg, setLightboxImg] = useState(null);

  // Sticky subscribe bar visibility
  const [showSticky, setShowSticky] = useState(false);

  // Scroll progress bar
  const [scrollProgress, setScrollProgress] = useState(0);

  // Proud moments slider
  const [proudIdx, setProudIdx] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const manualPauseUntil = useRef(0);

  const ref = useFadeIn(0.15, [loading, selectedCategory, searchTerm]);

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

    getPublicContent()
      .then((data) => {
        setHighlights(Array.isArray(data.websiteData?.highlights) ? data.websiteData.highlights : []);
        setAlbums(Array.isArray(data.websiteData?.albums) ? data.websiteData.albums : []);
      })
      .catch(() => setHighlights([]));
  }, [searchParams]);

  useEffect(() => {
    const onScroll = () => {
      setShowSticky(window.scrollY > 520);
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Reset slider position when highlights load
  useEffect(() => {
    setProudIdx(0);
  }, [highlights]);

  // Auto-rotate every 5s, paused while hovering or for 20s after manual nav
  useEffect(() => {
    if (highlights.length <= 1) return;
    const t = setInterval(() => {
      if (hoverPaused) return;
      if (Date.now() < manualPauseUntil.current) return;
      setProudIdx((p) => (p + 1) % highlights.length);
    }, 5000);
    return () => clearInterval(t);
  }, [highlights.length, hoverPaused]);

  const goProud = (i) => {
    setProudIdx(((i % highlights.length) + highlights.length) % highlights.length);
    manualPauseUntil.current = Date.now() + 20000;
  };

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

  const todayStr = new Date().toISOString().split('T')[0];

  const formatDay = (dateStr) => {
    if (!dateStr) return '01';
    const parts = dateStr.split('-');
    return parts[2] || '01';
  };

  const formatMonth = (dateStr) => {
    if (!dateStr) return 'JAN';
    const date = new Date(`${dateStr}T12:00:00`);
    return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  };

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'UPCOMING' && ev.eventDate < todayStr) return false;
    if (selectedCategory === 'COMPLETED' && ev.eventDate >= todayStr) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const titleMatch = ev.title?.toLowerCase().includes(q);
      const descMatch = ev.description?.toLowerCase().includes(q);
      const venueMatch = ev.venue?.toLowerCase().includes(q);
      if (!titleMatch && !descMatch && !venueMatch) return false;
    }

    return true;
  });

  // Next upcoming event spotlight
  const upcoming = events
    .filter((ev) => ev.eventDate >= todayStr)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  const spotlight = upcoming[0] || null;
  const daysToGo = spotlight
    ? Math.max(0, Math.ceil((new Date(spotlight.eventDate) - new Date(todayStr)) / 86400000))
    : null;

  const marqueeItems = events.slice(0, 10).map((e) => e.title).filter(Boolean);

  // Build a seamless marquee track: repeat titles cyclically until the strip
  // is always wider than the viewport, then duplicate once so the -50%
  // translate loop lands on an identical half (A-B-C = A-B-C ...).
  const marqueeTrack = (() => {
    if (marqueeItems.length === 0) return [];
    const set = [];
    const TARGET = 16;
    for (let i = 0; set.length < TARGET; i++) {
      set.push(marqueeItems[i % marqueeItems.length]);
    }
    return [...set, ...set];
  })();

  return (
    <>
      <Header />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <main ref={ref} className="events-page" style={{ minHeight: '90vh' }}>
        {/* ── HERO with integrated search ── */}
        <section className="events-hero">
          <div className="events-hero-inner">
            <span className="events-hero-kicker">
              {lang === 'en' ? 'Rotaract Club of Swoyambhu' : 'स्वयम्भू रोटर्‍याक्ट क्लब'}
            </span>
            <h1 className="events-hero-title">
              {lang === 'en' ? 'Events & Activities' : <span className="devanagari">कार्यक्रम तथा गतिविधिहरू</span>}
            </h1>
            <p className="events-hero-sub">
              {lang === 'en'
                ? 'Service, celebration and community — explore everything we have done and what is coming next.'
                : 'सेवा, उत्सव र समुदाय — हामीले गरेका र आउने हरेक कार्यक्रम यहाँ हेर्नुहोस्।'}
            </p>
          </div>
        </section>

        {/* ── Marquee ticker (between hero and featured event) ── */}
        {loading ? (
          <div className="marquee marquee-sk" aria-hidden="true">
            <div className="marquee-sk-track">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk brand" style={{ height: 12, width: 180, borderRadius: 999 }} />
              ))}
            </div>
          </div>
        ) : marqueeTrack.length > 0 && (
          <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
              {marqueeTrack.map((t, i) => (
                <span key={i} className="marquee-item">
                  <i className="fa-solid fa-bolt" /> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── SPOTLIGHT: next upcoming event ── */}
        {loading ? (
          <section className="spotlight spotlight-sk" aria-busy="true">
            <div className="spotlight-inner">
              <div className="spotlight-media">
                <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
              </div>
              <div className="spotlight-body">
                <div className="sk brand" style={{ height: 10, width: 130, borderRadius: 999, marginBottom: 18 }} />
                <div className="sk brand" style={{ height: 30, width: '78%', marginBottom: 16 }} />
                <div className="sk brand" style={{ height: 14, width: 190, borderRadius: 999, marginBottom: 16 }} />
                <div className="sk brand" style={{ height: 13, width: '92%', marginBottom: 8 }} />
                <div className="sk brand" style={{ height: 13, width: '70%', marginBottom: 26 }} />
                <div className="sk brand" style={{ height: 46, width: 180, borderRadius: 999 }} />
              </div>
            </div>
          </section>
        ) : spotlight && (
          <section className="spotlight">
            <div className="spotlight-inner">
              <div className="spotlight-media">
                {spotlight.pictures && spotlight.pictures.length > 0 ? (
                  <EventCarousel
                    pictures={spotlight.pictures}
                    title={spotlight.title}
                    onImageClick={(img) => setLightboxImg(img)}
                    height="100%"
                  />
                ) : (
                  <div className="spotlight-empty"><i className="fa-solid fa-calendar-star" /></div>
                )}
                <span className="spotlight-badge">
                  <i className="fa-solid fa-fire" />
                  {lang === 'en' ? 'Next Up' : 'अर्को कार्यक्रम'}
                </span>
              </div>

              <div className="spotlight-body">
                <span className="spotlight-kicker">
                  {lang === 'en' ? 'Featured Event' : 'विशेष कार्यक्रम'}
                </span>
                <h2>{spotlight.title}</h2>

                <div className="spotlight-date">
                  <i className="fa-regular fa-calendar" />
                  <span>{spotlight.eventDate}{spotlight.eventTime ? ` @ ${spotlight.eventTime}` : ''}</span>
                </div>
                {spotlight.venue && (
                  <span className="spotlight-venue"><i className="fa-solid fa-location-dot" /> {spotlight.venue}</span>
                )}

                {daysToGo !== null && (
                  <span className="spotlight-countdown">
                    <i className="fa-regular fa-hourglass-half" />
                    {lang === 'en'
                      ? (daysToGo === 0 ? 'Happening Today!' : `${daysToGo} days to go`)
                      : (daysToGo === 0 ? 'आजै कार्यक्रम छ!' : `${daysToGo} दिन बाँकी`)}
                  </span>
                )}

                {spotlight.description && <p>{spotlight.description}</p>}

                {spotlight.registrationLink && (
                  spotlight.registrationClosed ? (
                    <span className="register-closed" style={{ marginTop: 22 }}>
                      <i className="fa-solid fa-lock" /> {lang === 'en' ? 'Registration Closed' : 'दर्ता बन्द भयो'}
                    </span>
                  ) : (
                    <a href={spotlight.registrationLink} target="_blank" rel="noopener noreferrer" className="spotlight-cta">
                      <span>{lang === 'en' ? 'Register Now' : 'दर्ता गर्नुहोस्'}</span>
                      <i className="fa-solid fa-arrow-right" />
                    </a>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Marquee ticker (between featured event and proud moments) ── */}
        {loading ? (
          <div className="marquee marquee-sk marquee-invert" aria-hidden="true">
            <div className="marquee-sk-track">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk brand" style={{ height: 12, width: 180, borderRadius: 999 }} />
              ))}
            </div>
          </div>
        ) : marqueeTrack.length > 0 && (
          <div className="marquee marquee-invert" aria-hidden="true">
            <div className="marquee-track">
              {marqueeTrack.map((t, i) => (
                <span key={i} className="marquee-item">
                  <i className="fa-solid fa-trophy" /> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── PROUD MOMENTS: light cinematic slider ── */}
        {loading ? (
          <section className="proud proud-sk" aria-busy="true">
            <div className="sk brand" style={{ height: '75vh', minHeight: 340, width: '100%' }} />
          </section>
        ) : highlights.length > 0 && (
          <section className="proud">
              {highlights.length > 1 ? (
                <div
                  className="proud-slider"
                  onMouseEnter={() => setHoverPaused(true)}
                  onMouseLeave={() => setHoverPaused(false)}
                >
                  <div className="proud-viewport">
                    <div className="proud-head">
                      <span className="proud-kicker">
                        <i className="fa-solid fa-trophy" />
                        {lang === 'en' ? 'Milestones & Accolades' : 'उपलब्धि र सम्मान'}
                      </span>
                      <h2 className="proud-title">
                        {lang === 'en' ? 'Proud Moments' : <span className="devanagari">गौरवका क्षणहरू</span>}
                      </h2>
                    </div>
                    {highlights.map((h, idx) => (
                      <article
                        key={h.id}
                        className={`proud-slide ${idx === proudIdx ? 'active' : ''}`}
                        aria-hidden={idx !== proudIdx}
                      >
                        {h.imageUrl ? (
                          <img src={h.imageUrl} alt={h.title} loading="lazy" />
                        ) : (
                          <div className="proud-slide-empty"><i className="fa-solid fa-medal" /></div>
                        )}
                        <div className="proud-slide-shade" />
                        <div className="proud-slide-caption">
                          {h.badge && (
                            <span className="proud-badge">
                              <i className="fa-solid fa-star" /> {h.badge}
                            </span>
                          )}
                          <h3>{h.title}</h3>
                          {h.titleNe && <div className="devanagari">{h.titleNe}</div>}
                          {h.description && <p>{h.description}</p>}
                        </div>
                      </article>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="proud-nav prev"
                    aria-label="Previous proud moment"
                    onClick={() => goProud(proudIdx - 1)}
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>
                  <button
                    type="button"
                    className="proud-nav next"
                    aria-label="Next proud moment"
                    onClick={() => goProud(proudIdx + 1)}
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>

                  <div className="proud-dots">
                    {highlights.map((h, i) => (
                      <button
                        key={h.id}
                        type="button"
                        aria-label={`Go to proud moment ${i + 1}`}
                        className={`proud-dot ${i === proudIdx ? 'active' : ''}`}
                        onClick={() => goProud(i)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <article className="proud-slide proud-single">
                  <div className="proud-head">
                    <span className="proud-kicker">
                      <i className="fa-solid fa-trophy" />
                      {lang === 'en' ? 'Milestones & Accolades' : 'उपलब्धि र सम्मान'}
                    </span>
                    <h2 className="proud-title">
                      {lang === 'en' ? 'Proud Moments' : <span className="devanagari">गौरवका क्षणहरू</span>}
                    </h2>
                  </div>
                  {highlights[0].imageUrl ? (
                    <img src={highlights[0].imageUrl} alt={highlights[0].title} loading="lazy" />
                  ) : (
                    <div className="proud-slide-empty"><i className="fa-solid fa-medal" /></div>
                  )}
                  <div className="proud-slide-shade" />
                  <div className="proud-slide-caption">
                    {highlights[0].badge && (
                      <span className="proud-badge">
                        <i className="fa-solid fa-star" /> {highlights[0].badge}
                      </span>
                    )}
                    <h3>{highlights[0].title}</h3>
                    {highlights[0].titleNe && <div className="devanagari">{highlights[0].titleNe}</div>}
                    {highlights[0].description && <p>{highlights[0].description}</p>}
                  </div>
                </article>
              )}
          </section>
        )}

        {/* ── ALL EVENTS ── */}
        <div className="events-section-head">
          <span className="events-section-kicker">
            {lang === 'en' ? 'The Full Lineup' : 'पूरा कार्यक्रम सूची'}
          </span>
          <h2 className="events-section-title">
            {lang === 'en' ? 'All Events' : <span className="devanagari">सबै कार्यक्रमहरू</span>}
          </h2>
          {!loading && !error && (
            <span className="events-section-count">
              {lang === 'en'
                ? `${filteredEvents.length} event${filteredEvents.length === 1 ? '' : 's'} found`
                : `${filteredEvents.length} कार्यक्रमहरू फेला परे`}
            </span>
          )}
        </div>

        {/* ── Filter toolbar (Show pills + search) ── */}
        {!loading && (
          <div className="events-toolbar">
            <div className="events-toolbar-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search events...' : 'कार्यक्रम खोज्नुहोस्...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="events-toolbar-group">
              <span className="toolbar-label">{lang === 'en' ? 'Show' : 'देखाउनुहोस्'}</span>
              <div className="toolbar-pills">
                {[
                  { id: 'ALL', en: 'All', ne: 'सबै' },
                  { id: 'UPCOMING', en: 'Upcoming', ne: 'आगामी' },
                  { id: 'COMPLETED', en: 'Completed', ne: 'सम्पन्न' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`pill ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {lang === 'en' ? cat.en : cat.ne}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="events-list" aria-busy="true" aria-label="Loading events">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="event-row" style={{ animation: 'none' }}>
                <div className="event-row-media">
                  <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                </div>
                <div className="event-row-body">
                  <div className="sk brand" style={{ height: 12, width: 190, marginBottom: 18, borderRadius: 999 }} />
                  <div className="sk brand" style={{ height: 26, width: '48%', marginBottom: 14 }} />
                  <div className="sk brand" style={{ height: 13, width: '94%', marginBottom: 8 }} />
                  <div className="sk brand" style={{ height: 13, width: '58%', marginBottom: 22 }} />
                  <div className="sk brand" style={{ height: 40, width: 160, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <i className="fa-regular fa-calendar-xmark" />
            <h3>{lang === 'en' ? 'No events found' : 'कुनै कार्यक्रम फेला परेन'}</h3>
            <p>{lang === 'en' ? 'Try adjusting your search query or filter.' : 'आफ्नो खोजी वा फिल्टर समायोजन गर्नुहोस्।'}</p>
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.map((ev, idx) => {
              const isPast = ev.eventDate < todayStr;
              const linkedAlbum = albums.find(a => a.eventId === ev.id);
              return (
                <article key={ev.id} className="event-row" style={{ animationDelay: `${(idx % 2) * 80}ms` }}>
                  {/* Media */}
                  <div className="event-row-media">
                    {ev.pictures && ev.pictures.length > 0 ? (
                      <EventCarousel pictures={ev.pictures} title={ev.title} onImageClick={(img) => setLightboxImg(img)} height="100%" />
                    ) : (
                      <div className="event-row-empty"><i className="fa-solid fa-calendar-days" /></div>
                    )}
                    <div className={`event-date-badge ${isPast ? 'past' : ''}`}>
                      <span className="event-date-badge-day">{formatDay(ev.eventDate)}</span>
                      <span className="event-date-badge-month">{formatMonth(ev.eventDate)}</span>
                    </div>
                    <span className={`event-status ${isPast ? 'past' : ''}`}>
                      {isPast ? (lang === 'en' ? 'Completed' : 'सम्पन्न') : (lang === 'en' ? 'Upcoming' : 'आगामी')}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="event-row-body">
                    <div className="event-row-meta">
                      <span><i className="fa-regular fa-calendar" /> {ev.eventDate}{ev.eventTime ? ` • ${ev.eventTime}` : ''}</span>
                      {ev.venue && <span><i className="fa-solid fa-location-dot" /> {ev.venue}</span>}
                    </div>

                    <h3 className="event-row-title">{ev.title}</h3>

                    {ev.description && <p className="event-row-desc">{ev.description}</p>}

                    {ev.collaborators && ev.collaborators.length > 0 ? (
                      <div className="collab-block" style={{ marginTop: 4 }}>
                        <div className="collab-label">
                          <i className="fa-solid fa-handshake" /> {lang === 'en' ? 'In Collaboration With' : 'सहकार्यकर्ता संस्थाहरू'}
                        </div>
                        <div className="collab-chips">
                          {ev.collaborators.map((c, cIdx) => (
                            <div key={cIdx} className="chip">
                              {c.logoUrl ? (
                                <img src={c.logoUrl} alt={c.name} />
                              ) : (
                                <i className="fa-solid fa-building" style={{ fontSize: '0.72rem' }} />
                              )}
                              <span>{c.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="chip" style={{ margin: '6px 0 0' }}>
                        <img src={logo} alt="Swoyambhu Logo" />
                        <span>{lang === 'en' ? 'Rotaract Club of Swoyambhu' : 'स्वयम्भू रोटर्‍याक्ट क्लब'}</span>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="event-row-foot">
                      {linkedAlbum ? (
                        <a href={`/gallery/album/${linkedAlbum.id}`} className="photos-link">
                          <i className="fa-solid fa-images" />
                          {lang === 'en' ? 'View Photos' : 'तस्बिर हेर्नुहोस्'}
                        </a>
                      ) : (
                        <span className="photos-link disabled"><i className="fa-solid fa-link" /></span>
                      )}

                      {ev.registrationLink && (
                        ev.registrationClosed ? (
                          <span className="register-closed">
                            <i className="fa-solid fa-lock" /> {lang === 'en' ? 'Registration Closed' : 'दर्ता बन्द भयो'}
                          </span>
                        ) : (
                          <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer" className="register-btn">
                            <span>{lang === 'en' ? 'Register Now' : 'दर्ता गर्नुहोस्'}</span>
                            <i className="fa-solid fa-arrow-right" />
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Sticky subscribe bar */}
      <button
        type="button"
        className={`sticky-subscribe ${showSticky ? 'visible' : ''}`}
        onClick={() => {
          setSubMsg('');
          setSubErr('');
          setIsUnsubscribing(false);
          setIsSubscribeModalOpen(true);
        }}
      >
        <i className="fa-solid fa-bell" />
        {lang === 'en' ? 'Get Event Updates' : 'सूचना पाउनुहोस्'}
      </button>

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="subscribe-overlay"
          style={{ cursor: 'zoom-out', zIndex: 9999 }}
        >
          <img
            src={lightboxImg}
            alt="Full size view"
            style={{
              maxWidth: '90vw', maxHeight: '90vh',
              borderRadius: 16, boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
            }}
          />
          <button
            type="button"
            onClick={() => setLightboxImg(null)}
            className="modal-close"
            style={{ position: 'absolute', top: 24, right: 28, width: 38, height: 38, fontSize: '1rem' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* Subscribe Modal */}
      {isSubscribeModalOpen && (
        <div
          onClick={() => setIsSubscribeModalOpen(false)}
          className="subscribe-overlay"
        >
          <div onClick={(e) => e.stopPropagation()} className="subscribe-modal">
            <button
              type="button"
              onClick={() => setIsSubscribeModalOpen(false)}
              className="modal-close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className="modal-icon">
              {isUnsubscribing ? (
                <i className="fa-solid fa-bell-slash"></i>
              ) : (
                <i className="fa-solid fa-envelope-open-text"></i>
              )}
            </div>

            <h3>
              {isUnsubscribing
                ? (lang === 'en' ? 'Unsubscribe from Events' : 'सूचनाहरू बन्द गर्नुहोस्')
                : (lang === 'en' ? 'Subscribe to Upcoming Events' : 'आगामी कार्यक्रमहरूको सूचना पाउनुहोस्')}
            </h3>
            <p style={{ marginBottom: 22 }}>
              {isUnsubscribing
                ? (lang === 'en' ? 'Enter your email address to stop receiving event notifications.' : 'सूचनाहरू रोक्न आफ्नो इमेल ठेगाना प्रविष्ट गर्नुहोस्।')
                : (lang === 'en' ? 'Enter your email address to automatically receive notifications whenever a new event or program is announced.' : 'नयाँ कार्यक्रम वा सूचना प्रकाशित हुँदा आफ्नो इमेलमा तुरुन्त जानकारी प्राप्त गर्नुहोस्।')}
            </p>

            {subMsg && (
              <div className="alert success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>{subMsg}</span>
              </div>
            )}

            {subErr && <div className="alert error">{subErr}</div>}

            <form onSubmit={handleSubscribeSubmit}>
              <div>
                <label>{lang === 'en' ? 'Your Email Address' : 'आफ्नो इमेल ठेगाना'}</label>
                <input
                  type="email"
                  placeholder="e.g. yourname@example.com"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={subscribing}
                className="submit-btn"
                style={{ cursor: subscribing ? 'not-allowed' : 'pointer', opacity: subscribing ? 0.7 : 1 }}
              >
                {subscribing
                  ? (isUnsubscribing ? 'Unsubscribing...' : 'Subscribing...')
                  : (isUnsubscribing ? 'Unsubscribe' : (lang === 'en' ? 'Subscribe Now' : 'अहिले नै सदस्यता लिनुहोस्'))}
              </button>
            </form>

            <button
              type="button"
              className="modal-switch"
              onClick={() => {
                setSubMsg('');
                setSubErr('');
                setIsUnsubscribing(!isUnsubscribing);
              }}
            >
              {isUnsubscribing ? 'Want to subscribe instead?' : 'Already subscribed? Unsubscribe here'}
            </button>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </>
  );
}
