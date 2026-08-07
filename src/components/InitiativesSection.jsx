import React from 'react';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import BlockControls from './BlockControls';
import HorizontalScrollCarousel from './HorizontalScrollCarousel';
import TraditionalDivider from './TraditionalDivider';
import SandyDivider from './SandyDivider';

export default function InitiativesSection({ content = {}, isLoading = false }) {
  const { lang } = useLang();
  // Re-run the fade observer once data loads so post-load .fade-in content is seen.
  const ref = useFadeIn(0.15, [isLoading]);
  const { isEditMode, draft, updateDraftArray } = useEditMode();

  // Use draft when inside admin provider; fall back to content prop on public page
  const hasDraft = draft && Object.keys(draft).length > 0;
  const initiativesList = hasDraft ? (draft.initiatives || []) : (content?.initiatives || []);
  const useCarousel = initiativesList.length > 3;

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
      <section id="initiatives" className="lokta-texture" style={{ padding: '4rem 0 6.5rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%' }}>
          <div className="section-header" style={{ opacity: 1, transform: 'none' }}>
            <div className="sk brand" style={{ width: 260, height: '2.2rem', margin: '0 auto' }} />
            <TraditionalDivider style={{ margin: '0.8rem auto 0.5rem' }} />
          </div>
          <div className="initiatives-grid" style={{ marginTop: '2.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="init-card">
                <div className="init-icon">
                  <div className="sk rounded" style={{ width: '100%', height: '100%' }} />
                </div>
                <div className="sk brand" style={{ width: '58%', height: 18, margin: '0 auto 0.6rem' }} />
                <div className="sk" style={{ width: '100%', height: 12, margin: '0 auto 8px' }} />
                <div className="sk" style={{ width: '92%', height: 12, margin: '0 auto 8px' }} />
                <div className="sk" style={{ width: '70%', height: 12, margin: '0 auto 12px' }} />
                <div className="sk" style={{ width: 90, height: 14, margin: '0 auto' }} />
              </div>
            ))}
          </div>
        </div>
        <SandyDivider bottomColor="#F5ECDA" />
      </section>
    );
  }

  const renderHeader = (forceVisible = false) => (
    <div 
      className={`section-header numbered-head ${forceVisible ? '' : 'fade-in'}`} 
      style={{ padding: 0, margin: '0 auto 2rem', textAlign: 'center', ...(forceVisible ? { opacity: 1, transform: 'none' } : {}) }}
    >
      <span className="numbered-num">04</span>
      <span className="numbered-kicker">
        {lang === 'en' ? 'Focus Areas' : 'मुख्य क्षेत्रहरू'}
      </span>
      <h2 className="section-title">
        {lang === 'en' ? 'What We Do' : <span className="devanagari">हाम्रा पहलहरू</span>}
      </h2>
      <TraditionalDivider style={{ margin: '0.8rem auto 0.5rem' }} />
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
          <EditableField
            value={init.titleEn}
            onChange={(val) => handleUpdate(i, 'titleEn', val)}
            neValue={init.titleNe}
            onChangeNe={(val) => handleUpdate(i, 'titleNe', val)}
          >
            {lang === 'en' ? init.titleEn : init.titleNe}
          </EditableField>
        </h4>
        <p className="init-desc">
          <EditableField
            multiline
            value={init.desc}
            onChange={(val) => handleUpdate(i, 'desc', val)}
            neValue={init.descNe}
            onChangeNe={(val) => handleUpdate(i, 'descNe', val)}
          >
            {lang === 'en' ? init.desc : (init.descNe || init.desc)}
          </EditableField>
        </p>
        <span className="init-link">
          <span className="init-link-label">{lang === 'en' ? 'Discover' : 'हेर्नुहोस्'}</span>
          <i className="fa-solid fa-arrow-right-long" />
        </span>
      </div>
    </BlockControls>
  );

  return (
    <section id="initiatives" ref={ref} className="lokta-texture" style={{ padding: useCarousel ? '0 0 7rem' : '4rem 0 6.5rem' }}>
      {useCarousel ? (
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
        <div style={{ textAlign: 'center', marginTop: '2rem', position: 'relative', zIndex: 6 }}>
          <button 
            onClick={handleAdd}
            style={{
              background: 'transparent',
              border: '2px dashed var(--primary)',
              color: 'var(--primary)',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'background 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(121, 33, 60, 0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <i className="fa-solid fa-plus"></i>
            <span>Add Initiative</span>
          </button>
        </div>
      )}
      <SandyDivider bottomColor="#F5ECDA" />
    </section>
  );
}
