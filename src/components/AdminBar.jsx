import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEditMode } from '../context/EditModeContext';

// Decode the JWT exp field without verifying signature (client-side only, for UI purposes)
function getSessionExpiresAt() {
  const cookieStr = document.cookie;
  const match = cookieStr.match(/admin_session=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Mandala SVG for the edit-mode watermark
const WatermarkMandala = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="100" cy="100" r="95" stroke="#C9962B" strokeWidth="0.5" strokeDasharray="2 3" />
    <circle cx="100" cy="100" r="80" stroke="#E8871A" strokeWidth="0.4" />
    <circle cx="100" cy="100" r="65" stroke="#C9962B" strokeWidth="0.5" strokeDasharray="3 2" />
    <circle cx="100" cy="100" r="50" stroke="#E8871A" strokeWidth="0.4" strokeDasharray="1 3" />
    <circle cx="100" cy="100" r="35" stroke="#C9962B" strokeWidth="0.5" />
    <circle cx="100" cy="100" r="18" stroke="#E8871A" strokeWidth="0.6" strokeDasharray="2 2" />
    {/* 8 petals */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + 18 * Math.cos(rad);
      const y1 = 100 + 18 * Math.sin(rad);
      const x2 = 100 + 90 * Math.cos(rad);
      const y2 = 100 + 90 * Math.sin(rad);
      return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9962B" strokeWidth="0.3" strokeDasharray="2 4" />;
    })}
    {/* Diamond tips */}
    {[0, 90, 180, 270].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const cx = 100 + 95 * Math.cos(rad);
      const cy = 100 + 95 * Math.sin(rad);
      return <circle key={`tip-${angle}`} cx={cx} cy={cy} r="3" fill="#E8871A" opacity="0.5" />;
    })}
    {/* Dharma wheel center */}
    <circle cx="100" cy="100" r="6" stroke="#E8871A" strokeWidth="0.8" fill="none" />
    <circle cx="100" cy="100" r="2" fill="#C9962B" opacity="0.7" />
  </svg>
);

export default function AdminBar({ onSwitchToHistory, onLogout }) {
  const {
    isEditMode,
    toggleEditMode,
    saveAll,
    saving,
    discard,
    handleRestoreDefaults,
    hasChanges,
    toast,
    closeToast
  } = useEditMode();

  const [sessionWarning, setSessionWarning] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check session expiry every 60 seconds and warn when < 30 minutes remain
  useEffect(() => {
    const check = () => {
      const expiresAt = getSessionExpiresAt();
      if (!expiresAt) return;
      const minsLeft = Math.floor((expiresAt - Date.now()) / 60000);
      setMinutesLeft(minsLeft);
      setSessionWarning(minsLeft >= 0 && minsLeft < 30);
    };
    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* ── Main AdminBar ── */}
      <div
        className="admin-bar admin-bar-frosted"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          color: 'white',
        }}
      >
        {/* Left: Branding & Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={onSwitchToHistory}
            disabled={saving}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '13px' }}></i>
            History
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

          <button
            onClick={() => navigate('/admin/edit')}
            style={{
              background: location.pathname === '/admin/edit' ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              color: location.pathname === '/admin/edit' ? 'white' : 'rgba(255,255,255,0.75)',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'background 0.2s, color 0.2s'
            }}
            disabled={saving}
          >
            Edit Home
          </button>
          
          <button
            onClick={() => navigate('/admin/edit/gallery')}
            style={{
              background: location.pathname === '/admin/edit/gallery' ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              color: location.pathname === '/admin/edit/gallery' ? 'white' : 'rgba(255,255,255,0.75)',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.88rem',
              fontWeight: 500,
              padding: '6px 12px',
              borderRadius: '8px',
              transition: 'background 0.2s, color 0.2s'
            }}
            disabled={saving}
          >
            Edit Gallery
          </button>

          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />

          {/* Edit Mode Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
            <span style={{
              fontSize: '0.88rem',
              fontWeight: 600,
              color: isEditMode ? 'white' : 'rgba(255,255,255,0.45)',
              transition: 'color 0.3s',
              letterSpacing: '0.3px'
            }}>
              Edit Mode
            </span>
            {/* Custom toggle */}
            <div style={{
              width: '46px',
              height: '26px',
              background: isEditMode
                ? 'linear-gradient(135deg, #79213C, #9E2D50)'
                : 'rgba(255,255,255,0.15)',
              borderRadius: '13px',
              position: 'relative',
              transition: 'background 0.35s',
              boxShadow: isEditMode ? '0 0 12px rgba(121,33,60,0.5)' : 'none',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                background: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '3px',
                left: isEditMode ? '23px' : '3px',
                transition: 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
              }} />
            </div>
            <input
              type="checkbox"
              checked={isEditMode}
              onChange={toggleEditMode}
              disabled={saving}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Center: Status indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {hasChanges && isEditMode && (
            <div style={{
              fontSize: '0.82rem',
              color: '#b33a5d',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              fontWeight: 600,
              background: 'rgba(121,33,60,0.1)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(121,33,60,0.2)',
            }}>
              <span style={{
                width: '7px', height: '7px',
                background: '#79213C',
                borderRadius: '50%',
                boxShadow: '0 0 8px rgba(121,33,60,0.7)',
                display: 'inline-block',
              }} />
              Unsaved Changes
            </div>
          )}
          {sessionWarning && (
            <div style={{
              fontSize: '0.8rem',
              color: minutesLeft <= 5 ? '#ef4444' : '#b33a5d',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              background: minutesLeft <= 5 ? 'rgba(239,68,68,0.12)' : 'rgba(121,33,60,0.12)',
              padding: '4px 12px',
              borderRadius: '20px',
              border: `1px solid ${minutesLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(121,33,60,0.3)'}`,
            }}>
              <i className="fa-regular fa-clock"></i>
              <span>Session expires in {minutesLeft}m</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isEditMode && hasChanges && (
            <button
              onClick={discard}
              disabled={saving}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.65)',
                cursor: saving ? 'not-allowed' : 'pointer',
                padding: '7px 14px',
                fontSize: '0.86rem',
                fontWeight: 500,
                borderRadius: '8px',
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
              }}
            >
              Discard
            </button>
          )}
          {isEditMode && (
            <button
              onClick={saveAll}
              disabled={!hasChanges || saving}
              style={{
                background: hasChanges
                  ? 'linear-gradient(135deg, #79213C, #561427)'
                  : 'rgba(255,255,255,0.08)',
                color: hasChanges ? 'white' : 'rgba(255,255,255,0.25)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 20px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: (hasChanges && !saving) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '110px',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s',
                boxShadow: hasChanges ? '0 4px 16px rgba(121,33,60,0.4)' : 'none',
                letterSpacing: '0.3px',
              }}
            >
              {saving ? (
                <>
                  <span className="admin-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                  Saving…
                  <span className="btn-progress-bar" />
                </>
              ) : (
                <>
                  <i className="fa-solid fa-floppy-disk" style={{ fontSize: '13px' }}></i>
                  Save All
                </>
              )}
            </button>
          )}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '6px 10px',
              fontSize: '0.84rem',
              borderRadius: '6px',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ── Edit Mode: Mandala Watermark ── */}
      <div className={`edit-mode-watermark ${isEditMode ? 'active' : ''}`}>
        <WatermarkMandala />
      </div>

      {/* ── Edit Mode: Floating Pill Badge ── */}
      {isEditMode && (
        <div className="edit-mode-pill">
          <div className="edit-mode-pill-dot" />
          Editing
        </div>
      )}

      {/* ── Toast Notification ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            maxWidth: '380px',
            width: 'calc(100% - 48px)',
            animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)',
            borderLeft: `6px solid ${toast.type === 'success' ? '#10b981' : '#79213C'}`,
            display: 'flex',
            padding: '16px 20px',
            alignItems: 'flex-start',
            gap: '14px',
          }}
        >
          {/* Icon */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(121,33,60,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {toast.type === 'success' ? (
              <i className="fa-solid fa-check" style={{ color: '#10b981', fontSize: '18px' }}></i>
            ) : (
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#79213C', fontSize: '18px' }}></i>
            )}
          </div>

          <div style={{ flexGrow: 1, paddingRight: '8px' }}>
            <h4 style={{
              margin: '0 0 4px',
              fontFamily: 'var(--font-sans)',
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--navy)'
            }}>
              {toast.type === 'success' ? 'Saved!' : 'Notice'}
            </h4>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '0.85rem',
              lineHeight: 1.4,
              fontFamily: 'var(--font-sans)',
              fontWeight: 500
            }}>
              {toast.message}
            </p>
          </div>

          <button
            onClick={closeToast}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: 0,
              lineHeight: 1,
              marginTop: '2px',
              transition: 'color 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--navy)'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
