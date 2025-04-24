"use client";

import { AuroraWave } from "@/components/AuroraWave";
import { Button } from "@/components/ui/button";
import { OAUTH_PROVIDERS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Chrome, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useRef, useState } from "react";

function LoginContent() {
  const t = useTranslations("Login");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  const handleOAuthLogin = async (
    provider: (typeof OAUTH_PROVIDERS)[number]
  ) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error("OAuth login error:", error);
        setIsLoading((prev) => ({ ...prev, [provider]: false }));
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  // 横スクロールでカメラを回転
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (controlsRef.current) {
      // 横スクロール量に応じて回転
      controlsRef.current.azimuthAngle -= event.deltaX * 0.005;
    }
  };

  return (
    <div className="w-full h-screen relative" onWheel={handleWheel}>
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
        }}
        className="absolute inset-0"
      >
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <ambientLight intensity={0.3} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minPolarAngle={Math.PI / 2}
          maxPolarAngle={Math.PI / 2}
        />
        <AuroraWave />

        <Html center>
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg p-6 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10">
            <h1 className="text-2xl font-bold text-center text-white">
              {t("title")}
            </h1>
            <div className="flex flex-col gap-4">
              {OAUTH_PROVIDERS.includes("google") && (
                <Button
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                  onClick={() => handleOAuthLogin("google")}
                  isLoading={isLoading.google}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  {t("loginWithGoogle")}
                </Button>
              )}
              {OAUTH_PROVIDERS.includes("github") && (
                <Button
                  className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-300 disabled:opacity-50"
                  onClick={() => handleOAuthLogin("github")}
                  isLoading={isLoading.github}
                >
                  <Github className="w-4 h-4 mr-2" />
                  {t("loginWithGithub")}
                </Button>
              )}
            </div>
          </div>
        </Html>
      </Canvas>
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
