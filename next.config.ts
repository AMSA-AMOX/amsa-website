import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tell Next.js to treat these heavy server-only packages as external
  // so they are NOT bundled into the server bundle (avoids dialect issues with Sequelize)
  serverExternalPackages: ["sequelize", "mysql2", "bcryptjs", "jsonwebtoken", "@google/genai"],
};

export default nextConfig;
