import { CACHE_EXPIRY, getUserCacheKey, redis } from "@/lib/redis";
import { SessionItem } from "@/types/types";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    const cachedUser = await redis.get<SessionItem>(getUserCacheKey(userId));
    return NextResponse.json({ user: cachedUser });
  } catch (error) {
    console.error("キャッシュ取得エラー:", error);
    return NextResponse.json(
      { error: "キャッシュの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userData } = await request.json();

    if (!userId || !userData) {
      return NextResponse.json(
        { error: "ユーザーIDとユーザーデータが必要です" },
        { status: 400 }
      );
    }

    await redis.set(getUserCacheKey(userId), userData, {
      ex: CACHE_EXPIRY,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("キャッシュ保存エラー:", error);
    return NextResponse.json(
      { error: "キャッシュの保存に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "ユーザーIDが必要です" },
        { status: 400 }
      );
    }

    await redis.del(getUserCacheKey(userId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("キャッシュ削除エラー:", error);
    return NextResponse.json(
      { error: "キャッシュの削除に失敗しました" },
      { status: 500 }
    );
  }
}
