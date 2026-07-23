import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* React Compiler: build-time auto-memoization — cuts re-render
     work across the motion-heavy component tree (INP/TBT) */
  reactCompiler: true,
  /* Cache Components = Partial Prerendering in Next 16: pages serve a
     prerendered static shell immediately while `use cache` data
     (sanityFetch) streams in — see src/sanity/lib/fetch.ts */
  cacheComponents: true,
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
