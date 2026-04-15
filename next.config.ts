import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cpus: 1, // Membatasi proses agar tidak menabrak batas nproc di cPanel
    workerThreads: false,
    memoryBasedWorkersCount: true,
  },
  // swcMinify: false kadang juga bisa menghemat crash untuk versi Next.js tertentu
};

export default nextConfig;
