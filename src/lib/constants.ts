import { ICompressionSettings } from "@/types/types";

// 認証プロバイダーの定義
export const OAUTH_PROVIDERS = ["google", "github"] as const;

// 圧縮設定のデフォルト値
export const DEFAULT_COMPRESSION_SETTINGS: ICompressionSettings = {
  enabled: true,
  format: "JPEG",
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
};

// 切り抜き領域の比率
export const RATIOS = [
  { name: "フリー", value: null },
  { name: "1:1", value: 1 },
  { name: "4:3", value: 4 / 3 },
  { name: "3:2", value: 3 / 2 },
  { name: "16:9", value: 16 / 9 },
  { name: "9:16", value: 9 / 16 },
];
export type { ICompressionSettings };
