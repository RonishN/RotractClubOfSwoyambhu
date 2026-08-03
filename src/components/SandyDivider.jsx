import React from 'react';

export default function SandyDivider({ bottomColor, height = '60px' }) {
  return (
    <div 
      className="sandy-divider"
      style={{ 
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%', 
        height: height, 
        overflow: 'hidden', 
        lineHeight: 0, 
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <svg 
        viewBox="0 0 1200 120" 
        preserveAspectRatio="none" 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block'
        }}
      >
        {/* Layer 1 - Deep soft dune */}
        <path 
          d="M0,40 C350,-10 850,110 1200,40 L1200,120 L0,120 Z" 
          fill={bottomColor} 
        />
        {/* Layer 2 - Transparent overlay dune for organic depth */}
        <path 
          d="M0,65 C400,25 800,115 1200,65 L1200,120 L0,120 Z" 
          fill={bottomColor} 
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
