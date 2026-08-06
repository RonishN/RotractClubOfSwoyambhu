import React from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import { useEditMode } from '../context/EditModeContext';
import EditableField from './EditableField';
import EditableImage from './EditableImage';
import useFadeIn from '../hooks/useFadeIn';
import TraditionalDivider from './TraditionalDivider';
import heroImage from '../assets/images/heroimage.jpg';

const VALUES = [
  {
    iconClass: 'fa-solid fa-compass',
    titleEn: 'Leadership', titleNe: 'नेतृत्व',
    descEn: 'Empowering youth to take charge and create meaningful impact in their communities.',
    descNe: 'युवाहरूलाई नेतृत्व लिन र आफ्नो समुदायमा अर्थपूर्ण प्रभाव सिर्जना गर्न सशक्त बनाउने।',
  },
  {
    iconClass: 'fa-solid fa-people-group',
    titleEn: 'Fellowship', titleNe: 'भाइचारा',
    descEn: 'Building lifelong bonds through shared goals, laughter, and mutual respect.',
    descNe: 'साझा लक्ष्य, हाँसो र आपसी सम्मान मार्फत आजीवन बन्धन निर्माण गर्ने।',
  },
  {
    iconClass: 'fa-solid fa-hand-holding-heart',
    titleEn: 'Service', titleNe: 'सेवा',
    descEn: "Putting 'Service Above Self' in every community initiative we undertake.",
    descNe: "हामीले गर्ने प्रत्येक सामुदायिक पहलमा 'स्वार्थ भन्दा माथि सेवा' राख्ने।",
  },
  {
    iconClass: 'fa-solid fa-landmark-dome',
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
  const { draft, updateDraftField } = useEditMode();
  const ref = useFadeIn(0.15, [isLoading]);

  // Use draft when inside admin provider; fall back to content prop on public page
  const hasDraft = draft && Object.keys(draft).length > 0;
  const displayContent = hasDraft ? draft : (content || {});
  const aboutEn = displayContent.aboutEn || '';
  const aboutNe = displayContent.aboutNe || '';
  const aboutImage = displayContent.aboutImage || heroImage;

  return (
    <section id="about" className="lokta-texture" ref={ref}>
      <div className="about-split">
        {/* Editorial visual column (sticky on desktop) */}
        <div className="about-visual fade-in">
          <div className="about-visual-frame">
            <EditableImage
              src={aboutImage}
              alt=""
              className="about-visual-img"
              style={{ borderRadius: '22px' }}
              onChange={(url) => updateDraftField('aboutImage', url)}
              cropType="portrait"
            />
            <span className="about-visual-ring" aria-hidden="true">
              <span className="mandala-wheel"><span></span><span></span><span></span></span>
            </span>
          </div>
          <div className="about-visual-caption">
            <span className="about-visual-caption-title">{lang === 'en' ? 'Swoyambhu' : 'स्वयम्भू'}</span>
            <span className="about-visual-caption-sub">{lang === 'en' ? 'Stupa & heritage' : 'स्तूप र सम्पदा'}</span>
          </div>
        </div>

        {/* Narrative + values column */}
        <div className="about-body">
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

              {/* Pull-quote */}
              <blockquote className="about-quote fade-in delay-2">
                <span className="about-quote-mark" aria-hidden="true">"</span>
                <p>
                  {lang === 'en'
                    ? 'Service Above Self — inspired by the wisdom eyes of Swoyambhu, we rise with clarity and compassion.'
                    : 'स्वार्थ भन्दा माथि सेवा — स्वयम्भूका ज्ञान नेत्रबाट प्रेरित, हामी स्पष्टता र करुणाका साथ अगाडि बढ्छौं।'}
                </p>
              </blockquote>

              {/* Numbered value list */}
              <div className="values-grid fade-in delay-1">
                {VALUES.map((v, i) => (
                  <div
                    key={i}
                    className={`value-card-3d ${DELAYS[i]}`}
                    aria-label={lang === 'en' ? v.titleEn : v.titleNe}
                  >
                    <div className="value-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className={v.iconClass} style={{ fontSize: '1.6rem', color: '#B8532A' }}></i>
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
        </div>
      </div>
    </section>
  );
}
