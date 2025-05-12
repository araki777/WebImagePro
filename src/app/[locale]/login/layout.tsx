"use client";

import { AuroraWave } from "@/components/AuroraWave";
import FloatingCrystals from "@/components/FloatingCrystals";
import GlowingSpheres from "@/components/GlowingSpheres";
import ParticleField from "@/components/ParticleField";
import { PerspectiveCamera, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import React, { useRef } from "react";

function LoginContent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  // 横スクロールでカメラを回転
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (controlsRef.current) {
      controlsRef.current.rotateY(event.deltaX * 0.001);
    }
  };

  return (
    <div className="w-full h-screen relative" onWheel={handleWheel}>
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 3, 10], fov: 75 }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#040113"]} />
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={75} />
        <AuroraWave />
        <FloatingCrystals />
        <ParticleField />
        <GlowingSpheres />
        <Preload all />
      </Canvas>
    </div>
  );
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="w-full h-screen relative">
      {/* three.jsアニメーションを常に表示 */}
      <LoginContent />
      {/* 各ページのフォーム部分 */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto w-full flex flex-col items-center">
          <motion.div
            className="p-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10 w-full max-w-sm pointer-events-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
