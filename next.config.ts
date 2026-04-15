import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  ...(process.env.NODE_ENV === 'production' && {
    experimental: {
      cpus: 1,
      workerThreads: false,
      memoryBasedWorkersCount: true,
    }
  }),
};

export default nextConfig;
