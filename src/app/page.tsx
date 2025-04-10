'use client';

import { Header } from "@/components/ui/header";
import { Footer } from "@/components/ui/footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import Link from "next/link";
import TourGuid from "@/components/common/TourGuid";
import { Step } from "react-joyride";

export default function Home() {
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  // トップページのツアーステップを定義
  const steps: Step[] = [
    {
      target: '.card:nth-child(1)',
      content: '新しい画像をアップロードするには、このカードからアップロードページに移動します。様々な画像形式に対応しています。',
      placement: 'right',
      disableBeacon: true,
      spotlightClicks: true,
    },
    {
      target: '.card:nth-child(2)',
      content: 'アップロードした画像はすべてギャラリーで管理できます。編集、ダウンロード、削除などの操作が可能です。',
      placement: 'left',
      disableBeacon: true,
      spotlightClicks: true,
    }
  ];

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return null;
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
        <h1 className="text-3xl font-bold mb-8 text-center">WebImagePro</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                画像アップロード
              </CardTitle>
              <CardDescription>
                画像をアップロードして編集することができます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>新しい画像をアップロードして加工しましょう。様々な画像処理機能が利用できます。</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/upload">アップロードページへ</Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                画像ギャラリー
              </CardTitle>
              <CardDescription>
                これまでにアップロードした画像を閲覧できます
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>過去にアップロードした画像の一覧を表示し、管理することができます。</p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/gallery">ギャラリーページへ</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}