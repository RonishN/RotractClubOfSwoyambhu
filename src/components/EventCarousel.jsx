import React, { useState } from 'react';

export default function EventCarousel({ pictures = [], title = '', onImageClick, height = 260 }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pictures || pictures.length === 0) {
    return (
      <div style={{
        height: height || '100%', minHeight: 220, background: '#f1f5f9', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem'
      }}>
        No images available
      </div>
    );
  }

  const prevSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? pictures.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === pictures.length - 1 ? 0 : prev + 1));
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: height || '100%', minHeight: 220, overflow: 'hidden', background: '#0f172a' }}>
      <img
        src={pictures[currentIndex]}
        alt={`${title} - Photo ${currentIndex + 1}`}
        onClick={() => onImageClick && onImageClick(pictures[currentIndex], currentIndex)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover', cursor: onImageClick ? 'pointer' : 'default',
          transition: 'all 0.3s ease'
        }}
      />

      {pictures.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous photo"
            style={{
              position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.2s', zIndex: 10
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next photo"
            style={{
              position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
              width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.7)',
              color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.2s', zIndex: 10
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          {/* Dots / Badge */}
          <div style={{
            position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6, background: 'rgba(0,0,0,0.65)', padding: '4px 10px', borderRadius: 20,
            backdropFilter: 'blur(4px)', zIndex: 10
          }}>
            {pictures.map((_, idx) => (
              <span
                key={idx}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: idx === currentIndex ? '#FF8A00' : 'rgba(255,255,255,0.5)',
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>

          <div style={{
            position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', color: '#ffffff',
            fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, backdropFilter: 'blur(4px)', zIndex: 10
          }}>
            {currentIndex + 1} / {pictures.length}
          </div>
        </>
      )}
    </div>
  );
}
