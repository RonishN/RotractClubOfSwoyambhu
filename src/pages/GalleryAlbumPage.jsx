import React, { useState, useEffect, useMemo } from 'react';
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
  const [showBack, setShowBack] = useState(false);

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
      setShowBack(window.scrollY > 320);
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

  // Infinite scroll (legacy behavior) replaced by explicit "Load More" button
  const visiblePhotos = photos.slice(0, visibleCount);
  const hasMore = visibleCount < photos.length;

  return (
    <>
      <Header />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Sticky back bar (mobile, appears after scrolling) */}
      {showBack && (
        <div className="gallery-sticky-back">
          <button type="button" className="gallery-sticky-back-btn" onClick={() => navigate('/gallery')}>
            <i className="fa-solid fa-arrow-left" />
            {lang === 'en' ? 'All Albums' : 'सबै एल्बमहरू'}
          </button>
        </div>
      )}
      <main ref={ref} style={{ minHeight: '80vh', paddingBottom: '4rem' }} className="gallery-page">

        {/* ── Full-bleed banner slideshow (cover — works for any orientation) ── */}
        <section className="album-hero">
          {!isLoading && slideshowImages.length > 0 && slideshowImages.map((imgUrl, index) => (
            <div
              key={imgUrl}
              className={`album-slide-bg ${index === currentSlideIndex ? 'active' : ''}`}
              style={{ backgroundImage: `url(${imgUrl})` }}
            />
          ))}
          <div className="album-hero-overlay" />

          {/* Back button — top left */}
          <div className="album-hero-back">
            <button type="button" onClick={() => navigate('/gallery')}>
              <i className="fa-solid fa-arrow-left" />
              {lang === 'en' ? 'All Albums' : 'सबै एल्बमहरू'}
            </button>
          </div>

          {/* Overlaid album info */}
          <div className="album-hero-inner">
            {isLoading ? (
              <div className="album-hero-info" aria-busy="true">
                <div className="album-hero-sk-line" style={{ width: 130, marginBottom: 16 }} />
                <div className="album-hero-sk-line" style={{ width: '62%', height: 30, marginBottom: 14 }} />
                <div className="album-hero-sk-line" style={{ width: '42%' }} />
              </div>
            ) : album ? (
              <div className="album-hero-info">
                <span className="album-info-kicker">
                  <i className="fa-solid fa-images" />
                  {lang === 'en' ? 'Album' : 'एल्बम'}
                </span>
                <h1>{lang === 'en' ? album.titleEn : (album.titleNe || album.titleEn)}</h1>
                {album.titleNe && lang === 'en' && (
                  <div className="album-info-subtitle devanagari">{album.titleNe}</div>
                )}
                <div className="album-info-meta">
                  <span className="album-meta-pill">
                    <i className="fa-solid fa-camera" />
                    {`${photos.length} ${lang === 'en' ? 'Photos' : 'तस्बिरहरू'}`}
                  </span>
                  {linkedEvent && (
                    <button
                      type="button"
                      className="album-meta-pill album-meta-event"
                      title={linkedEvent.title}
                      onClick={() => navigate(`/events?event=${encodeURIComponent(linkedEvent.id)}`)}
                    >
                      <i className="fa-solid fa-calendar-day" />
                      {linkedEvent.title}
                    </button>
                  )}
                </div>
                {(album.description || album.descriptionNe) && (
                  <p className="album-info-desc">
                    {lang === 'en' ? album.description || album.descriptionNe : album.descriptionNe || album.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="album-hero-empty">
                <i className="fa-solid fa-folder-open" />
                <span>{lang === 'en' ? 'This album could not be found.' : 'यो एल्बम फेला पार्न सकिएन।'}</span>
              </div>
            )}
          </div>

          {/* Slideshow dots */}
          {slideshowImages.length > 1 && (
            <div className="album-hero-dots">
              {slideshowImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlideIndex(i)}
                  className={`album-hero-dot ${i === currentSlideIndex ? 'active' : ''}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
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
