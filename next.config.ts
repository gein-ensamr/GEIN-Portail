import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // next/image isn't used, so skip the loader config.
  images: { unoptimized: true },
  devIndicators: false,
  reactStrictMode: false,
};

export default nextConfig;
