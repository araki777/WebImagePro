"use client";

import TourGuid from "@/components/common/TourGuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { Header } from "@/components/ui/header";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePathname, useRouter } from "@/i18n/routing";
import { DEFAULT_LANGUAGE, LANGUAGES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { Step } from "react-joyride";
import { toast } from "sonner";

// Stripeの公開キーを設定
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { updateUserSettings } = useAuthStore();

  const locales = LANGUAGES.map((lang) => ({
    code: lang,
    label: lang === DEFAULT_LANGUAGE ? "日本語" : "English",
  }));

  const handleLanguageChange = async (code: string) => {
    await updateUserSettings({ language: code });
    // 言語切り替え後にページ遷移
    router.push(pathname, { locale: code });
  };

  return (
    <div className="flex gap-2 items-center mb-6">
      {locales.map(({ code, label }) => (
        <Button
          key={code}
          variant="outline"
          className="px-3 py-1"
          aria-current={
            pathname.startsWith(`/${code.split("-")[0]}`) ? "page" : undefined
          }
          onClick={() => handleLanguageChange(code)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}

function SettingsContent() {
  const t = useTranslations("Settings");
  const { user, userSettings, updateUserSettings, signOut, checkUser } =
    useAuthStore();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();

  // テーマ変更時のハンドラー
  const handleThemeChange = async (checked: boolean) => {
    const newTheme = checked ? "dark" : "light";
    setTheme(newTheme);
    await updateUserSettings({ theme: newTheme });
  };

  // 初期テーマの設定
  useEffect(() => {
    if (userSettings?.theme && userSettings.theme !== "system") {
      setTheme(userSettings.theme);
    }
  }, [userSettings?.theme, setTheme]);

  useEffect(() => {
    // 決済成功時のメッセージ
    if (searchParams?.get("success")) {
      toast.success(t("paymentSuccess"));
    }
    // 決済キャンセル時のメッセージ
    if (searchParams?.get("canceled")) {
      toast.error(t("paymentCanceled"));
    }
  }, [searchParams, t]);

  const handleSubscribe = async () => {
    try {
      // セッションを取得
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("認証が必要です");
      }

      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include", // クッキーを含める
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "決済セッションの作成に失敗しました"
        );
      }

      const { sessionId } = await response.json();

      // Stripeのチェックアウトページにリダイレクト
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripeの初期化に失敗しました");
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error("決済エラー:", error);
      toast.error(
        error instanceof Error ? error.message : "決済の開始に失敗しました"
      );
    }
  };

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (!user) {
    return null;
  }

  // ツアーステップもt関数で
  const steps: Step[] = [
    {
      target: ".theme-switch",
      content: t("tourDarkMode"),
      placement: "left",
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: ".premium-button",
      content: t("tourPremium"),
      placement: "left",
      disableBeacon: true,
      spotlightClicks: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("language")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("languageDescription")}
                </p>
              </div>
              <div>
                <LanguageSwitcher />
              </div>
            </div>
            <div className="flex items-center justify-between theme-switch">
              <div className="space-y-0.5">
                <Label>{t("darkMode")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("darkModeDescription")}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-5 w-5" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={handleThemeChange}
                />
                <Moon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t("premium")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("premiumDescription")}
                </p>
              </div>
              <Button
                onClick={handleSubscribe}
                className="premium-button flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {t("subscribe")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          読み込み中...
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
