import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function FeaturedEventModal({ event }) {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [animatingOut, setAnimatingOut] = useState(false);

  useEffect(() => {
    if (!event || !event.id) return;
    // Never show on admin routes
    if (location.pathname.startsWith('/admin')) return;

    const dismissKey = `dismissed_featured_event_${event.id}`;
    if (localStorage.getItem(dismissKey)) return;

    // Small delay so page loads smoothly first
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, [event, location.pathname]);

  if (!event || !visible) return null;

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(() => setVisible(false), 320);
  };

  const handleDontShowAgain = () => {
    localStorage.setItem(`dismissed_featured_event_${event.id}`, '1');
    handleClose();
  };

  const coverImg = Array.isArray(event.pictures) && event.pictures.length > 0
    ? event.pictures[0]
    : null;

  const isUpcoming = event.eventDate >= new Date().toISOString().split('T')[0];

  return (
    <>
      <style>{`
        @keyframes fem-backdrop-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fem-card-pop { 
          0% { opacity: 0; transform: scale(0.92) translateY(20px); } 
          100% { opacity: 1; transform: scale(1) translateY(0); } 
        }
        @keyframes fem-card-pop-out { 
          from { opacity: 1; transform: scale(1) translateY(0); } 
          to { opacity: 0; transform: scale(0.95) translateY(10px); } 
        }
      `}</style>

      {/* Glassmorphic Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 10500,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          animation: animatingOut ? 'fem-backdrop-fade 0.3s ease reverse' : 'fem-backdrop-fade 0.3s ease forwards',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}
      >
        {/* Modern Modal Card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 480,
            background: '#ffffff',
            borderRadius: 24,
            overflow: 'hidden',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.8)',
            animation: animatingOut ? 'fem-card-pop-out 0.3s cubic-bezier(0.4,0,0.2,1) forwards' : 'fem-card-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Close button floating top-right */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute', top: 14, right: 14, zIndex: 20,
              background: 'rgba(255, 255, 255, 0.85)', border: 'none',
              color: '#334155', borderRadius: '50%',
              width: 34, height: 34, fontSize: '1.1rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.background = '#ffffff'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'; }}
          >✕</button>

          {/* Cover image preserving 16:9 aspect ratio */}
          {coverImg && (
            <div style={{ width: '100%', aspectRatio: '16 / 9', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
              <img
                src={coverImg}
                alt={event.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Card Content Area */}
          <div style={{ padding: '24px 28px 20px', background: '#ffffff' }}>
            
            {/* Event Meta Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {event.eventDate && (
                <span style={{
                  fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary, #79213C)',
                  background: 'rgba(121, 33, 60, 0.08)', padding: '5px 12px',
                  borderRadius: 20, border: '1px solid rgba(121, 33, 60, 0.12)',
                  display: 'inline-flex', alignItems: 'center', gap: 5
                }}>
                  <i className="fa-regular fa-calendar" /> {event.eventDate}{event.eventTime ? ` • ${event.eventTime}` : ''}
                </span>
              )}
              {isUpcoming && (
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, color: '#166534',
                  background: '#dcfce7', padding: '5px 10px', borderRadius: 20
                }}>
                  Upcoming
                </span>
              )}
            </div>

            {/* Title */}
            <h2 style={{
              margin: '0 0 10px', fontSize: '1.35rem', fontWeight: 800,
              color: '#0f172a', lineHeight: 1.3, fontFamily: 'var(--font-sans-bold, sans-serif)'
            }}>
              {event.title}
            </h2>

            {/* Description */}
            <p style={{
              margin: '0 0 16px', fontSize: '0.9rem', color: '#475569',
              lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {event.description}
            </p>

            {/* Attendees info if exists */}
            {event.attendees && (
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-users" style={{ color: 'var(--primary, #79213C)' }} /> <strong>Attendees:</strong> {event.attendees}
              </div>
            )}

            {/* Call to Action Button */}
            <div>
              {event.registrationLink && !event.registrationClosed ? (
                <a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%', textAlign: 'center',
                    background: '#79213C',
                    color: '#ffffff', textDecoration: 'none',
                    padding: '12px 20px', borderRadius: 14,
                    fontWeight: 700, fontSize: '0.92rem',
                    boxShadow: '0 6px 20px rgba(121, 33, 60, 0.3)',
                    transition: 'all 0.2s ease',
                    display: 'block', boxSizing: 'border-box'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(121, 33, 60, 0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 33, 60, 0.3)'; }}
                >
                  Register Now →
                </a>
              ) : (
                <button
                  onClick={handleClose}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, var(--primary, #79213C), #561427)',
                    color: '#ffffff', border: 'none', cursor: 'pointer',
                    padding: '12px 20px', borderRadius: 14,
                    fontWeight: 700, fontSize: '0.92rem',
                    boxShadow: '0 6px 20px rgba(121, 33, 60, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(121, 33, 60, 0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(121, 33, 60, 0.3)'; }}
                >
                  View Event Details
                </button>
              )}
            </div>

            {/* Don't show again anchor */}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <button
                onClick={handleDontShowAgain}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500,
                  textDecoration: 'underline', textUnderlineOffset: '3px',
                  transition: 'color 0.2s',
                  fontFamily: 'var(--font-sans, sans-serif)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                Don't show this again
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
