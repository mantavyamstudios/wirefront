// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Badge } from "@wirefront/ui/badge";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Progress } from "@wirefront/ui/progress";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { WrenchIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("maintenance.<key>"). */
export const MAINTENANCE_MESSAGES = {
  badge: "Scheduled maintenance",
  title: "We’ll be back shortly.",
  description: "We’re rolling out a database migration. Reads and writes are paused for the duration. No data will be lost.",
  eta: "ETA",
  progress: "Maintenance progress",
  overdue: "Any moment now",
  subscribe: "Subscribe to updates",
  subscribed: "We’ll email you when we’re back.",
  status: "View status page",
};

export interface MaintenanceProps {
  /** When maintenance started (ISO 8601). */
  startedAt: string;
  /** When it is expected to end (ISO 8601); the countdown and progress use the provider's clock. */
  endsAt: string;
  /** Email the user when it ends. The button only shows when this is given. */
  onSubscribe?: Action;
  /** Your status page. The link only shows when this is given. */
  statusHref?: string;
  className?: string;
}

function MaintenanceScreen({ startedAt, endsAt, onSubscribe, statusHref, className }: MaintenanceProps) {
  const t = useMessages("maintenance", MAINTENANCE_MESSAGES);
  const { now } = useWirefront();
  const [current, setCurrent] = useState(() => now().getTime());
  const [subscribed, setSubscribed] = useState(false);
  const subscribe = useAction(onSubscribe ?? (async () => {}), { onSuccess: () => setSubscribed(true) });

  useEffect(() => {
    const id = window.setInterval(() => setCurrent(now().getTime()), 1000);
    return () => window.clearInterval(id);
  }, [now]);

  const start = Date.parse(startedAt);
  const end = Date.parse(endsAt);
  const remaining = Math.max(0, Math.round((end - current) / 1000));
  const progress = end > start ? Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100)) : 100;
  const clock = `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-10 sm:px-6 sm:py-16", className)}>
      <div className="mx-auto flex max-w-xl flex-col items-center text-center">
        <Badge className="gap-2 font-mono text-[10px] uppercase tracking-[0.25em]" variant="outline">
          <span aria-hidden className="relative inline-flex">
            <span className="size-2 rounded-full bg-warning" />
            <span className="absolute inset-0 size-2 rounded-full bg-warning/60 motion-safe:animate-ping" />
          </span>
          {t.badge}
        </Badge>
        <div className="mt-8 flex size-14 items-center justify-center rounded-2xl border border-border bg-card text-foreground shadow-xs/5">
          <WrenchIcon aria-hidden className="size-6" />
        </div>
        <h1 className="mt-6 font-heading text-2xl leading-tight md:text-3xl">{t.title}</h1>
        <p className="mt-2 max-w-md text-balance text-muted-foreground text-sm">{t.description}</p>
        <div className="mt-10 w-full max-w-sm">
          <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            <span>{t.eta}</span>
            <span className="text-foreground tabular-nums">{remaining > 0 ? clock : t.overdue}</span>
          </div>
          <Progress aria-label={t.progress} className="mt-2" value={progress} />
        </div>
        {onSubscribe || statusHref ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {onSubscribe && !subscribed ? (
              <Button disabled={subscribe.isPending()} onClick={() => void subscribe.run()} size="sm" variant="outline">
                {subscribe.isPending() ? <Spinner /> : null}
                {t.subscribe}
              </Button>
            ) : null}
            {statusHref ? (
              <WirefrontLink className={buttonVariants({ size: "sm", variant: "ghost" })} href={statusHref} rel="noreferrer" target="_blank">
                {t.status}
              </WirefrontLink>
            ) : null}
          </div>
        ) : null}
        <div aria-live="polite" className="mt-3 min-h-4 text-xs">
          {subscribe.error ? (
            <p className="text-destructive-foreground" role="alert">
              {subscribe.error}
            </p>
          ) : subscribed ? (
            <p className="text-muted-foreground">{t.subscribed}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Maintenance(props: MaintenanceProps) {
  return (
    <ScreenBoundary name="Maintenance">
      <MaintenanceScreen {...props} />
    </ScreenBoundary>
  );
}
