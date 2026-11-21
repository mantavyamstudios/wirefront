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
import { RotateCwIcon, WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("offline.<key>"). */
export const OFFLINE_MESSAGES = {
  status: "Offline · waiting",
  title: "We’ve lost the signal.",
  description: "Your connection dropped while we were syncing. Don’t worry — your last edit is safe locally.",
  retry: "Try again",
  stillOffline: "Still offline. We’ll keep trying.",
  tip1: "Check that a VPN or firewall isn’t blocking the app",
  tip2: "We’ll keep retrying in the background",
  tip3: "Changes you make offline sync when you’re back",
};

export interface OfflineProps {
  /** Check the connection again. Resolve when it's back; reject (or fail) while still offline. */
  onRetry: Action;
  /** Tips that rotate under the button. Defaults to the three tip messages. */
  tips?: string[];
  className?: string;
}

function OfflineScreen({ onRetry, tips, className }: OfflineProps) {
  const t = useMessages("offline", OFFLINE_MESSAGES);
  const list = tips ?? [t.tip1, t.tip2, t.tip3];
  const [tipIndex, setTipIndex] = useState(0);
  const retry = useAction(onRetry);

  useEffect(() => {
    if (list.length < 2) return;
    const id = window.setInterval(() => setTipIndex((i) => (i + 1) % list.length), 4000);
    return () => window.clearInterval(id);
  }, [list.length]);

  return (
    <div className={cn("relative min-h-svh overflow-x-clip bg-background", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 size-[min(60vmin,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full motion-safe:animate-ping"
          style={{ background: "radial-gradient(closest-side, color-mix(in srgb, var(--destructive) 8%, transparent), transparent 70%)", animationDuration: "3.6s" }}
        />
      </div>
      <div className="relative mx-auto flex min-h-svh max-w-md flex-col items-center justify-center-safe px-6 py-10 text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-xs/5">
          <WifiOffIcon aria-hidden className="size-7" />
          <span aria-hidden className="absolute end-2 -bottom-1 size-3 rounded-full border-2 border-background bg-destructive" />
        </div>
        <div className="mt-8 font-mono text-[10px] text-destructive-foreground uppercase tracking-[0.4em]">{t.status}</div>
        <h1 className="mt-3 font-heading text-2xl leading-tight">{t.title}</h1>
        <p className="mt-2 text-balance text-muted-foreground text-sm">{t.description}</p>
        <Button aria-busy={retry.isPending()} className="mt-8 w-full max-w-xs" disabled={retry.isPending()} onClick={() => void retry.run()}>
          {retry.isPending() ? <Spinner data-icon="inline-start" /> : <RotateCwIcon />}
          {t.retry}
        </Button>
        <div aria-live="polite" className="mt-6 min-h-8">
          {retry.error ? (
            <p className="text-destructive-foreground text-xs">{t.stillOffline}</p>
          ) : list.length ? (
            <p className="font-mono text-[11px] text-muted-foreground" key={tipIndex}>
              {list[tipIndex % list.length]}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Offline(props: OfflineProps) {
  return (
    <ScreenBoundary name="Offline">
      <OfflineScreen {...props} />
    </ScreenBoundary>
  );
}
