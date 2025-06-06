import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

const ParticleField: React.FC = () => {
  const ref = useRef<THREE.Points>(null);

  const count = 200;
  const radius = 12;

  // Create particles with a spherical distribution
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, [count]);

  // アニメーションを最小限に
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime() * 0.03;
      ref.current.rotation.y = time * 0.1;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default ParticleField;
