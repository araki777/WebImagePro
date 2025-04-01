'use client';

import { Header } from "@/components/ui/header";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageGallery } from "@/components/ImageGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { IUserData } from "@/types/types";

export default function Home() {
  // ユーザー情報の状態管理
  const [user, setUser] = useState<IUserData | null>(null);

  // コンポーネントがマウントされたときにユーザー情報を取得
  useEffect(() => {
    const checkUser = async () => {
      // 現在のユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();

      // ユーザーがログインしていない場合は、'/login'にリダイレクト
      if (!user) {
        // クエリパラメータでエラーメッセージを渡してログインページにリダイレクト
        redirect('/login?error=ユーザー情報が取得できませんでした');
      }

      // ユーザー情報を状態にセット
      setUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      });
    };

    checkUser();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // ログアウト時に'/login'にリダイレクト
        redirect('/login');
      } else if (session?.user) {
        // ログインまたはセッションが変更された場合、ユーザー情報を更新
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata
        });
      }
    });

    // クリーンアップ処理(コンポーネントがアンマウントされたときにサブスクライブを解除)
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ログアウト処理
  const handleOAuthLogOut = async () => {
    await supabase.auth.signOut(); // サインアウト
  };

  // ユーザー情報が取得出来ていない場合は'null'を返し、画面には何も表示しない（ローディング状態）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <Header
        onLogout={handleOAuthLogOut} // ログアウト処理
        userImage={user.user_metadata.avatar_url} // ユーザーのアバター画像
        userName={user.user_metadata.full_name || user.email} // ユーザー名（ユーザー名が無ければメールアドレス）
      />
      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        {/* タブコンテンツ */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              アップロード
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              ギャラリー
            </TabsTrigger>
          </TabsList>
          {/* 画像アップロードのタブコンテンツ */}
          <TabsContent value="upload">
            <ImageUpload />
          </TabsContent>
          {/* 画像ギャラリーのタブコンテンツ */}
          <TabsContent value="gallery">
            <ImageGallery />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}