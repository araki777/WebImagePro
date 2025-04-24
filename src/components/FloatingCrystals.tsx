import { Icosahedron, MeshDistortMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Group } from "three";

type CrystalProps = {
  position: [number, number, number];
  scale: number;
  speed: number;
  distort: number;
  color: string;
  rotationFactor: number;
};

const Crystal: React.FC<CrystalProps> = ({
  position,
  scale,
  speed,
  distort,
  color,
  rotationFactor,
}) => {
  const ref = useRef<Group>(null);
  const initialY = position[1];

  useFrame(({ clock }) => {
    if (ref.current) {
      // Floating motion
      ref.current.position.y =
        initialY + Math.sin(clock.getElapsedTime() * speed) * 0.5;

      // Rotation
      ref.current.rotation.x += 0.003 * rotationFactor;
      ref.current.rotation.y += 0.005 * rotationFactor;
      ref.current.rotation.z += 0.002 * rotationFactor;
    }
  });

  return (
    <group ref={ref} position={position}>
      <Icosahedron args={[1, 2]} scale={scale}>
        <MeshDistortMaterial
          color={color}
          speed={speed * 4}
          distort={distort}
          transparent
          opacity={0.8}
        />
      </Icosahedron>
    </group>
  );
};

const FloatingCrystals: React.FC = () => {
  // Define crystal configurations
  const crystals: CrystalProps[] = [
    {
      position: [-5, 2, -2],
      scale: 0.8,
      speed: 0.3,
      distort: 0.4,
      color: "#4b7bec",
      rotationFactor: 1,
    },
    {
      position: [4, 3, -3],
      scale: 0.6,
      speed: 0.5,
      distort: 0.3,
      color: "#45aaf2",
      rotationFactor: 0.8,
    },
    {
      position: [-3, 0, -6],
      scale: 1.2,
      speed: 0.2,
      distort: 0.5,
      color: "#2bcbba",
      rotationFactor: 0.5,
    },
    {
      position: [6, 1, -7],
      scale: 0.7,
      speed: 0.4,
      distort: 0.6,
      color: "#a55eea",
      rotationFactor: 1.2,
    },
    {
      position: [0, 5, -5],
      scale: 0.5,
      speed: 0.6,
      distort: 0.2,
      color: "#0abde3",
      rotationFactor: 0.9,
    },
    {
      position: [-7, 4, -4],
      scale: 0.9,
      speed: 0.25,
      distort: 0.45,
      color: "#1dd1a1",
      rotationFactor: 0.7,
    },
    {
      position: [8, 2, -8],
      scale: 0.4,
      speed: 0.35,
      distort: 0.55,
      color: "#5f27cd",
      rotationFactor: 1.1,
    },
  ];

  return (
    <>
      {crystals.map((props, index) => (
        <Crystal key={index} {...props} />
      ))}
    </>
  );
};

export default FloatingCrystals;
