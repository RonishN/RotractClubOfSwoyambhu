import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import WaveDivider from './WaveDivider';
import { getPublicEvents } from '../api/client';

function EventsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading events" className="events-skeleton">
      <section className="spotlight spotlight-sk">
        <div className="spotlight-inner">
          <div className="spotlight-media">
            <div className="sk brand" style={{ position: 'absolute', inset: 0 }} />
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
      {[0, 1, 2].map((i) => (
        <div key={i} className="events-list-row">
          <div className="sk" style={{ height: 54, width: 64, borderRadius: 12 }} />
          <div>
            <div className="sk" style={{ height: 16, width: '52%', borderRadius: 6, marginBottom: 8 }} />
            <div className="sk" style={{ height: 13, width: '84%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventsSection() {
  const { lang } = useLang();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  // Re-run the fade observer when loading flips so the spotlight/list that
  // render AFTER the async fetch get observed (otherwise they stay opacity:0
  // and leave a big blank gap between the header and the CTA).
  const ref = useFadeIn(0.15, [loading]);

  useEffect(() => {
    getPublicEvents()
      .then((data) => {
        const todayStr = new Date().toISOString().split('T')[0];
        // Only upcoming events (eventDate >= todayStr), sorted by date
        const upcoming = (data || [])
          .filter((e) => e.eventDate >= todayStr)
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
          .slice(0, 4);
        setEvents(upcoming);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Prefer the admin-starred priority event; fall back to the soonest upcoming.
  const featured = events.find(ev => ev.isPriority) || events[0];
  const list = events.filter(ev => ev.id !== featured.id);

  return (
    <section id="events" className="lokta-texture home-events" ref={ref}>
      <div className="section-header numbered-head fade-in">
        <span className="numbered-num">05</span>
        <span className="numbered-kicker">
          {lang === 'en' ? 'Mark Your Calendar' : 'मिति टिप्नुहोस्'}
        </span>
        <h2 className="section-title">
          {lang === 'en' ? 'Upcoming Events' : <span className="devanagari">सूचना तथा कार्यक्रम</span>}
        </h2>
      </div>

      {loading ? (
        <EventsSkeleton />
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8A6A52', padding: '2rem 0' }}>
          {lang === 'en' ? 'No events scheduled.' : 'कुनै कार्यक्रमहरू तय गरिएको छैन।'}
        </div>
      ) : (
        <>
          {/* Featured event — full-width spotlight band (matches /events) */}
          <article className="spotlight fade-in delay-1">
            <div className="spotlight-inner">
              <div className="spotlight-media">
                {featured.pictures && featured.pictures.length > 0 ? (
                  <img src={featured.pictures[0]} alt={featured.title} />
                ) : (
                  <div className="spotlight-empty"><i className="fa-solid fa-calendar-star" /></div>
                )}
                <span className="spotlight-badge">
                  <i className="fa-solid fa-star" />
                  {lang === 'en' ? 'Next Up' : 'अर्को कार्यक्रम'}
                </span>
              </div>

              <div className="spotlight-body">
                <span className="spotlight-kicker">
                  {lang === 'en' ? 'Featured Event' : 'विशेष कार्यक्रम'}
                </span>
                <h2>{featured.title}</h2>

                <span className="spotlight-date">
                  <i className="fa-regular fa-calendar" />
                  {formatDate(featured.eventDate)}{featured.eventTime ? ` @ ${featured.eventTime}` : ''}
                </span>
                {featured.venue && (
                  <span className="spotlight-venue">
                    <i className="fa-solid fa-location-dot" /> {featured.venue}
                  </span>
                )}

                {featured.description && <p>{featured.description}</p>}

                {featured.registrationLink && (
                  featured.registrationClosed ? (
                    <span className="register-closed" style={{ marginTop: 22 }}>
                      <i className="fa-solid fa-lock" /> {lang === 'en' ? 'Registration Closed' : 'दर्ता बन्द भयो'}
                    </span>
                  ) : (
                    <a href={featured.registrationLink} target="_blank" rel="noopener noreferrer" className="spotlight-cta">
                      <span>{lang === 'en' ? 'Register Now' : 'दर्ता गर्नुहोस्'}</span>
                      <i className="fa-solid fa-arrow-right" />
                    </a>
                  )
                )}
              </div>
            </div>
          </article>

          <div className="home-events-inner">
            {/* Upcoming list */}
            {list.length > 0 && (
              <ul className="events-list fade-in delay-2">
                {list.map((ev) => (
                  <li key={ev.id} className="events-list-row">
                    <div className="events-list-date">
                      <span className="eld-day">{ev.eventDate ? ev.eventDate.split('-')[2] : ''}</span>
                      <span className="eld-month">{ev.eventDate ? new Date(ev.eventDate).toLocaleString('en-US', { month: 'short' }).toUpperCase() : ''}</span>
                    </div>
                    <div className="events-list-info">
                      <h4>{ev.title}</h4>
                      {ev.description && <p>{ev.description}</p>}
                    </div>

                    <div className="events-list-action">
                      {ev.registrationLink && !ev.registrationClosed && (
                        <a href={ev.registrationLink} target="_blank" rel="noopener noreferrer">
                          {lang === 'en' ? 'Register' : 'दर्ता'}
                          <i className="fa-solid fa-arrow-right"></i>
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
      {/* View All Events Button */}
      <div style={{ textAlign: 'center', marginTop: '2.8rem', marginBottom: '1rem' }}>
        <Link
          to="/events"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #F28C1F, #E8B43A)',
            color: '#3D0C1B',
            padding: '12px 28px',
            borderRadius: '25px',
            fontWeight: 800,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 8px 22px rgba(61, 12, 27, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #D9750F, #F28C1F)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(61, 12, 27, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #F28C1F, #E8B43A)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 22px rgba(61, 12, 27, 0.25)';
          }}
        >
          <span>{lang === 'en' ? 'View All Events' : 'सबै कार्यक्रमहरू हेर्नुहोस्'}</span>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.9rem' }}></i>
        </Link>
      </div>

      <WaveDivider fill="#7A1F34" backFill="#9E2C46" height={72} />
    </section>
  );
}
