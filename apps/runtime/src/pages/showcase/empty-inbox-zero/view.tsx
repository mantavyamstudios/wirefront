// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button, buttonVariants } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ParticleField } from "@wirefront/ui/particle-field";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckCheckIcon } from "lucide-react";
import { useRef, useState } from "react";

import type { SnoozeInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("inboxZero.<key>"). */
export const INBOX_ZERO_MESSAGES = {
  status: "Inbox · 0 unread",
  thisWeek: "This week",
  cleared: "{count} cleared",
  eyebrow: "A quiet horizon",
  title: "You’re all caught up.",
  sinceLast:
    "Nothing new since {time}. Take a break — we’ll let you know when something arrives.",
  nothingNew:
    "Nothing new. Take a break — we’ll let you know when something arrives.",
  archive: "View archive",
  snooze: "Snooze new mail",
  snoozed: "New-mail notifications paused for {hours} hours.",
};

export interface InboxZeroProps {
  /** An image the particle field draws (any URL your bundler gives you). */
  illustration: string;
  /** When the last message arrived (ISO 8601), shown in the user's time zone. */
  lastMessageAt?: string;
  /** Messages cleared this week. The counter shows when given. */
  clearedThisWeek?: number;
  /** Where "View archive" goes. Hidden when not given. */
  archiveHref?: string;
  /** Pause new-mail notifications. The button only shows when this is given. */
  onSnooze?: Action<SnoozeInput>;
  /** How long "Snooze new mail" pauses for. */
  snoozeHours?: number;
  className?: string;
}

function InboxZeroScreen({
  illustration,
  lastMessageAt,
  clearedThisWeek,
  archiveHref,
  onSnooze,
  snoozeHours = 4,
  className,
}: InboxZeroProps) {
  const t = useMessages("inboxZero", INBOX_ZERO_MESSAGES);
  const format = useFormat();
  const typingImpulse = useRef(0);
  const [snoozed, setSnoozed] = useState(false);
  const snooze = useAction(onSnooze ?? (async () => {}), {
    onSuccess: () => setSnoozed(true),
  });

  return (
    <div
      className={cn(
        "relative flex min-h-dvh w-full flex-col overflow-hidden bg-background",
        className
      )}
    >
      <div className="absolute inset-0">
        <ParticleField
          align="center"
          dotSize={0.9}
          renderScale={1}
          sampleStep={2}
          src={illustration}
          threshold={48}
          typingImpulseRef={typingImpulse}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 50% 45%, transparent 35%, color-mix(in srgb, var(--background) 80%, transparent) 95%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[60%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--background) 50%, transparent) 35%, color-mix(in srgb, var(--background) 90%, transparent) 70%, var(--background) 100%)",
        }}
      />
      <div className="relative z-10 flex items-start justify-between gap-3 p-4 sm:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] backdrop-blur sm:tracking-[0.3em]">
          <CheckCheckIcon aria-hidden className="size-3 text-foreground" />
          {t.status}
        </div>
        {clearedThisWeek !== undefined ? (
          <div className="text-end font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.3em]">
            <div>{t.thisWeek}</div>
            <div className="mt-0.5 font-heading text-foreground/85 text-xs normal-case tracking-normal">
              {interpolate(t.cleared, {
                count: format.number(clearedThisWeek),
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div className="relative z-10 mt-auto flex flex-col items-center gap-4 px-6 pt-[30svh] pb-[max(3rem,env(safe-area-inset-bottom))] text-center sm:pb-20">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          {t.eyebrow}
        </div>
        <h1 className="max-w-xl font-heading text-3xl leading-tight sm:text-4xl md:text-5xl">
          {t.title}
        </h1>
        <p className="max-w-md text-balance text-muted-foreground text-sm leading-relaxed">
          {lastMessageAt
            ? interpolate(t.sinceLast, { time: format.time(lastMessageAt) })
            : t.nothingNew}
        </p>
        {archiveHref || onSnooze ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {archiveHref ? (
              <WirefrontLink
                className={buttonVariants({ size: "sm", variant: "outline" })}
                href={archiveHref}
              >
                {t.archive}
              </WirefrontLink>
            ) : null}
            {onSnooze ? (
              <Button
                disabled={snooze.isPending()}
                onClick={() => void snooze.run({ hours: snoozeHours })}
                size="sm"
                variant="ghost"
              >
                {snooze.isPending() ? <Spinner /> : null}
                {t.snooze}
              </Button>
            ) : null}
          </div>
        ) : null}
        <div aria-live="polite" className="min-h-4 text-xs">
          {snooze.error ? (
            <p className="text-destructive-foreground" role="alert">
              {snooze.error}
            </p>
          ) : snoozed ? (
            <p className="text-muted-foreground">
              {interpolate(t.snoozed, { hours: snoozeHours })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function InboxZero(props: InboxZeroProps) {
  return (
    <ScreenBoundary name="InboxZero">
      <InboxZeroScreen {...props} />
    </ScreenBoundary>
  );
}
