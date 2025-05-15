import { routing } from "@/i18n/routing";
import { createClient } from "@supabase/supabase-js";
import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

// Supabase認証用のAPIパス
const API_SUPABASE_PREFIX = "/api/supabase";

export default async function middleware(request: NextRequest) {
  // API認証が必要な場合のみSupabase認証を実行
  if (request.nextUrl.pathname.startsWith(API_SUPABASE_PREFIX)) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || "",
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      );
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json(
          { error: "認証が失敗しました" },
          { status: 401 }
        );
      }
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", user.id);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch (error) {
      console.error("認証エラー:", error);
      return NextResponse.json(
        { error: "認証処理中にエラーが発生しました" },
        { status: 500 }
      );
    }
  }
  // それ以外はnext-intlの多言語ミドルウェアを適用
  // createMiddlewareはsyncなのでawait不要
  return createMiddleware(routing)(request);
}

export const config = {
  // APIはSupabase認証、それ以外はi18n
  matcher: [
    "/api/supabase/:path*",
    // 拡張子があるファイル（静的ファイル）はすべて除外
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
