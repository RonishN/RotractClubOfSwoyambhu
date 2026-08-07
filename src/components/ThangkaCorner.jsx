import React from 'react';

export default function ThangkaCorner({ className = '', size = 160 }) {
  return (
    <svg
      className={`thangka-corner ${className}`}
      viewBox="0 0 160 160"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="26" y="26" width="108" height="108" transform="rotate(45 80 80)" fill="none" stroke="#DFA92E" strokeWidth="1.2" />
      <rect x="46" y="46" width="68" height="68" transform="rotate(45 80 80)" fill="none" stroke="#DFA92E" strokeWidth="1.2" />
      <rect x="62" y="62" width="36" height="36" transform="rotate(45 80 80)" fill="#EE7F13" opacity="0.16" />
      <circle cx="80" cy="80" r="3.5" fill="#DFA92E" />
      <circle cx="26" cy="26" r="3" fill="#DFA92E" />
      <circle cx="134" cy="26" r="3" fill="#DFA92E" />
      <circle cx="26" cy="134" r="3" fill="#DFA92E" />
      <circle cx="134" cy="134" r="3" fill="#DFA92E" />
      <circle cx="80" cy="14" r="2.5" fill="#DFA92E" />
      <circle cx="80" cy="146" r="2.5" fill="#DFA92E" />
      <circle cx="14" cy="80" r="2.5" fill="#DFA92E" />
      <circle cx="146" cy="80" r="2.5" fill="#DFA92E" />
    </svg>
  );
}
