'use client';

import { Header } from "@/components/ui/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Moon, Sun, CreditCard } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { loadStripe } from '@stripe/stripe-js';
import { toast } from "sonner";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

// Stripeの公開キーを設定
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

export default function SettingsPage() {
  const { user, isLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 決済成功時のメッセージ
    if (searchParams.get('success')) {
      toast.success('決済が完了しました');
    }
    // 決済キャンセル時のメッセージ
    if (searchParams.get('canceled')) {
      toast.error('決済がキャンセルされました');
    }
  }, [searchParams]);

  const handleSubscribe = async () => {
    try {
      // セッションを取得
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include', // クッキーを含める
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '決済セッションの作成に失敗しました');
      }

      const { sessionId } = await response.json();

      // Stripeのチェックアウトページにリダイレクト
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripeの初期化に失敗しました');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (error) {
      console.error('決済エラー:', error);
      toast.error(error instanceof Error ? error.message : '決済の開始に失敗しました');
    }
  };

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
            <CardTitle>設定</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ダークモード</Label>
                <p className="text-sm text-muted-foreground">
                  ダークモードとライトモードを切り替えます
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Sun className="h-5 w-5" />
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                />
                <Moon className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>プレミアム会員</Label>
                <p className="text-sm text-muted-foreground">
                  プレミアム機能を利用するには会員登録が必要です
                </p>
              </div>
              <Button onClick={handleSubscribe} className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                会員登録
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}