'use client';

import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Chrome, Github } from "lucide-react";

interface OAuthLoginProps {
  providers: ('google' | 'github')[];
}

export function OAuthLogin({ providers }: OAuthLoginProps) {
  const handleOAuthLogin = async (provider: string) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error('OAuth login error:', error);
        alert(`OAuth ログインに失敗しました: ${error.message}`);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      alert('OAuth ログイン中にエラーが発生しました');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {providers.includes('google') && (
        <Button className="w-full" onClick={() => handleOAuthLogin('google')}>
          <Chrome className="w-4 h-4 mr-2" />
          Google でログイン
        </Button>
      )}
      {providers.includes('github') && (
        <Button className="w-full" onClick={() => handleOAuthLogin('github')}>
          <Github className="w-4 h-4 mr-2" />
          GitHub でログイン
        </Button>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">ログイン</h1>
        <OAuthLogin providers={['google', 'github']} />
      </div>
    </div>
  );
}
