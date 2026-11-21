import type { Metadata } from "next";

import manifest from "@/lib/flows/flows.manifest.json";

/** Production site origin — used for sitemap, robots, metadata, and JSON-LD. */
export const SITE_URL = "https://enterprise-ui-playground.pages.dev" as const;

function toAbsoluteSiteUrl(pathname: string): string {
  if (pathname === "/" || pathname === "") {
    return SITE_URL;
  }

  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

/**
 * Self-referencing canonical + hreflang (en + x-default).
 * Always absolute on `SITE_URL` so Google never treats a preview host
 * as the canonical, even when the request hits that host.
 */
export function getPageAlternates(
  pathname: string
): NonNullable<Metadata["alternates"]> {
  let canonical = pathname;
  if (pathname === "") {
    canonical = "/";
  } else if (!pathname.startsWith("/")) {
    canonical = `/${pathname}`;
  }

  const href = toAbsoluteSiteUrl(canonical);

  return {
    canonical: href,
    languages: {
      en: href,
      "x-default": href,
    },
  };
}

export const CONTACT_EMAIL = "deveshmishra09269@gmail.com" as const;
export const SUPPORT_EMAIL = CONTACT_EMAIL;
/** Author profile (footer credit). */
export const STUDIO_URL = "https://github.com/deveshmishra09" as const;

export const GITHUB_REPO_URL =
  "https://github.com/deveshmishra09/enterprise_ui_playground" as const;
export const GITHUB_PROFILE_URL = "https://github.com/deveshmishra09" as const;
export const X_PROFILE_URL = "https://x.com/devzsh" as const;

/** Public community hub — bug reports, discussions, and feature requests. */
export const COMMUNITY_REPO_URL = GITHUB_REPO_URL;
export const COMMUNITY_ISSUES_URL = `${GITHUB_REPO_URL}/issues/new` as const;
export const COMMUNITY_DISCUSSIONS_URL = `${GITHUB_REPO_URL}/issues` as const;

export const SITE_NAME = "Enterprise UI Playground" as const;

/** Counts come from the flows manifest, which is synced from Flutter on every build. */
export const SITE_DESCRIPTION = `${manifest.totals.subflows} real Flutter user flows you can click through live in the browser — sign-in to checkout, across ${manifest.totals.categories} categories, with the full Dart source of every screen.`;

/** Default OG image headline. */
export const SITE_OG_HERO_TITLE = "Real Flutter flows";

/** OG image subline. */
export const SITE_OG_HERO_SUBLINE = "Live in your browser";

/**
 * Origin for resolving metadata and OG image URLs.
 * - Vercel: deployment host (preview or production)
 * - Dev: `NEXT_PUBLIC_SITE_URL` or localhost
 * - Fallback: `SITE_URL`
 */
export function getMetadataBaseUrl(): string {
  if (process.env.VERCEL_ENV === "production") {
    return SITE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }

  return SITE_URL;
}
