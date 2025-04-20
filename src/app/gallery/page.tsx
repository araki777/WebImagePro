"use client";

import { ImageGallery } from "@/components/ImageGallery";
import { Header } from "@/components/ui/header";
import { useAuthStore } from "@/store/useAuthStore";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// フッターを動的にインポート
const Footer = dynamic(() =>
  import("@/components/ui/footer").then((mod) => mod.Footer)
);

export default function GalleryPage() {
  const router = useRouter();
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    // ユーザーの読み込みが終わり、未ログインの場合はログインページへリダイレクト
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
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
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-8">ギャラリー</h1>
        <ImageGallery />
      </main>
      <Footer />
    </div>
  );
}
