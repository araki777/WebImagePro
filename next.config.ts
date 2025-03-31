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
};

export default nextConfig;