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
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  FileDiffIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  MessageSquareIcon,
  PlayIcon,
  PlusIcon,
  RocketIcon,
  ShieldCheckIcon,
  TagIcon,
  UserPlusIcon,
  XIcon,
} from "lucide-react";
import { type ReactNode, useId } from "react";
import type { PrTimelineItem, PullRequestDetail } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("pullRequestPage.<key>"). */
export const PULL_REQUEST_PAGE_MESSAGES = {
  breadcrumb: "Breadcrumb",
  pulls: "pulls",
  open: "Open",
  draft: "Draft",
  merged: "Merged",
  closed: "Closed",
  wantsToMerge: "wants to merge {count} commits into",
  from: "from",
  ready: "Ready to merge",
  readyHint: "All approvals in, all checks green, branch up to date with {base}.",
  running: "Running {count} check(s)",
  failing: "{count} check(s) failing",
  waitingReviews: "Waiting on reviews",
  conflictsTitle: "Resolve conflicts first",
  almost: "Almost there — see what’s left below.",
  approvals: "{approved}/{required} approvals",
  checksCount: "{passed}/{total} checks",
  noConflicts: "No conflicts",
  conflicts: "Has conflicts",
  upToDate: "Branch up to date",
  behind: "Branch behind {base}",
  merge: "Squash & merge",
  files: "{count} files",
  checksPassed: "{passed} of {total} checks passed",
  checksRunning: "{count} running · {time} elapsed",
  runningLabel: "running",
  skipped: "skipped",
  activity: "Activity",
  pushed: "pushed {count} commits",
  approvedThis: "approved this",
  requestedChanges: "requested changes",
  reviewed: "left a review",
  ci: "CI",
  ciSummary: "{passed}/{total} checks passed in {time}",
  deployReady: "{env} deploy ready",
  deployIn: "in {time}",
  lineN: "line {n}",
  added: "Added",
  removed: "Removed",
  reviewers: "Reviewers",
  addReviewer: "Add reviewer",
  labels: "Labels",
  addLabel: "Add label",
  linkedIssues: "Linked issues",
  milestone: "Milestone",
  ships: "ships {when}",
  minutes: "{m}m {s}s",
  seconds: "{s}s",
  approvedState: "approved",
  changesState: "changes requested",
  pendingState: "pending",
  errorTitle: "Couldn’t load the pull request",
  retry: "Try again",
};

export interface PullRequestPageProps {
  /** The pull request. Leave it out while it loads. */
  pr?: PullRequestDetail;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Squash and merge. Shown while open; enabled once ready. */
  onMerge?: Action;
  /** Open your reviewer picker. The + is hidden without it. */
  onAddReviewer?: () => void;
  /** Open your label picker. The + is hidden without it. */
  onAddLabel?: () => void;
  className?: string;
}

type Messages = typeof PULL_REQUEST_PAGE_MESSAGES;
const LABEL_TONE: Record<PullRequestDetail["labels"][number]["tone"], string> = {
  violet: "bg-category-5/15 text-category-5-foreground",
  amber: "bg-category-3/15 text-category-3-foreground",
  sky: "bg-category-1/15 text-category-1-foreground",
  rose: "bg-category-4/15 text-category-4-foreground",
  emerald: "bg-category-2/15 text-category-2-foreground",
};
const PILL_TONE = { ok: "bg-category-2/10 text-category-2-foreground", wait: "bg-category-3/10 text-category-3-foreground", fail: "bg-category-4/10 text-category-4-foreground" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Pill({ children, tone, icon }: { children: ReactNode; tone: keyof typeof PILL_TONE; icon: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.15em]", PILL_TONE[tone])}>
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  );
}

function SidebarSection({ title, action, children }: { title: string; action?: { label: string; icon: ReactNode; onClick: () => void }; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{title}</h2>
        {action ? (
          <button aria-label={action.label} className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={action.onClick} type="button">
            {action.icon}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function TimelineIcon({ item }: { item: PrTimelineItem }) {
  switch (item.kind) {
    case "commit":
      return <GitCommitIcon className="size-3 text-foreground/70" />;
    case "comment":
      return <MessageSquareIcon className="size-3 text-foreground/70" />;
    case "review":
      return item.state === "approved" ? <CheckIcon className="size-3 text-category-2-foreground" /> : item.state === "changes" ? <XIcon className="size-3 text-category-4-foreground" /> : <CircleIcon className="size-3 text-category-3-foreground" />;
    case "ci":
      return <PlayIcon className="size-3 text-foreground/70" />;
    case "deploy":
      return <RocketIcon className="size-3 text-category-1-foreground" />;
    case "status":
      return <TagIcon className="size-3 text-foreground/70" />;
  }
}

function TimelineBody({ item, t, when, duration }: { item: PrTimelineItem; t: Messages; when: ReactNode; duration: (ms: number) => string }) {
  switch (item.kind) {
    case "commit":
      return (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <span className="text-foreground">{item.actor}</span>
            <span className="text-muted-foreground">{interpolate(t.pushed, { count: item.commits.length })} ·</span>
            {when}
          </div>
          <ul className="mt-1 space-y-0.5">
            {item.commits.map((c) => (
              <li className="flex items-center gap-2 font-mono text-[11px]" key={c.sha}>
                <span className="text-muted-foreground">{c.sha}</span>
                <span className="truncate">{c.message}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case "comment":
      return (
        <div className="rounded-xl border border-border/60 bg-background/40 p-3">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            <Avatar aria-hidden className="size-5">
              <AvatarFallback className="text-[10px]">{initials(item.actor)}</AvatarFallback>
            </Avatar>
            <span>{item.actor}</span>
            {when}
          </div>
          {item.diff ? (
            <div className="mt-2 overflow-hidden rounded-md border border-border/60 bg-foreground/[0.02]">
              <div className="flex items-center justify-between gap-3 border-border/40 border-b px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="min-w-0 truncate">{item.diff.file}</span>
                <span className="shrink-0">{interpolate(t.lineN, { n: item.diff.line })}</span>
              </div>
              <ScrollRegion aria-label={item.diff.file} orientation="horizontal">
                <pre className="px-3 py-2 font-mono text-[11px]">
                  {item.diff.lines.map((l) => (
                    <div className={l.kind === "add" ? "bg-category-2/10 text-category-2-foreground" : l.kind === "del" ? "bg-category-4/10 text-category-4-foreground" : "text-muted-foreground"} key={`${l.kind}-${l.n}`}>
                      <span aria-hidden className="me-3 inline-block w-4 select-none text-muted-foreground">
                        {l.kind === "add" ? "+" : l.kind === "del" ? "−" : " "}
                      </span>
                      {l.kind !== "context" ? <span className="sr-only">{l.kind === "add" ? t.added : t.removed}: </span> : null}
                      {l.text}
                    </div>
                  ))}
                </pre>
              </ScrollRegion>
            </div>
          ) : null}
          <p className="mt-2 text-foreground/85 text-sm">{item.body}</p>
        </div>
      );
    case "review":
      return (
        <div className="text-sm">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span>{item.actor}</span>
            <span className="text-muted-foreground">{item.state === "approved" ? t.approvedThis : item.state === "changes" ? t.requestedChanges : t.reviewed}</span>
            {when}
          </div>
          {item.summary ? <p className="mt-1 text-muted-foreground text-sm">{item.summary}</p> : null}
        </div>
      );
    case "ci":
      return (
        <div className="text-sm">
          <span className="text-foreground">{t.ci}</span> <span className="text-muted-foreground">{interpolate(t.ciSummary, { passed: item.passed, total: item.total, time: duration(item.durationMs) })} ·</span> {when}
        </div>
      );
    case "deploy":
      return (
        <div className="text-sm">
          <span className="text-foreground">{interpolate(t.deployReady, { env: item.env })}</span> <span className="text-muted-foreground">{interpolate(t.deployIn, { time: duration(item.durationMs) })} ·</span>{" "}
          <WirefrontLink className="font-mono text-[11px] text-category-1-foreground hover:underline" href={`https://${item.url}`}>
            {item.url}
          </WirefrontLink>
          <span className="ms-2">{when}</span>
        </div>
      );
    case "status":
      return (
        <div className="text-sm">
          <span>{item.actor}</span> <span className="text-muted-foreground">{item.label} ·</span> {when}
        </div>
      );
  }
}

function PullRequestPageScreen({ pr, status = "ready", error, onRetry, onMerge, onAddReviewer, onAddLabel, className }: PullRequestPageProps) {
  const t = useMessages("pullRequestPage", PULL_REQUEST_PAGE_MESSAGES);
  const fmt = useFormat();
  const merge = useAction(onMerge ?? (async () => {}));
  const uid = useId();
  const duration = (ms: number) => {
    const total = Math.round(ms / 1000);
    return total < 60 ? interpolate(t.seconds, { s: total }) : interpolate(t.minutes, { m: Math.floor(total / 60), s: String(total % 60).padStart(2, "0") });
  };

  if (status === "error" || !pr || status === "loading") {
    return (
      <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
        <div className="mx-auto max-w-6xl">
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
              <Skeleton className="h-9 w-2/3 motion-reduce:animate-none" />
              <Skeleton className="h-32 w-full rounded-2xl motion-reduce:animate-none" />
              <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const approvals = pr.reviewers.filter((r) => r.state === "approved").length;
  const changes = pr.reviewers.some((r) => r.state === "changes");
  const passed = pr.checks.filter((c) => c.status === "passed").length;
  const running = pr.checks.filter((c) => c.status === "running").length;
  const failing = pr.checks.filter((c) => c.status === "failed").length;
  const elapsed = Math.max(0, ...pr.checks.map((c) => c.durationMs ?? 0));
  const ready = approvals >= pr.requiredApprovals && !changes && !failing && !running && !pr.conflicts && pr.upToDate;
  const headline = ready ? t.ready : pr.conflicts ? t.conflictsTitle : failing ? interpolate(t.failing, { count: failing }) : running ? interpolate(t.running, { count: running }) : t.waitingReviews;
  const milestonePct = pr.milestone?.total ? (pr.milestone.done / pr.milestone.total) * 100 : 0;
  const stateTone = pr.state === "closed" ? "bg-category-4/15 text-category-4-foreground" : pr.state === "merged" ? "bg-category-5/15 text-category-5-foreground" : pr.state === "draft" ? "bg-foreground/[0.06] text-muted-foreground" : "bg-category-2/15 text-category-2-foreground";

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-6xl">
        <nav aria-label={t.breadcrumb} className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          <span>{pr.repo}</span>
          <span aria-hidden>›</span>
          <span>{t.pulls}</span>
          <span aria-hidden>›</span>
          <span aria-current="page" className="text-foreground">
            #{pr.number}
          </span>
        </nav>

        <div className="mt-3 min-w-0">
          <h1 className="text-balance font-heading text-2xl sm:text-3xl">{pr.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs", stateTone)}>
              <GitPullRequestIcon aria-hidden className="size-3" />
              {t[pr.state]}
            </span>
            <Avatar aria-hidden className="size-5">
              <AvatarFallback className="text-[10px]">{initials(pr.author)}</AvatarFallback>
            </Avatar>
            <span className="text-foreground">{pr.author}</span>
            <span>{interpolate(t.wantsToMerge, { count: pr.commits })}</span>
            <span className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-foreground">{pr.base}</span>
            <span>{t.from}</span>
            <span className="break-all rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-foreground">{pr.head}</span>
          </div>
        </div>

        <section aria-label={headline} className="mt-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background/40 to-background/20">
          <div className="grid grid-cols-1 items-center gap-6 p-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div aria-hidden className={cn("flex size-9 items-center justify-center rounded-full", ready ? "bg-category-2/15 text-category-2-foreground" : "bg-category-3/15 text-category-3-foreground")}>
                  {ready ? <CheckIcon className="size-5" /> : <ClockIcon className="size-5" />}
                </div>
                <div>
                  <h2 className="font-heading text-xl">{headline}</h2>
                  <p className="text-muted-foreground text-sm">{ready ? interpolate(t.readyHint, { base: pr.base }) : t.almost}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill icon={<CheckIcon className="size-3" />} tone={approvals >= pr.requiredApprovals && !changes ? "ok" : changes ? "fail" : "wait"}>
                  {interpolate(t.approvals, { approved: approvals, required: pr.requiredApprovals })}
                </Pill>
                <Pill icon={running ? <PlayIcon className="size-3" /> : <CheckIcon className="size-3" />} tone={failing ? "fail" : running ? "wait" : "ok"}>
                  {interpolate(t.checksCount, { passed, total: pr.checks.length })}
                </Pill>
                <Pill icon={<GitMergeIcon className="size-3" />} tone={pr.conflicts ? "fail" : "ok"}>
                  {pr.conflicts ? t.conflicts : t.noConflicts}
                </Pill>
                <Pill icon={<ShieldCheckIcon className="size-3" />} tone={pr.upToDate ? "ok" : "wait"}>
                  {pr.upToDate ? t.upToDate : interpolate(t.behind, { base: pr.base })}
                </Pill>
              </div>
            </div>
            {onMerge && pr.state === "open" ? (
              <div className="flex flex-col items-start gap-1.5 lg:items-end">
                <Button className="gap-2 bg-category-2-strong text-white hover:bg-category-2 disabled:bg-foreground/10 disabled:text-muted-foreground" disabled={!ready || merge.isPending()} onClick={() => void merge.run()}>
                  {merge.isPending() ? <Spinner /> : <GitMergeIcon aria-hidden className="size-4" />}
                  {t.merge}
                </Button>
                {merge.error ? (
                  <p className="text-destructive-foreground text-xs" role="alert">
                    {merge.error}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-4">
            <div className="rounded-xl border border-border/60 bg-background/40 p-5">
              <div className="flex items-start gap-3">
                <Avatar aria-hidden className="size-7">
                  <AvatarFallback className="text-[10px]">{initials(pr.author)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <p className="whitespace-pre-line">{pr.body}</p>
                  {pr.highlights?.length ? (
                    <ul className="ms-4 mt-3 list-disc space-y-1 text-muted-foreground">
                      {pr.highlights.map((h) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-4 flex items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                    <span className="inline-flex items-center gap-1">
                      <FileDiffIcon aria-hidden className="size-3" />
                      {interpolate(t.files, { count: fmt.number(pr.files) })}
                    </span>
                    <span className="text-category-2-foreground">
                      <span className="sr-only">{t.added} </span>+{fmt.number(pr.additions)}
                    </span>
                    <span className="text-category-4-foreground">
                      <span className="sr-only">{t.removed} </span>−{fmt.number(pr.deletions)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <details className="group rounded-xl border border-border/60 bg-background/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div aria-hidden className={cn("flex size-7 items-center justify-center rounded-full", failing ? "bg-category-4/15 text-category-4-foreground" : "bg-category-2/15 text-category-2-foreground")}>
                    {failing ? <XIcon className="size-4" /> : <CheckIcon className="size-4" />}
                  </div>
                  <div>
                    <div className="text-sm">{interpolate(t.checksPassed, { passed, total: pr.checks.length })}</div>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{running ? interpolate(t.checksRunning, { count: running, time: duration(elapsed) }) : duration(elapsed)}</div>
                  </div>
                </div>
                <ChevronDownIcon aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <ul className="divide-y divide-border/40 border-border/40 border-t">
                {pr.checks.map((c) => (
                  <li className="flex items-center justify-between gap-3 px-4 py-2 font-mono text-xs" key={c.id}>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2">
                      {c.status === "passed" ? <CheckIcon aria-hidden className="size-3.5 text-category-2-foreground" /> : null}
                      {c.status === "failed" ? <XIcon aria-hidden className="size-3.5 text-category-4-foreground" /> : null}
                      {c.status === "running" ? <span aria-hidden className="size-2 rounded-full bg-category-3 motion-safe:animate-pulse" /> : null}
                      {c.status === "skipped" ? <CircleIcon aria-hidden className="size-3.5 text-muted-foreground" /> : null}
                      <span className="sr-only">{c.status}: </span>
                      <span>{c.name}</span>
                      <span aria-hidden className="text-muted-foreground">
                        /
                      </span>
                      <span className="text-muted-foreground">{c.context}</span>
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{c.durationMs !== undefined ? duration(c.durationMs) : c.status === "skipped" ? t.skipped : t.runningLabel}</span>
                  </li>
                ))}
              </ul>
            </details>

            <section aria-labelledby={`${uid}-activity`}>
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]" id={`${uid}-activity`}>
                {t.activity}
              </h2>
              <div className="relative mt-3">
                <div aria-hidden className="absolute start-3.5 top-2 bottom-2 w-px bg-border/60" />
                <ol className="space-y-3">
                  {pr.timeline.map((item) => (
                    <li className="relative ps-10" key={item.id}>
                      <div aria-hidden className="absolute start-1.5 top-1.5 flex size-5 items-center justify-center rounded-full border border-border/60 bg-background">
                        <TimelineIcon item={item} />
                      </div>
                      <TimelineBody
                        duration={duration}
                        item={item}
                        t={t}
                        when={
                          <time className="font-mono text-[11px] text-muted-foreground" dateTime={item.at}>
                            {fmt.relative(item.at)}
                          </time>
                        }
                      />
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <SidebarSection action={onAddReviewer ? { label: t.addReviewer, icon: <UserPlusIcon aria-hidden className="size-3.5" />, onClick: onAddReviewer } : undefined} title={t.reviewers}>
              <ul className="space-y-2">
                {pr.reviewers.map((r) => (
                  <li className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5" key={r.id}>
                    <Avatar aria-hidden className="size-8">
                      <AvatarFallback className="text-[10px]">{initials(r.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{r.name}</div>
                      {r.note ? <div className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{r.note}</div> : null}
                    </div>
                    <span className="sr-only">{r.state === "approved" ? t.approvedState : r.state === "changes" ? t.changesState : t.pendingState}</span>
                    {r.state === "approved" ? (
                      <CheckIcon aria-hidden className="size-4 text-category-2-foreground" />
                    ) : r.state === "changes" ? (
                      <XIcon aria-hidden className="size-4 text-category-4-foreground" />
                    ) : (
                      <CircleIcon aria-hidden className="size-4 text-category-3-foreground" />
                    )}
                  </li>
                ))}
              </ul>
            </SidebarSection>

            {pr.labels.length || onAddLabel ? (
              <SidebarSection action={onAddLabel ? { label: t.addLabel, icon: <PlusIcon aria-hidden className="size-3.5" />, onClick: onAddLabel } : undefined} title={t.labels}>
                <ul className="flex flex-wrap gap-1.5">
                  {pr.labels.map((l) => (
                    <li className={cn("inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]", LABEL_TONE[l.tone])} key={l.name}>
                      {l.name}
                    </li>
                  ))}
                </ul>
              </SidebarSection>
            ) : null}

            {pr.linkedIssues.length ? (
              <SidebarSection title={t.linkedIssues}>
                <ul className="space-y-1.5 text-sm">
                  {pr.linkedIssues.map((issue) => {
                    const content = (
                      <>
                        <CircleIcon aria-hidden className="size-3.5 shrink-0 text-category-2-foreground" />
                        <span className="font-mono text-muted-foreground text-xs">#{issue.number}</span>
                        <span className="truncate">{issue.title}</span>
                      </>
                    );
                    return (
                      <li key={issue.number}>
                        {issue.href ? (
                          <WirefrontLink className="flex items-center gap-2 rounded outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={issue.href}>
                            {content}
                          </WirefrontLink>
                        ) : (
                          <span className="flex items-center gap-2">{content}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </SidebarSection>
            ) : null}

            {pr.milestone ? (
              <SidebarSection title={t.milestone}>
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span>{pr.milestone.title}</span>
                    <span className="font-mono text-muted-foreground text-xs">
                      {pr.milestone.done}/{pr.milestone.total}
                    </span>
                  </div>
                  <meter aria-label={pr.milestone.title} className="sr-only" max={pr.milestone.total} min={0} value={pr.milestone.done} />
                  <div aria-hidden className="mt-1 h-1 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div className="h-full bg-foreground/40" style={{ width: `${milestonePct}%` }} />
                  </div>
                  {pr.milestone.dueAt ? (
                    <div className="mt-1.5 flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
                      <ClockIcon aria-hidden className="size-3" />
                      {interpolate(t.ships, { when: fmt.relative(pr.milestone.dueAt) })}
                    </div>
                  ) : null}
                </div>
              </SidebarSection>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

export function PullRequestPage(props: PullRequestPageProps) {
  return (
    <ScreenBoundary name="PullRequestPage">
      <PullRequestPageScreen {...props} />
    </ScreenBoundary>
  );
}
