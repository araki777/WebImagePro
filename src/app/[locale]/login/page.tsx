"use client";

import { LoginForm } from "@/components/form/LoginForm";
import { useRouter } from "@/i18n/routing";
import { authApi } from "@/lib/api/auth";
import { OAUTH_PROVIDERS } from "@/lib/constants";
import { loginSchema } from "@/lib/validation/auth";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { z } from "zod";

export default function LoginPage() {
  const t = useTranslations("Login");
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false,
  });
  const router = useRouter();

  const handleOAuthLogin = async (
    provider: (typeof OAUTH_PROVIDERS)[number]
  ) => {
    setIsLoading((prev) => ({ ...prev, [provider]: true }));

    try {
      if (provider === "github") {
        const response = await authApi.github();
        window.location.href = response.url;
      } else if (provider === "google") {
        const response = await authApi.google();
        window.location.href = response.url;
      }
    } catch (error) {
      console.error("OAuth login error:", error);
      setIsLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleEmailLogin = async (data: z.infer<typeof loginSchema>) => {
    const response = await authApi.signin({
      email: data.email,
      password: data.password,
    });

    if ("detail" in response) {
      console.error("Email login error:", response.detail);
    } else {
      router.push("/");
    }
  };

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          {t("loading")}
        </div>
      }
    >
      <LoginForm
        isLoading={isLoading}
        handleOAuthLogin={handleOAuthLogin}
        handleEmailLogin={handleEmailLogin}
      />
    </Suspense>
  );
}
