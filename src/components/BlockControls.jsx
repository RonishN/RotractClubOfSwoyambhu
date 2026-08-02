import React from 'react';
import { useEditMode } from '../context/EditModeContext';

// SVG icon components for the pill toolbar
const UpIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const DownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const TrashIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

const EditTextIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/**
 * BlockControls — wraps any editable block with always-visible controls
 * in edit mode. Now uses a floating pill with SVG icon-only buttons
 * and native tooltip via title attribute.
 */
export default function BlockControls({ children, onMoveUp, onMoveDown, onDelete, onEdit, isFirst, isLast }) {
  const { isEditMode } = useEditMode();

  if (!isEditMode) {
    return <>{children}</>;
  }

  return (
    <div
      className="admin-block-controls"
      style={{
        position: 'relative',
        border: '2px solid rgba(226, 0, 122, 0.15)',
        borderRadius: '14px',
        padding: '22px 8px 8px',
        margin: '20px 0',
        background: 'rgba(226, 0, 122, 0.015)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(226,0,122,0.38)';
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(226,0,122,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(226,0,122,0.15)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Floating pill toolbar — appears on hover via CSS */}
      <div className="block-tools-pill">
        {/* Move Up */}
        <button
          className="block-pill-btn block-pill-btn-nav"
          onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
          disabled={isFirst}
          title="Move Up"
        >
          <UpIcon />
        </button>

        {/* Move Down */}
        <button
          className="block-pill-btn block-pill-btn-nav"
          onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
          disabled={isLast}
          title="Move Down"
        >
          <DownIcon />
        </button>

        <div className="block-pill-divider" />

        {/* Delete */}
        <button
          className="block-pill-btn block-pill-btn-delete"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this item?')) onDelete?.();
          }}
          title="Delete"
        >
          <TrashIcon />
        </button>

        {onEdit && (
          <>
            <div className="block-pill-divider" />
            <button
              className="block-pill-btn block-pill-btn-edit"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              title="Edit Captions"
            >
              <EditTextIcon />
            </button>
          </>
        )}
      </div>

      {children}
    </div>
  );
}
