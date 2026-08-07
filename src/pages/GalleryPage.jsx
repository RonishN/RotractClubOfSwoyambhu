import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { getPublicContent } from '../api/client';
import useFadeIn from '../hooks/useFadeIn';

export default function GalleryPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const [gallery, setGallery] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all'); // all | featured
  const [scrollProgress, setScrollProgress] = useState(0);

  // Re-run observer after loading data
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

  const albumList = albums.filter(a => a && a.titleEn).map((a, idx) => ({ a, idx }));

  const albumSortDate = (item) => {
    const m = String(item.a.id || '').match(/album-(\d+)/);
    return m ? Number(m[1]) : item.idx;
  };

  const albumCover = (a) => a.coverImage || gallery.find(g => (g.albumId || '') === a.id)?.imgUrl || null;
  const albumFirstPhoto = (a) => gallery.find(g => (g.albumId || '') === a.id)?.imgUrl || albumCover(a);
  const albumEvent = (a) => a.eventId ? (eventsList.find(ev => ev.id === a.eventId) || null) : null;
  const eventTitle = (ev) => lang === 'en' ? (ev?.title || '') : (ev?.titleNe || ev?.title || '');
  const albumCount = (a) => gallery.filter(g => (g.albumId || '') === a.id).length;
  const title = (a) => lang === 'en' ? a.titleEn : (a.titleNe || a.titleEn);

  const matchesSearch = (album) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (album.titleEn && album.titleEn.toLowerCase().includes(q)) ||
      (album.titleNe && album.titleNe.toLowerCase().includes(q)) ||
      (album.description && album.description.toLowerCase().includes(q))
    );
  };

  // Newest first (album id ordering)
  const newestAlbumItems = [...albumList].sort((x, y) => albumSortDate(y) - albumSortDate(x));

  const filteredAlbums = newestAlbumItems
    .filter(item => (filterKey === 'featured' ? albumCount(item.a) > 0 : true))
    .filter(item => matchesSearch(item.a))
    .map(item => item.a);

  const spotlightAlbum = newestAlbumItems[0]?.a || null;

  const marqueeItems = filteredAlbums.map(title).filter(Boolean);
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

      <main ref={ref} style={{ minHeight: '90vh' }} className="gallery-page">
        {/* ── HERO (events-style, centered) ── */}
        <section className="events-hero">
          <div className="events-hero-inner">
            <span className="events-hero-kicker">
              {lang === 'en' ? 'Our Gallery' : 'हाम्रो ग्यालरी'}
            </span>
            <h1 className="events-hero-title">
              {lang === 'en' ? 'Browse the Moments' : <span className="devanagari">क्षणहरू हेर्नुहोस्</span>}
            </h1>
            <p className="events-hero-sub">
              {lang === 'en'
                ? 'Memories captured across our events, service projects and celebrations.'
                : 'हाम्रा कार्यक्रम, सेवा परियोजना र उत्सवहरूमा कैद गरिएका सम्झनाहरू।'}
            </p>
          </div>
        </section>

        {/* ── Marquee ticker (album names) ── */}
        {isLoading ? (
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
                  <i className="fa-solid fa-images" /> {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── FEATURED: newest album showcase (unique design) ── */}
        {isLoading ? (
          <section className="featured-album featured-album-sk" aria-busy="true">
            <div className="featured-album-inner">
              <div className="featured-album-media">
                <div className="featured-frame">
                  <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                </div>
              </div>
              <div className="featured-album-body">
                <div className="sk brand" style={{ height: 10, width: 130, borderRadius: 999, marginBottom: 18 }} />
                <div className="sk brand" style={{ height: 32, width: '72%', marginBottom: 16 }} />
                <div className="sk brand" style={{ height: 14, width: 170, borderRadius: 999, marginBottom: 16 }} />
                <div className="sk brand" style={{ height: 13, width: '92%', marginBottom: 8 }} />
                <div className="sk brand" style={{ height: 13, width: '60%', marginBottom: 26 }} />
                <div className="sk brand" style={{ height: 46, width: 180, borderRadius: 999 }} />
              </div>
            </div>
          </section>
        ) : spotlightAlbum && (
          <section className="featured-album">
            <div className="featured-album-inner">
              <div className="featured-album-media">
                <div className="featured-frame-back" aria-hidden="true">
                  {albumFirstPhoto(spotlightAlbum) && (
                    <img src={albumFirstPhoto(spotlightAlbum)} alt="" loading="lazy" />
                  )}
                </div>
                <div className="featured-frame">
                  {albumCover(spotlightAlbum) ? (
                    <img src={albumCover(spotlightAlbum)} alt={title(spotlightAlbum)} loading="lazy" />
                  ) : (
                    <div className="featured-frame-empty"><i className="fa-solid fa-images" /></div>
                  )}
                  <span className="featured-badge">
                    <i className="fa-solid fa-sparkles" />
                    {lang === 'en' ? 'Latest Album' : 'नयाँ एल्बम'}
                  </span>
                  <span className="featured-count">
                    <i className="fa-solid fa-camera" /> {albumCount(spotlightAlbum)}
                  </span>
                </div>
              </div>

              <div className="featured-album-body">
                <span className="featured-kicker">
                  <i className="fa-solid fa-star" />
                  {lang === 'en' ? 'Featured Album' : 'विशेष एल्बम'}
                </span>
                <h2 className="featured-title">{title(spotlightAlbum)}</h2>
                {spotlightAlbum.titleNe && lang === 'en' && (
                  <div className="featured-subtitle devanagari">{spotlightAlbum.titleNe}</div>
                )}

                {(spotlightAlbum.description || spotlightAlbum.descriptionNe) && (
                  <p className="featured-desc">
                    {lang === 'en'
                      ? (spotlightAlbum.description || spotlightAlbum.descriptionNe)
                      : (spotlightAlbum.descriptionNe || spotlightAlbum.description)}
                  </p>
                )}

                <div className="featured-actions">
                  <button
                    type="button"
                    className="featured-cta"
                    onClick={() => navigate(`/gallery/album/${spotlightAlbum.id}`)}
                  >
                    <span>{lang === 'en' ? 'View Album' : 'एल्बम हेर्नुहोस्'}</span>
                    <i className="fa-solid fa-arrow-right" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Section head ── */}
        <div className="events-section-head">
          <span className="events-section-kicker">
            {lang === 'en' ? 'Photo Albums' : 'तस्बिर एल्बमहरू'}
          </span>
          <h2 className="events-section-title">
            {lang === 'en' ? 'All Albums' : <span className="devanagari">सबै एल्बमहरू</span>}
          </h2>
          {!isLoading && (
            <span className="events-section-count">
              <i className="fa-solid fa-images" style={{ marginRight: 6 }} />
              {lang === 'en'
                ? `${filteredAlbums.length} album${filteredAlbums.length === 1 ? '' : 's'}`
                : `${filteredAlbums.length} एल्बमहरू`}
            </span>
          )}
        </div>

        {/* ── Filter toolbar (search + pills) ── */}
        {!isLoading && (
          <div className="events-toolbar">
            <div className="events-toolbar-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search albums...' : 'एल्बम खोज्नुहोस्...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="events-toolbar-group">
              <span className="toolbar-label">{lang === 'en' ? 'Show' : 'देखाउनुहोस्'}</span>
              <div className="toolbar-pills">
                {[
                  { id: 'all', en: 'All', ne: 'सबै' },
                  { id: 'featured', en: 'Featured', ne: 'विशेष' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`pill ${filterKey === f.id ? 'active' : ''}`}
                    onClick={() => setFilterKey(f.id)}
                  >
                    {lang === 'en' ? f.en : f.ne}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Album grid (album card design kept) ── */}
        {isLoading ? (
          <div className="albums-landing-grid fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }} aria-busy="true" aria-label="Loading albums">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="album-card album-card-sk" style={{ cursor: 'default', animation: 'none' }}>
                <div className="album-card-photo">
                  <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                </div>
                <div className="album-card-body">
                  <div className="sk brand" style={{ height: 8, width: '42%', marginBottom: 10, borderRadius: 999 }} />
                  <div className="sk brand" style={{ height: 14, width: '78%', marginBottom: 6, borderRadius: 6 }} />
                  <div className="sk brand" style={{ height: 11, width: '58%', marginBottom: 12, borderRadius: 6 }} />
                  <div className="sk brand" style={{ height: 11, width: '92%', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="empty-state" style={{ maxWidth: 560, margin: '2rem auto 0' }}>
            <i className="fa-regular fa-folder-open" />
            <h3>{lang === 'en' ? 'No albums found' : 'कुनै एल्बम फेला परेन'}</h3>
            <p>
              {searchQuery || filterKey === 'featured'
                ? (lang === 'en' ? 'No albums match your search or filter.' : 'खोजी वा फिल्टरसँग मेल खाने एल्बम फेला परेन।')
                : (lang === 'en' ? 'No gallery albums available yet.' : 'हाल कुनै ग्यालरी एल्बमहरू उपलब्ध छैनन्।')}
            </p>
          </div>
        ) : (
          <div className="albums-landing-grid fade-in" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
            {filteredAlbums.map((a, idx) => {
              const cover = albumCover(a);
              const count = albumCount(a);
              const albumTitle = title(a);
              const ev = albumEvent(a);
              return (
                <div
                  key={a.id}
                  className="album-card"
                  role="button"
                  tabIndex={0}
                  style={{ '--i': idx }}
                  onClick={() => navigate(`/gallery/album/${a.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/gallery/album/${a.id}`); } }}
                >
                  <div className="album-card-photo">
                    {cover ? (
                      <img src={cover} alt={albumTitle} loading="lazy" />
                    ) : (
                      <div className="album-card-empty">
                        <i className="fa-solid fa-images" />
                        <span>{lang === 'en' ? 'No photos yet' : 'तस्बिरहरू छैनन्'}</span>
                      </div>
                    )}
                    <span className="album-card-tag">
                      {lang === 'en' ? 'Album' : 'एल्बम'}
                    </span>
                    <span className="album-card-count">
                      <i className="fa-solid fa-camera" />
                      {count}
                    </span>
                  </div>
                  <div className="album-card-body">
                    <span className="album-card-kicker">
                      {lang === 'en' ? 'Rotaract Swoyambhu' : 'रोटर्‍याक्ट स्वयम्भू'}
                    </span>
                    <h3 className="album-card-title">{albumTitle}</h3>
                    {a.titleNe && lang === 'en' && (
                      <span className="album-card-sub devanagari">{a.titleNe}</span>
                    )}
                    <div className="album-card-foot">
                      <span className="album-card-stat">
                        <i className="fa-solid fa-images" />
                        {lang === 'en'
                          ? `${count} photo${count === 1 ? '' : 's'}`
                          : `${count} तस्बिरहरू`}
                      </span>
                      {ev && eventTitle(ev) && (
                        <span className="album-card-event" title={eventTitle(ev)}>
                          <i className="fa-solid fa-calendar-day" />
                          <span className="album-card-event-name">{eventTitle(ev)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
