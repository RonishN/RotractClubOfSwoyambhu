import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Floating sacred geometry wireframe ring in 3D space
function RotatingGeometry() {
  const meshRef1 = useRef();
  const meshRef2 = useRef();
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating and mouse parallax from pointer
      const targetX = state.pointer.x * 0.8;
      const targetY = state.pointer.y * 0.5;
      groupRef.current.rotation.y += delta * 0.15;
      groupRef.current.rotation.x += delta * 0.08;
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, targetX, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.05);
    }
    if (meshRef1.current) {
      meshRef1.current.rotation.z += delta * 0.2;
    }
    if (meshRef2.current) {
      meshRef2.current.rotation.x -= delta * 0.15;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1]}>
      {/* Outer subtle golden Torus wireframe */}
      <mesh ref={meshRef1}>
        <torusGeometry args={[3.2, 0.02, 16, 64]} />
        <meshBasicMaterial color="#FFD13B" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Inner sacred icosahedron wireframe */}
      <mesh ref={meshRef2}>
        <icosahedronGeometry args={[2.0, 1]} />
        <meshBasicMaterial color="#FF8A00" wireframe transparent opacity={0.22} />
      </mesh>

      {/* Secondary accent ring */}
      <mesh rotation={[Math.PI / 3, 0, 0]}>
        <ringGeometry args={[2.6, 2.64, 48]} />
        <meshBasicMaterial color="#FFD13B" side={THREE.DoubleSide} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}

// 3D Star & Golden Particle Field
function ParticleField() {
  const pointsRef = useRef();
  const count = 90;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return [pos];
  }, []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.04;
      pointsRef.current.rotation.x += delta * 0.02;
      
      const mx = state.pointer.x * 0.6;
      const my = state.pointer.y * 0.4;
      pointsRef.current.position.x = THREE.MathUtils.lerp(pointsRef.current.position.x, mx, 0.04);
      pointsRef.current.position.y = THREE.MathUtils.lerp(pointsRef.current.position.y, my, 0.04);
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#FFD13B"
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function Leadership3DBackground() {
  return (
    <div 
      className="leadership-3d-canvas-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <RotatingGeometry />
        <ParticleField />
      </Canvas>
    </div>
  );
}
