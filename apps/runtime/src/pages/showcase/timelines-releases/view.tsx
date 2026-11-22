// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, RocketIcon, TimerIcon } from "lucide-react";
import type { Release } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("releasePromotion.<key>"). */
export const RELEASE_PROMOTION_MESSAGES = {
  eyebrow: "Release · {version}",
  title: "Promotion timeline",
  summary: "Triggered by {by} · started {when}.",
  rolling: "rolling",
  rollout: "{name} rollout",
  done: "Done",
  active: "In progress",
  queued: "Queued",
  minutes: "{m}m {s}s",
  elapsed: "{time} in",
  noDuration: "—",
  pause: "Pause",
  rollBack: "Roll back",
  errorTitle: "Couldn’t load the release",
  retry: "Try again",
};

export interface ReleasePromotionProps {
  /** The release and its steps. Leave it out while it loads. */
  release?: Release;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Hold the rollout. Hidden without it. */
  onPause?: Action;
  /** Roll the release back. Hidden without it. */
  onRollBack?: Action;
  className?: string;
}

function ReleasePromotionScreen({
  release,
  status = "ready",
  error,
  onRetry,
  onPause,
  onRollBack,
  className,
}: ReleasePromotionProps) {
  const t = useMessages("releasePromotion", RELEASE_PROMOTION_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const pause = useAction(onPause ?? (async () => {}));
  const rollBack = useAction(onRollBack ?? (async () => {}));
  const duration = (ms: number) => {
    const total = Math.round(ms / 1000);
    return interpolate(t.minutes, {
      m: Math.floor(total / 60),
      s: String(total % 60).padStart(2, "0"),
    });
  };
  const busy = pause.isPending() || rollBack.isPending();

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-3xl">
        {status === "error" ? (
          <div className="rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? (
              <p className="mt-1 text-muted-foreground text-sm">{error}</p>
            ) : null}
            {onRetry ? (
              <Button
                className="mt-4"
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !release || status === "loading" ? (
          <div aria-busy="true" className="flex flex-col gap-4">
            <Skeleton className="h-8 w-56 motion-reduce:animate-none" />
            <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
          </div>
        ) : (
          <>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {interpolate(t.eyebrow, { version: release.version })}
            </div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {interpolate(t.summary, {
                by: release.triggeredBy,
                when: fmt.relative(release.startedAt),
              })}
            </p>

            <div className="mt-6 rounded-xl border border-border/60 bg-background/40 px-4 py-5 sm:px-6">
              <ol className="relative">
                <span
                  aria-hidden
                  className="absolute inset-s-3.75 top-2 bottom-2 w-px bg-border/50"
                />
                {release.steps.map((s) => {
                  const elapsed =
                    s.state === "active" && s.startedAt
                      ? now().getTime() - new Date(s.startedAt).getTime()
                      : undefined;
                  return (
                    <li
                      aria-current={s.state === "active" ? "step" : undefined}
                      className="relative grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 py-3"
                      key={s.id}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "z-10 grid size-8 place-items-center rounded-full ring-4 ring-background transition-all",
                          s.state === "done"
                            ? "bg-category-2 text-white"
                            : s.state === "active"
                              ? "bg-foreground text-background"
                              : "border border-border/70 bg-background text-muted-foreground"
                        )}
                      >
                        {s.state === "done" ? (
                          <CheckIcon className="size-4" />
                        ) : s.state === "active" ? (
                          <span className="relative grid size-3 place-items-center">
                            <span className="absolute inset-0 rounded-full bg-background/40 motion-safe:animate-ping" />
                            <span className="size-1.5 rounded-full bg-background" />
                          </span>
                        ) : (
                          <span className="size-2 rounded-full bg-muted-foreground/40" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-sm">{s.name}</span>
                          <span className="sr-only">{t[s.state]}</span>
                          {s.region ? (
                            <span className="rounded bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
                              {s.region}
                            </span>
                          ) : null}
                          {s.state === "active" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/6 px-1.5 py-0.5 font-mono text-[10px] text-foreground/80">
                              <TimerIcon aria-hidden className="size-2.5" />
                              {t.rolling}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs leading-relaxed">
                          {s.detail}
                        </div>
                        {s.state === "active" && s.progress !== undefined ? (
                          <div
                            aria-label={interpolate(t.rollout, {
                              name: s.name,
                            })}
                            aria-valuemax={100}
                            aria-valuemin={0}
                            aria-valuenow={Math.round(s.progress * 100)}
                            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted"
                            role="progressbar"
                          >
                            <div
                              className="h-full bg-foreground"
                              style={{ width: `${s.progress * 100}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                      <span className="self-center font-mono text-[10px] text-muted-foreground">
                        {s.durationMs !== undefined
                          ? duration(s.durationMs)
                          : elapsed !== undefined
                            ? interpolate(t.elapsed, {
                                time: duration(elapsed),
                              })
                            : t.noDuration}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Commit ref and actions stack on phones; actions split the width there. */}
              <div className="mt-5 flex flex-col gap-3 border-border/60 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2 text-xs">
                  <RocketIcon
                    aria-hidden
                    className="size-3.5 shrink-0 opacity-60"
                  />
                  <span className="min-w-0 truncate font-mono text-muted-foreground">
                    {release.commit.sha} · {release.commit.message}
                  </span>
                </div>
                {onPause || onRollBack ? (
                  <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                    {onPause ? (
                      <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-border/60 px-3 py-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void pause.run()}
                        type="button"
                      >
                        {pause.isPending() ? (
                          <Spinner className="size-3" />
                        ) : null}
                        {t.pause}
                      </button>
                    ) : null}
                    {onRollBack ? (
                      <button
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-category-4/15 px-3 py-1.5 font-mono text-[10px] text-category-4-foreground uppercase tracking-[0.25em] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                        disabled={busy}
                        onClick={() => void rollBack.run()}
                        type="button"
                      >
                        {rollBack.isPending() ? (
                          <Spinner className="size-3" />
                        ) : null}
                        {t.rollBack}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {pause.error || rollBack.error ? (
                <p
                  className="mt-3 text-destructive-foreground text-sm"
                  role="alert"
                >
                  {pause.error ?? rollBack.error}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ReleasePromotion(props: ReleasePromotionProps) {
  return (
    <ScreenBoundary name="ReleasePromotion">
      <ReleasePromotionScreen {...props} />
    </ScreenBoundary>
  );
}
