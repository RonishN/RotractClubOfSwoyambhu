import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function useTexture(url) {
  const [tex, setTex] = useState(null);
  useEffect(() => {
    let texture = null;
    if (!url) { setTex(null); return undefined; }
    const loader = new THREE.TextureLoader();
    texture = loader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        setTex(t);
      },
      undefined,
      () => setTex(null)
    );
    return () => { if (texture) texture.dispose(); };
  }, [url]);
  return tex;
}

function FloatingCard({ url, accent, index, total, mouse }) {
  const group = useRef();
  const texture = useTexture(url);
  const baseAngle = (index / total) * Math.PI * 2;
  const radius = 3.1;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const speed = 1 + (index % 3) * 0.12;
    const angle = baseAngle + t * 0.13 * speed;
    const g = group.current;
    g.position.x = Math.cos(angle) * radius;
    g.position.z = Math.sin(angle) * radius;
    g.position.y = Math.sin(t * 0.5 + index * 1.8) * 0.42 + mouse.current.y * 0.28;
    g.rotation.y = Math.PI / 2 - angle;
    g.rotation.x = mouse.current.y * 0.08 + Math.sin(t * 0.4 + index * 2.1) * 0.03;
    g.rotation.z = mouse.current.x * 0.06;
  });

  return (
    <group ref={group}>
      {/* Frame / backing */}
      <mesh>
        <planeGeometry args={[1.72, 1.3]} />
        <meshBasicMaterial color="#18060d" />
      </mesh>
      {/* Accent edge glow */}
      <mesh position={[0, 0, -0.004]} scale={1.045}>
        <planeGeometry args={[1.72, 1.3]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} />
      </mesh>
      {/* Photo */}
      <mesh position={[0, 0, 0.008]}>
        <planeGeometry args={[1.6, 1.18]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          color={texture ? '#ffffff' : accent}
        />
      </mesh>
    </group>
  );
}

function Dust() {
  const ref = useRef();
  const positions = useRef(null);
  if (!positions.current) {
    const count = 360;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 7;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    positions.current = arr;
  }

  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.current.length / 3}
          array={positions.current}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#fbbf24" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

export default function Gallery3DHero({ covers = [] }) {
  const mouse = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const cards = covers.slice(0, isMobile ? 4 : 6);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  };

  if (cards.length === 0) return null;

  return (
    <div
      className="gallery-hero-canvas"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouse.current.x = 0; mouse.current.y = 0; }}
    >
      <Canvas
        camera={{ position: [0, 0.2, 6.4], fov: 42 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.75]}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <ambientLight intensity={1} />
        {cards.map((c, i) => (
          <FloatingCard
            key={`${c.url}-${i}`}
            url={c.url}
            accent={c.accent}
            index={i}
            total={cards.length}
            mouse={mouse}
          />
        ))}
        <Dust />
      </Canvas>
    </div>
  );
}
