import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        hostname: "images.squarespace-cdn.com",
      },
    ],
  },
  // Skip static generation of API routes during build
  output: undefined, // Use default for now
};

export default nextConfig;
