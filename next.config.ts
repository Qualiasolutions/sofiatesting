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
      {
        hostname: "i.ibb.co",
      },
    ],
  },
  // Skip static generation of admin routes during build
  trailingSlash: false,
  // Exclude admin routes from static generation
  generateEtags: false,
};

export default nextConfig;
