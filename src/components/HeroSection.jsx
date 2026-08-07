import React, { useEffect, useRef } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import heroImage from '../assets/images/heroimage.jpg';

const PRAYER_FLAGS = ['pf-blue', 'pf-white', 'pf-red', 'pf-green', 'pf-yellow'];

export default function HeroSection({ content, isLoading }) {
  const { lang } = useLang();
  const { draft } = useEditMode();
  const sectionRef = useRef(null);
  const bgWrapRef = useRef(null);
  const contentRef = useRef(null);

  // Use draft as the single display source when inside the admin provider,
  // otherwise fall back to the public content prop.
  const hasDraft = draft && Object.keys(draft).length > 0;
  const displayContent = hasDraft ? draft : (content || {});
  const heroEn = displayContent.heroEn || '';
  const heroNe = displayContent.heroNe || '';

  // Cinematic parallax-out: as the user scrolls away, the hero background
  // drifts slower (parallax + gentle zoom) and the content fades & slides up.
  useEffect(() => {
    const onScroll = () => {
      const hero = sectionRef.current;
      if (!hero) return;
      const prog = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
      if (bgWrapRef.current) {
        bgWrapRef.current.style.transform = `translateY(${prog * 26}%) scale(${1 + prog * 0.1})`;
      }
      if (contentRef.current) {
        contentRef.current.style.opacity = `${1 - prog * 1.25}`;
        contentRef.current.style.transform = `translateY(${prog * 80}px)`;
        contentRef.current.style.filter = `blur(${prog * 6}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => (e) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hero" className="home-hero" ref={sectionRef}>
      {/* Parallax background (Wrapper is translated on scroll; inner does Ken-Burns) */}
      <div className="home-hero-bg-wrap" ref={bgWrapRef}>
        <div className="home-hero-bg" style={{ backgroundImage: `url(${heroImage})` }} />
      </div>
      <div className="home-hero-overlay" />

      {/* Center-balanced cinematic content */}
      <div className="home-hero-inner" ref={contentRef}>
        <span className="home-hero-kicker">
          <i className="fa-solid fa-star" style={{ fontSize: '0.62rem' }} />
          <span>{lang === 'en' ? 'ROTARY INTERNATIONAL DISTRICT 3292' : 'रोटरी इन्टरनेसनल डिष्ट्रिक्ट ३२९२'}</span>
          <i className="fa-solid fa-star" style={{ fontSize: '0.62rem' }} />
        </span>

        {isLoading ? (
          <SkeletonTheme baseColor="rgba(255,255,255,0.15)" highlightColor="rgba(255,255,255,0.3)">
            <div className="home-hero-sk-title">
              <Skeleton height={72} width="100%" borderRadius={8} />
            </div>
            <div className="home-hero-sk-title home-hero-sk-title-sm">
              <Skeleton height={72} width="100%" borderRadius={8} />
            </div>
          </SkeletonTheme>
        ) : lang === 'en' ? (
          <EditableField field="heroEn" style={{ display: 'inline-block' }}>
            <h1 className="home-hero-title">
              {heroEn && heroEn.split('\n').map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </h1>
          </EditableField>
        ) : (
          <EditableField field="heroNe" style={{ display: 'inline-block' }}>
            <h1 className="home-hero-title devanagari">{heroNe}</h1>
          </EditableField>
        )}

        <p className="home-hero-tagline">
          {lang === 'en'
            ? 'Service Above Self — Rooted in Heritage, Rising with Purpose'
            : 'स्वार्थ भन्दा माथि सेवा — सम्पदामा आधारित, उद्देश्यका साथ उदीयमान'}
        </p>

        <div className="home-hero-actions">
          <a href="#about" className="home-hero-btn primary" onClick={scrollTo('about')}>
            <span>{lang === 'en' ? 'Learn About Us' : 'हाम्रो बारेमा जान्नुहोस्'}</span>
            <i className="fa-solid fa-arrow-right" />
          </a>
          <a href="#initiatives" className="home-hero-btn ghost" onClick={scrollTo('initiatives')}>
            <span>{lang === 'en' ? 'Our Initiatives' : 'हाम्रा पहलहरू'}</span>
            <i className="fa-solid fa-compass" />
          </a>
        </div>
      </div>

      {/* Prayer flag strip */}
      <div className="prayer-flags-bar">
        {[...Array(3)].flatMap((_, i) =>
          PRAYER_FLAGS.map((cls, j) => <div key={`${i}-${j}`} className={cls} />)
        )}
      </div>
    </section>
  );
}