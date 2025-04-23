"use client";

import { AuroraWave } from "@/components/AuroraWave";
import { Button } from "@/components/ui/button";
import { OAUTH_PROVIDERS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { Canvas } from "@react-three/fiber";
import { Chrome, Github } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";

function LoginContent() {
  const t = useTranslations("Login");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
  });

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

  return (
    <div className="w-full h-screen relative">
      <Canvas
        camera={{
          position: [0, 0, 5],
          fov: 75,
        }}
        className="absolute inset-0"
      >
        <AuroraWave />
      </Canvas>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-md p-6 space-y-6 bg-black/20 backdrop-blur-lg rounded-2xl border border-white/10">
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
