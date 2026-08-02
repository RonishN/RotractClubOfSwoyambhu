import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Creates a procedural high-res canvas texture with the sacred mantra
 * "ॐ मणि पद्मे हूँ" (Om Mani Padme Hum) and traditional Newari border motifs.
 */
function createMantraTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Rich antique brass/gold background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bgGrad.addColorStop(0, '#B8860B');
  bgGrad.addColorStop(0.3, '#FFD700');
  bgGrad.addColorStop(0.5, '#FFF8DC');
  bgGrad.addColorStop(0.7, '#DAA520');
  bgGrad.addColorStop(1, '#8B6508');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top & Bottom Ornamental Borders
  ctx.strokeStyle = '#5C4008';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  // Lotus petal patterns top/bottom
  ctx.fillStyle = '#6B420A';
  ctx.font = '24px serif';
  ctx.textAlign = 'center';
  for (let x = 30; x < canvas.width; x += 60) {
    ctx.fillText('❖', x, 40);
    ctx.fillText('❖', x, canvas.height - 25);
  }

  // Mantra text band across the cylinder
  ctx.fillStyle = '#4A2800';
  ctx.font = 'bold 56px "NepaliFont", "Inter", sans-serif';
  ctx.textBaseline = 'middle';
  const mantra = 'ॐ  म  णि  प  द्मे  हूँ  ❖  ';
  const fullText = mantra.repeat(3);
  ctx.fillText(fullText, canvas.width / 2, canvas.height / 2);

  // Subtle metallic horizontal highlights
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(0, canvas.height * 0.45, canvas.width, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export default function PrayerWheel3D({ mousePosition = { x: 0, y: 0 } }) {
  const groupRef = useRef();
  const wheelRef = useRef();
  const weightRef = useRef();

  const mantraTexture = useMemo(() => createMantraTexture(), []);

  // Golden Brass Material Palette
  const brassMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFC107'),
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const darkGoldMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#D4AF37'),
        metalness: 0.9,
        roughness: 0.2,
      }),
    []
  );

  const mantraMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: mantraTexture,
        metalness: 0.7,
        roughness: 0.3,
      }),
    []
  );

  const jewelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#E60039'),
        metalness: 0.3,
        roughness: 0.1,
        emissive: new THREE.Color('#800020'),
        emissiveIntensity: 0.4,
      }),
    []
  );

  useFrame((state, delta) => {
    if (wheelRef.current) {
      // Smooth continuous clockwise rotation of the prayer wheel
      wheelRef.current.rotation.y += delta * 1.2;
    }

    if (groupRef.current) {
      // Interactive mouse tilt and subtle breathing float
      const targetX = (mousePosition.y * 0.25) + 0.1;
      const targetY = mousePosition.x * 0.35;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, delta * 3);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, delta * 3);
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.08;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* ── Fixed Central Spindle & Wooden Handle ── */}
      {/* Top Spindle */}
      <mesh position={[0, 1.75, 0]} material={brassMaterial}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 24]} />
      </mesh>
      {/* Top Ruby Jewel Finial */}
      <mesh position={[0, 2.05, 0]} material={jewelMaterial}>
        <sphereGeometry args={[0.14, 24, 24]} />
      </mesh>
      {/* Bottom Spindle */}
      <mesh position={[0, -1.8, 0]} material={brassMaterial}>
        <cylinderGeometry args={[0.06, 0.06, 0.7, 24]} />
      </mesh>
      {/* Wooden Handle Base */}
      <mesh position={[0, -2.4, 0]} material={darkGoldMaterial}>
        <cylinderGeometry args={[0.12, 0.16, 0.9, 24]} />
      </mesh>

      {/* ── Rotating Prayer Wheel Drum & Weighted Bead ── */}
      <group ref={wheelRef}>
        {/* Main Mantra Cylinder Drum */}
        <mesh position={[0, 0, 0]} material={mantraMaterial}>
          <cylinderGeometry args={[1.05, 1.05, 1.8, 48]} />
        </mesh>

        {/* Top Decorative Ring Cap */}
        <mesh position={[0, 0.96, 0]} material={darkGoldMaterial}>
          <cylinderGeometry args={[1.18, 1.05, 0.16, 48]} />
        </mesh>
        {/* Top Lotus Stepped Dome */}
        <mesh position={[0, 1.18, 0]} material={brassMaterial}>
          <cylinderGeometry args={[0.65, 1.15, 0.3, 36]} />
        </mesh>
        <mesh position={[0, 1.38, 0]} material={darkGoldMaterial}>
          <torusGeometry args={[0.65, 0.08, 16, 48]} />
        </mesh>

        {/* Bottom Decorative Ring Cap */}
        <mesh position={[0, -0.96, 0]} material={darkGoldMaterial}>
          <cylinderGeometry args={[1.05, 1.18, 0.16, 48]} />
        </mesh>
        {/* Bottom Lotus Stepped Base */}
        <mesh position={[0, -1.18, 0]} material={brassMaterial}>
          <cylinderGeometry args={[1.15, 0.65, 0.3, 36]} />
        </mesh>
        <mesh position={[0, -1.38, 0]} material={darkGoldMaterial}>
          <torusGeometry args={[0.65, 0.08, 16, 48]} />
        </mesh>

        {/* Mid-body Brass Ribs */}
        <mesh position={[0, 0.82, 0]} material={brassMaterial}>
          <torusGeometry args={[1.07, 0.04, 16, 48]} />
        </mesh>
        <mesh position={[0, -0.82, 0]} material={brassMaterial}>
          <torusGeometry args={[1.07, 0.04, 16, 48]} />
        </mesh>

        {/* Traditional Weighted Cord & Lead Bead on the side */}
        <group position={[1.08, 0, 0]}>
          <mesh position={[0.25, -0.2, 0]} material={brassMaterial} rotation={[0, 0, -0.6]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
          </mesh>
          <mesh position={[0.48, -0.45, 0]} material={darkGoldMaterial}>
            <sphereGeometry args={[0.12, 16, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
