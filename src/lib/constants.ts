// 認証プロバイダーの定義
export const OAUTH_PROVIDERS = ['google', 'github'] as const;

// 圧縮設定のデフォルト値
export const DEFAULT_COMPRESSION_SETTINGS = {
  enabled: false,
  quality: 80,
  maxWidth: 1024,
  maxHeight: 1024,
};
