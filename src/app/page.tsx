'use client';

import { Header } from "@/components/ui/header";
import { ImageUpload } from "@/components/image-upload";
import { ImageGallery } from "@/components/image-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Image as ImageIcon } from "lucide-react";
import { supabase } from '@/lib/supabase';
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface UserData {
  id: string;
  email: string | undefined;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
  };
}

export default function Home() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        redirect('/login');
      }
      setUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata
      });
    };

    checkUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        redirect('/login');
      } else if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          user_metadata: session.user.user_metadata
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleOAuthLogOut = async () => {
    await supabase.auth.signOut();
    redirect('/login');
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onLogout={handleOAuthLogOut}
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