import React from 'react';
import { useEditMode } from '../context/EditModeContext';

// Icon components for the pill toolbar
const UpIcon = () => <i className="fa-solid fa-chevron-up" style={{ fontSize: '11px' }}></i>;
const DownIcon = () => <i className="fa-solid fa-chevron-down" style={{ fontSize: '11px' }}></i>;
const TrashIcon = () => <i className="fa-solid fa-trash-can" style={{ fontSize: '11px' }}></i>;
const EditTextIcon = () => <i className="fa-solid fa-pen" style={{ fontSize: '11px' }}></i>;

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
        border: '2px solid rgba(121, 33, 60, 0.18)',
        borderRadius: '14px',
        padding: '22px 8px 8px',
        margin: '20px 0',
        background: 'rgba(121, 33, 60, 0.02)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(121, 33, 60, 0.45)';
        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(121, 33, 60, 0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(121, 33, 60, 0.18)';
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
