"use client";

import { ImageGallery } from "@/components/ImageGallery";
import { Header } from "@/components/ui/header";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/store/useAuthStore";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { useEffect } from "react";

// フッターを動的にインポート
const Footer = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function GalleryPage() {
  const t = useTranslations("Gallery");
  const router = useRouter();
  const { signOut, checkUser, userProfiles } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    // ユーザーの読み込みが終わり、未ログインの場合はログインページへリダイレクト
    if (!userProfiles) {
      router.push("/login");
    }
  }, [userProfiles, router]);

  if (!userProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        onLogout={signOut}
        userImage={userProfiles?.avatar_url || undefined}
        userName={userProfiles?.display_name || "No Names"}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>
        <ImageGallery />
      </main>
      <Footer />
    </div>
  );
}
