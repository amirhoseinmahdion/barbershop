import type { NextConfig } from "next";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const apiProxyTarget = configuredApiUrl.startsWith("http")
  ? configuredApiUrl.replace(/\/$/, "")
  : "http://localhost:4000/api/v1";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
