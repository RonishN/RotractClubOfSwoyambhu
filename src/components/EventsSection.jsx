import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import SandyDivider from './SandyDivider';
import { getPublicEvents } from '../api/client';

export default function EventsSection() {
  const { lang } = useLang();
  const ref = useFadeIn();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicEvents()
      .then((data) => {
        const todayStr = new Date().toISOString().split('T')[0];
        // Only upcoming events (eventDate >= todayStr), sorted by date
        const upcoming = (data || [])
          .filter((e) => e.eventDate >= todayStr)
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
          .slice(0, 3);
        setEvents(upcoming);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const formatMonth = (dateStr) => {
    if (!dateStr) return 'JAN';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  };

  const formatDay = (dateStr) => {
    if (!dateStr) return '01';
    const parts = dateStr.split('-');
    return parts[2] || '01';
  };

  return (
    <section id="events" className="lokta-texture" ref={ref}>
      <div className="section-header fade-in">
        <h2 className="section-title">
          {lang === 'en' ? 'Upcoming Events' : <span className="devanagari">सूचना तथा कार्यक्रम</span>}
        </h2>
      </div>

      {/* Magazine-style event cards */}
      <div className="events-magazine fade-in delay-1" style={{ opacity: 1, transform: 'none' }}>
        {loading ? (
          <div aria-busy="true" aria-label="Loading events">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="event-magazine-card" style={{ opacity: 1, animation: 'none' }}>
                <div className="event-card-accent" />
                <div className="event-card-date-badge">
                  <div className="sk" style={{ height: 22, width: 40, margin: '0 auto 6px' }} />
                  <div className="sk" style={{ height: 11, width: 34, margin: '0 auto' }} />
                </div>
                <div className="event-card-body">
                  <div className="sk" style={{ height: 18, width: '62%', marginBottom: 12 }} />
                  <div className="sk" style={{ height: 13, width: '92%', marginBottom: 8 }} />
                  <div className="sk" style={{ height: 13, width: '48%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#8A6A52', padding: '2rem 0' }}>
            {lang === 'en' ? 'No events scheduled.' : 'कुनै कार्यक्रमहरू तय गरिएको छैन।'}
          </div>
        ) : (
          events.map((ev) => (
            <div key={ev.id} className="event-magazine-card">
              {/* Colored left accent bar */}
              <div className="event-card-accent" />

              {/* Date badge */}
              <div className="event-card-date-badge">
                <div className="event-card-day">{formatDay(ev.eventDate)}</div>
                <div className="event-card-month">{formatMonth(ev.eventDate)}</div>
              </div>

              {/* Event details */}
              <div className="event-card-body">
                <h4 className="event-card-title">{ev.title}</h4>
                {ev.description && <p className="event-card-desc">{ev.description}</p>}
                {ev.registrationLink && !ev.registrationClosed && (
                  <div style={{ marginTop: 10 }}>
                    <a
                      href={ev.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.82rem', color: '#B8532A', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>Register Now</span>
                      <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.75rem' }}></i>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View All Events Button Redirect */}
      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
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

      <SandyDivider bottomColor="#F5ECDA" />
    </section>
  );
}
