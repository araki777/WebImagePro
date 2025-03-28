'use client';

import { Header } from "@/components/ui/header";
import { ImageUpload } from "@/components/image-upload";
import { ImageGallery } from "@/components/image-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { redirect } from "next/navigation";

export default function Home() {
  const handleOAuthLogOut = async () => {
      await supabase.auth.signOut();
      redirect('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={handleOAuthLogOut} />
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