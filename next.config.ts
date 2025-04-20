import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["images.unsplash.com", "webimageprostg.blob.core.windows.net"],
    unoptimized: true,
  },
  webpack: (config) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
  // ビルドから特定のページを除外
  // @ts-ignore - Next.jsの最新バージョンでのビルド設定
  transpilePackages: [],
  // 静的エクスポートを設定
  output: "export",
  // 実験的なページのビルドをスキップ
  distDir: process.env.SKIP_BUILD_STATIC_GENERATION ? ".next" : ".next",
  // 特定のパスを除外
  exportPathMap: async function () {
    return {
      "/": { page: "/" },
      "/editor": { page: "/editor" },
      "/terms": { page: "/terms" },
      "/privacy": { page: "/privacy" },
      "/gallery": { page: "/gallery" },
      "/upload": { page: "/upload" },
      "/404": { page: "/not-found" },
    };
  },
};

export default nextConfig;
