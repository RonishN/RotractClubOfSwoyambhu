import React from 'react';

/**
 * StupaSkyline — a stylized Swoyambhu stupa skyline.
 * Central detailed stupa with the all-seeing eyes, 13 rings, crescent
 * pinnacle and prayer flags, flanked by smaller silhouettes.
 */
export default function StupaSkyline() {
  return (
    <svg
      className="contact-stupa-skyline"
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      <defs>
        <g id="stupa-detail">
          {/* Plinth */}
          <rect x="-74" y="-18" width="148" height="18" rx="2" fill="#5A1326" />
          <rect x="-62" y="-30" width="124" height="12" rx="2" fill="#7A1F34" />
          {/* Dome */}
          <path d="M-48,-30 C-48,-90 -28,-116 0,-116 C28,-116 48,-90 48,-30 Z" fill="#7A1F34" />
          {/* All-seeing eyes */}
          <path d="M-30,-80 C-24,-92 -13,-92 -7,-80 C-13,-70 -24,-70 -30,-80 Z" fill="#FBF5E9" />
          <path d="M30,-80 C24,-92 13,-92 7,-80 C13,-70 24,-70 30,-80 Z" fill="#FBF5E9" />
          {/* Nose / '1' mark */}
          <path d="M0,-102 C-6,-97 -5,-90 0,-88 L2,-88 L1,-70 L-1,-70 L0,-88 C3,-90 4,-94 0,-102 Z" fill="#FBF5E9" />
          {/* Eyebrow arcs */}
          <path d="M-33,-84 C-26,-98 -14,-98 -5,-84" fill="none" stroke="#DFA92E" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M33,-84 C26,-98 14,-98 5,-84" fill="none" stroke="#DFA92E" strokeWidth="2.5" strokeLinecap="round" />
          {/* Harmika */}
          <rect x="-28" y="-116" width="56" height="18" rx="2" fill="#5A1326" />
          <rect x="-28" y="-134" width="56" height="4" fill="#DFA92E" />
          {/* Spire body */}
          <path d="M-12,-134 L12,-134 L4,-198 L-4,-198 Z" fill="#7A1F34" />
          {/* 13 rings (tapering) */}
          <rect x="-11" y="-140" width="22" height="4" rx="2" fill="#DFA92E" />
          <rect x="-10" y="-146" width="20" height="4" rx="2" fill="#DFA92E" />
          <rect x="-9" y="-152" width="18" height="4" rx="2" fill="#DFA92E" />
          <rect x="-8" y="-158" width="16" height="4" rx="2" fill="#DFA92E" />
          <rect x="-7" y="-164" width="14" height="4" rx="2" fill="#DFA92E" />
          <rect x="-6" y="-170" width="12" height="4" rx="2" fill="#DFA92E" />
          <rect x="-5.5" y="-176" width="11" height="4" rx="2" fill="#DFA92E" />
          <rect x="-5" y="-182" width="10" height="4" rx="2" fill="#DFA92E" />
          <rect x="-4.5" y="-188" width="9" height="4" rx="2" fill="#DFA92E" />
          <rect x="-4" y="-194" width="8" height="4" rx="2" fill="#DFA92E" />
          {/* Crescent + sun pinnacle */}
          <path d="M-10,-198 A11,11 0 1 0 1,-209 A8,8 0 0 1 -10,-198 Z" fill="#DFA92E" />
          <circle cx="4" cy="-205" r="4.2" fill="#EE7F13" />
          {/* Prayer flag strings */}
          <path d="M-2,-204 Q-45,-176 -122,-142" fill="none" stroke="#B8532A" strokeWidth="1.4" opacity="0.55" />
          <path d="M2,-204 Q45,-176 122,-142" fill="none" stroke="#B8532A" strokeWidth="1.4" opacity="0.55" />
          {/* Prayer flags (left) */}
          <path d="M-30,-192 L-20,-195 L-35,-200 Z" fill="#EE7F13" />
          <path d="M-58,-179 L-48,-182 L-63,-187 Z" fill="#DFA92E" />
          <path d="M-86,-166 L-76,-169 L-91,-174 Z" fill="#7A1F34" />
          <path d="M-114,-153 L-104,-156 L-119,-161 Z" fill="#FBF5E9" />
          {/* Prayer flags (right) */}
          <path d="M30,-192 L20,-195 L35,-200 Z" fill="#DFA92E" />
          <path d="M58,-179 L48,-182 L63,-187 Z" fill="#EE7F13" />
          <path d="M86,-166 L76,-169 L91,-174 Z" fill="#FBF5E9" />
          <path d="M114,-153 L104,-156 L119,-161 Z" fill="#7A1F34" />
        </g>
      </defs>

      <g>
        {/* Far flanking silhouettes */}
        <use href="#stupa-detail" transform="translate(14,240) scale(0.3)" opacity="0.7" />
        <use href="#stupa-detail" transform="translate(940,240) scale(0.4)" opacity="0.7" />
        {/* Side stupas */}
        <use href="#stupa-detail" transform="translate(96,240) scale(0.5)" opacity="0.88" />
        <use href="#stupa-detail" transform="translate(672,240) scale(0.62)" opacity="0.88" />
        {/* Central detailed stupa (anchored under the left visual column) */}
        <use href="#stupa-detail" transform="translate(322,240) scale(1.08)" />
      </g>
    </svg>
  );
}
