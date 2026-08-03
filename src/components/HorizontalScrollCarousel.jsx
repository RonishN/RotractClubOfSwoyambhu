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
          paddingBottom: '3.5rem',
          zIndex: 10
        }}
      >
        {/* Header with Navigation Controls */}
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

        {/* Dynamic Glowing Scroll Progress Bar */}
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
