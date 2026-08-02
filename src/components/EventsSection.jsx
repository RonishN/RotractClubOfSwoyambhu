import React from 'react';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import useFadeIn from '../hooks/useFadeIn';
import EditableField from './EditableField';
import BlockControls from './BlockControls';
import TraditionalDivider from './TraditionalDivider';

export default function EventsSection({ content = {} }) {
  const { lang } = useLang();
  const ref = useFadeIn();
  const { isEditMode, draft, updateDraftArray } = useEditMode();

  // Use draft when inside admin provider; fall back to content prop on public page
  const hasDraft = draft && Object.keys(draft).length > 0;
  const eventsList = hasDraft ? (draft.events || []) : (content?.events || []);

  const handleUpdate = (index, field, value) => {
    const newList = [...eventsList];
    newList[index] = { ...newList[index], [field]: value };
    updateDraftArray('events', newList);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...eventsList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    updateDraftArray('events', newList);
  };

  const handleMoveDown = (index) => {
    if (index === eventsList.length - 1) return;
    const newList = [...eventsList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    updateDraftArray('events', newList);
  };

  const handleDelete = (index) => {
    const newList = [...eventsList];
    newList.splice(index, 1);
    updateDraftArray('events', newList);
  };

  const handleAdd = () => {
    const newList = [...eventsList, {
      id: Date.now().toString(),
      day: '01',
      month: 'JAN',
      titleEn: 'New Event',
      titleNe: 'नयाँ कार्यक्रम',
      desc: 'Description goes here.'
    }];
    updateDraftArray('events', newList);
  };

  return (
    <section id="events" className="lokta-texture" ref={ref}>
      <div className="section-header fade-in">
        <h2 className="section-title">
          {lang === 'en' ? 'Upcoming Events' : <span className="devanagari">सूचना तथा कार्यक्रम</span>}
        </h2>
      </div>

      {/* Magazine-style event cards */}
      <div className="events-magazine fade-in delay-1" style={{ opacity: 1, transform: 'none' }}>
        {eventsList.map((ev, i) => (
          <BlockControls
            key={ev.id || i}
            isFirst={i === 0}
            isLast={i === eventsList.length - 1}
            onMoveUp={() => handleMoveUp(i)}
            onMoveDown={() => handleMoveDown(i)}
            onDelete={() => handleDelete(i)}
          >
            <div className="event-magazine-card">
              {/* Colored left accent bar */}
              <div className="event-card-accent" />

              {/* Date badge */}
              <div className="event-card-date-badge">
                <div className="event-card-day">
                  <EditableField value={ev.day} onChange={(val) => handleUpdate(i, 'day', val)}>
                    {ev.day}
                  </EditableField>
                </div>
                <div className="event-card-month">
                  <EditableField value={ev.month} onChange={(val) => handleUpdate(i, 'month', val)}>
                    {ev.month}
                  </EditableField>
                </div>
              </div>

              {/* Event details */}
              <div className="event-card-body">
                <h4 className="event-card-title">
                  <EditableField
                    value={lang === 'en' ? ev.titleEn : ev.titleNe}
                    onChange={(val) => handleUpdate(i, lang === 'en' ? 'titleEn' : 'titleNe', val)}
                  >
                    {lang === 'en' ? ev.titleEn : <span className="devanagari">{ev.titleNe}</span>}
                  </EditableField>
                </h4>
                <p className="event-card-desc">
                  <EditableField multiline value={ev.desc} onChange={(val) => handleUpdate(i, 'desc', val)}>
                    {ev.desc}
                  </EditableField>
                </p>
              </div>
            </div>
          </BlockControls>
        ))}
      </div>

      {isEditMode && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={handleAdd}
            style={{
              background: 'transparent',
              border: '2px dashed var(--magenta)',
              color: 'var(--magenta)',
              padding: '12px 28px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'background 0.2s, transform 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(226,0,122,0.06)';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>＋</span> Add Event
          </button>
        </div>
      )}
    </section>
  );
}
