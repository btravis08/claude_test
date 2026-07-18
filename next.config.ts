import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /* React ViewTransition integration — SPA page cross-fades */
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
};

export default nextConfig;
