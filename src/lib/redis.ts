import { Redis } from "@upstash/redis";

// 環境変数の存在チェックを厳密に行う
if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error("Upstash Redisの環境変数が設定されていません。");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// キャッシュの有効期限（1時間）
export const CACHE_EXPIRY = 60 * 60;

// ユーザー情報のキャッシュキーを生成する関数
export const getUserCacheKey = (userId: string) => `user:${userId}`;
