import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ミドルウェアを実行するパスを制限
export const config = {
  matcher: ['/api/supabase/:path*']
};

export async function middleware(request: NextRequest) {
  // 認証ヘッダーの確認
  const authHeader = request.headers.get('Authorization');
  
  // API関連のパスの場合は認証をチェック
  if (request.nextUrl.pathname.startsWith('/api/supabase')) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    try {
      // Supabaseクライアントを作成
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      
      // トークンからユーザー情報を取得
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return NextResponse.json(
          { error: '認証が失敗しました' },
          { status: 401 }
        );
      }

      // ユーザーIDをヘッダーに追加
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', user.id);
      
      // リクエストを進める
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      });
    } catch (error) {
      console.error('認証エラー:', error);
      return NextResponse.json(
        { error: '認証処理中にエラーが発生しました' },
        { status: 500 }
      );
    }
  }

  // 他のルートの場合はそのまま進める
  return NextResponse.next();
} 