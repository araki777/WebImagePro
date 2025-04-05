'use client';

import { Header } from "@/components/ui/header";
import { ImageGallery } from "@/components/ImageGallery";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import { Step } from 'react-joyride';
import TourGuid from "@/components/common/TourGuid";

const steps: Step[] = [
  {
    target: '.search-bar',
    content: '画像を検索できます。ファイル名で検索しましょう',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '.image-list',
    content: 'アップロードした画像が一覧表示されます。各画像に対して編集、ダウンロード、削除が可能です',
    placement: 'top',
    disableBeacon: true,
  }
];

export default function GalleryPage() {
  const { user, isLoading, signOut, checkUser } = useAuthStore();

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
        <ImageGallery />
      </main>
    </div>
  );
} 