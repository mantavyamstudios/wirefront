// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ArrowLeftIcon, HomeIcon } from "lucide-react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("notFound.<key>"). */
export const NOT_FOUND_MESSAGES = {
  eyebrow: "Status · 404",
  code: "404",
  title: "We can’t find that page.",
  description:
    "The link may be old, or the page may have moved. Check the URL or head back to somewhere you know.",
  back: "Go back",
  home: "Take me home",
};

export interface NotFoundProps {
  /** Go back, e.g. your router's history.back. The button only shows when this is given. */
  onBack?: () => void;
  /** Your home page. The link only shows when this is given. */
  homeHref?: string;
  className?: string;
}

function NotFoundScreen({ onBack, homeHref, className }: NotFoundProps) {
  const t = useMessages("notFound", NOT_FOUND_MESSAGES);
  return (
    <div
      className={cn(
        "relative min-h-svh overflow-hidden bg-background",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at center, black 35%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto flex min-h-svh max-w-3xl flex-col items-center justify-center-safe px-6 py-10 text-center">
        <div className="mb-6 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
          {t.eyebrow}
        </div>
        <div
          aria-hidden
          className="relative font-bold font-heading text-[clamp(8rem,22vw,16rem)] leading-none tracking-tighter"
        >
          <span className="bg-linear-to-b from-foreground to-foreground/30 bg-clip-text text-transparent">
            {t.code}
          </span>
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-2 h-1/2"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 100%, color-mix(in srgb, var(--background) 80%, transparent) 50%, transparent 100%)",
            }}
          />
        </div>
        <h1 className="mt-10 max-w-md font-heading text-2xl leading-tight md:text-3xl">
          {t.title}
        </h1>
        <p className="mt-2 max-w-sm text-balance text-muted-foreground text-sm">
          {t.description}
        </p>
        {onBack || homeHref ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {onBack ? (
              <Button onClick={onBack} variant="outline">
                <ArrowLeftIcon />
                {t.back}
              </Button>
            ) : null}
            {homeHref ? (
              <WirefrontLink className={buttonVariants()} href={homeHref}>
                <HomeIcon />
                {t.home}
              </WirefrontLink>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function NotFound(props: NotFoundProps) {
  return (
    <ScreenBoundary name="NotFound">
      <NotFoundScreen {...props} />
    </ScreenBoundary>
  );
}
