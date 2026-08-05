import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { getPublicContent } from '../api/client';
import useFadeIn from '../hooks/useFadeIn';
import GalleryLightbox from '../components/GalleryLightbox';

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
  const photos = gallery.filter(g => (g.albumId || '') === albumId);
  const linkedEvent = album?.eventId ? eventsList.find(ev => ev.id === album.eventId) : null;
  const cover = album?.coverImage || photos[0]?.imgUrl || null;

  return (
    <>
      <Header />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      <main ref={ref} style={{ minHeight: '80vh', paddingBottom: '4rem' }} className="gallery-page">
        {/* ── Album hero band ── */}
        <section className="gallery-album-head">
          <div className="gallery-album-head-inner">
            <button type="button" className="album-back-link gallery-back" onClick={() => navigate('/gallery')}>
              <i className="fa-solid fa-arrow-left" /> {lang === 'en' ? 'All Albums' : 'सबै एल्बमहरू'}
            </button>

            {isLoading ? (
              <div className="gallery-album-head-main">
                <div className="gallery-album-head-badge sk brand" />
                <div className="gallery-album-head-text">
                  <div className="sk brand" style={{ height: 10, width: 110, borderRadius: 999, marginBottom: 14 }} />
                  <div className="sk brand" style={{ height: 28, width: '70%', marginBottom: 14 }} />
                  <div className="sk brand" style={{ height: 12, width: 180, borderRadius: 999, marginBottom: 14 }} />
                  <div className="sk brand" style={{ height: 12, width: '88%', marginBottom: 8 }} />
                  <div className="sk brand" style={{ height: 12, width: '60%' }} />
                </div>
              </div>
            ) : album ? (
              <div className="gallery-album-head-main">
                <div className="gallery-album-head-badge">
                  {cover ? <img src={cover} alt={album.titleEn || ''} /> : <i className="fa-solid fa-images" />}
                </div>
                <div className="gallery-album-head-text">
                  <span className="gallery-kicker">{lang === 'en' ? 'Album' : 'एल्बम'}</span>
                  <h1>{lang === 'en' ? album.titleEn : (album.titleNe || album.titleEn)}</h1>
                  {album.titleNe && lang === 'en' && (
                    <div className="gallery-album-head-sub devanagari">{album.titleNe}</div>
                  )}
                  <div className="gallery-album-head-meta">
                    <span>
                      <i className="fa-solid fa-images" />
                      {`${photos.length} ${lang === 'en' ? 'Photos' : 'तस्बिरहरू'}`}
                    </span>
                    {linkedEvent && (
                      <span className="gallery-album-head-event">
                        <i className="fa-solid fa-calendar-day" /> {linkedEvent.title}
                      </span>
                    )}
                  </div>
                  {album.description && (
                    <p className="gallery-album-head-desc">{album.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="gallery-album-head-main" style={{ minHeight: 120 }} />
            )}
          </div>
        </section>

        {isLoading ? (
          <div className="gallery-album-photos-wrap">
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
          <div className="gallery-album-photos-wrap">
            <div className="gallery-uniform-grid fade-in">
              {photos.map((item, i) => {
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
          </div>
        )}
      </main>

      {/* ── Lightbox with captions ── */}
      <GalleryLightbox
        images={photos}
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
