import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { getPublicContent } from '../api/client';
import useFadeIn from '../hooks/useFadeIn';
import GalleryLightbox from '../components/GalleryLightbox';

function isSameImage(url1, url2) {
  if (!url1 || !url2) return false;
  let u1 = url1.split('?')[0].replace(/\/tr:[^/]+\//g, '/');
  let u2 = url2.split('?')[0].replace(/\/tr:[^/]+\//g, '/');
  return u1.trim() === u2.trim();
}

const PAGE_SIZE = 24;

export default function GalleryAlbumPage() {
  const { lang } = useLang();
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef(null);

  const ref = useFadeIn(0.15, [isLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
    getPublicContent().then(res => {
      setGallery(res.websiteData?.gallery || []);
      setAlbums(res.websiteData?.albums || []);
      setEventsList(res.websiteData?.eventsList || []);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [albumId]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const album = albums.find(a => a.id === albumId) || null;
  const photos = gallery.filter(g => (g.albumId || '') === albumId && !isSameImage(g.imgUrl, album?.coverImage));
  const linkedEvent = album?.eventId ? eventsList.find(ev => ev.id === album.eventId) : null;

  const slideshowImages = useMemo(() => {
    if (!album) return [];
    const imgs = [];
    if (album.coverImage) imgs.push(album.coverImage);
    photos.forEach(p => { if (p.imgUrl && !imgs.includes(p.imgUrl)) imgs.push(p.imgUrl); });
    return imgs.slice(0, 8);
  }, [album, photos]);

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (slideshowImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slideshowImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [slideshowImages.length]);

  // Infinite scroll
  useEffect(() => {
    if (isLoading) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setVisibleCount(v => v + PAGE_SIZE); },
      { rootMargin: '500px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isLoading, photos.length, visibleCount]);

  const visiblePhotos = photos.slice(0, visibleCount);
  const hasMore = visibleCount < photos.length;

  return (
    <>
      <Header />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <main ref={ref} style={{ minHeight: '80vh', paddingBottom: '4rem' }} className="gallery-page">

        {/* ── Cinematic Slideshow Banner ── */}
        <section style={{
          position: 'relative',
          minHeight: '460px',
          overflow: 'hidden',
          background: '#100306',
        }}>
          {/* Slideshow layers */}
          {!isLoading && slideshowImages.length > 0 && slideshowImages.map((imgUrl, index) => (
            <div
              key={imgUrl}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${imgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: index === currentSlideIndex ? 1 : 0,
                transition: 'opacity 1.8s ease-in-out',
                animation: index === currentSlideIndex ? 'kenBurnsAnimation 22s ease-in-out infinite' : 'none',
                zIndex: index === currentSlideIndex ? 1 : 0,
              }}
            />
          ))}

          {/* Gradient overlay: dark on bottom and left for text readability */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(to top, rgba(10,2,5,0.97) 0%, rgba(10,2,5,0.6) 40%, rgba(10,2,5,0.15) 100%),
              linear-gradient(to right, rgba(10,2,5,0.82) 0%, rgba(10,2,5,0.35) 50%, rgba(10,2,5,0) 100%)
            `,
            zIndex: 2,
          }} />

          {/* Slideshow dots indicator */}
          {slideshowImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '1.5rem',
              right: '2rem',
              display: 'flex',
              gap: 6,
              zIndex: 5,
            }}>
              {slideshowImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlideIndex(i)}
                  style={{
                    width: i === currentSlideIndex ? 22 : 7,
                    height: 7,
                    borderRadius: 999,
                    border: 'none',
                    background: i === currentSlideIndex ? '#F2B73A' : 'rgba(255,255,255,0.35)',
                    cursor: 'pointer',
                    transition: 'all 0.35s ease',
                    padding: 0,
                  }}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* ── Back button — top left ── */}
          <div style={{
            position: 'absolute',
            top: '1.5rem',
            left: '5%',
            zIndex: 10,
          }}>
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.22)',
                borderRadius: 999,
                padding: '8px 18px',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                letterSpacing: '0.02em',
                transition: 'background 0.2s, border-color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,183,58,0.22)'; e.currentTarget.style.borderColor = 'rgba(242,183,58,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.78rem' }} />
              {lang === 'en' ? 'All Albums' : 'सबै एल्बमहरू'}
            </button>
          </div>

          {/* ── Album title — bottom left ── */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 4,
            padding: '2.5rem 5% 2.5rem',
          }}>
            <div style={{ maxWidth: 760 }}>
              {isLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="sk brand" style={{ height: 10, width: 100, borderRadius: 999 }} />
                  <div className="sk brand" style={{ height: 36, width: '65%', borderRadius: 8 }} />
                  <div className="sk brand" style={{ height: 10, width: 160, borderRadius: 999, marginTop: 4 }} />
                </div>
              ) : album ? (
                <>
                  {/* Kicker */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(242,183,58,0.18)',
                    border: '1px solid rgba(242,183,58,0.4)',
                    borderRadius: 999,
                    padding: '4px 14px',
                    marginBottom: '0.8rem',
                  }}>
                    <i className="fa-solid fa-images" style={{ color: '#F2B73A', fontSize: '0.7rem' }} />
                    <span style={{
                      color: '#F2B73A',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      letterSpacing: '0.22em',
                      textTransform: 'uppercase',
                    }}>
                      {lang === 'en' ? 'Album' : 'एल्बम'}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 style={{
                    margin: '0 0 8px',
                    color: '#FFFFFF',
                    fontSize: 'clamp(1.9rem, 4.5vw, 3.4rem)',
                    fontFamily: 'var(--ev-font-display)',
                    fontWeight: 800,
                    lineHeight: 1.08,
                    textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 4px 30px rgba(0,0,0,0.5)',
                    letterSpacing: '-0.01em',
                  }}>
                    {lang === 'en' ? album.titleEn : (album.titleNe || album.titleEn)}
                  </h1>

                  {/* Nepali subtitle */}
                  {album.titleNe && lang === 'en' && (
                    <div style={{
                      color: 'rgba(255,255,255,0.75)',
                      fontSize: '1rem',
                      marginBottom: 10,
                      textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                      fontFamily: 'var(--ev-font-display)',
                    }} className="devanagari">
                      {album.titleNe}
                    </div>
                  )}

                  {/* Meta pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px', marginTop: 10 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999,
                      padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#fff',
                    }}>
                      <i className="fa-solid fa-images" style={{ color: '#F2B73A' }} />
                      {`${photos.length} ${lang === 'en' ? 'Photos' : 'तस्बिरहरू'}`}
                    </span>
                    {linkedEvent && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: 'rgba(142,27,60,0.55)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(142,27,60,0.6)', borderRadius: 999,
                        padding: '5px 14px', fontSize: '0.78rem', fontWeight: 700, color: '#fff',
                      }}>
                        <i className="fa-solid fa-calendar-day" style={{ color: '#F2B73A' }} />
                        {linkedEvent.title}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {(album.description || album.descriptionNe) && (
                    <p style={{
                      marginTop: 14,
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      maxWidth: 620,
                      textShadow: '0 1px 8px rgba(0,0,0,0.85)',
                    }}>
                      {lang === 'en' ? album.description || album.descriptionNe : album.descriptionNe || album.description}
                    </p>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Photo Grid ── */}
        {isLoading ? (
          <div className="gallery-album-photos-wrap" style={{ marginTop: '2.5rem' }}>
            <div className="gallery-uniform-grid" aria-busy="true" aria-label="Loading photos">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="gallery-item-frame" style={{ cursor: 'default', animation: 'none' }}>
                  <div className="gallery-item-frame-photo">
                    <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                  </div>
                  <div className="sk brand" style={{ height: 10, width: '55%', margin: '8px auto 6px', borderRadius: 999 }} />
                </div>
              ))}
            </div>
          </div>
        ) : !album ? (
          <div style={{ textAlign: 'center', padding: '6rem 1rem', color: '#64748b' }}>
            <i className="fa-regular fa-folder-open" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: 16 }} /><br />
            <p style={{ marginBottom: 20 }}>
              {lang === 'en' ? 'This album could not be found.' : 'यो एल्बम फेला पार्न सकिएन।'}
            </p>
            <button type="button" className="album-back-link" onClick={() => navigate('/gallery')}>
              <i className="fa-solid fa-arrow-left" /> {lang === 'en' ? 'Back to All Albums' : 'सबै एल्बमहरूमा फर्कनुहोस्'}
            </button>
          </div>
        ) : photos.length === 0 ? (
          <div className="empty-state" style={{ maxWidth: 520, margin: '3rem auto 0' }}>
            <i className="fa-regular fa-image" />
            <h3>{lang === 'en' ? 'No photos yet' : 'कुनै तस्बिरहरू छैनन्'}</h3>
            <p>{lang === 'en' ? 'No photos in this album yet.' : 'यस एल्बममा हाल कुनै तस्बिरहरू छैनन्।'}</p>
          </div>
        ) : (
          <div className="gallery-album-photos-wrap" style={{ marginTop: '2.5rem' }}>
            <div className="gallery-uniform-grid fade-in">
              {visiblePhotos.map((item, i) => {
                const cap = lang === 'en'
                  ? (item.captionEn || item.captionNe || '')
                  : (item.captionNe || item.captionEn || '');
                return (
                  <div
                    key={item.id || i}
                    className="gallery-item-frame"
                    onClick={() => setLightboxIndex(i)}
                    style={{ '--i': i }}
                  >
                    <div className="gallery-item-frame-photo">
                      <img
                        src={item.imgUrl}
                        alt={cap || album.titleEn}
                        loading="lazy"
                      />
                    </div>
                    {cap && (
                      <div className="gallery-item-frame-cap">
                        <span>{cap}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="gallery-load-more">
                <span className="gallery-load-more-count">
                  {lang === 'en'
                    ? `Showing ${visiblePhotos.length} of ${photos.length} photos`
                    : `${visiblePhotos.length} / ${photos.length} तस्बिरहरू देखाइँदै`}
                </span>
                <button type="button" className="gallery-load-more-btn" onClick={() => setVisibleCount(v => v + PAGE_SIZE)}>
                  <i className="fa-solid fa-camera" />
                  {lang === 'en' ? 'Load More Photos' : 'थप तस्बिरहरू लोड गर्नुहोस्'}
                </button>
                <div ref={sentinelRef} className="gallery-load-sentinel" aria-hidden="true" />
              </div>
            )}
          </div>
        )}
      </main>

      <GalleryLightbox
        images={photos}
        albumTitle={album?.titleEn || ''}
        currentIndex={lightboxIndex !== null ? lightboxIndex : 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

      <Footer />
      <MobileBottomNav />
    </>
  );
}
