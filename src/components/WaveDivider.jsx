import React from 'react';

export default function WaveDivider({ fill = '#f5ecda', backFill = null, flip = false, height = 70 }) {
  const back = backFill || fill;
  return (
    <svg
      className={`wave-divider${flip ? ' wave-divider--flip' : ''}`}
      style={{ height }}
      viewBox="0 0 1440 80"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {back !== fill && (
        <path
          fill={back}
          d="M0,38 C120,70 240,8 400,20 C560,32 660,64 820,50 C980,36 1080,8 1240,20 C1320,26 1380,38 1440,44 L1440,80 L0,80 Z"
        />
      )}
      <path
        fill={fill}
        d="M0,56 C120,82 240,26 400,40 C560,54 660,80 820,66 C980,52 1080,24 1240,38 C1320,44 1380,54 1440,60 L1440,80 L0,80 Z"
      />
    </svg>
  );
}
