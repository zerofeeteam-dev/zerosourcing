import process from "node:process";

import { resolveSupabaseStorageRemotePatterns } from "./lib/public-content/next-image-config.mjs";

const runtimeEnvironment = {
  // eslint-disable-next-line turbo/no-undeclared-env-vars -- Next sets NODE_ENV while loading its build configuration.
  nodeEnvironment: process.env.NODE_ENV,
  supabaseUrl: process.env.SUPABASE_URL,
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: resolveSupabaseStorageRemotePatterns(runtimeEnvironment),
  },
  async rewrites() {
    return [{ source: "/sitemap.xml", destination: "/api/sitemap" }];
  },
};

export default nextConfig;
