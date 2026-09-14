import type { NextConfig } from "next";

const ONE_YEAR = 60 * 60 * 24 * 365;

const nextConfig: NextConfig = {
  // Tell Next.js to treat these heavy server-only packages as external
  // so they are NOT bundled into the server bundle (avoids dialect issues with Sequelize)
  serverExternalPackages: ["sequelize", "mysql2", "bcryptjs", "jsonwebtoken", "@google/genai"],

  // Keep the dev-tools badge off the sidebar's bottom-left "Send feedback" button.
  devIndicators: { position: "bottom-right" },

  images: {
    // Serve AVIF/WebP at the rendered size instead of the multi-MB originals.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "img.logo.dev" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },

  async headers() {
    // Optimized assets live under versioned `optimized/` folders whose file
    // names change with content, so browsers and the CDN may keep them forever.
    const immutable = [{ key: "Cache-Control", value: `public, max-age=${ONE_YEAR}, immutable` }];
    return [
      { source: "/assets/optimized/:path*", headers: immutable },
      { source: "/team/optimized/:path*", headers: immutable },
      { source: "/assets/universities/:path*", headers: immutable },
      { source: "/Fonts/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
