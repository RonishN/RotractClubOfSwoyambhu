import React from 'react';

/**
 * Traditional Newari Woodcarving (Jhyal/Lattice) inspired divider
 * with authentic geometry, warm saffron/gold gradient, and center flourish.
 */
export default function TraditionalDivider({ style = {} }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        maxWidth: '340px',
        margin: '1.2rem auto 2.5rem',
        opacity: 0.9,
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Left Woodcarving Lattice Bar */}
      <svg width="110" height="12" viewBox="0 0 110 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="6" x2="110" y2="6" stroke="url(#goldGradLeft)" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="90" y="2" width="8" height="8" transform="rotate(45 94 6)" stroke="var(--gold)" strokeWidth="1" fill="none" />
        <rect x="70" y="3" width="6" height="6" transform="rotate(45 73 6)" stroke="var(--saffron)" strokeWidth="1" fill="none" />
        <defs>
          <linearGradient id="goldGradLeft" x1="0" y1="6" x2="110" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="transparent" />
            <stop offset="0.7" stopColor="var(--gold)" />
            <stop offset="1" stopColor="var(--saffron)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Center Newari Auspicious Emblem */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(255, 209, 59, 0.15), rgba(255, 138, 0, 0.15))',
          border: '1px solid var(--gold)',
          transform: 'rotate(45deg)',
          borderRadius: '4px',
          boxShadow: '0 0 12px rgba(255, 209, 59, 0.3)',
        }}
      >
        <span
          style={{
            transform: 'rotate(-45deg)',
            color: 'var(--saffron)',
            fontSize: '12px',
            lineHeight: 1,
            fontWeight: 'bold',
          }}
        >
          ❖
        </span>
      </div>

      {/* Right Woodcarving Lattice Bar */}
      <svg width="110" height="12" viewBox="0 0 110 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="6" x2="110" y2="6" stroke="url(#goldGradRight)" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="12" y="2" width="8" height="8" transform="rotate(45 16 6)" stroke="var(--gold)" strokeWidth="1" fill="none" />
        <rect x="34" y="3" width="6" height="6" transform="rotate(45 37 6)" stroke="var(--saffron)" strokeWidth="1" fill="none" />
        <defs>
          <linearGradient id="goldGradRight" x1="0" y1="6" x2="110" y2="6" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--saffron)" />
            <stop offset="0.3" stopColor="var(--gold)" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
