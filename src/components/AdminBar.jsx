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
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + 18 * Math.cos(rad);
      const y1 = 100 + 18 * Math.sin(rad);
      const x2 = 100 + 90 * Math.cos(rad);
      const y2 = 100 + 90 * Math.sin(rad);
      return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9962B" strokeWidth="0.3" strokeDasharray="2 4" />;
    })}
    {[0, 90, 180, 270].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const cx = 100 + 95 * Math.cos(rad);
      const cy = 100 + 95 * Math.sin(rad);
      return <circle key={`tip-${angle}`} cx={cx} cy={cy} r="3" fill="#E8871A" opacity="0.5" />;
    })}
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
  const barRef = React.useRef(null);

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

  useEffect(() => {
    const updateHeight = () => {
      if (barRef.current) {
        const height = barRef.current.offsetHeight || 90;
        document.documentElement.style.setProperty('--admin-bar-height', `${height}px`);
        document.body.classList.add('has-admin-bar');
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (barRef.current) ro.observe(barRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
      document.body.classList.remove('has-admin-bar');
      document.documentElement.style.removeProperty('--admin-bar-height');
    };
  }, []);

  const navBtnStyle = (active) => ({
    background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
    border: 'none',
    color: active ? 'white' : 'rgba(255,255,255,0.75)',
    cursor: saving ? 'not-allowed' : 'pointer',
    fontSize: '0.82rem',
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: '6px',
    transition: 'background 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  });

  return (
    <>
      <style>{`
        .admin-bar-shell {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          background: #79213C;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        /* Row 1 — primary actions always visible */
        .admin-bar-row1 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          height: 50px;
          gap: 8px;
        }
        /* Row 2 — nav links */
        .admin-bar-row2 {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px 8px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-bar-row2::-webkit-scrollbar { display: none; }

        .admin-bar-brand {
          display: flex; align-items: center; gap: 8px;
          font-weight: 700; font-size: 0.84rem;
          color: white;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .admin-bar-brand-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: white;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
          flex-shrink: 0;
        }

        /* Edit mode toggle */
        .admin-toggle-track {
          width: 40px; height: 22px;
          border-radius: 11px;
          position: relative;
          transition: background 0.3s;
          border: 1px solid rgba(255,255,255,0.25);
          flex-shrink: 0;
        }
        .admin-toggle-knob {
          width: 16px; height: 16px;
          background: white; border-radius: 50%;
          position: absolute; top: 2px;
          transition: left 0.28s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 2px 5px rgba(0,0,0,0.25);
        }

        /* Save button */
        .admin-save-btn {
          background: white;
          color: #79213C;
          border: none; border-radius: 7px;
          padding: 6px 14px; font-size: 0.82rem; font-weight: 700;
          cursor: pointer; display: flex; align-items: center; gap: 6px;
          white-space: nowrap; flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: opacity 0.2s, background 0.2s, color 0.2s;
          letter-spacing: 0.2px;
        }
        .admin-save-btn:hover:not(:disabled) {
          background: #fdf2f4;
        }
        .admin-save-btn:disabled {
          background: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.4);
          box-shadow: none; cursor: not-allowed;
        }
        .admin-discard-btn {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          cursor: pointer; padding: 6px 11px;
          font-size: 0.78rem; font-weight: 600;
          border-radius: 6px; transition: background 0.2s, color 0.2s;
          white-space: nowrap; flex-shrink: 0;
        }
        .admin-discard-btn:hover { background: rgba(255,255,255,0.22); color: white; }
        .admin-logout-btn {
          background: transparent; border: none;
          color: rgba(255,255,255,0.65); cursor: pointer;
          padding: 6px 8px; font-size: 0.78rem; border-radius: 6px;
          transition: color 0.2s, background 0.2s; flex-shrink: 0;
          white-space: nowrap;
        }
        .admin-logout-btn:hover { color: white; background: rgba(255,255,255,0.15); }

        .admin-divider-v {
          width: 1px; height: 20px;
          background: rgba(255,255,255,0.2);
          flex-shrink: 0;
        }

        /* Unsaved pill */
        .admin-unsaved-pill {
          font-size: 0.74rem; color: white;
          display: flex; align-items: center; gap: 5px;
          font-weight: 700;
          background: rgba(255,255,255,0.18);
          padding: 3px 10px; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.3);
          white-space: nowrap; flex-shrink: 0;
        }
        .admin-unsaved-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #facc15;
          box-shadow: 0 0 7px rgba(250, 204, 21, 0.8);
        }

        /* Session warning */
        .admin-session-pill {
          font-size: 0.74rem; display: flex; align-items: center; gap: 5px;
          font-weight: 600; padding: 3px 10px; border-radius: 20px;
          white-space: nowrap; flex-shrink: 0;
        }

        /* Edit label text */
        .admin-edit-label {
          font-size: 0.82rem; font-weight: 700; white-space: nowrap;
          transition: color 0.3s; letter-spacing: 0.2px;
        }

        /* Nav button hover */
        .admin-nav-btn:hover {
          background: rgba(255,255,255,0.15) !important;
          color: white !important;
        }

        @media (max-width: 640px) {
          .admin-bar-row1 { padding: 0 10px; gap: 6px; }
          .admin-bar-row2 { padding: 0 10px 8px; }
          .admin-bar-brand { font-size: 0.76rem; }
          .admin-save-btn { padding: 5px 10px; font-size: 0.78rem; }
          .admin-bar-shell { border-radius: 0; }
        }
      `}</style>

      {/* ── Main AdminBar Shell ── */}
      <div ref={barRef} className="admin-bar-shell">

        {/* ── Row 1: Brand | Edit Toggle | Status | Actions | Logout ── */}
        <div className="admin-bar-row1">

          {/* Left: Brand */}
          <div className="admin-bar-brand">
            <div className="admin-bar-brand-dot" />
            <span>Admin</span>
          </div>

          <div className="admin-divider-v" />

          {/* Edit Mode Toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1, flexShrink: 0 }}>
            <span className="admin-edit-label" style={{ color: isEditMode ? 'white' : 'rgba(255,255,255,0.6)' }}>
              Edit
            </span>
            <div
              className="admin-toggle-track"
              style={{ background: isEditMode ? '#561427' : 'rgba(255,255,255,0.2)', boxShadow: isEditMode ? '0 0 10px rgba(0,0,0,0.3)' : 'none' }}
            >
              <div className="admin-toggle-knob" style={{ left: isEditMode ? '21px' : '3px' }} />
            </div>
            <input type="checkbox" checked={isEditMode} onChange={toggleEditMode} disabled={saving} style={{ display: 'none' }} />
          </label>

          {/* Status pills — shown in row1 only on wider screens, collapse on mobile */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', minWidth: 0 }}>
            {hasChanges && isEditMode && (
              <div className="admin-unsaved-pill">
                <span className="admin-unsaved-dot" />
                <span className="admin-hide-xs">Unsaved</span>
              </div>
            )}
            {sessionWarning && (
              <div className="admin-session-pill" style={{ color: minutesLeft <= 5 ? '#ef4444' : '#e2a0b3', background: minutesLeft <= 5 ? 'rgba(239,68,68,0.12)' : 'rgba(121,33,60,0.12)', border: `1px solid ${minutesLeft <= 5 ? 'rgba(239,68,68,0.3)' : 'rgba(121,33,60,0.3)'}` }}>
                <i className="fa-regular fa-clock" />
                <span>{minutesLeft}m</span>
              </div>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isEditMode && hasChanges && (
              <button className="admin-discard-btn" onClick={discard} disabled={saving}>
                Discard
              </button>
            )}
            {isEditMode && (
              <button
                className="admin-save-btn"
                onClick={saveAll}
                disabled={!hasChanges || saving}
              >
                {saving ? (
                  <>
                    <span className="admin-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk" style={{ fontSize: '12px' }} />
                    <span>Save</span>
                  </>
                )}
              </button>
            )}

            <div className="admin-divider-v" />

            <button className="admin-logout-btn" onClick={onLogout}>
              <i className="fa-solid fa-right-from-bracket" style={{ fontSize: '13px' }} />
              <span className="admin-hide-xs" style={{ marginLeft: 4 }}>Logout</span>
            </button>
          </div>
        </div>

        {/* ── Row 2: Navigation — backend sections navigate in the same tab ── */}
        <div className="admin-bar-row2">
          <button
            className="admin-nav-btn"
            onClick={() => navigate('/admin')}
            disabled={saving}
            style={navBtnStyle(false)}
            title="Go to Admin Portal"
          >
            <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '11px', marginRight: 4 }} />
            Admin Panel
          </button>

          <div className="admin-divider-v" style={{ height: 16 }} />

          <button
            className="admin-nav-btn"
            onClick={() => navigate('/admin/edit')}
            disabled={saving}
            style={navBtnStyle(location.pathname === '/admin/edit')}
            title="Open Visual Editor"
          >
            Edit Home
          </button>

          <button
            className="admin-nav-btn"
            onClick={() => navigate('/admin/edit/gallery')}
            disabled={saving}
            style={navBtnStyle(location.pathname === '/admin/edit/gallery')}
            title="Open Gallery Editor"
          >
            Edit Gallery
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
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: toast.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(121,33,60,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            {toast.type === 'success' ? (
              <i className="fa-solid fa-check" style={{ color: '#10b981', fontSize: '18px' }} />
            ) : (
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#79213C', fontSize: '18px' }} />
            )}
          </div>

          <div style={{ flexGrow: 1, paddingRight: '8px' }}>
            <h4 style={{ margin: '0 0 4px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy)' }}>
              {toast.type === 'success' ? 'Saved!' : 'Notice'}
            </h4>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              {toast.message}
            </p>
          </div>

          <button
            onClick={closeToast}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: 0, lineHeight: 1, marginTop: '2px', transition: 'color 0.15s' }}
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
