import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import logo from '../assets/images/logo.png';
import useFadeIn from '../hooks/useFadeIn';
import TraditionalDivider from './TraditionalDivider';

const PRAYER_FLAGS = ['pf-blue', 'pf-white', 'pf-red', 'pf-green', 'pf-yellow'];

export default function HeroSection({ content, isLoading }) {
  const { lang } = useLang();
  const { isEditMode, draft } = useEditMode();
  const ref = useFadeIn();

  // Use draft as the single display source when inside the admin provider
  // (draft is seeded from initialContent and updated on every save).
  // On the public Home page, useEditMode() returns draft={} so we fall back
  // to the content prop fetched from the public API.
  const hasDraft = draft && Object.keys(draft).length > 0;
  const displayContent = hasDraft ? draft : (content || {});
  const heroEn = displayContent.heroEn || '';
  const heroNe = displayContent.heroNe || '';

  const scrollToAbout = (e) => {
    e.preventDefault();
    const el = document.getElementById('about');
    if (el) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight,
        behavior: 'smooth',
      });
    }
  };

  const scrollToInitiatives = (e) => {
    e.preventDefault();
    const el = document.getElementById('initiatives');
    if (el) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 80;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.pageYOffset - headerHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hero">
      <div className="hero-container">
        <div className="hero-content">
          {/* Subtitle / Badge */}
          <div className="hero-badge">
            <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i>
            <span>{lang === 'en' ? 'ROTARY INTERNATIONAL DISTRICT 3292' : 'रोटरी इन्टरनेसनल डिष्ट्रिक्ट ३२९२'}</span>
            <i className="fa-solid fa-star" style={{ fontSize: '0.65rem' }}></i>
          </div>

          {/* Hero Title */}
          {isLoading ? (
            <SkeletonTheme baseColor="rgba(255,255,255,0.15)" highlightColor="rgba(255,255,255,0.3)">
              <div style={{ marginBottom: '0.5rem' }}>
                <Skeleton height={72} width={420} borderRadius={8} />
              </div>
              <Skeleton height={72} width={320} borderRadius={8} />
            </SkeletonTheme>
          ) : lang === 'en' ? (
            <EditableField field="heroEn" style={{ display: 'inline-block' }}>
              <h1 className="hero-title">
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
              <h1
                className="hero-title devanagari"
                style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}
              >
                {heroNe}
              </h1>
            </EditableField>
          )}

          {/* Tagline */}
          <p className="hero-tagline">
            {lang === 'en'
              ? 'Service Above Self — Rooted in Heritage, Rising with Purpose'
              : 'स्वार्थ भन्दा माथि सेवा — सम्पदामा आधारित, उद्देश्यका साथ उदीयमान'}
          </p>

          {/* Hero Actions */}
          <div className="hero-actions">
            <a href="#about" className="btn btn-primary" onClick={scrollToAbout}>
              {lang === 'en' ? 'Learn About Us' : 'हाम्रो बारेमा जान्नुहोस्'}
            </a>
            <a href="#initiatives" className="btn btn-secondary" onClick={scrollToInitiatives}>
              {lang === 'en' ? 'Our Initiatives' : 'हाम्रा पहलहरू'}
            </a>
          </div>
        </div>
      </div>

      {/* Prayer Flags */}
      <div className="prayer-flags-bar">
        {[...Array(3)].flatMap((_, i) =>
          PRAYER_FLAGS.map((cls, j) => <div key={`${i}-${j}`} className={cls} />)
        )}
      </div>
    </section>
  );
}
