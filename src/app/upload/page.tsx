"use client";

import TourGuid from "@/components/common/TourGuid";
import { ImageUpload } from "@/components/ImageUpload";
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { Step } from "react-joyride";

// フッターを動的にインポート
const Footer = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function UploadPage() {
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  const steps: Step[] = [
    {
      target: ".upload-header",
      content: "ここでファイルを選択する",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".compression-settings",
      content:
        "画像の圧縮設定を調整できます。画質とファイルサイズのバランスを調整しましょう",
      placement: "bottom",
      disableBeacon: true,
    },
    {
      target: ".upload-button",
      content:
        "選択した画像をアップロードするボタンです。複数の画像を一括でアップロードできます",
      placement: "bottom",
      disableBeacon: true,
    },
  ];

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <ImageUpload />
      </main>
      <Footer />
    </div>
  );
}
