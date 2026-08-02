import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Initialize from localStorage if available, otherwise default to 'en'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferredLang') || 'en';
  });

  // Whenever language changes, save it to localStorage IF consent is given
  useEffect(() => {
    if (localStorage.getItem('cookieConsent') === 'true') {
      localStorage.setItem('preferredLang', lang);
    }
  }, [lang]);

  const toggleLang = () => setLang(prev => (prev === 'en' ? 'ne' : 'en'));

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
