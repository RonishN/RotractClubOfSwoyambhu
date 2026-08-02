import { useEffect, useRef } from 'react';

/**
 * useFadeIn – returns a ref to attach to a container.
 * When the element enters the viewport, 'visible' class is added,
 * triggering the CSS fade-in animation defined in index.css.
 * Also observes .section-header elements so the heading swoosh
 * gradient underline animates in when the header becomes visible.
 */
export default function useFadeIn(threshold = 0.15, deps = []) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold }
    );

    // Observe all .fade-in AND .section-header elements inside the ref'd container
    const fadeTargets = el.querySelectorAll('.fade-in');
    const headerTargets = el.querySelectorAll('.section-header');

    if (fadeTargets.length > 0 || headerTargets.length > 0) {
      fadeTargets.forEach(t => observer.observe(t));
      headerTargets.forEach(t => observer.observe(t));
    } else {
      // If the element itself is the fade target
      observer.observe(el);
    }

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, ...deps]);

  return ref;
}
