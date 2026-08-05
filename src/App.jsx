import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import AdminSettings from './pages/AdminSettings';
import ManageAdmins from './pages/ManageAdmins';
import AuditLogs from './pages/AuditLogs';
import AdminEdit from './pages/AdminEdit';
import AdminEvents from './pages/AdminEvents';
import GalleryPage from './pages/GalleryPage';
import GalleryAlbumPage from './pages/GalleryAlbumPage';
import GalleryEdit from './pages/GalleryEdit';
import EventsPage from './pages/EventsPage';
import './styles/index.css';

import CookieConsent from './components/CookieConsent';
import GlobalLoading from './components/GlobalLoading';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <GlobalLoading />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/gallery/album/:albumId" element={<GalleryAlbumPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={<Admin />}>
            <Route index element={<Navigate to="settings" replace />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="manage" element={<ManageAdmins />} />
            <Route path="logs" element={<AuditLogs />} />
          </Route>
          
          <Route path="/admin/edit" element={<AdminEdit />} />
          <Route path="/admin/edit/gallery" element={<GalleryEdit />} />
          <Route path="/admin/edit/gallery/album/:albumId" element={<GalleryEdit />} />
        </Routes>
        <CookieConsent />
      </BrowserRouter>
    </LanguageProvider>
  );
}
