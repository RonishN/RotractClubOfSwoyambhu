import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../context/LanguageContext';

export default function GalleryLightbox({
  images = [],
  albumTitle = '',
  currentIndex = 0,
  isOpen = false,
  onClose,
  onNavigate,
}) {
  const { lang } = useLang();
  const [index, setIndex] = useState(currentIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const containerRef = useRef(null);
  const thumbnailStripRef = useRef(null);
  const indexRef = useRef(index);
  indexRef.current = index;

  // Sync index when currentIndex prop changes
  useEffect(() => {
    if (isOpen) {
      setIndex(currentIndex);
      setZoomLevel(1);
    }
  }, [currentIndex, isOpen]);

  const total = images.length;
  const currentImage = images[index] || null;
  const currentCaption = lang === 'en'
    ? (currentImage?.captionEn || currentImage?.captionNe || '')
    : (currentImage?.captionNe || currentImage?.captionEn || '');

  // Autoplay slideshow
  useEffect(() => {
    if (!isOpen || !isPlaying || total <= 1) return;
    const id = setInterval(() => {
      const nextIdx = (indexRef.current + 1) % total;
      setZoomLevel(1);
      setIndex(nextIdx);
      onNavigate?.(nextIdx);
    }, 3500);
    return () => clearInterval(id);
  }, [isOpen, isPlaying, total, onNavigate]);

  // Stop playback when the lightbox closes
  useEffect(() => {
    if (!isOpen) setIsPlaying(false);
  }, [isOpen]);

  const goToPrev = useCallback(() => {
    if (total <= 1) return;
    setZoomLevel(1);
    const nextIdx = (index - 1 + total) % total;
    setIndex(nextIdx);
    onNavigate?.(nextIdx);
  }, [index, total, onNavigate]);

  const goToNext = useCallback(() => {
    if (total <= 1) return;
    setZoomLevel(1);
    const nextIdx = (index + 1) % total;
    setIndex(nextIdx);
    onNavigate?.(nextIdx);
  }, [index, total, onNavigate]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(3, +(z + 0.35).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, +(z - 0.35).toFixed(2)));
  const handleResetZoom = () => setZoomLevel(1);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (!currentImage?.imgUrl) return;
    try {
      const response = await fetch(currentImage.imgUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `rotaract_swoyambhu_gallery_${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentImage.imgUrl, '_blank');
    }
  };

  const handleCopyLink = (e) => {
    e.stopPropagation();
    if (!currentImage?.imgUrl) return;
    navigator.clipboard.writeText(currentImage.imgUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToPrev, goToNext, onClose]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.children[index];
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [index]);

  // Touch swipe handling
  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      goToNext(); // Swiped left -> next
    } else if (distance < -50) {
      goToPrev(); // Swiped right -> prev
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(38, 9, 20, 0.97)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
        overflow: 'hidden',
      }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 24px',
          background: 'linear-gradient(to bottom, rgba(38, 9, 20, 0.85) 0%, transparent 100%)',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: 12,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Album + caption context */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div
              style={{
                background: 'rgba(158, 31, 66, 0.55)',
                border: '1px solid rgba(232, 180, 58, 0.35)',
                color: '#FCFBF7',
                borderRadius: 30,
                padding: '6px 14px',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <i className="fa-solid fa-image" style={{ color: '#E8B43A', fontSize: '0.85rem' }} />
              <span>{index + 1} / {total}</span>
            </div>
            {albumTitle && (
              <span style={{ color: '#E8B43A', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.02em' }}>
                <i className="fa-solid fa-folder" style={{ marginRight: 6, opacity: 0.8 }} />
                {albumTitle}
              </span>
            )}
          </div>
          {currentCaption && (
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.45, maxWidth: '70vw' }}>
              {currentCaption}
            </div>
          )}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', display: 'none' }} className="desktop-only">
            (Use Arrow Keys <i className="fa-solid fa-arrow-left" /> <i className="fa-solid fa-arrow-right" /> or swipe)
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Slideshow toggle */}
          <button
            type="button"
            className={`gallery-slideshow-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(p => !p)}
            title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
            style={{
              background: isPlaying ? 'rgba(232, 180, 58, 0.85)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(232, 180, 58, 0.5)',
              color: isPlaying ? '#3D0C1B' : 'white',
              height: 36,
              padding: '0 12px',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              opacity: 0.9,
              fontSize: '0.78rem',
              fontWeight: 700,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = 0.9; }}
          >
            <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ fontSize: '0.72rem' }} />
            <span className="desktop-only">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Zoom controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 30,
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '2px 4px',
            }}
          >
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.6}
              title="Zoom Out (-)"
              style={{
                background: 'none', border: 'none', color: 'white', padding: '6px 10px',
                cursor: zoomLevel <= 0.6 ? 'not-allowed' : 'pointer', opacity: zoomLevel <= 0.6 ? 0.3 : 0.85,
                fontSize: '0.9rem',
              }}
            >
              <i className="fa-solid fa-magnifying-glass-minus" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Reset Zoom (0)"
              style={{
                background: 'none', border: 'none', color: '#E8B43A', padding: '4px 8px',
                cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, minWidth: 44,
              }}
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 3}
              title="Zoom In (+)"
              style={{
                background: 'none', border: 'none', color: 'white', padding: '6px 10px',
                cursor: zoomLevel >= 3 ? 'not-allowed' : 'pointer', opacity: zoomLevel >= 3 ? 0.3 : 0.85,
                fontSize: '0.9rem',
              }}
            >
              <i className="fa-solid fa-magnifying-glass-plus" />
            </button>
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Toggle Fullscreen (F)"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: 0.85, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.85}
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} style={{ fontSize: '0.88rem' }} />
          </button>

          {/* Copy link button */}
          <button
            type="button"
            onClick={handleCopyLink}
            title={copiedLink ? 'Link Copied!' : 'Copy Direct Image Link'}
            style={{
              background: copiedLink ? '#10b981' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: 0.85, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.85}
          >
            <i className={`fa-solid ${copiedLink ? 'fa-check' : 'fa-link'}`} style={{ fontSize: '0.88rem' }} />
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            title="Download Image"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'white',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: 0.85, transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.85}
          >
            <i className="fa-solid fa-download" style={{ fontSize: '0.88rem' }} />
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            title="Close Lightbox (Esc)"
            style={{
              background: 'rgba(158,31,66,0.85)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: 'white',
              width: 36, height: 36, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#9E1F42';
              e.currentTarget.style.transform = 'scale(1.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(158,31,66,0.85)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: '1.1rem' }} />
          </button>
        </div>
      </div>

      {/* ── Main Photo Viewing Area ── */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 20px',
          overflow: 'hidden',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Edge preview: previous photo (desktop) */}
        {total > 1 && zoomLevel === 1 && (
          <button
            type="button"
            className="gallery-edge-preview prev"
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            aria-label="Previous photo"
          >
            <img src={images[(index - 1 + total) % total].imgUrl} alt="" />
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}

        {/* Previous Button (<) */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            title="Previous Image (Left Arrow)"
            style={{
              position: 'absolute',
              left: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(61, 12, 27, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 180, 58, 0.35)',
              color: '#FCFBF7',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#9E1F42';
              e.currentTarget.style.borderColor = '#E8B43A';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(61, 12, 27, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(232, 180, 58, 0.35)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
        )}

        {/* Display Image */}
        <div
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: `scale(${zoomLevel})`,
            cursor: zoomLevel > 1 ? 'grab' : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={currentImage.imgUrl}
            alt={currentImage.captionEn || 'Gallery Photo'}
            style={{
              maxWidth: '86vw',
              maxHeight: '68vh',
              objectFit: 'contain',
              borderRadius: 14,
              boxShadow: '0 25px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'opacity 0.25s ease',
              display: 'block',
            }}
          />
        </div>

        {/* Next Button (>) */}
        {total > 1 && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            title="Next Image (Right Arrow)"
            style={{
              position: 'absolute',
              right: 20,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(61, 12, 27, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 180, 58, 0.35)',
              color: '#FCFBF7',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#9E1F42';
              e.currentTarget.style.borderColor = '#E8B43A';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(61, 12, 27, 0.8)';
              e.currentTarget.style.borderColor = 'rgba(232, 180, 58, 0.35)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}

        {/* Edge preview: next photo (desktop) */}
        {total > 1 && zoomLevel === 1 && (
          <button
            type="button"
            className="gallery-edge-preview next"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            aria-label="Next photo"
          >
            <img src={images[(index + 1) % total].imgUrl} alt="" />
            <i className="fa-solid fa-chevron-right" />
          </button>
        )}
      </div>

      {/* ── Bottom Section: Captions & Thumbnail Strip ── */}
      <div
        style={{
          background: 'linear-gradient(to top, rgba(38,9,20,0.9) 0%, rgba(38,9,20,0.4) 70%, transparent 100%)',
          padding: '12px 20px 18px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Caption Display */}
        {(currentImage.captionEn || currentImage.captionNe) && (
          <div
            style={{
              background: 'rgba(158, 31, 66, 0.88)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(232, 180, 58, 0.4)',
              borderRadius: 30,
              padding: '8px 22px',
              color: 'white',
              fontSize: '0.92rem',
              fontWeight: 500,
              maxWidth: '85%',
              textAlign: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {lang === 'en' ? (
              <span>{currentImage.captionEn || currentImage.captionNe}</span>
            ) : (
              <span className="devanagari">{currentImage.captionNe || currentImage.captionEn}</span>
            )}
            {currentImage.captionEn && currentImage.captionNe && (
              <span style={{ fontSize: '0.78rem', opacity: 0.75, borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 8 }}>
                {lang === 'en' ? currentImage.captionNe : currentImage.captionEn}
              </span>
            )}
          </div>
        )}

        {/* Thumbnail Carousel Strip */}
        {total > 1 && (
          <div
            ref={thumbnailStripRef}
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              maxWidth: '100%',
              padding: '6px 4px',
              scrollbarWidth: 'none',
            }}
          >
            {images.map((img, i) => {
              const isSelected = i === index;
              return (
                <button
                  key={img.id || i}
                  type="button"
                  onClick={() => {
                    setZoomLevel(1);
                    setIndex(i);
                    onNavigate?.(i);
                  }}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: isSelected ? '2.5px solid #E8B43A' : '1.5px solid rgba(255,255,255,0.2)',
                    opacity: isSelected ? 1 : 0.5,
                    transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    transition: 'all 0.2s',
                    padding: 0,
                    background: '#2A0915',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 0 12px rgba(232,180,58,0.55)' : 'none',
                  }}
                >
                  <img
                    src={img.imgUrl}
                    alt={img.captionEn || `Thumb ${i}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
