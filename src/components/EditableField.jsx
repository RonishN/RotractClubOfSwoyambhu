import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '../context/EditModeContext';

// Pencil SVG icon
const PencilIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default function EditableField({ field, multiline = false, children, style = {}, value: propValue, onChange }) {
  const { isEditMode, draft, updateDraftField } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  // Close the editing state when the field key changes (e.g., language switch EN↔NE).
  useEffect(() => {
    setIsEditing(false);
  }, [field]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const val = inputRef.current.value;
      inputRef.current.value = '';
      inputRef.current.value = val;
    }
  }, [isEditing]);

  if (!isEditMode) {
    return <>{children}</>;
  }

  const value = propValue !== undefined ? propValue : (draft[field] ?? '');

  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    } else if (field) {
      updateDraftField(field, e.target.value);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
    // Commit single-line inputs on Enter
    if (e.key === 'Enter' && !multiline && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
    }
  };

  // ── Active editing: full input/textarea ──
  if (isEditing) {
    const inputStyle = {
      width: '100%',
      background: 'white',
      color: '#1a2340',
      border: '2px solid var(--magenta)',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      textAlign: 'inherit',
      outline: 'none',
      boxShadow: '0 8px 30px rgba(226,0,122,0.15), 0 0 0 4px rgba(226,0,122,0.08)',
      position: 'relative',
      zIndex: 10,
      boxSizing: 'border-box',
      ...style,
    };

    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {multiline ? (
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
            placeholder={`Type ${field || 'here'}…`}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={inputStyle}
            placeholder={`Type ${field || 'here'}…`}
          />
        )}
      </div>
    );
  }

  const isEmpty = value === null || value === undefined || String(value).trim() === '';

  // ── Idle edit mode: glassmorphism pill indicator ──
  return (
    <span
      onClick={() => setIsEditing(true)}
      className="editable-pill"
      style={style}
      title="Click to edit"
    >
      {isEmpty ? (
        <span className="editable-pill-empty">
          <PencilIcon />
          Click to add {field || 'text'}…
        </span>
      ) : (
        <>
          {children}
          <span className="editable-pill-pencil" aria-hidden="true">
            <PencilIcon />
          </span>
        </>
      )}
    </span>
  );
}
