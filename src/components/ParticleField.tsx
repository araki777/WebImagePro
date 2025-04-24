import { PointMaterial, Points } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";

const ParticleField: React.FC = () => {
  const ref = useRef<THREE.Points>(null);

  // Generate random particle positions
  const count = 1000;
  const radius = 15;

  // Create particles with a spherical distribution
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Random spherical coordinates
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random()); // Cube root for more uniform distribution

      // Convert to Cartesian coordinates
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    return positions;
  }, [count]);

  // Animation for particles
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.x = time * 0.2;
      ref.current.rotation.y = time * 0.1;

      // Subtle pulsing effect
      const scale = 1 + Math.sin(time * 3) * 0.03;
      ref.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default ParticleField;
