"use client";

import { AuroraWave } from "@/components/AuroraWave";
import FloatingCrystals from "@/components/FloatingCrystals";
import GlowingSpheres from "@/components/GlowingSpheres";
import LoginPanel from "@/components/LoginPanel";
import ParticleField from "@/components/ParticleField";
import { OrbitControls, PerspectiveCamera, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useTranslations } from "next-intl";
import { Suspense, useRef } from "react";

function LoginContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // 横スクロールでカメラを回転
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (controlsRef.current) {
      // Rotate camera on horizontal scroll
      controlsRef.current.rotateY(event.deltaX * 0.001);
    }
  };

  return (
    <div className="w-full h-screen relative" onWheel={handleWheel}>
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 3, 10], fov: 75 }}
        dpr={[1, 2]} // Optimize for different device pixel ratios
      >
        <color attach="background" args={["#040113"]} />

        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#4f6fff" />
        <pointLight position={[-5, 0, -5]} intensity={0.3} color="#ff9dff" />

        {/* Camera Controls */}
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={75} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.2} // Adjusted to prevent camera from going below the wave
          minPolarAngle={Math.PI / 3}
          rotateSpeed={0.5}
          autoRotate
          autoRotateSpeed={0.3}
        />

        {/* Scene Elements */}
        <AuroraWave />
        <FloatingCrystals />
        <ParticleField />
        <GlowingSpheres />

        {/* Optimize loading */}
        <Preload all />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <LoginPanel />
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("Login");
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          {t("loading")}
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
