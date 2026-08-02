import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminEdit from './pages/AdminEdit';
import GalleryPage from './pages/GalleryPage';
import GalleryEdit from './pages/GalleryEdit';
import './styles/index.css';

import CookieConsent from './components/CookieConsent';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit" element={<AdminEdit />} />
          <Route path="/admin/edit/gallery" element={<GalleryEdit />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </LanguageProvider>
  );
}
