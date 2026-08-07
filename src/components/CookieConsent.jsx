import React, { useState, useEffect, useCallback } from 'react';
import { useLang } from '../context/LanguageContext';
import './CookieConsent.css';

const CONSENT_KEY = 'cookieConsent';
const PREFS_KEY = 'rcs_cookie_prefs';
const RUNTIME_CACHES = ['content', 'events', 'imagekit-images'];

function readPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return { performance: !!p.performance, preferences: !!p.preferences };
    }
  } catch (e) {}
  const legacy = localStorage.getItem(CONSENT_KEY);
  const ok = legacy === 'true';
  return { performance: ok, preferences: ok };
}

function writeConsent(prefs) {
  localStorage.setItem(CONSENT_KEY, prefs.preferences ? 'true' : 'false');
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function clearDeviceCaches() {
  if (!('caches' in window)) return;
  caches.keys().then(keys =>
    Promise.all(keys.filter(k => RUNTIME_CACHES.includes(k)).map(k => caches.delete(k)))
  );
}

export default function CookieConsent() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);
  const [prefs, setPrefs] = useState({ performance: true, preferences: true });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === null) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
    setPrefs(readPrefs());
  }, []);

  const applyChoice = useCallback(
    next => {
      writeConsent(next);
      if (next.preferences) {
        localStorage.setItem('preferredLang', lang);
      } else {
        localStorage.removeItem('preferredLang');
      }
      if (!next.performance) clearDeviceCaches();
      setShow(false);
    },
    [lang]
  );

  const handleAcceptAll = () => applyChoice({ performance: true, preferences: true });
  const handleDecline = () => applyChoice({ performance: false, preferences: false });
  const handleSave = () => applyChoice(prefs);

  const togglePref = key => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  };

  if (!show) return null;

  const t = {
    title: lang === 'en' ? 'We respect your privacy' : 'हामी तपाईंको गोपनीयताको सम्मान गर्छौं',
    intro:
      lang === 'en'
        ? 'This site uses cookies and local storage to remember your preferences, load pages faster with caching, and keep the site secure. You can choose which non-essential features to allow below.'
        : 'यस साइटले तपाईंको प्राथमिकताहरू सम्झन, पृष्ठहरू छिटो लोड गर्न क्यासिङ र साइट सुरक्षित राख्न कुकीहरू र स्थानीय भण्डारण प्रयोग गर्छ। तल कुन गैर-आवश्यक सुविधाहरू अनुमति दिने भन्ने तपाईं छान्न सक्नुहुन्छ।',
    necessaryTitle: lang === 'en' ? 'Strictly necessary' : 'पूर्ण आवश्यक',
    necessaryDesc:
      lang === 'en'
        ? 'Required for the site to function securely and smoothly.'
        : 'साइट सुरक्षित र सहज रूपमा चल्नका लागि आवश्यक।',
    alwaysActive: lang === 'en' ? 'Always active' : 'सधैँ सक्रिय',
    cachingTitle: lang === 'en' ? 'Performance & caching' : 'कार्यसम्पादन र क्यासिङ',
    cachingDesc:
      lang === 'en'
        ? 'Caches content and images on your device (service worker) and at the edge, so pages load faster and keep working offline. Turning this off clears the saved cache on your device.'
        : 'पृष्ठहरू छिटो लोड हुन र अफलाइन चलिरहन यन्त्र (service worker) र एजमा सामग्री र छविहरू क्यास गर्छ। बन्द गर्दा यन्त्रमा बचत भएको क्यास मेटिन्छ।',
    prefsTitle: lang === 'en' ? 'Preferences' : 'प्राथमिकताहरू',
    prefsDesc:
      lang === 'en'
        ? 'Remembers your language choice (English / नेपाली) for your next visit.'
        : 'अर्को भ्रमणका लागि तपाईंको भाषा छनोट (English / नेपाली) सम्झन्छ।',
    acceptAll: lang === 'en' ? 'Accept all' : 'सबै स्वीकार',
    decline: lang === 'en' ? 'Decline' : 'अस्वीकार',
    save: lang === 'en' ? 'Save my choices' : 'छनोट सुरक्षित गर्नुहोस्',
  };

  return (
    <div className="cookie-consent" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="cookie-consent-head">
        <span className="cc-icon"><i className="fa-solid fa-cookie-bite" aria-hidden="true" /></span>
        <h3>{lang === 'ne' ? <span className="devanagari">{t.title}</span> : t.title}</h3>
      </div>
      <p className="cookie-consent-intro">{lang === 'ne' ? <span className="devanagari">{t.intro}</span> : t.intro}</p>

      <div className="cookie-consent-cats">
        <div className="cc-cat">
          <span className="cc-cat-icon"><i className="fa-solid fa-shield-halved" aria-hidden="true" /></span>
          <div className="cc-cat-body">
            <div className="cc-cat-title">
              <span>{lang === 'ne' ? <span className="devanagari">{t.necessaryTitle}</span> : t.necessaryTitle}</span>
              <span className="cc-cat-badge">{lang === 'ne' ? <span className="devanagari">{t.alwaysActive}</span> : t.alwaysActive}</span>
            </div>
            <p className="cc-cat-desc">{lang === 'ne' ? <span className="devanagari">{t.necessaryDesc}</span> : t.necessaryDesc}</p>
          </div>
        </div>

        <div className="cc-cat">
          <span className="cc-cat-icon"><i className="fa-solid fa-bolt" aria-hidden="true" /></span>
          <div className="cc-cat-body">
            <div className="cc-cat-title">
              <span>{lang === 'ne' ? <span className="devanagari">{t.cachingTitle}</span> : t.cachingTitle}</span>
            </div>
            <p className="cc-cat-desc">{lang === 'ne' ? <span className="devanagari">{t.cachingDesc}</span> : t.cachingDesc}</p>
          </div>
          <button
            className="cc-toggle"
            role="switch"
            aria-checked={prefs.performance}
            aria-label={lang === 'en' ? 'Performance and caching' : 'कार्यसम्पादन र क्यासिङ'}
            onClick={() => togglePref('performance')}
          >
            <span className="cc-toggle-knob" />
          </button>
        </div>

        <div className="cc-cat">
          <span className="cc-cat-icon"><i className="fa-solid fa-language" aria-hidden="true" /></span>
          <div className="cc-cat-body">
            <div className="cc-cat-title">
              <span>{lang === 'ne' ? <span className="devanagari">{t.prefsTitle}</span> : t.prefsTitle}</span>
            </div>
            <p className="cc-cat-desc">{lang === 'ne' ? <span className="devanagari">{t.prefsDesc}</span> : t.prefsDesc}</p>
          </div>
          <button
            className="cc-toggle"
            role="switch"
            aria-checked={prefs.preferences}
            aria-label={lang === 'en' ? 'Preferences' : 'प्राथमिकताहरू'}
            onClick={() => togglePref('preferences')}
          >
            <span className="cc-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="cookie-consent-actions">
        <button className="cc-btn cc-btn-ghost" onClick={handleDecline}>
          {lang === 'ne' ? <span className="devanagari">{t.decline}</span> : t.decline}
        </button>
        <button className="cc-btn cc-btn-primary" onClick={dirty ? handleSave : handleAcceptAll}>
          {lang === 'ne' ? <span className="devanagari">{dirty ? t.save : t.acceptAll}</span> : (dirty ? t.save : t.acceptAll)}
        </button>
      </div>
    </div>
  );
}
