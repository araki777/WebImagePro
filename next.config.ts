import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "webimageprostg.blob.core.windows.net",
    ],
    unoptimized: true
  },
};

export default nextConfig;