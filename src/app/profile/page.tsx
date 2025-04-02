'use client';

import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
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
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.user_metadata.avatar_url} />
                <AvatarFallback>{user.email?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user.user_metadata.full_name || '名前未設定'}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}