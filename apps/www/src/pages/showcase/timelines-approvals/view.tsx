// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { useId } from "react";
import { CheckCircle2Icon, CircleIcon, GitBranchIcon, GitCommitIcon, GitMergeIcon, GitPullRequestIcon, MessageSquareIcon, XCircleIcon } from "lucide-react";
import type { PrEvent, PullRequest, Reviewer } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("mergeReadiness.<key>"). */
export const MERGE_READINESS_MESSAGES = {
  eyebrow: "{repo} · Pull request #{number}",
  open: "Open",
  merged: "Merged",
  closed: "Closed",
  branches: "{head} → {base}",
  counts: "· {commits} commits · {files} files",
  activity: "Activity",
  reviewers: "Reviewers · {approved} / {total} approved",
  approvedAt: "approved · {when}",
  changesAt: "changes requested · {when}",
  pending: "pending",
  checks: "Checks · {passed} / {total} passed",
  passed: "passed",
  failing: "failing",
  minutes: "{m}m {s}s",
  merge: "Squash and merge",
  ready: "Ready to merge",
  blockedChecks: "Blocked by {count} failing check(s)",
  blockedChanges: "Blocked: changes requested",
  waitingChecks: "Waiting for {count} check(s)",
  errorTitle: "Couldn’t load the pull request",
  retry: "Try again",
};

export interface MergeReadinessProps {
  /** The pull request. Leave it out while it loads. */
  pr?: PullRequest;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Merge it. Shown while open; enabled only when nothing blocks it. */
  onMerge?: Action;
  className?: string;
}

const TONE = { ok: "bg-category-2/15 text-category-2-foreground", bad: "bg-category-4/15 text-category-4-foreground", neutral: "bg-foreground/[0.06] text-foreground" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function EventGlyph({ e }: { e: PrEvent }) {
  const tone = e.state === "approved" || e.state === "passed" ? TONE.ok : e.state === "changes" || e.state === "failing" ? TONE.bad : TONE.neutral;
  const icon =
    e.type === "review" ? (
      e.state === "changes" ? (
        <XCircleIcon className="size-4" />
      ) : (
        <CheckCircle2Icon className="size-4" />
      )
    ) : e.type === "ci" ? (
      e.state === "passed" ? (
        <CheckCircle2Icon className="size-4" />
      ) : (
        <XCircleIcon className="size-4" />
      )
    ) : e.type === "comment" ? (
      <MessageSquareIcon className="size-4" />
    ) : e.type === "opened" ? (
      <GitPullRequestIcon className="size-4" />
    ) : (
      <GitCommitIcon className="size-4" />
    );
  return (
    <span aria-hidden className={cn("z-10 grid size-[32px] place-items-center rounded-full ring-4 ring-background", tone)}>
      {icon}
    </span>
  );
}

function ReviewerGlyph({ state }: { state: Reviewer["state"] }) {
  if (state === "approved") return <CheckCircle2Icon aria-hidden className="size-4 text-category-2-foreground" />;
  if (state === "changes") return <XCircleIcon aria-hidden className="size-4 text-category-4-foreground" />;
  return <CircleIcon aria-hidden className="size-4 opacity-30" />;
}

function MergeReadinessScreen({ pr, status = "ready", error, onRetry, onMerge, className }: MergeReadinessProps) {
  const t = useMessages("mergeReadiness", MERGE_READINESS_MESSAGES);
  const fmt = useFormat();
  const merge = useAction(onMerge ?? (async () => {}));
  const uid = useId();
  const duration = (ms: number) => {
    const total = Math.round(ms / 1000);
    return interpolate(t.minutes, { m: Math.floor(total / 60), s: String(total % 60).padStart(2, "0") });
  };

  if (status === "error" || !pr || status === "loading") {
    return (
      <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
        <div className="mx-auto max-w-4xl">
          {status === "error" ? (
            <div className="rounded-xl border border-border/60 py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : (
            <div aria-busy="true" className="flex flex-col gap-4">
              <Skeleton className="h-8 w-80 motion-reduce:animate-none" />
              <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const approved = pr.reviewers.filter((r) => r.state === "approved").length;
  const changes = pr.reviewers.some((r) => r.state === "changes");
  const passed = pr.checks.filter((c) => c.status === "passed").length;
  const failing = pr.checks.filter((c) => c.status === "failing").length;
  const pendingChecks = pr.checks.filter((c) => c.status === "pending").length;
  const blocker = failing ? interpolate(t.blockedChecks, { count: failing }) : changes ? t.blockedChanges : pendingChecks ? interpolate(t.waitingChecks, { count: pendingChecks }) : undefined;

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { repo: pr.repo, number: pr.number })}</div>
        <h1 className="mt-1 font-heading text-2xl">{pr.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-muted-foreground text-xs">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5", pr.state === "closed" ? TONE.bad : TONE.ok)}>
            <span aria-hidden className={cn("size-1.5 rounded-full", pr.state === "closed" ? "bg-category-4" : "bg-category-2")} /> {t[pr.state]}
          </span>
          <span className="inline-flex min-w-0 items-center gap-1 break-all">
            <GitBranchIcon aria-hidden className="size-3 shrink-0" /> {interpolate(t.branches, { head: pr.head, base: pr.base })}
          </span>
          <span>{interpolate(t.counts, { commits: fmt.number(pr.commits), files: fmt.number(pr.files) })}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section aria-labelledby={`${uid}-activity`} className="min-w-0 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-5">
            <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`${uid}-activity`}>
              {t.activity}
            </h2>
            <ol className="relative mt-4">
              <span aria-hidden className="absolute start-[15px] top-1 bottom-1 w-px bg-border/50" />
              {pr.events.map((e) => (
                <li className="relative grid grid-cols-[32px_minmax(0,1fr)_auto] items-start gap-3 py-2.5" key={e.id}>
                  <EventGlyph e={e} />
                  <div className="min-w-0">
                    <div className="flex items-start gap-2 text-sm">
                      {e.actor ? (
                        <Avatar aria-hidden className="size-5 shrink-0">
                          <AvatarFallback className="text-[10px]">{initials(e.actor)}</AvatarFallback>
                        </Avatar>
                      ) : null}
                      <span className="min-w-0 break-words">{e.summary}</span>
                    </div>
                    {e.detail ? <div className="mt-1 break-words text-muted-foreground text-xs">{e.detail}</div> : null}
                  </div>
                  <time className="whitespace-nowrap pt-0.5 font-mono text-[10px] text-muted-foreground" dateTime={e.at}>
                    {fmt.relative(e.at)}
                  </time>
                </li>
              ))}
            </ol>
          </section>

          {/* Below lg the merge status (reviewers + checks) comes first — it's the
              answer to "can I merge?" — and sits side by side from sm. */}
          <div className="order-first grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:order-none lg:grid-cols-1">
            <section aria-labelledby={`${uid}-reviewers`} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`${uid}-reviewers`}>
                {interpolate(t.reviewers, { approved, total: pr.reviewers.length })}
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {pr.reviewers.map((r) => (
                  <li className="flex items-center gap-2.5" key={r.id}>
                    <Avatar aria-hidden className="size-7">
                      <AvatarFallback className="text-[10px]">{initials(r.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{r.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {r.state === "pending" ? t.pending : interpolate(r.state === "approved" ? t.approvedAt : t.changesAt, { when: r.at ? fmt.relative(r.at) : "" })}
                      </div>
                    </div>
                    <ReviewerGlyph state={r.state} />
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby={`${uid}-checks`} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`${uid}-checks`}>
                {interpolate(t.checks, { passed, total: pr.checks.length })}
              </h2>
              <ul className="mt-3 flex flex-col gap-1.5">
                {pr.checks.map((c) => (
                  <li className="flex items-center gap-2 text-xs" key={c.id}>
                    <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", c.status === "passed" ? "bg-category-2" : c.status === "failing" ? "bg-category-4" : "bg-muted-foreground/50")} />
                    <span className="min-w-0 flex-1 truncate font-mono">
                      <span className="sr-only">{c.status === "pending" ? t.pending : t[c.status]}: </span>
                      {c.name}
                    </span>
                    {c.durationMs !== undefined ? <span className="font-mono text-[10px] text-muted-foreground">{duration(c.durationMs)}</span> : null}
                  </li>
                ))}
              </ul>
              {onMerge && pr.state === "open" ? (
                <>
                  <Button className="mt-4 w-full" disabled={Boolean(blocker) || merge.isPending()} onClick={() => void merge.run()} size="sm" type="button">
                    {merge.isPending() ? <Spinner /> : <GitMergeIcon aria-hidden />}
                    {t.merge}
                  </Button>
                  <p className="mt-1.5 text-center text-muted-foreground text-xs">{blocker ?? t.ready}</p>
                  {merge.error ? (
                    <p className="mt-1.5 text-center text-destructive-foreground text-xs" role="alert">
                      {merge.error}
                    </p>
                  ) : null}
                </>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MergeReadiness(props: MergeReadinessProps) {
  return (
    <ScreenBoundary name="MergeReadiness">
      <MergeReadinessScreen {...props} />
    </ScreenBoundary>
  );
}
