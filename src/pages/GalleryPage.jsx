import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { useLang } from '../context/LanguageContext';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { getPublicContent } from '../api/client';
import useFadeIn from '../hooks/useFadeIn';
import GalleryLightbox from '../components/GalleryLightbox';

export default function GalleryPage() {
  const { lang } = useLang();
  const [gallery, setGallery] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Re-run observer after loading data
  const ref = useFadeIn(0.15, [isLoading]);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
    getPublicContent().then(res => {
      setGallery(res.websiteData?.gallery || []);
      setIsLoading(false);
    });
  }, []);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  const filteredGallery = gallery.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.captionEn && item.captionEn.toLowerCase().includes(q)) ||
      (item.captionNe && item.captionNe.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header />
      <main ref={ref} className="lokta-texture" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '4rem', paddingLeft: '5%', paddingRight: '5%' }}>
        <div className="section-header fade-in">
          <h2 className="section-title">
            {lang === 'en' ? 'Our Gallery' : <span className="devanagari">हाम्रो ग्यालरी</span>}
          </h2>
          <p style={{ maxWidth: 600, margin: '12px auto 0', color: '#64748b', fontSize: '0.95rem' }}>
            {lang === 'en'
              ? 'Memorable moments, impactful community projects, and fellowship activities of Rotaract Club of Swoyambhu.'
              : 'रोटर्‍याक्ट क्लब अफ स्वयम्भूका स्मरणीय क्षणहरू, समुदाय-केन्द्रित परियोजनाहरू र फेलोसिपका झलकहरू।'}
          </p>
        </div>

        {/* Search and stats bar */}
        {!isLoading && gallery.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: '2rem',
              maxWidth: 1200,
              margin: '0 auto 2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#79213C', fontWeight: 600, fontSize: '0.9rem' }}>
              <i className="fa-solid fa-images" />
              <span>{filteredGallery.length} {lang === 'en' ? 'Photos' : 'तस्बिरहरू'}</span>
            </div>

            <div style={{ position: 'relative', width: '100%', maxWidth: 300 }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                }}
              />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search photos...' : 'तस्बिर खोज्नुहोस्...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 20,
                  border: '1px solid rgba(121, 33, 60, 0.2)',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: 'white',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#79213C'}
                onBlur={e => e.target.style.borderColor = 'rgba(121, 33, 60, 0.2)'}
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#79213C', fontWeight: 600 }}>
            <span className="admin-spinner" style={{ width: 32, height: 32, borderWidth: 3, borderColor: 'rgba(121,33,60,0.2)', borderTopColor: '#79213C', display: 'inline-block', marginBottom: 12 }} /><br />
            {lang === 'en' ? 'Loading Gallery...' : 'ग्यालरी लोड हुँदैछ...'}
          </div>
        ) : filteredGallery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
            <i className="fa-regular fa-image" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: 16 }} /><br />
            {searchQuery ? (
              <p>{lang === 'en' ? 'No photos match your search.' : 'खोजिएको कुनै तस्बिर फेला परेन।'}</p>
            ) : (
              <p>{lang === 'en' ? 'No gallery photos available yet.' : 'हाल कुनै तस्बिरहरू उपलब्ध छैनन्।'}</p>
            )}
          </div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid fade-in delay-1"
            columnClassName="my-masonry-grid_column"
          >
            {filteredGallery.map((item, i) => (
              <div 
                key={item.id || i} 
                className="gallery-item-saffron" 
                onClick={() => setLightboxIndex(i)}
                style={{ marginBottom: '24px', aspectRatio: 'auto', cursor: 'pointer' }}
                title={lang === 'en' ? (item.captionEn || 'Click to view photo') : (item.captionNe || 'तस्बिर हेर्न क्लिक गर्नुहोस्')}
              >
                <img
                  src={item.imgUrl}
                  alt={lang === 'en' ? item.captionEn : item.captionNe}
                  loading="lazy"
                  style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '12px' }}
                />
                <div className="gallery-caption-slide">
                  <span className="gallery-caption-text">
                    <span className="gallery-caption-lang">{lang === 'en' ? 'EN' : 'NE'}</span>
                    {lang === 'en' ? item.captionEn : item.captionNe}
                  </span>
                </div>
              </div>
            ))}
          </Masonry>
        )}
      </main>
      
      {/* ── Modern Lightbox with Keyboard & Touch navigation ── */}
      <GalleryLightbox
        images={filteredGallery}
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
