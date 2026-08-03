import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { useLang } from '../context/LanguageContext';
import Header from '../components/Header';
import MobileBottomNav from '../components/MobileBottomNav';
import Footer from '../components/Footer';
import { getPublicContent } from '../api/client';
import useFadeIn from '../hooks/useFadeIn';
import TraditionalDivider from '../components/TraditionalDivider';

export default function GalleryPage() {
  const { lang } = useLang();
  const [gallery, setGallery] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      <Header />
      <main ref={ref} className="lokta-texture" style={{ paddingTop: '120px', minHeight: '80vh', paddingBottom: '4rem', paddingLeft: '5%', paddingRight: '5%' }}>
        <div className="section-header fade-in">
          <h2 className="section-title">
            {lang === 'en' ? 'Our Gallery' : <span className="devanagari">हाम्रो ग्यालरी</span>}
          </h2>
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid fade-in delay-1"
            columnClassName="my-masonry-grid_column"
          >
            {gallery.map((item, i) => (
              <div 
                key={item.id || i} 
                className="gallery-item-saffron" 
                onClick={() => setSelectedImage(item)}
                style={{ marginBottom: '30px', aspectRatio: 'auto' }}
              >
                <img
                  src={item.imgUrl}
                  alt={lang === 'en' ? item.captionEn : item.captionNe}
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
      
      {/* Lightbox */}
      {selectedImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(10, 16, 36, 0.95)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            style={{ 
              position: 'absolute', top: 25, right: 35, 
              background: 'none', border: 'none', color: 'white', 
              fontSize: '2.5rem', cursor: 'pointer', opacity: 0.7,
              transition: 'opacity 0.2s', zIndex: 10
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.7}
          >
            ×
          </button>
          
          <img 
            src={selectedImage.imgUrl} 
            alt={lang === 'en' ? selectedImage.captionEn : selectedImage.captionNe}
            style={{ 
              maxWidth: '100%', maxHeight: '85vh', 
              objectFit: 'contain', borderRadius: '12px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          />
          
          {(selectedImage.captionEn || selectedImage.captionNe) && (
            <div 
              style={{ 
                position: 'absolute', bottom: '2.5rem', 
                color: 'white', textAlign: 'center', 
                backgroundColor: 'rgba(232, 135, 26, 0.9)', 
                padding: '12px 24px', borderRadius: 30,
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                fontWeight: 500, letterSpacing: '0.5px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
               {lang === 'en' ? selectedImage.captionEn : <span className="devanagari">{selectedImage.captionNe}</span>}
            </div>
          )}
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </>
  );
}
