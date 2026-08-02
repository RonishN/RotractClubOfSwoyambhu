import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

export default function HorizontalScrollCarousel({ items, renderItem, chunkSize = 8, header }) {
  const containerRef = useRef(null);
  const stickyRef = useRef(null);
  const trackRef = useRef(null);
  const [maxScroll, setMaxScroll] = useState(0);
  const [innerHeight, setInnerHeight] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Framer Motion values for buttery smooth scrolling
  const rawProgress = useMotionValue(0);
  const smoothProgress = useSpring(rawProgress, {
    stiffness: 200,
    damping: 28,
    mass: 0.4
  });
  const xTransform = useTransform(smoothProgress, [0, 1], [0, -maxScroll]);

  // Track progress state for button disabled states
  useEffect(() => {
    const unsub = smoothProgress.on('change', v => {
      setCurrentProgress(v);
    });
    return () => unsub();
  }, [smoothProgress]);

  // We chunk the items into rows of max chunkSize
  const rows = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    rows.push(items.slice(i, i + chunkSize));
  }

  // Handle Resize recalculation
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (trackRef.current && containerRef.current) {
        const containerWidth = window.innerWidth;
        // Total scrollable width minus visible viewport plus generous end padding
        const padding = containerWidth * 0.12;
        const overflow = trackRef.current.scrollWidth - containerWidth + padding;
        setMaxScroll(Math.max(0, overflow));
      }
      if (stickyRef.current) {
        setInnerHeight(stickyRef.current.offsetHeight);
      }
    };
    const timer = setTimeout(updateDimensions, 100);
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateDimensions);
    };
  }, [items]);

  // Highly responsive speed factor: scrolls through cards much faster
  const speedFactor = 2.0;
  const scrollDistance = maxScroll > 0 ? (maxScroll / speedFactor) * 1.3 : 0;
  const scrollHeight = maxScroll > 0 ? `calc(${innerHeight || 500}px + ${scrollDistance}px)` : 'auto';

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container || maxScroll <= 0) {
        rawProgress.set(0);
        return;
      }

      const { top } = container.getBoundingClientRect();
      const stickyTop = 85; // Fixed comfortable top offset in pixels
      
      let progress = 0;
      if (scrollDistance > 0) {
        const rawRatio = (stickyTop - top) / scrollDistance;
        // Reaches 100% horizontal scroll at 65% of vertical scroll distance,
        // giving a comfortable hold window before the section unpins!
        progress = Math.max(0, Math.min(1, rawRatio / 0.65));
      }
      
      rawProgress.set(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items, maxScroll, scrollDistance, rawProgress]);

  // Arrow button navigation
  const scrollNext = useCallback(() => {
    if (maxScroll <= 0) return;
    const step = 0.35;
    const target = Math.min(1, rawProgress.get() + step);
    animate(rawProgress, target, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
  }, [maxScroll, rawProgress]);

  const scrollPrev = useCallback(() => {
    if (maxScroll <= 0) return;
    const step = 0.35;
    const target = Math.max(0, rawProgress.get() - step);
    animate(rawProgress, target, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
  }, [maxScroll, rawProgress]);

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
          paddingBottom: '2.5rem',
          zIndex: 10
        }}
      >
        {/* Header with Navigation Controls */}
        <div style={{ 
          width: '100%', 
          padding: '0 5%', 
          marginBottom: '1.8rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            {header}
          </div>

          {/* Quick Nav Arrows when content overflows */}
          {maxScroll > 0 && (
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                onClick={scrollPrev}
                disabled={currentProgress <= 0.02}
                aria-label="Previous"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 209, 59, 0.4)',
                  background: currentProgress <= 0.02 ? 'rgba(255,255,255,0.05)' : 'rgba(255, 138, 0, 0.2)',
                  color: currentProgress <= 0.02 ? 'rgba(255,255,255,0.3)' : '#FFD13B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentProgress <= 0.02 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                </svg>
              </button>

              <button
                onClick={scrollNext}
                disabled={currentProgress >= 0.98}
                aria-label="Next"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 209, 59, 0.4)',
                  background: currentProgress >= 0.98 ? 'rgba(255,255,255,0.05)' : 'rgba(255, 138, 0, 0.2)',
                  color: currentProgress >= 0.98 ? 'rgba(255,255,255,0.3)' : '#FFD13B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentProgress >= 0.98 ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Track Container */}
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
