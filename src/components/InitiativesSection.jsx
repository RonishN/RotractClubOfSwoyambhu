import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import BlockControls from './BlockControls';
import HorizontalScrollCarousel from './HorizontalScrollCarousel';
import TraditionalDivider from './TraditionalDivider';

export default function InitiativesSection({ content = {}, isLoading = false }) {
  const { lang } = useLang();
  const ref = useFadeIn();
  const { isEditMode, draft, updateDraftArray } = useEditMode();

  // Use draft when inside admin provider; fall back to content prop on public page
  const hasDraft = draft && Object.keys(draft).length > 0;
  const initiativesList = hasDraft ? (draft.initiatives || []) : (content?.initiatives || []);

  const handleUpdate = (index, field, value) => {
    const newList = [...initiativesList];
    newList[index] = { ...newList[index], [field]: value };
    updateDraftArray('initiatives', newList);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...initiativesList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    updateDraftArray('initiatives', newList);
  };

  const handleMoveDown = (index) => {
    if (index === initiativesList.length - 1) return;
    const newList = [...initiativesList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    updateDraftArray('initiatives', newList);
  };

  const handleDelete = (index) => {
    const newList = [...initiativesList];
    newList.splice(index, 1);
    updateDraftArray('initiatives', newList);
  };

  const handleAdd = () => {
    const newList = [...initiativesList, {
      id: Date.now().toString(),
      titleEn: 'New Initiative',
      titleNe: 'नयाँ पहल',
      desc: 'Description of the initiative.',
      iconSvg: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z' // Default info icon
    }];
    updateDraftArray('initiatives', newList);
  };

  if (isLoading) {
    return (
      <section id="initiatives" className="lokta-texture" style={{ padding: '10rem 5%' }}>
        <div className="section-header">
          <h2 className="section-title"><Skeleton width={250} /></h2>
        </div>
        <div className="initiatives-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="init-card">
              <div className="init-icon" style={{ display: 'inline-block' }}><Skeleton circle width={50} height={50} /></div>
              <h4 className="init-title"><Skeleton width="60%" /></h4>
              <p className="init-desc"><Skeleton count={3} /></p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const renderHeader = (forceVisible = false) => (
    <div 
      className={`section-header ${forceVisible ? '' : 'fade-in'}`} 
      style={{ padding: 0, ...(forceVisible ? { opacity: 1, transform: 'none' } : {}) }}
    >
      <h2 className="section-title">
        {lang === 'en' ? 'What We Do' : <span className="devanagari">हाम्रा पहलहरू</span>}
      </h2>
    </div>
  );

  const renderInitiativeCard = (init, i) => (
    <BlockControls
      key={init.id || i}
      isFirst={i === 0}
      isLast={i === initiativesList.length - 1}
      onMoveUp={() => handleMoveUp(i)}
      onMoveDown={() => handleMoveDown(i)}
      onDelete={() => handleDelete(i)}
    >
      <div className="init-card">
        <div className="init-icon" title={isEditMode ? 'SVG path can be edited in Advanced settings (not yet implemented)' : ''}>
          <svg viewBox="0 0 24 24"><path d={init.iconSvg} /></svg>
        </div>
        <h4 className={`init-title ${lang !== 'en' ? 'devanagari' : ''}`}>
          <EditableField value={lang === 'en' ? init.titleEn : init.titleNe} onChange={(val) => handleUpdate(i, lang === 'en' ? 'titleEn' : 'titleNe', val)}>
            {lang === 'en' ? init.titleEn : init.titleNe}
          </EditableField>
        </h4>
        <p className="init-desc">
          <EditableField multiline value={init.desc} onChange={(val) => handleUpdate(i, 'desc', val)}>
            {init.desc}
          </EditableField>
        </p>
      </div>
    </BlockControls>
  );

  return (
    <section id="initiatives" ref={ref} className="lokta-texture" style={{ padding: '4rem 0' }}>
      {initiativesList.length > 3 ? (
        <HorizontalScrollCarousel 
          items={initiativesList} 
          renderItem={renderInitiativeCard} 
          chunkSize={999}
          header={renderHeader(true)}
        />
      ) : (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          {renderHeader()}
          <div className="initiatives-grid fade-in delay-1" style={{ opacity: 1, transform: 'none', marginTop: '2.5rem' }}>
            {initiativesList.map((init, i) => renderInitiativeCard(init, i))}
          </div>
        </div>
      )}

      {isEditMode && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button 
            onClick={handleAdd}
            style={{
              background: 'transparent',
              border: '2px dashed var(--magenta)',
              color: 'var(--magenta)',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(226,0,122,0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            + Add Initiative
          </button>
        </div>
      )}
    </section>
  );
}
