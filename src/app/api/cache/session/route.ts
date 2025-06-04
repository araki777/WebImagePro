import { CACHE_EXPIRY, redis } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "セッションIDが必要です" },
        { status: 400 }
      );
    }

    const cachedSession = await redis.get(sessionId);
    return NextResponse.json(cachedSession);
  } catch (error) {
    console.error("セッションキャッシュ取得エラー:", error);
    return NextResponse.json(
      { error: "セッションキャッシュの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { sessionId, ...cacheData } = await request.json();

    if (!sessionId || !cacheData) {
      return NextResponse.json(
        { error: "セッションIDとセッションデータが必要です" },
        { status: 400 }
      );
    }

    await redis.set(sessionId, cacheData, {
      ex: CACHE_EXPIRY,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("セッションキャッシュ保存エラー:", error);
    return NextResponse.json(
      { error: "セッションキャッシュの保存に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "セッションIDが必要です" },
        { status: 400 }
      );
    }

    await redis.del(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("セッションキャッシュ削除エラー:", error);
    return NextResponse.json(
      { error: "セッションキャッシュの削除に失敗しました" },
      { status: 500 }
    );
  }
}
