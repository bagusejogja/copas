import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Use webpack for build instead of turbopack (cPanel symlink issue)
  },
};

export default nextConfig;
