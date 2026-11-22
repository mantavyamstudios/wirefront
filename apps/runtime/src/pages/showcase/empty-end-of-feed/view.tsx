// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, RotateCwIcon } from "lucide-react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("endOfFeed.<key>"). */
export const END_OF_FEED_MESSAGES = {
  title: "End of feed",
  description:
    "You’ve seen everything from the last 24 hours. New events will appear at the top.",
  refresh: "Refresh",
};

export interface EndOfFeedProps {
  /** Fetch newer events. The button only shows when this is given; it shows progress and errors. */
  onRefresh?: Action;
  className?: string;
}

/** The marker under the last item of a feed. Render it after your list. */
function EndOfFeedScreen({ onRefresh, className }: EndOfFeedProps) {
  const t = useMessages("endOfFeed", END_OF_FEED_MESSAGES);
  const refresh = useAction(onRefresh ?? (async () => {}));
  return (
    <div className={cn("mt-8 flex flex-col items-center gap-3", className)}>
      <div aria-hidden className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-border/70" />
        <div className="flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
          <CheckIcon className="size-3" />
        </div>
        <div className="h-px flex-1 bg-border/70" />
      </div>
      <p className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.25em]">
        {t.title}
      </p>
      <p className="max-w-xs text-balance text-center text-muted-foreground text-xs">
        {t.description}
      </p>
      {onRefresh ? (
        <Button
          className="mt-1"
          disabled={refresh.isPending()}
          onClick={() => void refresh.run()}
          size="sm"
          variant="ghost"
        >
          {refresh.isPending() ? <Spinner /> : <RotateCwIcon />}
          {t.refresh}
        </Button>
      ) : null}
      {refresh.error ? (
        <p className="text-destructive-foreground text-xs" role="alert">
          {refresh.error}
        </p>
      ) : null}
    </div>
  );
}

export function EndOfFeed(props: EndOfFeedProps) {
  return (
    <ScreenBoundary name="EndOfFeed">
      <EndOfFeedScreen {...props} />
    </ScreenBoundary>
  );
}
