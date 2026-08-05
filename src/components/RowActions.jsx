import React, { useState, useRef, useEffect } from 'react';

const baseIconBtn = (danger) => ({
  width: 32,
  height: 32,
  borderRadius: 8,
  border: danger ? '1px solid #fecaca' : '1px solid #e2e8f0',
  background: danger ? 'rgba(239, 68, 68, 0.06)' : '#ffffff',
  color: danger ? '#dc2626' : '#334155',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.78rem',
  transition: 'all 0.15s ease',
});

export default function RowActions({
  onView,
  onEdit,
  onDelete,
  viewTitle = 'View',
  editTitle = 'Edit',
  deleteTitle = 'Delete',
  more = [],
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const run = (fn) => (e) => {
    e.stopPropagation();
    setOpen(false);
    fn && fn();
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        display: 'inline-flex',
        gap: 6,
        alignItems: 'center',
        justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {onView && (
        <button
          type="button"
          title={viewTitle}
          aria-label={viewTitle}
          onClick={run(onView)}
          style={baseIconBtn(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--saffron)';
            e.currentTarget.style.color = 'var(--saffron)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(232, 135, 26, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <i className="fa-solid fa-eye" />
        </button>
      )}

      {onEdit && (
        <button
          type="button"
          title={editTitle}
          aria-label={editTitle}
          onClick={run(onEdit)}
          style={baseIconBtn(false)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--magenta)';
            e.currentTarget.style.color = 'var(--magenta)';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(121, 33, 60, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <i className="fa-solid fa-pen" />
        </button>
      )}

      {onDelete && (
        <button
          type="button"
          title={deleteTitle}
          aria-label={deleteTitle}
          onClick={run(onDelete)}
          style={baseIconBtn(true)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#f87171';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.color = '#b91c1c';
            e.currentTarget.style.boxShadow = '0 4px 10px rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#fecaca';
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <i className="fa-solid fa-trash-can" />
        </button>
      )}

      {more.filter((m) => !m.hidden).length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="More Options"
            aria-label="More Options"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            style={{ ...baseIconBtn(false), background: open ? 'rgba(121, 33, 60, 0.08)' : '#ffffff', color: open ? 'var(--magenta)' : '#334155', borderColor: open ? 'var(--magenta)' : '#e2e8f0' }}
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>

          {open && (
            <div
              style={{
                position: 'absolute',
                right: align === 'right' ? 0 : 'auto',
                left: align === 'left' ? 0 : 'auto',
                top: 'calc(100% + 6px)',
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                boxShadow: '0 14px 34px rgba(15, 23, 42, 0.16)',
                zIndex: 60,
                minWidth: 200,
                padding: 6,
                overflow: 'hidden',
              }}
            >
              {more.map((m, i) =>
                m.hidden ? null : (
                  <button
                    key={i}
                    type="button"
                    disabled={m.disabled}
                    onClick={run(m.onClick)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '9px 12px',
                      border: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      cursor: m.disabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: m.danger ? '#dc2626' : '#334155',
                      opacity: m.disabled ? 0.5 : 1,
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!m.disabled) e.currentTarget.style.background = m.danger ? 'rgba(239, 68, 68, 0.08)' : '#f1f5f9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <i className={`fa-solid ${m.icon || 'fa-ellipsis'}`} style={{ width: 16, textAlign: 'center', fontSize: '0.78rem' }} />
                    <span style={{ flex: 1 }}>{m.label}</span>
                    {m.disabled && <i className="fa-solid fa-lock" style={{ fontSize: '0.7rem', color: '#94a3b8' }} />}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
