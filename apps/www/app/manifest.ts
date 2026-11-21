import type { MetadataRoute } from "next";

import { SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

/** Static export (Cloudflare Pages): render once at build time. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Enterprise UI Playground",
    short_name: "UI Playground",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#121212",
    icons: [
      {
        src: "/brand/avatar-192.jpg",
        sizes: "192x192",
        type: "image/jpeg",
      },
      {
        src: "/brand/avatar-512.jpg",
        sizes: "512x512",
        type: "image/jpeg",
      },
    ],
    id: SITE_URL,
  };
}
