import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "webimageprostg.blob.core.windows.net",
      "webimagepro.vercel.app",
      "webimageprostg.vercel.app"
    ],
    unoptimized: true
  },
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // WASMファイルを正しく扱うための設定
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;