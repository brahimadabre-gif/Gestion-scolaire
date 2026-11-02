import type { NextConfig } from "next";

const isNetlifyBuild = process.env.NETLIFY === "true" || Boolean(process.env.NETLIFY_DB_URL);

const nextConfig: NextConfig = {
  // Netlify's Next.js runtime packages the server function itself. Keep the
  // standalone bundle for local/Tauri runs, but do not feed it to Netlify.
  ...(isNetlifyBuild ? {} : { output: "standalone" as const }),
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
