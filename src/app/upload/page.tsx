'use client';

import { Header } from "@/components/ui/header";
import { ImageUpload } from "@/components/ImageUpload";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import TourGuid from "@/components/common/TourGuid";
import { Step } from "react-joyride";

export default function UploadPage() {
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  const steps: Step[] = [
    {
      target: '.upload-header',
      content: 'ここでファイルを選択する',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.compression-settings',
      content: '画像の圧縮設定を調整できます。画質とファイルサイズのバランスを調整しましょう',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '.upload-button',
      content: '選択した画像をアップロードするボタンです。複数の画像を一括でアップロードできます',
      placement: 'bottom',
      disableBeacon: true,
    }
  ];

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8">
        <ImageUpload />
      </main>
    </div>
  );
} 