"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { getSiteSection } from "@/components/page-transition/page-transition-provider";

type SiteLinkProps = ComponentProps<typeof NextLink>;

/**
 * next/link that prefetches only within the current section (home, screens,
 * docs, pricing, legal).
 *
 * A link into another section plays the full-screen page transition, so a
 * prefetch gains nothing there. It would also make the browser preload that
 * section's stylesheet, which this page never applies (Chrome: "preloaded
 * using link preload but not used"). An explicit `prefetch` prop wins.
 */
export default function SiteLink({ href, prefetch, ...props }: SiteLinkProps) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : (href.pathname ?? "");
  const internal = target.startsWith("/") && !target.startsWith("//");
  const crossSection =
    internal && getSiteSection(target) !== getSiteSection(pathname ?? "/");

  return (
    <NextLink
      href={href}
      prefetch={prefetch ?? (crossSection ? false : undefined)}
      {...props}
    />
  );
}
