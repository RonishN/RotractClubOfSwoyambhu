import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import EditableImage from './EditableImage';
import BlockControls from './BlockControls';
import HorizontalScrollCarousel from './HorizontalScrollCarousel';
import TraditionalDivider from './TraditionalDivider';

// Decorative mandala ring SVG drawn behind each avatar
const MandalaRing = () => (
  <svg className="mandala-ring" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="none">
    <circle cx="50" cy="50" r="48" stroke="#C9962B" strokeWidth="0.6" strokeDasharray="2 3" />
    <circle cx="50" cy="50" r="42" stroke="#E8871A" strokeWidth="0.4" strokeDasharray="3 2" />
    <circle cx="50" cy="50" r="36" stroke="#C9962B" strokeWidth="0.5" />
    {/* 8 radial lines */}
    {[0,45,90,135,180,225,270,315].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 50 + 36 * Math.cos(rad);
      const y1 = 50 + 36 * Math.sin(rad);
      const x2 = 50 + 47 * Math.cos(rad);
      const y2 = 50 + 47 * Math.sin(rad);
      return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E8871A" strokeWidth="0.5" opacity="0.6" />;
    })}
    {/* Diamond tips at cardinal points */}
    {[0,90,180,270].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const cx = 50 + 48 * Math.cos(rad);
      const cy = 50 + 48 * Math.sin(rad);
      return <circle key={`d-${angle}`} cx={cx} cy={cy} r="1.5" fill="#C9962B" opacity="0.7" />;
    })}
  </svg>
);

export default function TeamSection({ content = {}, isLoading = false }) {
  const { lang } = useLang();
  // Pass [isLoading] so the observer re-runs once data is loaded
  const ref = useFadeIn(0.15, [isLoading]);
  const { isEditMode, draft, updateDraftArray } = useEditMode();

  const hasDraft = draft && Object.keys(draft).length > 0;
  const membersList = hasDraft ? (draft.team || []) : (content?.team || []);

  if (isLoading) {
    return (
      <section id="team" className="lokta-texture" style={{ padding: '8rem 5%' }}>
        <div className="section-header">
          <h2 className="section-title"><Skeleton width={250} /></h2>
        </div>
        <div className="team-grid">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="team-card">
              <div className="avatar-placeholder" style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}>
                <Skeleton circle width="100%" height="100%" />
              </div>
              <h3 className="team-name" style={{ marginTop: '1rem' }}><Skeleton width="70%" /></h3>
              <p className="team-role" style={{ margin: '0.5rem auto 0' }}><Skeleton width="50%" /></p>
            </div>
          ))}
        </div>
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
            <MandalaRing />
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
                background: 'var(--magenta)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(226,0,122,0.45)',
                pointerEvents: 'none',
                fontWeight: 600,
                zIndex: 12
              }}>
                ✏️
              </div>
            )}
          </div>

          {/* Member Name */}
          <h4 className="team-name">
            <EditableField 
              value={m.name} 
              onChange={(val) => handleUpdate(i, 'name', val)}
            >
              {m.name}
            </EditableField>
          </h4>

          {/* Classic Magenta / Pink Role Pill Badge */}
          <div className="team-role">
            <EditableField 
              value={lang === 'en' ? m.roleEn : m.roleNe} 
              onChange={(val) => handleUpdate(i, lang === 'en' ? 'roleEn' : 'roleNe', val)}
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
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.22a1.6 1.6 0 0 0-1.6 1.6c0 .88.72 1.6 1.6 1.6.88 0 1.6-.72 1.6-1.6 0-.88-.72-1.6-1.6-1.6Z"/>
                </svg>
              </a>
            )}
            {hasEmail && (
              <a 
                href={`mailto:${m.email}`} 
                className="team-social-btn team-social-email"
                title={`Email ${m.name}`}
                onClick={(e) => isEditMode && e.preventDefault()}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
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
      className={`section-header ${forceVisible ? '' : 'fade-in'}`} 
      style={{ padding: 0, ...(forceVisible ? { opacity: 1, transform: 'none' } : {}) }}
    >
      <h2 className="section-title">
        {lang === 'en' ? 'Meet Our Leadership' : <span className="devanagari">हाम्रो नेतृत्व</span>}
      </h2>
    </div>
  );

  return (
    <section id="team" ref={ref} className="lokta-texture" style={{ padding: '4.5rem 0 5rem' }}>
      {membersList.length > 5 ? (
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
        <div style={{ textAlign: 'center', marginTop: '2.5rem', padding: membersList.length > 5 ? '0 5%' : '0' }}>
          <button 
            onClick={handleAdd}
            style={{
              background: '#FFFFFF',
              border: '2px dashed var(--magenta)',
              color: 'var(--magenta)',
              padding: '12px 28px',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              boxShadow: '0 4px 14px rgba(226,0,122,0.15)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--magenta)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.color = 'var(--magenta)';
            }}
          >
            + Add Team Member
          </button>
        </div>
      )}
    </section>
  );
}
