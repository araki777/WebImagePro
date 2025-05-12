"use client";

import { LoginForm } from "@/components/form/LoginForm";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

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
      <LoginForm />
    </Suspense>
  );
}
