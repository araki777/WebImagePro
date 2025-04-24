import { MeshTransmissionMaterial, Sphere } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Group } from "three";

type GlowingSphereProps = {
  position: [number, number, number];
  size: number;
  color: string;
  orbitRadius?: number;
  orbitSpeed?: number;
  pulseSpeed?: number;
  initialAngle?: number;
};

const GlowingSphere: React.FC<GlowingSphereProps> = ({
  position,
  size,
  color,
  orbitRadius = 0,
  orbitSpeed = 0,
  pulseSpeed = 1,
  initialAngle = 0,
}) => {
  const ref = useRef<Group>(null);
  const initialPosition = [...position] as [number, number, number];

  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();

      // Apply orbit motion if radius > 0
      if (orbitRadius > 0) {
        const angle = initialAngle + time * orbitSpeed;
        ref.current.position.x =
          initialPosition[0] + Math.cos(angle) * orbitRadius;
        ref.current.position.z =
          initialPosition[2] + Math.sin(angle) * orbitRadius;
      }

      // Gentle pulsing effect
      const scale = size * (1 + 0.1 * Math.sin(time * pulseSpeed));
      ref.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={ref} position={position}>
      <Sphere args={[1, 32, 32]}>
        <MeshTransmissionMaterial
          color={color}
          transmission={0.95}
          thickness={0.5}
          roughness={0.2}
          ior={1.5}
          chromaticAberration={0.04}
          distortion={0.4}
          distortionScale={0.3}
          temporalDistortion={0.1}
          attenuationDistance={0.5}
          attenuationColor={color}
          transparent
          opacity={0.7}
        />
      </Sphere>
    </group>
  );
};

const GlowingSpheres: React.FC = () => {
  // Configuration for all glowing spheres
  const spheres: GlowingSphereProps[] = [
    // Center sphere
    { position: [0, 3, -2], size: 0.8, color: "#6c5ce7", pulseSpeed: 0.5 },

    // Orbiting spheres
    {
      position: [0, 3, -2],
      size: 0.3,
      color: "#00cec9",
      orbitRadius: 2.5,
      orbitSpeed: 0.3,
      initialAngle: 0,
      pulseSpeed: 0.7,
    },
    {
      position: [0, 3, -2],
      size: 0.4,
      color: "#74b9ff",
      orbitRadius: 2.5,
      orbitSpeed: 0.3,
      initialAngle: 2,
      pulseSpeed: 0.6,
    },
    {
      position: [0, 3, -2],
      size: 0.2,
      color: "#a29bfe",
      orbitRadius: 2.5,
      orbitSpeed: 0.3,
      initialAngle: 4,
      pulseSpeed: 0.8,
    },

    // Distant spheres
    { position: [-5, 1, -10], size: 0.6, color: "#81ecec", pulseSpeed: 0.4 },
    { position: [7, 2, -6], size: 0.5, color: "#55efc4", pulseSpeed: 0.3 },
    { position: [-4, 4, -8], size: 0.7, color: "#ffeaa7", pulseSpeed: 0.25 },
  ];

  return (
    <>
      {spheres.map((props, index) => (
        <GlowingSphere key={index} {...props} />
      ))}
    </>
  );
};

export default GlowingSpheres;
