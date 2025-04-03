'use client';

import { Header } from "@/components/ui/header";
import { ImageUpload } from "@/components/ImageUpload";
import { ImageGallery } from "@/components/ImageGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";

export default function Home() {
  const { user, isLoading, signOut, checkUser } = useAuthStore();

  useEffect(() => {
    checkUser();
  }, [checkUser]);

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
          <TabsContent value="upload">
            <ImageUpload />
          </TabsContent>
          <TabsContent value="gallery">
            <ImageGallery />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}