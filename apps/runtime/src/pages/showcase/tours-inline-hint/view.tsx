// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { LightbulbIcon, XIcon } from "lucide-react";
import type { Tip } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("tipCard.<key>"). */
export const TIP_CARD_MESSAGES = {
  region: "Tip",
  tryIt: "Try it",
  notNow: "Not now",
  dismiss: "Dismiss tip",
  progress: "Tip · {n} of {total}",
  seeAll: "See all tips →",
};

export interface TipCardProps {
  /** The tip. Nothing renders without one. */
  tip?: Tip;
  /** Act on the tip. Hidden without it. */
  onTry?: () => void;
  /** Hide it for now (show again later). Hidden without it. */
  onSnooze?: () => void;
  /** Hide it for good. */
  onDismiss: (id: string) => void;
  /** Where "See all tips" goes. Hidden when not given. */
  allHref?: string;
  className?: string;
}

// Phones: full width above the home indicator. sm+: a 20rem card bottom-right. Non-blocking,
// so it's a labelled region, not a dialog.
function TipCardScreen({ tip, onTry, onSnooze, onDismiss, allHref, className }: TipCardProps) {
  const t = useMessages("tipCard", TIP_CARD_MESSAGES);
  if (!tip) return null;
  return (
    <aside aria-label={t.region} className={cn("fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 sm:inset-x-auto sm:inset-e-6 sm:bottom-6 sm:w-80", className)}>
      <div className="rounded-xl border border-border/70 bg-background p-4 shadow-xl backdrop-blur">
        <div className="flex items-start gap-3">
          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-full bg-category-3/15 text-category-3-foreground">
            <LightbulbIcon className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-medium text-sm">{tip.title}</h2>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{tip.body}</p>
            {onTry || onSnooze ? (
              <div className="mt-3 flex items-center gap-2">
                {onTry ? (
                  <Button onClick={onTry} size="sm" type="button" variant="outline">
                    {t.tryIt}
                  </Button>
                ) : null}
                {onSnooze ? (
                  <Button onClick={onSnooze} size="sm" type="button" variant="ghost">
                    {t.notNow}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          <button
            aria-label={t.dismiss}
            className="-me-1.5 -mt-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
            onClick={() => onDismiss(tip.id)}
            type="button"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-1 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>{interpolate(t.progress, { n: tip.position, total: tip.total })}</span>
          {allHref ? (
            <WirefrontLink className="-me-2 inline-flex min-h-8 items-center rounded px-2 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" href={allHref}>
              {t.seeAll}
            </WirefrontLink>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

export function TipCard(props: TipCardProps) {
  return (
    <ScreenBoundary name="TipCard">
      <TipCardScreen {...props} />
    </ScreenBoundary>
  );
}
