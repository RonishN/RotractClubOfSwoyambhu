import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  checkAdminSession,
  getAdminContent,
  logoutAdmin,
  restoreAdminContent,
} from '../api/client';

import { EditModeProvider } from '../context/EditModeContext';
import AdminBar from '../components/AdminBar';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import AboutSection from '../components/AboutSection';
import TeamSection from '../components/TeamSection';
import InitiativesSection from '../components/InitiativesSection';
import EventsSection from '../components/EventsSection';
import GallerySection from '../components/GallerySection';
import ContactSection from '../components/ContactSection';
import Footer from '../components/Footer';

export default function Admin() {
  const navigate = useNavigate();

  const [history, setHistory]         = useState([]);
  const [modal, setModal]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const showToast = (type, message) => setToast({ type, message });
  const closeToast = () => setToast(null);

  const loadAdminData = useCallback(async () => {
    try {
      const result = await getAdminContent();
      setHistory(Array.isArray(result.history) ? result.history : []);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAdminSession()
      .then(() => loadAdminData())
      .catch(() => navigate('/login'));
  }, [navigate, loadAdminData]);

  const restoreVersion = async (entry) => {
    if (saving) return;
    setSaving(true);
    try {
      const result = await restoreAdminContent(entry.new);
      setHistory(Array.isArray(result.history) ? result.history : []);
      setModal(null);
      showToast('success', result.message || 'Restored successfully!');
    } catch (err) {
      showToast('error', err?.message || 'Failed to restore version');
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    logoutAdmin()
      .catch(() => {})
      .finally(() => {
        navigate('/login');
      });
  };

  if (loading) {
    return (
      <div className="admin-login-bg">
        <div className="login-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 32px', maxWidth: '360px' }}>
          <span className="admin-spinner" style={{ 
            width: '40px', 
            height: '40px', 
            borderWidth: '3px',
            borderColor: 'rgba(201, 150, 43, 0.15)',
            borderTopColor: 'var(--gold)' 
          }} />
          <h3 className="serif" style={{ fontSize: '1.25rem', letterSpacing: '0.5px', color: 'var(--navy)', margin: 0 }}>
            Opening Admin Panel
          </h3>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
            Retrieving revision history...
          </p>
        </div>
      </div>
    );
  }

  // Change History View
  return (
    <div className="admin-body">
      <div className="admin-wrapper">
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'space-between' }}>
          <div>
            <h2 className="serif">Swoyambhu Admin</h2>
            
            <button className="nav-btn active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>Change History</span>
            </button>
            
            <button className="nav-btn" onClick={() => navigate('/admin/edit')} style={{ marginTop: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              <span>Visual Editor</span>
            </button>
          </div>
          
          <button className="nav-btn" onClick={logout} style={{ color: '#fca5a5', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 18, borderRadius: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            <span>Logout</span>
          </button>
        </div>

        <div className="main-content">
          <div className="section-card active" style={{ padding: '40px 48px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 className="serif" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Modification History</h2>
              <button 
                className="btn-action btn-edit" 
                onClick={() => navigate('/admin/edit')}
                style={{ background: 'var(--magenta)', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Launch Visual Editor
              </button>
            </div>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr><td colSpan={2} style={{ color: '#94a3b8' }}>No history yet.</td></tr>
                ) : (
                  history.map((item, i) => (
                    <tr key={i} onClick={() => setModal(item)} style={{ cursor: 'pointer' }}>
                      <td><b>{item.new.timestamp}</b></td>
                      <td style={{ color: 'var(--magenta)', fontWeight: 600 }}>View Comparison</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 840, padding: '36px 40px', borderRadius: 24 }}>
            <button className="close-modal" onClick={() => setModal(null)}>×</button>
            <h3 className="serif" style={{ fontSize: '1.6rem', color: 'var(--navy)', margin: '0 0 4px' }}>Compare Changes</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 24px', fontWeight: 500 }}>
              Modification saved at <span style={{ color: 'var(--navy)', fontWeight: 600 }}>{modal.new.timestamp}</span>
            </p>
            
            <div className="diff-container" style={{ gap: 24 }}>
              <div>
                <h4 style={{ color: '#be123c', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#be123c' }} />
                  Previous Version (About Text)
                </h4>
                <div className="diff-box diff-old">
                  {`[ENGLISH]\n${modal.old.aboutEn || ''}\n\n[NEPALI]\n${modal.old.aboutNe || ''}`}
                </div>
              </div>
              <div>
                <h4 style={{ color: '#047857', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#047857' }} />
                  New Version (About Text)
                </h4>
                <div className="diff-box diff-new">
                  {`[ENGLISH]\n${modal.new.aboutEn || ''}\n\n[NEPALI]\n${modal.new.aboutNe || ''}`}
                </div>
              </div>
            </div>
            <button
              className="btn-action"
              style={{ 
                marginTop: 28, 
                width: '100%', 
                minHeight: 48, 
                position: 'relative', 
                overflow: 'hidden', 
                background: 'var(--magenta)', 
                color: 'white',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(226, 0, 122, 0.25)',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
              onClick={() => restoreVersion(modal)}
              disabled={saving}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span className="admin-spinner" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Restoring…
                </span>
              ) : 'Restore This Version'}
              {saving && <span className="btn-progress-bar" />}
            </button>
          </div>
        </div>
      )}
      
      {toast && (
        <div className="modal-overlay" onClick={closeToast} style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center', padding: '3rem 2.5rem', borderTop: `6px solid ${toast.type === 'success' ? '#10b981' : '#e2007a'}`, animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            <h3 className="serif" style={{ color: toast.type === 'success' ? '#10b981' : '#e2007a', fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              {toast.type === 'success' ? 'Success' : 'Error'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {toast.message}
            </p>
            <button className="btn" onClick={closeToast} style={{ background: toast.type === 'success' ? '#10b981' : 'var(--magenta)', borderColor: toast.type === 'success' ? '#10b981' : 'var(--magenta)', padding: '0.75rem 2.5rem', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
