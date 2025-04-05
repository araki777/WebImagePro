'use client';

import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import TourGuid from "@/components/common/TourGuid";
import { Step } from "react-joyride";

// ツアーステップを定義
const steps: Step[] = [
  {
    target: '.profile-avatar',
    content: 'プロフィール画像です。ログインに使用したサービスのアバターが表示されます。',
    placement: 'right',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.profile-form',
    content: 'プロフィール情報を編集できます。フルネーム、表示名、自己紹介文を設定しましょう。',
    placement: 'bottom',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.update-button',
    content: '情報を編集したら、このボタンをクリックして変更を保存します。',
    placement: 'top',
    disableBeacon: true,
    spotlightClicks: true,
  },
  {
    target: '.user-info',
    content: 'ユーザーIDやログイン方法などのアカウント情報が表示されています。',
    placement: 'top',
    disableBeacon: true,
    spotlightClicks: true,
  }
];

export default function ProfilePage() {
  const { user, isLoading, signOut, setUser, checkUser } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.user_metadata.full_name || '',
    display_name: user?.user_metadata.display_name || '',
    bio: user?.user_metadata.bio || '',
  });

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  if (isLoading || !user) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          display_name: formData.display_name,
          bio: formData.bio,
        }
      });

      if (error) throw error;

      // ユーザー情報を更新
      setUser({
        ...user,
        user_metadata: {
          ...user.user_metadata,
          ...formData
        }
      });

      toast.success('プロフィールを更新しました');
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      toast.error('プロフィールの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TourGuid steps={steps} />
      <Header
        onLogout={signOut}
        userImage={user.user_metadata.avatar_url}
        userName={user.user_metadata.full_name || user.email}
      />
      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>プロフィール情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="profile-avatar h-20 w-20">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.user_metadata.full_name || '名前未設定'}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="profile-form space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">フルネーム</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="フルネームを入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_name">表示名</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="表示名を入力"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">自己紹介</Label>
                <Input
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="自己紹介を入力"
                />
              </div>

              <Button type="submit" disabled={isUpdating} className="update-button">
                {isUpdating ? '更新中...' : 'プロフィールを更新'}
              </Button>
            </form>

            <div className="user-info space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">ユーザーID</h3>
                <p className="text-gray-600">{user.id}</p>
              </div>
              {user.user_metadata.provider && (
                <div className="space-y-2">
                  <h3 className="font-semibold">ログイン方法</h3>
                  <p className="text-gray-600">{user.user_metadata.provider}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}