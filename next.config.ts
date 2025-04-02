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
  webpack: (config) => {
    // WebAssemblyサポートを有効化
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // wasmファイルのルールを追加
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });

    return config;
  },
};

export default nextConfig;