import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    serverExternalPackages: ['jsdom'],
    allowedDevOrigins: ['192.168.1.226']
};
export default nextConfig;
