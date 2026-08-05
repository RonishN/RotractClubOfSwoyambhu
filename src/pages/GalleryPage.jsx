import React, { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [scrollProgress, setScrollProgress] = useState(0);
  const searchRef = useRef(null);

  // Re-run observer after loading data
  const ref = useFadeIn(0.15, [isLoading]);

  useEffect(() => {
    window.scrollTo(0, 0);
    getPublicContent().then(res => {
      setGallery(res.websiteData?.gallery || []);
      setAlbums(res.websiteData?.albums || []);
      setIsLoading(false);
    });
  }, []);

  // Auto-focus search on desktop only
  useEffect(() => {
    if (window.innerWidth > 760) searchRef.current?.focus();
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

  const matchesSearch = (album) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (album.titleEn && album.titleEn.toLowerCase().includes(q)) ||
      (album.titleNe && album.titleNe.toLowerCase().includes(q)) ||
      (album.description && album.description.toLowerCase().includes(q))
    );
  };

  const sortedAlbumItems = [...albumList].sort((x, y) => {
    if (sortKey === 'az') {
      return (x.a.titleEn || '').localeCompare(y.a.titleEn || '');
    }
    const dx = albumSortDate(x);
    const dy = albumSortDate(y);
    return sortKey === 'oldest' ? dx - dy : dy - dx;
  });

  const filteredAlbums = sortedAlbumItems.filter(item => matchesSearch(item.a)).map(item => item.a);

  const albumCover = (a) => a.coverImage || gallery.find(g => (g.albumId || '') === a.id)?.imgUrl || null;
  const albumCount = (a) => gallery.filter(g => (g.albumId || '') === a.id).length;

  return (
    <>
      <Header />
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
      
      <main ref={ref} style={{ minHeight: '80vh', paddingBottom: '4rem' }} className="gallery-page">
        {/* ── HERO (split: title left, search right) ── */}
        <section className="gallery-hero">
          <div className="gallery-hero-inner">
            <div className="gallery-hero-text">
              <span className="gallery-hero-kicker">
                {lang === 'en' ? 'Our Gallery' : 'हाम्रो ग्यालरी'}
              </span>
              <h1 className="gallery-hero-title">
                {lang === 'en' ? 'Browse the Moments' : 'क्षणहरू हेर्नुहोस्'}
              </h1>
              <p className="gallery-hero-sub">
                {lang === 'en'
                  ? 'Memories captured across our events, service projects and celebrations.'
                  : 'हाम्रा कार्यक्रम, सेवा परियोजना र उत्सवहरूमा कैद गरिएका सम्झनाहरू।'}
              </p>
            </div>

            <div className="gallery-search-bar">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                ref={searchRef}
                type="text"
                placeholder={lang === 'en' ? 'Search albums...' : 'एल्बम खोज्नुहोस्...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="gallery-search-clear"
                  aria-label={lang === 'en' ? 'Clear search' : 'खोजी मेट्नुहोस्'}
                  onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>
          </div>
        </section>

        <div className="gallery-albums-wrap">
          {/* ── Section head (left-aligned + sort) ── */}
          <div className="gallery-section-head">
            <div className="gallery-section-head-left">
              <span className="gallery-section-kicker">
                {lang === 'en' ? 'Photo Albums' : 'तस्बिर एल्बमहरू'}
              </span>
              <h2 className="gallery-section-title">
                {lang === 'en' ? 'Albums' : 'एल्बमहरू'}
              </h2>
              {!isLoading && (
                <span className="gallery-section-count">
                  <i className="fa-solid fa-images" />
                  {lang === 'en'
                    ? `${filteredAlbums.length} album${filteredAlbums.length === 1 ? '' : 's'}`
                    : `${filteredAlbums.length} एल्बमहरू`}
                </span>
              )}
            </div>

            {!isLoading && (
              <div className="gallery-sort">
                <i className="fa-solid fa-arrow-down-wide-short" />
                <select value={sortKey} onChange={e => setSortKey(e.target.value)} aria-label={lang === 'en' ? 'Sort albums' : 'एल्बमहरू क्रमबद्ध गर्नुहोस्'}>
                  <option value="newest">{lang === 'en' ? 'Newest' : 'नयाँ'}</option>
                  <option value="oldest">{lang === 'en' ? 'Oldest' : 'पुरानो'}</option>
                  <option value="az">{lang === 'en' ? 'A – Z' : 'क – ज्ञ'}</option>
                </select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="albums-landing-grid" style={{ margin: '0 auto' }} aria-busy="true" aria-label="Loading albums">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="gallery-window" style={{ cursor: 'default', animation: 'none' }}>
                  <div className="gallery-window-photo">
                    <div className="sk brand" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} />
                  </div>
                  <div className="gallery-window-plate" style={{ border: 'none' }}>
                    <div className="sk brand" style={{ height: 8, width: '40%', margin: '2px auto 8px', borderRadius: 999 }} />
                    <div className="sk brand" style={{ height: 13, width: '68%', margin: '0 auto', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAlbums.length === 0 ? (
            <div className="empty-state" style={{ maxWidth: 560, margin: '2rem auto 0' }}>
              <i className="fa-regular fa-folder-open" />
              <h3>{lang === 'en' ? 'No albums found' : 'कुनै एल्बम फेला परेन'}</h3>
              <p>
                {searchQuery
                  ? (lang === 'en' ? 'No albums match your search.' : 'खोजिएको कुनै एल्बम फेला परेन।')
                  : (lang === 'en' ? 'No gallery albums available yet.' : 'हाल कुनै ग्यालरी एल्बमहरू उपलब्ध छैनन्।')}
              </p>
            </div>
          ) : (
            <div className="albums-landing-grid fade-in" style={{ margin: '0 auto' }}>
              {filteredAlbums.map((a, idx) => {
                const cover = albumCover(a);
                const count = albumCount(a);
                const title = lang === 'en' ? a.titleEn : (a.titleNe || a.titleEn);
                return (
                  <div
                    key={a.id}
                    className="gallery-window"
                    role="button"
                    tabIndex={0}
                    style={{ '--i': idx }}
                    onClick={() => navigate(`/gallery/album/${a.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/gallery/album/${a.id}`); } }}
                  >
                    <div className="gallery-window-photo">
                      {cover ? (
                        <img src={cover} alt={title} loading="lazy" />
                      ) : (
                        <div className="gallery-window-empty">
                          <i className="fa-solid fa-images" />
                          <span>{lang === 'en' ? 'No photos yet' : 'तस्बिरहरू छैनन्'}</span>
                        </div>
                      )}
                      <span className="gallery-window-tag">
                        {lang === 'en' ? 'Album' : 'एल्बम'}
                      </span>
                      <span className="gallery-window-count">
                        <i className="fa-solid fa-camera" />
                        {count}
                      </span>
                    </div>
                    <div className="gallery-window-plate">
                      <span className="gallery-plate-kicker">
                        {lang === 'en' ? 'Rotaract Swoyambhu' : 'रोटर्‍याक्ट स्वयम्भू'}
                      </span>
                      <span className="gallery-plate-title">{title}</span>
                      {a.titleNe && lang === 'en' && (
                        <span className="gallery-plate-sub devanagari">{a.titleNe}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
