import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests in development (for accessing from different devices/IPs)
  allowedDevOrigins: ['*'],
};

export default nextConfig;
