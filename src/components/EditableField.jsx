import React, { useState, useRef, useEffect } from 'react';
import { useEditMode } from '../context/EditModeContext';
import { translateToNepali } from '../api/translate';

// Pencil icon
const PencilIcon = () => <i className="fa-solid fa-pen" style={{ fontSize: '10px' }}></i>;

/**
 * EditableField
 *
 * Bilingual support:
 *  - Pass `neValue` + `onChangeNe` for list/item fields (e.g. team names,
 *    initiative titles/descriptions) that carry {en, ne} data.
 *  - For content fields named like `aboutEn`, the Nepali sibling (`aboutNe`) is
 *    auto-derived from the draft, so no extra props are required.
 *  - In edit mode a EN / नेपाली toggle plus an "Auto-translate" button appear,
 *    letting admins fill the Nepali value for free without a paid API.
 */
export default function EditableField({
  field,
  multiline = false,
  children,
  style = {},
  value: propValue,
  onChange,
  neValue: propNeValue,
  onChangeNe,
  maxWords,
}) {
  const { isEditMode, draft, updateDraftField, showToast } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [translating, setTranslating] = useState(false);
  const inputRef = useRef(null);

  // Auto-derive the Nepali sibling for content fields like `aboutEn` -> `aboutNe`.
  const neField = field && field.endsWith('En') ? field.replace(/En$/, 'Ne') : null;

  // This field offers a Nepali side when an explicit onChangeNe is passed, or
  // when the field name lets us auto-derive one from the draft.
  const hasNeSide = !!onChangeNe || !!neField;

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

  const currentValue = propValue !== undefined ? propValue : (draft[field] ?? '');
  const currentNeValue =
    propNeValue !== undefined ? propNeValue : neField ? (draft[neField] ?? '') : '';

  const setValue = (lang, v) => {
    if (lang === 'ne') {
      if (onChangeNe) {
        onChangeNe(v);
      } else if (neField) {
        updateDraftField(neField, v);
      }
    } else if (onChange) {
      onChange(v);
    } else if (field) {
      updateDraftField(field, v);
    }
  };

  const countWords = (str) => {
    const t = String(str || '').trim();
    return t ? t.split(/\s+/).length : 0;
  };

  const handleChange = (e) => {
    const v = e.target.value;
    if (maxWords && countWords(v) > maxWords) {
      showToast('error', `Maximum ${maxWords} words allowed.`, false);
      return;
    }
    setValue(activeLang, v);
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

  const handleTranslate = async () => {
    const enText = currentValue;
    if (!enText || !String(enText).trim()) {
      showToast('error', 'Type the English text first, then auto-translate it.', false);
      return;
    }
    setTranslating(true);
    try {
      const translated = await translateToNepali(enText);
      if (translated) {
        setValue('ne', translated);
        setActiveLang('ne');
        showToast('success', 'Translated to Nepali.');
      } else {
        showToast('error', 'Translation came back empty — type the Nepali manually.', false);
      }
    } catch (err) {
      showToast('error', 'Auto-translate failed — type the Nepali text manually.', false);
    } finally {
      setTranslating(false);
    }
  };

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

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap',
  };

  const langTabStyle = (active) => ({
    padding: '5px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.78rem',
    background: active ? '#79213C' : '#f8fafc',
    color: active ? '#fff' : '#64748b',
  });

  const translateBtnStyle = {
    padding: '5px 14px',
    border: '1px solid #166534',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '0.78rem',
    background: translating ? '#dcfce7' : '#ecfdf5',
    color: '#166534',
  };

  const displayValue = activeLang === 'ne' ? currentNeValue : currentValue;

  // ── Active editing: full input/textarea ──
  if (isEditing) {
    return (
      <div style={{ position: 'relative', width: '100%' }}>
        {hasNeSide && (
          <div style={toolbarStyle}>
            <div style={{ display: 'inline-flex', overflow: 'hidden' }}>
              {[
                ['en', 'English'],
                ['ne', 'नेपाली'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setActiveLang(key)}
                  style={langTabStyle(activeLang === key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleTranslate}
              disabled={translating}
              style={{ ...translateBtnStyle, opacity: translating ? 0.6 : 1 }}
            >
              {translating ? 'Translating…' : '⟳ Auto-translate to नेपाली'}
            </button>
          </div>
        )}
        {multiline ? (
          <>
            <textarea
              ref={inputRef}
              value={displayValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              style={{ ...inputStyle, minHeight: '150px', resize: 'vertical' }}
              placeholder={`Type ${field || 'here'}…`}
            />
            {maxWords ? (
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: countWords(displayValue) >= maxWords ? '#b91c1c' : '#64748b',
                  textAlign: 'right',
                }}
              >
                {countWords(displayValue)} / {maxWords} words
              </div>
            ) : null}
          </>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
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

  const isEmpty =
    currentValue === null ||
    currentValue === undefined ||
    String(currentValue).trim() === '';

  // ── Idle edit mode: glassmorphism pill indicator ──
  return (
    <span
      onClick={() => {
        setActiveLang('en');
        setIsEditing(true);
      }}
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
