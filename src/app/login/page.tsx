'use client';

import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Chrome, Github } from "lucide-react";
import { Suspense, useState } from 'react';
import { OAUTH_PROVIDERS } from '@/lib/constants';

function LoginContent() {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({
    google: false,
    github: false
  });

  const handleOAuthLogin = async (provider: typeof OAUTH_PROVIDERS[number]) => {
    setIsLoading(prev => ({ ...prev, [provider]: true }));
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error('OAuth login error:', error);
        setIsLoading(prev => ({ ...prev, [provider]: false }));
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      setIsLoading(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">ログイン</h1>
        <div className="flex flex-col gap-4">
          {OAUTH_PROVIDERS.includes('google') && (
            <Button 
              className="w-full" 
              onClick={() => handleOAuthLogin('google')}
              isLoading={isLoading.google}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Google でログイン
            </Button>
          )}
          {OAUTH_PROVIDERS.includes('github') && (
            <Button 
              className="w-full" 
              onClick={() => handleOAuthLogin('github')}
              isLoading={isLoading.github}
            >
              <Github className="w-4 h-4 mr-2" />
              GitHub でログイン
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">読み込み中...</div>}>
      <LoginContent />
    </Suspense>
  );
}
