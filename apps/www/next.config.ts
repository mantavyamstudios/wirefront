import bundleAnalyzer from "@next/bundle-analyzer";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  transpilePackages: ["@workspace/ui"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@workspace/ui",
      "motion",
      "radix-ui",
      "fumadocs-ui",
      "lenis",
      "cmdk",
    ],
    turbopackFileSystemCacheForBuild: true,
    // Experimental native React Compiler path (Next 16.3+). Falls back to
    // babel-plugin-react-compiler if disabled; safe to try on Preview.
    turbopackRustReactCompiler: true,
    agentUpgrade: "security",
    agentFeedback: true,
  },
  reactCompiler: true,
  // Tailwind CSS v4 via the dedicated Turbopack loader (faster than PostCSS).
  // Do NOT set `as: '*.css'` here: it breaks CSS Modules (see tailwindlabs/tailwindcss#20659).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
      },
    },
  },
  // Cloudflare Pages serves the site as static files: no server runtime.
  // Response headers and redirects live in public/_headers and
  // public/_redirects instead of `headers()` / `redirects()`.
  output: "export",
  images: { unoptimized: true },
  reactStrictMode: false,
};

export default withBundleAnalyzer(withMDX(nextConfig));
