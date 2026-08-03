import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '../context/EditModeContext';

// Pencil icon
const PencilIcon = () => <i className="fa-solid fa-pen" style={{ fontSize: '10px' }}></i>;

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
      border: '2px solid #79213C',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
      lineHeight: 'inherit',
      textAlign: 'inherit',
      outline: 'none',
      boxShadow: '0 8px 30px rgba(121,33,60,0.15), 0 0 0 4px rgba(121,33,60,0.08)',
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
