import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HorizontalScrollCarousel({ items, renderItem, chunkSize = 8, header }) {
  const containerRef = useRef(null);
  const pinnedRef = useRef(null);
  const trackRef = useRef(null);
  const touchTrackRef = useRef(null);
  const progressBarRef = useRef(null);
  const progressLabelRef = useRef(null);

  const [maxScroll, setMaxScroll] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileIndex, setActiveMobileIndex] = useState(0);

  // Drive the progress bar + % label through the DOM (refs) instead of React
  // state — updating state on every scroll frame re-renders the whole carousel
  // and causes the jitter/glitchy horizontal scrolling.
  const paintProgress = (progress) => {
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = `scaleX(${progress})`;
    }
    if (progressLabelRef.current) {
      progressLabelRef.current.textContent = `${String(Math.round(progress * 100)).padStart(2, '0')}%`;
    }
  };

  // Detect mobile view (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop rows
  const rows = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    rows.push(items.slice(i, i + chunkSize));
  }

  // Measure how far the track overflows the visible content box → horizontal travel distance.
  // Re-measure only when the layout can actually change (fonts, images, resize, wrap size),
  // and let ScrollTrigger.refresh() re-anchor the pin afterwards so the section never
  // starts scrubbing against a stale measurement.
  useEffect(() => {
    let lastScroll = -1;
    let rafId = 0;
    let debounceTimer = 0;

    const apply = () => {
      const track = trackRef.current;
      const wrap = track && track.parentElement;
      if (!track || !wrap) return;
      const cs = getComputedStyle(wrap);
      const padLeft = parseFloat(cs.paddingLeft) || 0;
      const padRight = parseFloat(cs.paddingRight) || 0;
      const contentWidth = wrap.clientWidth - padLeft - padRight;
      const overflow = track.scrollWidth - contentWidth + 48; // breathing room so the last card is never clipped
      const next = Math.max(0, overflow);
      if (next !== lastScroll) {
        lastScroll = next;
        setMaxScroll(next);
      }
    };

    // Double rAF so we measure after the browser has re-laid-out (fonts/images settle).
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => requestAnimationFrame(apply));
    };

    const onResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(measure, 120);
    };

    measure();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        measure();
        ScrollTrigger.refresh();
      });
    }

    const trackEl = trackRef.current;
    const wrap = trackEl ? trackEl.parentElement : null;

    let ro;
    if (trackEl && wrap && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => measure());
      ro.observe(wrap);
      ro.observe(trackEl);
    }

    const images = trackEl ? trackEl.querySelectorAll('img') : [];
    images.forEach(img => img.addEventListener('load', measure));

    window.addEventListener('resize', onResize);
    window.addEventListener('load', measure);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(debounceTimer);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', measure);
      images.forEach(img => img.removeEventListener('load', measure));
    };
  }, [items, isMobile]);

  // GSAP ScrollTrigger pin — the section takes over the viewport and the page
  // only continues scrolling vertically AFTER the horizontal travel hits 100%.
  useEffect(() => {
    if (isMobile || maxScroll <= 0) return;
    const track = trackRef.current;
    const el = pinnedRef.current;
    if (!track || !el) return;

    const tween = gsap.to(track, {
      x: () => -maxScroll,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: () => `+=${maxScroll}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          paintProgress(self.progress);
        },
        onRefreshInit: () => paintProgress(0)
      }
    });
    const st = tween.scrollTrigger;

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);

    return () => {
      window.removeEventListener('load', refresh);
      if (st) st.kill();
      tween.kill();
      paintProgress(0);
    };
  }, [isMobile, maxScroll, items]);

  // Mobile Touch Swipe Handler
  const handleTouchScroll = () => {
    if (!touchTrackRef.current) return;
    const el = touchTrackRef.current;
    const scrollPosition = el.scrollLeft;
    const cardWidth = el.offsetWidth * 0.85;
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

  // DESKTOP HORIZONTAL SCROLL TAKE-OVER (GSAP ScrollTrigger pin)
  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div ref={pinnedRef} className="h-scroll-pinned">
        <div style={{
          width: '100%',
          padding: '0 5%',
          marginBottom: '1rem',
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
          <div style={{ width: 'min(90%, 720px)', margin: '0 auto 2rem', padding: '0 5%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '0.7rem',
              flexWrap: 'wrap'
            }}>
              <span className="carousel-progress-label">
                <i className="fa-solid fa-arrow-left-long" style={{ fontSize: '0.85rem' }} />
                <span>Scroll to explore</span>
                <i className="fa-solid fa-arrow-right-long" style={{ fontSize: '0.85rem' }} />
              </span>
              <span ref={progressLabelRef} className="carousel-progress-count">00%</span>
            </div>
            <div className="carousel-progress-track">
              <div
                ref={progressBarRef}
                className="carousel-progress-fill"
              />
            </div>
          </div>
        )}

        <div style={{ width: '100%', overflow: 'hidden', padding: '0 5%', flex: 1, display: 'flex', alignItems: 'center', minHeight: 0 }}>
          <div
            ref={trackRef}
            className="carousel-track"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2rem',
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
          </div>
        </div>
      </div>
    </div>
  );
}
