// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { InfoIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { useState } from "react";
import type { Announcement } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("systemBanner.<key>"). */
export const SYSTEM_BANNER_MESSAGES = {
  region: "System announcement",
  learnMore: "Learn more",
  dismiss: "Dismiss announcement",
};

export interface SystemBannerProps {
  /** The announcement. Nothing renders without one. */
  announcement?: Announcement;
  /** Hide it for this user; it goes at once and comes back if this fails. Without it, dismissing lasts until reload. */
  onDismiss?: Action<string>;
  className?: string;
}

const TONE = {
  info: { bar: "border-category-1/40 bg-category-1/10", text: "text-category-1-foreground", hover: "hover:bg-category-1/15" },
  warning: { bar: "border-category-3/40 bg-category-3/10", text: "text-category-3-foreground", hover: "hover:bg-category-3/15" },
};

// A system banner is persistent, page-level and dismissible — not a toast. The message wraps
// instead of truncating, and on phones "Learn more" drops under the text.
function SystemBannerScreen({ announcement, onDismiss, className }: SystemBannerProps) {
  const t = useMessages("systemBanner", SYSTEM_BANNER_MESSAGES);
  const [hidden, setHidden] = useState(false);
  const dismiss = useAction(onDismiss ?? (async () => {}), {
    optimistic: () => {
      setHidden(true);
      return () => setHidden(false);
    },
  });
  if (!announcement || hidden) return null;
  const tone = TONE[announcement.tone];
  return (
    <section aria-label={t.region} className={cn("sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] backdrop-blur", tone.bar, className)}>
      <div className="mx-auto flex max-w-6xl items-start gap-3 py-2 ps-4 pe-2 sm:items-center sm:ps-6 sm:pe-4">
        {announcement.tone === "warning" ? <TriangleAlertIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0 sm:mt-0", tone.text)} /> : <InfoIcon aria-hidden className={cn("mt-0.5 size-4 shrink-0 sm:mt-0", tone.text)} />}
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <p className={cn("min-w-0 flex-1 text-sm", tone.text)}>
            <span className="font-medium">{announcement.title}</span> · {announcement.message}
          </p>
          {announcement.href ? (
            <WirefrontLink className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "-ms-2.5 self-start sm:ms-0 sm:self-auto", tone.text, tone.hover)} href={announcement.href}>
              {t.learnMore}
            </WirefrontLink>
          ) : null}
        </div>
        <button
          aria-label={t.dismiss}
          className={cn("grid size-8 shrink-0 place-items-center rounded-md opacity-70 outline-none transition-colors hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10", tone.text, tone.hover)}
          onClick={() => void dismiss.run(announcement.id)}
          type="button"
        >
          <XIcon aria-hidden className="size-4" />
        </button>
      </div>
    </section>
  );
}

export function SystemBanner(props: SystemBannerProps) {
  return (
    <ScreenBoundary name="SystemBanner">
      <SystemBannerScreen {...props} />
    </ScreenBoundary>
  );
}
