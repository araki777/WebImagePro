import { routing } from "@/i18n/routing";
import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: [
    // 拡張子があるファイル（静的ファイル）はすべて除外
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
