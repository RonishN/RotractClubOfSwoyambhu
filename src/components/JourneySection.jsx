import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLang } from '../context/LanguageContext';
import useFadeIn from '../hooks/useFadeIn';
import ThangkaCorner from './ThangkaCorner';

const DEFAULT_TIMELINE = [
  {
    id: 't1',
    badge: 'Foundation',
    titleEn: 'Rooted in Service',
    titleNe: 'सेवामा गहिरिएको',
    description: 'Born on the sacred hill of Swoyambhu, our club grew from a handful of dreamers into a youth movement for change.',
  },
  {
    id: 't2',
    badge: 'Growth',
    titleEn: 'Giving Back to Swoyambhu',
    titleNe: 'स्वयम्भूलाई फिर्ता दिने',
    description: 'From blood drives to school-supply drives, we rally volunteers around the Stupa year after year.',
  },
  {
    id: 't3',
    badge: 'Recognition',
    titleEn: 'District 3292 Accolades',
    titleNe: 'डिस्ट्रिक्ट ३२९२ सम्मान',
    description: 'Awards, citations and grateful communities — milestones that keep our spirit high.',
  },
  {
    id: 't4',
    badge: 'Tomorrow',
    titleEn: 'Building Tomorrow Together',
    titleNe: 'भोलि सँगै निर्माण गर्दै',
    description: 'New projects, new members and new ideas — our journey continues with you.',
  },
];

const NODE_ICONS = [
  'fa-seedling',
  'fa-hand-holding-heart',
  'fa-medal',
  'fa-fire-flame-curved',
  'fa-users',
  'fa-trophy',
  'fa-bullhorn',
  'fa-hands-holding-circle',
];

function TimelineSkeleton() {
  return (
    <SkeletonTheme baseColor="#ede8e0" highlightColor="#f7f3ed">
      <ol className="history-timeline-list" style={{ pointerEvents: 'none' }}>
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="history-node">
            <div className="history-node-card">
              <div className="sk" style={{ height: 18, width: 120, borderRadius: 6, marginBottom: 8 }} />
              <div className="sk" style={{ height: 16, width: '70%', borderRadius: 6, marginBottom: 8 }} />
              <div className="sk" style={{ height: 13, width: '94%', borderRadius: 6, marginBottom: 5 }} />
              <div className="sk" style={{ height: 13, width: '60%', borderRadius: 6 }} />
            </div>
          </li>
        ))}
      </ol>
    </SkeletonTheme>
  );
}

export default function JourneySection({ content, isLoading }) {
  const { lang } = useLang();
  const ref = useFadeIn(0.15, [isLoading]);

  const displayContent = content || {};
  const rawTimeline = Array.isArray(displayContent.highlights) && displayContent.highlights.length
    ? displayContent.highlights
    : DEFAULT_TIMELINE;
  const nodes = rawTimeline.map((h, i) => ({
    badge: h.badge || (lang === 'en' ? 'Milestone' : 'कोसेढुङ्गा'),
    title: lang === 'en' ? h.title : (h.titleNe || h.title),
    description: h.description || '',
    iconClass: NODE_ICONS[i % NODE_ICONS.length],
  }));

  return (
    <section id="journey" className="home-journey" ref={ref}>
      <ThangkaCorner className="thangka-corner--tr" />
      <div className="section-header numbered-head fade-in">
        <span className="numbered-num">02</span>
        <span className="numbered-kicker">
          {lang === 'en' ? 'Our Journey' : 'हाम्रो यात्रा'}
        </span>
        <h2 className="section-title">
          {lang === 'en' ? 'Milestones of Service' : <span className="devanagari">सेवाका कोसेढुङ्गाहरू</span>}
        </h2>
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : (
        <ol className="history-timeline-list fade-in delay-1">
          {nodes.map((node, i) => (
            <li
              key={i}
              className="history-node fade-in"
              style={{ transitionDelay: `${0.1 + (i % 4) * 0.12}s` }}
            >
              <span className="history-node-marker" aria-hidden="true" />
              <div className="history-node-card">
                <span className="history-node-badge">
                  <i className={`fa-solid ${node.iconClass}`}></i>
                  {node.badge}
                </span>
                <h4>{node.title}</h4>
                {node.description && <p>{node.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
