import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },

  // Prevent Next.js from bundling these packages — they rely on native
  // binaries / their own directory structure and break when webpack-bundled.
  serverExternalPackages: ['playwright-core', '@sparticuz/chromium-min'],

  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
};

export default nextConfig;