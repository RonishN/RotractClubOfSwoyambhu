import React from 'react';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import EditableImage from './EditableImage';
import BlockControls from './BlockControls';
import HorizontalScrollCarousel from './HorizontalScrollCarousel';
import TraditionalDivider from './TraditionalDivider';
import MandalaFrame3D from './MandalaFrame3D';
import SandyDivider from './SandyDivider';


export default function TeamSection({ content = {}, isLoading = false }) {
  const { lang } = useLang();
  // Pass [isLoading] so the observer re-runs once data is loaded
  const ref = useFadeIn(0.15, [isLoading]);
  const { isEditMode, draft, updateDraftArray } = useEditMode();

  const hasDraft = draft && Object.keys(draft).length > 0;
  const membersList = hasDraft ? (draft.team || []) : (content?.team || []);
  const useCarousel = membersList.length > 5;

  if (isLoading) {
    return (
      <section id="team" className="lokta-texture" style={{ padding: '4.5rem 0 6.5rem' }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 5%' }}>
          <div className="section-header" style={{ opacity: 1, transform: 'none' }}>
            <div className="sk brand" style={{ width: 260, height: '2.2rem', margin: '0 auto' }} />
            <TraditionalDivider style={{ margin: '0.8rem auto 0.5rem' }} />
          </div>
          <div className="team-grid" style={{ marginTop: '2.8rem' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="team-card" style={{ width: '100%', maxWidth: 260 }}>
                <div className="team-avatar-wrapper">
                  <div className="avatar-placeholder">
                    <div className="sk rounded" style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
                <div className="sk brand" style={{ width: '68%', height: 16, margin: '1rem auto 0' }} />
                <div className="sk" style={{ width: '46%', height: 20, margin: '0.6rem auto 0', borderRadius: 999 }} />
              </div>
            ))}
          </div>
        </div>
        <SandyDivider bottomColor="#7A1F34" />
      </section>
    );
  }

  const handleUpdate = (index, field, value) => {
    const newList = [...membersList];
    newList[index] = { ...newList[index], [field]: value };
    updateDraftArray('team', newList);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newList = [...membersList];
    const temp = newList[index];
    newList[index] = newList[index - 1];
    newList[index - 1] = temp;
    updateDraftArray('team', newList);
  };

  const handleMoveDown = (index) => {
    if (index === membersList.length - 1) return;
    const newList = [...membersList];
    const temp = newList[index];
    newList[index] = newList[index + 1];
    newList[index + 1] = temp;
    updateDraftArray('team', newList);
  };

  const handleDelete = (index) => {
    const newList = [...membersList];
    newList.splice(index, 1);
    updateDraftArray('team', newList);
  };

  const handleAdd = () => {
    const newList = [...membersList, {
      id: Date.now().toString(),
      name: 'New Member',
      roleEn: 'Role',
      roleNe: 'भूमिका',
      linkedin: '',
      email: '',
      imgUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3EUpload Image%3C/text%3E%3C/svg%3E"
    }];
    updateDraftArray('team', newList);
  };

  const renderMemberCard = (m, i) => {
    const hasLinkedIn = !!m.linkedin;
    const hasEmail = !!m.email;
    const hasContact = hasLinkedIn || hasEmail;

    return (
      <BlockControls 
        key={m.id || i}
        isFirst={i === 0}
        isLast={i === membersList.length - 1}
        onMoveUp={() => handleMoveUp(i)}
        onMoveDown={() => handleMoveDown(i)}
        onDelete={() => handleDelete(i)}
      >
        <div className="team-card fade-in delay-1" style={{ opacity: 1, transform: 'none' }}>
          {/* Circular Avatar with Concentric Mandala Ring */}
          <div className="team-avatar-wrapper">
            <MandalaFrame3D />
            <div className="avatar-placeholder">
              <EditableImage 
                src={m.imgUrl} 
                alt={m.name} 
                className="avatar-image"
                onChange={(url) => handleUpdate(i, 'imgUrl', url)}
                cropType="circle"
                hideEditBadge={true}
              />
            </div>

            {/* Edit badge outside the circular container */}
            {isEditMode && (
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#9E1F42',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(121, 33, 60, 0.45)',
                pointerEvents: 'none',
                fontWeight: 600,
                zIndex: 12
              }}>
                <i className="fa-solid fa-pen" style={{ fontSize: '10px' }}></i>
              </div>
            )}
          </div>

          {/* Member Name */}
          <h4 className="team-name">
            <EditableField 
              value={m.name} 
              onChange={(val) => handleUpdate(i, 'name', val)}
              neValue={m.nameNe}
              onChangeNe={(val) => handleUpdate(i, 'nameNe', val)}
            >
              {lang === 'en' ? m.name : (m.nameNe || m.name)}
            </EditableField>
          </h4>

          {/* Classic Magenta / Pink Role Pill Badge */}
          <div className="team-role">
            <EditableField 
              value={m.roleEn} 
              onChange={(val) => handleUpdate(i, 'roleEn', val)}
              neValue={m.roleNe}
              onChangeNe={(val) => handleUpdate(i, 'roleNe', val)}
            >
              {lang === 'en' ? m.roleEn : <span className="devanagari">{m.roleNe}</span>}
            </EditableField>
          </div>

          {/* Social / Contact Links directly Under Title Text (Hover Only) */}
          <div className="team-social-links">
            {hasLinkedIn && (
              <a 
                href={m.linkedin.startsWith('http') ? m.linkedin : `https://${m.linkedin}`}
                target="_blank" 
                rel="noopener noreferrer" 
                className="team-social-btn team-social-linkedin"
                title={`${m.name}'s LinkedIn`}
                onClick={(e) => isEditMode && e.preventDefault()}
              >
                <i className="fa-brands fa-linkedin-in" style={{ fontSize: '13px' }}></i>
              </a>
            )}
            {hasEmail && (
              <a 
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}`} 
                className="team-social-btn team-social-email"
                title={`Email ${m.name}`}
                onClick={(e) => isEditMode && e.preventDefault()}
              >
                <i className="fa-solid fa-envelope" style={{ fontSize: '13px' }}></i>
              </a>
            )}
          </div>

          {/* Edit Mode Inputs for LinkedIn and Email */}
          {isEditMode && (
            <div className="team-edit-contact-fields">
              <div className="team-edit-contact-row">
                <span className="team-edit-contact-label">LinkedIn:</span>
                <input 
                  type="text" 
                  placeholder="https://linkedin.com/in/..." 
                  value={m.linkedin || ''} 
                  onChange={(e) => handleUpdate(i, 'linkedin', e.target.value)}
                  className="team-contact-input"
                />
              </div>
              <div className="team-edit-contact-row">
                <span className="team-edit-contact-label">Email:</span>
                <input 
                  type="email" 
                  placeholder="email@rotaract.org" 
                  value={m.email || ''} 
                  onChange={(e) => handleUpdate(i, 'email', e.target.value)}
                  className="team-contact-input"
                />
              </div>
            </div>
          )}
        </div>
      </BlockControls>
    );
  };

  const renderHeader = (forceVisible = false) => (
    <div 
      className={`section-header numbered-head ${forceVisible ? '' : 'fade-in'}`} 
      style={{ padding: 0, margin: '0 auto 2rem', textAlign: 'center', ...(forceVisible ? { opacity: 1, transform: 'none' } : {}) }}
    >
      <span className="numbered-num">03</span>
      <span className="numbered-kicker">
        {lang === 'en' ? 'The People' : 'हाम्रा मानिसहरू'}
      </span>
      <h2 className="section-title">
        {lang === 'en' ? 'Meet Our Leadership' : <span className="devanagari">हाम्रो नेतृत्व</span>}
      </h2>
      <TraditionalDivider style={{ margin: '0.8rem auto 0.5rem' }} />
    </div>
  );

  return (
    <section id="team" ref={ref} className="lokta-texture" style={{ padding: useCarousel ? '0 0 7rem' : '4.5rem 0 6.5rem' }}>
      {useCarousel ? (
        <HorizontalScrollCarousel 
          items={membersList} 
          renderItem={renderMemberCard} 
          chunkSize={999}
          header={renderHeader(true)}
        />
      ) : (
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 5%' }}>
          {renderHeader()}
          <div className="team-grid fade-in delay-1" style={{ opacity: 1, transform: 'none', marginTop: '2.8rem' }}>
            {membersList.map((m, i) => renderMemberCard(m, i))}
          </div>
        </div>
      )}

      {isEditMode && (
        <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: useCarousel ? '0 5%' : '0', position: 'relative', zIndex: 6 }}>
          <button 
            onClick={handleAdd}
            style={{
              background: '#FFFFFF',
              border: '2px dashed #9E1F42',
              color: '#9E1F42',
              padding: '12px 28px',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(121, 33, 60, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#9E1F42';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = '#9E1F42';
            }}
          >
            <i className="fa-solid fa-user-plus"></i>
            <span>Add Team Member</span>
          </button>
        </div>
      )}
      <SandyDivider bottomColor="#7A1F34" />
    </section>
  );
}
