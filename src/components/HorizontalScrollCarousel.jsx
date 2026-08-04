import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

export default function HorizontalScrollCarousel({ items, renderItem, chunkSize = 8, header }) {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const trackRef = useRef(null);
  const touchTrackRef = useRef(null);

  const [maxScroll, setMaxScroll] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Detect mobile view (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Framer Motion values for desktop smooth scrolling
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 200,
    damping: 28,
    mass: 0.4
  });
  const xTransform = useTransform(smoothProgress, [0, 1], [0, -maxScroll]);

  // Track progress state
  useEffect(() => {
    const unsub = smoothProgress.on('change', v => {
      setCurrentProgress(v);
    });
    return () => unsub();
  }, [smoothProgress]);

  // Desktop rows
  const rows = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    rows.push(items.slice(i, i + chunkSize));
  }

  // Handle Resize recalculation
  useEffect(() => {
    const updateDimensions = () => {
      if (trackRef.current && containerRef.current) {
        const containerWidth = window.innerWidth;
        const padding = containerWidth * 0.12;
        const overflow = trackRef.current.scrollWidth - containerWidth + padding;
        setMaxScroll(Math.max(0, overflow));
      }
      if (stickyRef.current) {
        setInnerHeight(stickyRef.current.offsetHeight || stickyRef.current.getBoundingClientRect().height || 500);
      }
    };
    
    // Recalculate on load, resize, and items update
    const timer = setTimeout(updateDimensions, 200);
    updateDimensions();
    
    // Listen for image loads inside track to recalculate layout dimensions accurately
    const trackEl = trackRef.current;
    const images = trackEl ? trackEl.querySelectorAll('img') : [];
    images.forEach(img => {
      img.addEventListener('load', updateDimensions);
    });

    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
      images.forEach(img => {
        img.removeEventListener('load', updateDimensions);
      });
    };
  }, [items, isMobile]); // Removed innerHeight from dependencies to prevent infinite loop

  const speedFactor = 2.0;
  const scrollDistance = maxScroll > 0 ? (maxScroll / speedFactor) * 1.3 : 0;
  const scrollHeight = !isMobile && maxScroll > 0 ? `${(innerHeight || 500) + scrollDistance}px` : 'auto';

  useEffect(() => {
    if (isMobile) return;
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || maxScroll <= 0) {
        rawProgress.set(0);
        return;
      }

      const { top } = container.getBoundingClientRect();
      const stickyTop = 85;
      
      let progress = 0;
      if (scrollDistance > 0) {
        const rawRatio = (stickyTop - top) / scrollDistance;
        progress = Math.max(0, Math.min(1, rawRatio / 0.65));
      }
      
      rawProgress.set(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, maxScroll, scrollDistance, rawProgress, isMobile]);

  // Mobile Touch Swipe Handler
  const handleTouchScroll = () => {
    if (!touchTrackRef.current) return;
    const el = touchTrackRef.current;
    const scrollPosition = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85; // Approx width of card on mobile
    const index = Math.round(scrollPosition / cardWidth);
    setActiveMobileIndex(Math.min(items.length - 1, Math.max(0, index)));
  };

  const scrollToMobileIndex = (idx) => {
    if (!touchTrackRef.current) return;
    const el = touchTrackRef.current;
    const cardWidth = el.offsetWidth * 0.85;
    el.scrollTo({
      left: idx * cardWidth,
      behavior: 'smooth'
    });
    setActiveMobileIndex(idx);
  };

  // MOBILE RESPONSIVE TOUCH CAROUSEL MODE
  if (isMobile) {
    return (
      <div className="mobile-touch-carousel-wrapper">
        <div style={{ padding: '0 5%', marginBottom: '1rem' }}>
          {header}
        </div>

        {/* Touch Swipe Track */}
        <div 
          ref={touchTrackRef}
          className="mobile-touch-swipe-track"
          onScroll={handleTouchScroll}
        >
          {items.map((item, index) => (
            <div key={index} className="mobile-touch-slide">
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Mobile Carousel Indicators & Navigation */}
        <div className="mobile-carousel-controls">
          <button 
            className="mobile-arrow-btn"
            disabled={activeMobileIndex === 0}
            onClick={() => scrollToMobileIndex(activeMobileIndex - 1)}
            aria-label="Previous card"
          >
            ‹
          </button>
          
          <div className="mobile-dots-indicator">
            {items.map((_, idx) => (
              <span 
                key={idx}
                className={`mobile-dot ${idx === activeMobileIndex ? 'active' : ''}`}
                onClick={() => scrollToMobileIndex(idx)}
              />
            ))}
          </div>

          <button 
            className="mobile-arrow-btn"
            disabled={activeMobileIndex === items.length - 1}
            onClick={() => scrollToMobileIndex(activeMobileIndex + 1)}
            aria-label="Next card"
          >
            ›
          </button>
        </div>
      </div>
    );
  }

  // DESKTOP HORIZONTAL SCROLL MODE
  return (
    <div ref={containerRef} style={{ height: scrollHeight, position: 'relative' }}>
      <div 
        ref={stickyRef}
        style={{ 
          position: maxScroll > 0 ? 'sticky' : 'relative', 
          top: maxScroll > 0 ? '85px' : 0, 
          height: 'auto', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          width: '100%',
          paddingBottom: '3.5rem',
          zIndex: 10
        }}
      >
        <div style={{ 
          width: '100%', 
          padding: '0 5%', 
          marginBottom: '1.2rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div style={{ flex: 1 }}>
            {header}
          </div>
        </div>

        {maxScroll > 0 && (
          <div style={{ width: '90%', margin: '0 auto 2.5rem', padding: '0 5%' }}>
            <div style={{
              width: '100%',
              height: '5px',
              background: 'rgba(28, 43, 76, 0.06)',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <motion.div 
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--saffron) 0%, var(--gold) 50%, var(--magenta) 100%)',
                  scaleX: smoothProgress,
                  transformOrigin: 'left',
                  borderRadius: '10px'
                }}
              />
            </div>
          </div>
        )}

        <div style={{ width: '100%', overflow: 'hidden', padding: '0 5%' }}>
          <motion.div 
            ref={trackRef}
            className="carousel-track"
            style={{ 
              x: maxScroll > 0 ? xTransform : 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '2.5rem',
              width: 'max-content',
              willChange: 'transform'
            }}
          >
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="carousel-row" style={{ display: 'flex', gap: '2rem', flexWrap: 'nowrap' }}>
                {row.map((item, itemIndex) => {
                  const originalIndex = rowIndex * chunkSize + itemIndex;
                  return renderItem(item, originalIndex);
                })}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
