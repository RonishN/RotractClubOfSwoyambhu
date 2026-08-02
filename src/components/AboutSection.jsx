import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import useFadeIn from '../hooks/useFadeIn';
import TraditionalDivider from './TraditionalDivider';

const VALUES = [
  {
    icon: <path d="M12 2L2 22l10-3 10 3L12 2zm0 13l-4.5 1.5L12 7l4.5 9.5L12 15z" />,
    titleEn: 'Leadership', titleNe: 'नेतृत्व',
    descEn: 'Empowering youth to take charge and create meaningful impact in their communities.',
    descNe: 'युवाहरूलाई नेतृत्व लिन र आफ्नो समुदायमा अर्थपूर्ण प्रभाव सिर्जना गर्न सशक्त बनाउने।',
  },
  {
    icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
    titleEn: 'Fellowship', titleNe: 'भाइचारा',
    descEn: 'Building lifelong bonds through shared goals, laughter, and mutual respect.',
    descNe: 'साझा लक्ष्य, हाँसो र आपसी सम्मान मार्फत आजीवन बन्धन निर्माण गर्ने।',
  },
  {
    icon: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
    titleEn: 'Service', titleNe: 'सेवा',
    descEn: "Putting 'Service Above Self' in every community initiative we undertake.",
    descNe: "हामीले गर्ने प्रत्येक सामुदायिक पहलमा 'स्वार्थ भन्दा माथि सेवा' राख्ने।",
  },
  {
    icon: <path d="M12 22s-7-5.5-7-11c0-2.5 1.5-4.5 3.5-5.5C9.5 3 11 2 12 2s2.5 1 3.5 3.5C17.5 6.5 19 8.5 19 11c0 5.5-7 11-7 11zM12 4.5c-1 2-2 3-3.5 3.5-1.5.5-2.5 2-2.5 3 0 3.5 4.5 8 6 9.5 1.5-1.5 6-6 6-9.5 0-1-1-2.5-2.5-3-1.5-.5-2.5-1.5-3.5-3.5z" />,
    titleEn: 'Cultural Pride', titleNe: 'सांस्कृतिक गौरव',
    descEn: 'Preserving and celebrating the sacred heritage of Swoyambhu for generations.',
    descNe: 'स्वयम्भूको पवित्र सम्पदाको पुस्तौंपुस्ता संरक्षण र उत्सव मनाउने।',
  },
];

const DELAYS = ['delay-1', 'delay-2', 'delay-3', 'delay-4'];

// Skeleton placeholder that matches the About text block layout
function AboutSkeleton() {
  return (
    <SkeletonTheme baseColor="#ede8e0" highlightColor="#f7f3ed">
      {/* About text paragraphs */}
      <div style={{ maxWidth: 900, margin: '0 auto 4rem', textAlign: 'center' }}>
        <Skeleton count={3} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton width="70%" height={20} borderRadius={6} style={{ marginBottom: 24 }} />
        <Skeleton count={2} height={20} borderRadius={6} style={{ marginBottom: 12 }} />
        <Skeleton width="50%" height={20} borderRadius={6} />
      </div>

      {/* Value cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2.5rem',
      }}>
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            style={{
              height: 280,
              background: 'white',
              borderRadius: 20,
              boxShadow: '0 15px 40px rgba(26,35,64,0.04)',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <Skeleton circle width={60} height={60} style={{ margin: '0 auto 1.5rem' }} />
            <Skeleton height={22} width="60%" borderRadius={6} style={{ margin: '0 auto 0.8rem', display: 'block' }} />
            <Skeleton count={2} height={16} borderRadius={6} style={{ marginBottom: 6 }} />
            <Skeleton width="70%" height={16} borderRadius={6} />
          </div>
        ))}
      </div>
    </SkeletonTheme>
  );
}

export default function AboutSection({ content, isLoading }) {
  const { lang } = useLang();
  const { isEditMode, draft } = useEditMode();
  const ref = useFadeIn(0.15, [isLoading]);

  // Use draft when inside admin provider; fall back to content prop on public page
  const hasDraft = draft && Object.keys(draft).length > 0;
  const displayContent = hasDraft ? draft : (content || {});
  const aboutEn = displayContent.aboutEn || '';
  const aboutNe = displayContent.aboutNe || '';

  return (
    <section id="about" className="lokta-texture" ref={ref}>
      <div className="section-header fade-in">
        <h2 className="section-title">
          {lang === 'en' ? 'About the Club' : <span className="devanagari">हाम्रो परिचय</span>}
        </h2>
      </div>

      {isLoading ? (
        <AboutSkeleton />
      ) : (
        <>
          {/* About text */}
          <div className="about-text fade-in delay-1">
            {lang === 'en'
              ? (
                <EditableField field="aboutEn" multiline>
                  {aboutEn
                    ? aboutEn.split('\n\n').map((p, i) => <p key={i}>{p}</p>)
                    : null}
                </EditableField>
              )
              : (
                <EditableField field="aboutNe" multiline>
                  {aboutNe
                    ? aboutNe.split('\n\n').map((p, i) => <p key={i} className="devanagari">{p}</p>)
                    : null}
                </EditableField>
              )
            }
          </div>

          {/* 3D Lift Value cards */}
          <div className="values-grid">
            {VALUES.map((v, i) => (
              <div
                key={i}
                className={`value-card-3d fade-in ${DELAYS[i]}`}
                aria-label={lang === 'en' ? v.titleEn : v.titleNe}
              >
                <div className="value-icon">
                  <svg viewBox="0 0 24 24">{v.icon}</svg>
                </div>
                <h4 className="value-title">
                  {lang === 'en' ? v.titleEn : <span className="devanagari">{v.titleNe}</span>}
                </h4>
                <p className="value-desc">
                  {lang === 'en' ? v.descEn : <span className="devanagari">{v.descNe}</span>}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
