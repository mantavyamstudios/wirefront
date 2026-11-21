// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowRightIcon, BookOpenIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, CircleDotIcon, GitBranchIcon, GitMergeIcon, GitPullRequestIcon, MinusIcon, PlugIcon, ShieldIcon, TerminalIcon, TriangleIcon, XIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import type { CiCheck, PrChecks } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("checksConsole.<key>"). */
export const CHECKS_CONSOLE_MESSAGES = {
  draft: "Draft",
  open: "Open",
  wantsToMerge: "wants to merge",
  commits: "{count} commits",
  into: "into",
  from: "from",
  allPassed: "All checks have passed",
  notSuccessful: "Some checks were not successful",
  failing: "{count} failing",
  skipped: "{count} skipped",
  successful: "{count} successful",
  checks: "checks",
  ring: "{passed} passed, {failed} failed, {skipped} skipped of {total} checks",
  collapse: "Collapse checks",
  expand: "Expand checks",
  failingGroup: "{count} failing check(s)",
  skippedGroup: "{count} skipped check(s)",
  passedGroup: "{count} successful check(s)",
  details: "Details",
  detailsFor: "Details for {name}",
  required: "Required",
  statusFailed: "Failed",
  statusSkipped: "Skipped",
  statusPassed: "Passed",
  behindTitle: "This branch is out-of-date with the base branch",
  behindBody: "Merge the latest changes from {base} into this branch.",
  behindAuthor: "The merge commit will be associated with {email}.",
  updateBranch: "Update branch",
  draftTitle: "This pull request is still a work in progress",
  draftBody: "Draft pull requests cannot be merged.",
  readyForReview: "Ready for review",
  merge: "Squash and merge",
  commandLine: "You can also merge this with the command line.",
  commandLineLink: "View command line instructions",
  errorTitle: "Couldn’t load checks",
  retry: "Try again",
};

export interface ChecksConsoleProps {
  /** The pull request and its checks. Leave it out while it loads. */
  pr?: PrChecks;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Merge the base branch in. Shown when the branch is behind. */
  onUpdateBranch?: Action;
  /** Take it out of draft. Shown while it's a draft. */
  onReadyForReview?: Action;
  /** Squash and merge. Enabled once it isn't a draft, isn't behind and no required check failed. */
  onMerge?: Action;
  /** Where the command-line merge instructions live. Hidden when not given. */
  commandLineHref?: string;
  className?: string;
}

type Messages = typeof CHECKS_CONSOLE_MESSAGES;
const BADGE = "inline-flex size-5 shrink-0 items-center justify-center rounded";

function GithubMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 16 16">
      <path
        d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
        fill="currentColor"
      />
    </svg>
  );
}

const APP_ICON: Record<CiCheck["app"], ReactNode> = {
  github: (
    <span aria-hidden className={cn(BADGE, "bg-foreground text-background")}>
      <GithubMark className="size-3.5" />
    </span>
  ),
  vercel: (
    <span aria-hidden className={cn(BADGE, "bg-foreground text-background")}>
      <TriangleIcon className="size-2.5 fill-current" />
    </span>
  ),
  mintlify: (
    <span aria-hidden className={cn(BADGE, "bg-category-2-strong text-white")}>
      <BookOpenIcon className="size-3" />
    </span>
  ),
  linear: (
    <span aria-hidden className={cn(BADGE, "bg-category-8 text-white")}>
      <CircleDotIcon className="size-3" />
    </span>
  ),
  snyk: (
    <span aria-hidden className={cn(BADGE, "bg-category-5-strong text-white")}>
      <ShieldIcon className="size-3" />
    </span>
  ),
  other: (
    <span aria-hidden className={cn(BADGE, "bg-muted text-muted-foreground")}>
      <PlugIcon className="size-3" />
    </span>
  ),
};

function StatusIcon({ status, t }: { status: CiCheck["status"]; t: Messages }) {
  const label = status === "failed" ? t.statusFailed : status === "passed" ? t.statusPassed : t.statusSkipped;
  const icon =
    status === "failed" ? (
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-category-4 text-white">
        <XIcon className="size-3 stroke-[3]" />
      </span>
    ) : status === "passed" ? (
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-category-2 text-white">
        <CheckIcon className="size-3 stroke-[3]" />
      </span>
    ) : (
      <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-muted-foreground/50 text-muted-foreground">
        <MinusIcon className="size-3 stroke-[2.5]" />
      </span>
    );
  return (
    <>
      <span aria-hidden>{icon}</span>
      <span className="sr-only">{label}: </span>
    </>
  );
}

function StatusRing({ passed, failed, total, label }: { passed: number; failed: number; total: number; label: string }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const passLen = total ? (passed / total) * c : 0;
  const failLen = total ? (failed / total) * c : 0;
  const skipLen = c - passLen - failLen;
  return (
    <svg aria-label={label} className="size-9 shrink-0 -rotate-90" role="img" viewBox="0 0 36 36">
      <circle className="fill-none stroke-muted" cx="18" cy="18" r={r} strokeWidth="4" />
      <circle className="fill-none stroke-category-2" cx="18" cy="18" r={r} strokeDasharray={`${passLen} ${c}`} strokeDashoffset={0} strokeWidth="4" />
      <circle className="fill-none stroke-category-4" cx="18" cy="18" r={r} strokeDasharray={`${failLen} ${c}`} strokeDashoffset={-passLen} strokeWidth="4" />
      <circle className="fill-none stroke-foreground/30" cx="18" cy="18" r={r} strokeDasharray={`${skipLen} ${c}`} strokeDashoffset={-(passLen + failLen)} strokeWidth="4" />
    </svg>
  );
}

function CheckGroup({ label, checks, open, tone, t }: { label: string; checks: CiCheck[]; open?: boolean; tone: "fail" | "ok" | "muted"; t: Messages }) {
  if (!checks.length) return null;
  return (
    <details className="group border-border/70 border-b last:border-b-0" open={open}>
      <summary className="flex min-h-10 cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-[13px] hover:bg-muted/40 sm:px-5">
        <ChevronDownIcon aria-hidden className="size-3.5 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0" />
        <span className={tone === "fail" ? "text-category-4-foreground" : tone === "ok" ? "text-category-2-foreground" : "text-foreground"}>{label}</span>
      </summary>
      <ul className="divide-y divide-border/50">
        {checks.map((c) => (
          <li className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 sm:gap-3 sm:px-5" key={c.id}>
            <StatusIcon status={c.status} t={t} />
            {APP_ICON[c.app]}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="min-w-0 truncate font-medium text-[13px]">{c.name}</span>
                <span className="min-w-0 truncate text-[12px] text-muted-foreground">{c.summary}</span>
              </div>
            </div>
            {c.detailsHref ? (
              <WirefrontLink className="inline-flex min-h-6 items-center rounded text-[12px] text-category-1-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10" href={c.detailsHref}>
                <span className="sr-only">{interpolate(t.detailsFor, { name: c.name })}</span>
                <span aria-hidden>{t.details}</span>
              </WirefrontLink>
            ) : null}
            {c.required ? <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground max-sm:hidden">{t.required}</span> : null}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Notice({ tone, icon, title, body, action }: { tone: "warn" | "info"; icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    // Action drops under the message on phones instead of crushing it.
    <div className="flex flex-wrap items-start gap-x-4 gap-y-3 border-border/70 border-b px-4 py-4 sm:flex-nowrap sm:px-5">
      <span aria-hidden className={cn("mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full", tone === "warn" ? "bg-category-3/15 text-category-3-foreground" : "bg-foreground/10 text-foreground")}>
        {icon}
      </span>
      <div className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
        <h3 className="font-semibold text-[14px]">{title}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{body}</p>
      </div>
      {action ? <div className="shrink-0 max-sm:ms-12">{action}</div> : null}
    </div>
  );
}

const plainButton = "inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-[13px] outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 pointer-coarse:min-h-10";

function ChecksConsoleScreen({ pr, status = "ready", error, onRetry, onUpdateBranch, onReadyForReview, onMerge, commandLineHref, className }: ChecksConsoleProps) {
  const t = useMessages("checksConsole", CHECKS_CONSOLE_MESSAGES);
  const id = useId();
  const [collapsed, setCollapsed] = useState(false);
  const update = useAction(onUpdateBranch ?? (async () => {}));
  const ready = useAction(onReadyForReview ?? (async () => {}));
  const merge = useAction(onMerge ?? (async () => {}));

  if (status === "error" || !pr || status === "loading") {
    return (
      <div className={cn("min-h-svh bg-muted/30 px-3 py-6 sm:px-6 sm:py-10", className)}>
        <div className="mx-auto max-w-3xl">
          {status === "error" ? (
            <div className="rounded-xl border border-border bg-background py-12 text-center">
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
              <Skeleton className="h-12 w-2/3 motion-reduce:animate-none" />
              <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      </div>
    );
  }

  const failing = pr.checks.filter((c) => c.status === "failed");
  const skipped = pr.checks.filter((c) => c.status === "skipped");
  const passed = pr.checks.filter((c) => c.status === "passed");
  const requiredFailing = failing.some((c) => c.required);
  const canMerge = !pr.draft && !pr.behind && !requiredFailing;
  const error_ = update.error ?? ready.error ?? merge.error;

  return (
    <div className={cn("min-h-svh bg-muted/30 px-3 py-6 sm:px-6 sm:py-10", className)}>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-start gap-3 px-1">
          <span aria-hidden className="mt-0.5 inline-flex size-9 items-center justify-center rounded-full bg-category-3/15 text-category-3-foreground">
            <GitPullRequestIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="font-heading text-xl leading-tight">
              {pr.title}
              <span className="ms-2 whitespace-nowrap font-mono text-base text-muted-foreground tabular-nums">#{pr.number}</span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded bg-category-3/15 px-1.5 py-0.5 font-mono text-[11px] text-category-3-foreground uppercase tracking-wider">{pr.draft ? t.draft : t.open}</span>
              <span>
                <strong className="text-foreground">{pr.author}</strong> {t.wantsToMerge} <strong className="text-foreground">{interpolate(t.commits, { count: pr.commits })}</strong> {t.into}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                <GitBranchIcon aria-hidden className="size-2.5 opacity-60" />
                {pr.base}
              </span>
              <ArrowRightIcon aria-hidden className="size-3 rtl:rotate-180" />
              <span>{t.from}</span>
              <span className="inline-flex items-center gap-1 rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                <GitBranchIcon aria-hidden className="size-2.5 opacity-60" />
                {pr.head}
              </span>
            </div>
          </div>
        </div>

        <section aria-labelledby={`${id}-checks`} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <div className="flex items-start gap-3 border-border/70 border-b px-4 py-4 sm:gap-4 sm:px-5">
            <StatusRing failed={failing.length} label={interpolate(t.ring, { passed: passed.length, failed: failing.length, skipped: skipped.length, total: pr.checks.length })} passed={passed.length} total={pr.checks.length} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-[15px]" id={`${id}-checks`}>
                {failing.length ? t.notSuccessful : t.allPassed}
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                <span className="font-medium text-category-4-foreground">{interpolate(t.failing, { count: failing.length })}</span>, <span className="font-medium text-foreground">{interpolate(t.skipped, { count: skipped.length })}</span>,{" "}
                <span className="font-medium text-category-2-foreground">{interpolate(t.successful, { count: passed.length })}</span> {t.checks}
              </p>
            </div>
            <button
              aria-controls={`${id}-groups`}
              aria-expanded={!collapsed}
              aria-label={collapsed ? t.expand : t.collapse}
              className="-me-2 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10 sm:me-0"
              onClick={() => setCollapsed((v) => !v)}
              type="button"
            >
              {collapsed ? <ChevronDownIcon aria-hidden className="size-4" /> : <ChevronUpIcon aria-hidden className="size-4" />}
            </button>
          </div>
          <div hidden={collapsed} id={`${id}-groups`}>
            <CheckGroup checks={failing} label={interpolate(t.failingGroup, { count: failing.length })} open t={t} tone="fail" />
            <CheckGroup checks={skipped} label={interpolate(t.skippedGroup, { count: skipped.length })} t={t} tone="muted" />
            <CheckGroup checks={passed} label={interpolate(t.passedGroup, { count: passed.length })} t={t} tone="ok" />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          {pr.behind ? (
            <Notice
              action={
                onUpdateBranch ? (
                  <button className={plainButton} disabled={update.isPending()} onClick={() => void update.run()} type="button">
                    {update.isPending() ? <Spinner className="size-3.5" /> : null}
                    {t.updateBranch}
                  </button>
                ) : undefined
              }
              body={[interpolate(t.behindBody, { base: pr.base }), pr.mergeAuthorEmail ? interpolate(t.behindAuthor, { email: pr.mergeAuthorEmail }) : ""].join(" ").trim()}
              icon={<GitMergeIcon className="size-4" />}
              title={t.behindTitle}
              tone="warn"
            />
          ) : null}
          {pr.draft ? (
            <Notice
              action={
                onReadyForReview ? (
                  <button className={plainButton} disabled={ready.isPending()} onClick={() => void ready.run()} type="button">
                    {ready.isPending() ? <Spinner className="size-3.5" /> : null}
                    {t.readyForReview}
                  </button>
                ) : undefined
              }
              body={t.draftBody}
              icon={<GitPullRequestIcon className="size-4" />}
              title={t.draftTitle}
              tone="info"
            />
          ) : null}
          {error_ ? (
            <p className="border-border/70 border-b px-4 py-2 text-destructive-foreground text-xs sm:px-5" role="alert">
              {error_}
            </p>
          ) : null}
          <div className="flex flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            {onMerge ? (
              <button
                className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 font-medium text-[13px] outline-none enabled:bg-category-2-strong enabled:text-white focus-visible:ring-2 focus-visible:ring-ring disabled:text-muted-foreground"
                disabled={!canMerge || merge.isPending()}
                onClick={() => void merge.run()}
                type="button"
              >
                {merge.isPending() ? <Spinner className="size-3.5" /> : null}
                {t.merge}
              </button>
            ) : null}
            {commandLineHref ? (
              <span className="text-[13px] text-muted-foreground">
                {t.commandLine}{" "}
                <WirefrontLink className="inline-flex items-center gap-1 rounded text-category-1-foreground outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring" href={commandLineHref}>
                  <TerminalIcon aria-hidden className="size-3" />
                  {t.commandLineLink}
                </WirefrontLink>
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

export function ChecksConsole(props: ChecksConsoleProps) {
  return (
    <ScreenBoundary name="ChecksConsole">
      <ChecksConsoleScreen {...props} />
    </ScreenBoundary>
  );
}
