import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import PrayerWheel3D from './PrayerWheel3D';

export default function Hero3DContainer() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: isMobile ? '200px' : '260px',
        height: isMobile ? '200px' : '240px',
        margin: '0 auto 0.5rem',
        position: 'relative',
        cursor: 'grab',
        zIndex: 15,
      }}
      title="3D Traditional Mani Wheel — Move mouse to interact"
    >
      <Canvas
        camera={{ position: [0, 0, 5.2], fov: 45 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ambientLight intensity={1.2} />
        {/* Warm Golden Key Light */}
        <directionalLight position={[4, 5, 4]} intensity={2.2} color="#FFF8DC" />
        {/* Rim Saffron Fill Light */}
        <directionalLight position={[-4, -2, -3]} intensity={1.5} color="#FF9933" />
        {/* Top Jewel Highlight */}
        <pointLight position={[0, 3, 2]} intensity={1.0} color="#FFD700" />

        <Suspense fallback={null}>
          <PrayerWheel3D mousePosition={mousePos} />
        </Suspense>
      </Canvas>

      {/* Subtle Golden Halo Glow underneath */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140px',
          height: '24px',
          background: 'radial-gradient(ellipse, rgba(255, 209, 59, 0.45) 0%, rgba(255, 138, 0, 0) 75%)',
          filter: 'blur(8px)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </div>
  );
}
