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
        // Filter upcoming events (eventDate >= todayStr) or fallback to all events if none upcoming, sorted by date
        const upcoming = (data || [])
          .filter((e) => e.eventDate >= todayStr)
          .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
          .slice(0, 3);
        
        // If less than 3 upcoming, pad with latest completed events
        if (upcoming.length < 3) {
          const remainingCount = 3 - upcoming.length;
          const remainingIds = new Set(upcoming.map((u) => u.id));
          const padding = (data || [])
            .filter((e) => !remainingIds.has(e.id))
            .sort((a, b) => b.eventDate.localeCompare(a.eventDate))
            .slice(0, remainingCount);
          setEvents([...upcoming, ...padding]);
        } else {
          setEvents(upcoming);
        }
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
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--navy)' }}>
            <span className="admin-spinner" style={{ borderTopColor: 'var(--saffron)' }} />
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
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
                      style={{ fontSize: '0.82rem', color: '#79213C', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
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
            background: '#79213C',
            color: '#ffffff',
            padding: '12px 28px',
            borderRadius: '25px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(121, 33, 60, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#561427';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(121, 33, 60, 0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#79213C';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(121, 33, 60, 0.3)';
          }}
        >
          <span>{lang === 'en' ? 'View All Events' : 'सबै कार्यक्रमहरू हेर्नुहोस्'}</span>
          <i className="fa-solid fa-arrow-right" style={{ fontSize: '0.9rem' }}></i>
        </Link>
      </div>

      <SandyDivider bottomColor="#FCFBF7" />
    </section>
  );
}
