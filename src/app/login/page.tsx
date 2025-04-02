'use client';

import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Chrome, Github, AlertCircle, X } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { OAUTH_PROVIDERS } from '@/lib/constants';

function LoginContent() {
  const searchParams = useSearchParams();
  const errorMessageFromParams = searchParams.get('error');
  const [showAlert, setShowAlert] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorMessageFromParams);

  const handleOAuthLogin = async (provider: typeof OAUTH_PROVIDERS[number]) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error) {
        console.error('OAuth login error:', error);
        setErrorMessage("認証に失敗しました");
        setShowAlert(true);
      }
    } catch (error) {
      console.error('OAuth login error:', error);
      setErrorMessage("認証に失敗しました");
      setShowAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {errorMessage && showAlert && (
        <div className="absolute top-8">
          <Alert variant="destructive" className='py-6 pl-5 pr-8'>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>接続エラー</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
            <button onClick={handleCloseAlert} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </Alert>
        </div>
      )}
      <div className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">ログイン</h1>
        <div className="flex flex-col gap-4">
          {OAUTH_PROVIDERS.includes('google') && (
            <Button className="w-full" onClick={() => handleOAuthLogin('google')}>
              <Chrome className="w-4 h-4 mr-2" />
              Google でログイン
            </Button>
          )}
          {OAUTH_PROVIDERS.includes('github') && (
            <Button className="w-full" onClick={() => handleOAuthLogin('github')}>
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
