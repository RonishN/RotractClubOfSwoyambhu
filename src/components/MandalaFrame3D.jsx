import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function MandalaRings() {
  const outerRingRef = useRef();
  const middleStar1Ref = useRef();
  const middleStar2Ref = useRef();
  const innerRingRef = useRef();
  const particlesRef = useRef();

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = elapsed * 0.15;
    }
    if (middleStar1Ref.current) {
      middleStar1Ref.current.rotation.z = elapsed * -0.2;
    }
    if (middleStar2Ref.current) {
      middleStar2Ref.current.rotation.z = elapsed * -0.2 + Math.PI / 4;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = elapsed * 0.3;
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.z = elapsed * 0.4;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer elegant thin ring */}
      <mesh ref={outerRingRef}>
        <ringGeometry args={[1.42, 1.45, 64]} />
        <meshBasicMaterial color="#FF8A00" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>

      {/* 8-pointed Star / Double square lattice (Sacred Geometry) */}
      <mesh ref={middleStar11 => {
        middleStar1Ref.current = middleStar11;
      }}>
        <ringGeometry args={[1.28, 1.30, 4]} />
        <meshBasicMaterial color="#FFD13B" side={THREE.DoubleSide} transparent opacity={0.7} wireframe />
      </mesh>
      <mesh ref={middleStar22 => {
        middleStar2Ref.current = middleStar22;
      }}>
        <ringGeometry args={[1.28, 1.30, 4]} />
        <meshBasicMaterial color="#FF8A00" side={THREE.DoubleSide} transparent opacity={0.7} wireframe />
      </mesh>

      {/* Intermediate dotted orbit circle */}
      <mesh>
        <ringGeometry args={[1.36, 1.37, 48]} />
        <meshBasicMaterial color="#FFD13B" side={THREE.DoubleSide} transparent opacity={0.25} />
      </mesh>

      {/* Outer frame points */}
      <group ref={particlesRef}>
        {[0, 60, 120, 180, 240, 300].map((angle, idx) => {
          const rad = (angle * Math.PI) / 180;
          const x = 1.37 * Math.cos(rad);
          const y = 1.37 * Math.sin(rad);
          return (
            <mesh key={idx} position={[x, y, 0]}>
              <circleGeometry args={[0.024, 8]} />
              <meshBasicMaterial color="#FFD13B" transparent opacity={0.9} />
            </mesh>
          );
        })}
      </group>

      {/* Inner ring directly bordering the avatar */}
      <mesh ref={innerRingRef}>
        <ringGeometry args={[1.13, 1.15, 64]} />
        <meshBasicMaterial color="#FFD13B" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export default function MandalaFrame3D() {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-20px',
        left: '-20px',
        width: '160px',
        height: '160px',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.8} />
        <MandalaRings />
      </Canvas>
    </div>
  );
}
