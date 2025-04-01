'use client';

import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Chrome, Github, AlertCircle, X } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { OAUTH_PROVIDERS } from '@/lib/constants';

export default function LoginPage() {
  // URLの検索パラメータを取得
  const searchParams = useSearchParams();
  const errorMessageFromParams = searchParams.get('error'); // URLに含まれているエラーメッセージを取得

  // アラートの表示状態とエラーメッセージの管理
  const [showAlert, setShowAlert] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(errorMessageFromParams);

  // OAuth認証を処理する関数
  const handleOAuthLogin = async (provider: typeof OAUTH_PROVIDERS[number]) => {
    try {
      // SupabaseのOAuth認証を使って、指定したプロバイダでサインイン
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`, // 認証後にリダイレクトするURL
        },
      });

      // エラーが発生した場合は、コンソールにエラーを表示し、アラートで通知
      if (error) {
        console.error('OAuth login error:', error);
        setErrorMessage("認証に失敗しました"); // エラーメッセージをセット
        setShowAlert(true); // アラートを表示
      }
    } catch (error) {
      // その他のエラーをキャッチして、コンソールとアラートで通知
      console.error('OAuth login error:', error);
      setErrorMessage("認証に失敗しました"); // エラーメッセージをセット
      setShowAlert(true); // アラートを表示
    }
  };

  // アラートを閉じる処理
  const handleCloseAlert = () => {
    setShowAlert(false); // showAlertステートをfalseにして、アラートを非表示にする
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      {/* エラーメッセージが存在し、アラートが表示されている場合にアラートを表示 */}
      {errorMessage && showAlert && (
      <div className="absolute top-8">
        <Alert variant="destructive" className='py-6 pl-5 pr-8'>
          {/* アラートのアイコン */}
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>接続エラー</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
          {/* アラートを閉じるボタン */}
          <button onClick={handleCloseAlert} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </Alert>
      </div>
      )}
      {/* ログインフォーム */}
      <div className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">ログイン</h1>
        <div className="flex flex-col gap-4">
          {/* Googleでログインするボタン */}
          {OAUTH_PROVIDERS.includes('google') && (
            <Button className="w-full" onClick={() => handleOAuthLogin('google')}>
              <Chrome className="w-4 h-4 mr-2" />
              Google でログイン
            </Button>
          )}
          {/* GitHubでログインするボタン */}
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
