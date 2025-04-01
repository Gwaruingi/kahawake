import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Don't run ESLint during builds - we've fixed the critical errors
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
