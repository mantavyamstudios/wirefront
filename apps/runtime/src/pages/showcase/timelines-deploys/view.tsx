// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckCircle2Icon, CircleAlertIcon, GitBranchIcon, RefreshCwIcon, RotateCcwIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import type { Deploy } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("deployHistory.<key>"). */
export const DEPLOY_HISTORY_MESSAGES = {
  eyebrow: "{project} · last 7 days",
  title: "Deploy history",
  env: "Environment",
  allEnvs: "All envs",
  production: "production",
  staging: "staging",
  preview: "preview",
  refresh: "Refresh",
  succeeded: "Succeeded",
  failed: "Failed",
  "rolled-back": "Rolled back",
  "in-progress": "In progress",
  minutes: "{m}m {s}s",
  rollBack: "Roll back",
  rollBackSha: "Roll back to {sha}",
  empty: "No deploys in this range.",
  errorTitle: "Couldn’t load deploys",
  retry: "Try again",
};

export interface DeployHistoryProps {
  /** Deploys, newest first. Leave it out while they load. */
  deploys?: Deploy[];
  /** The project's name for the header, e.g. "acme/web". */
  project: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Fetch the latest deploys. Hidden without it. */
  onRefresh?: Action;
  /** Redeploy production at a succeeded production deploy, by id. Hidden without it. */
  onRollBack?: Action<string>;
  className?: string;
}

type Env = Deploy["env"];
const ENVS: Env[] = ["production", "staging", "preview"];
const ENV_TONE: Record<Env, string> = {
  production: "bg-category-2/15 text-category-2-foreground",
  staging: "bg-category-3/15 text-category-3-foreground",
  preview: "bg-category-1/15 text-category-1-foreground",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function StatusGlyph({ status, label }: { status: Deploy["status"]; label: string }) {
  const icon =
    status === "succeeded" ? (
      <CheckCircle2Icon aria-hidden className="size-5 text-category-2-foreground" />
    ) : status === "failed" ? (
      <XCircleIcon aria-hidden className="size-5 text-category-4-foreground" />
    ) : status === "rolled-back" ? (
      <CircleAlertIcon aria-hidden className="size-5 text-category-3-foreground" />
    ) : (
      <span aria-hidden className="relative grid size-5 place-items-center">
        <span className="absolute size-3 rounded-full bg-foreground/30 motion-safe:animate-ping" />
        <span className="size-2 rounded-full bg-foreground" />
      </span>
    );
  return (
    <span className="grid size-5 place-items-center">
      {icon}
      <span className="sr-only">{label}</span>
    </span>
  );
}

function DeployHistoryScreen({ deploys, project, status = "ready", error, onRetry, onRefresh, onRollBack, className }: DeployHistoryProps) {
  const t = useMessages("deployHistory", DEPLOY_HISTORY_MESSAGES);
  const fmt = useFormat();
  const [env, setEnv] = useState<Env | "all">("all");
  const refresh = useAction(onRefresh ?? (async () => {}));
  const rollBack = useAction(onRollBack ?? (async () => {}));
  const duration = (ms: number) => {
    const total = Math.round(ms / 1000);
    return interpolate(t.minutes, { m: Math.floor(total / 60), s: String(total % 60).padStart(2, "0") });
  };
  const shown = (deploys ?? []).filter((d) => env === "all" || d.env === env);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { project })}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select items={{ all: t.allEnvs, production: t.production, staging: t.staging, preview: t.preview }} onValueChange={(v) => v && setEnv(v as Env | "all")} value={env}>
              <SelectTrigger aria-label={t.env} className="w-auto min-w-32 font-mono text-[10px] uppercase tracking-[0.25em]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">{t.allEnvs}</SelectItem>
                {ENVS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {t[e]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onRefresh ? (
              <button
                className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 font-mono text-[10px] text-background uppercase tracking-[0.25em] outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 pointer-coarse:min-h-10"
                disabled={refresh.isPending()}
                onClick={() => void refresh.run()}
                type="button"
              >
                <RefreshCwIcon aria-hidden className={cn("size-3", refresh.isPending() && "animate-spin motion-reduce:animate-none")} />
                {t.refresh}
              </button>
            ) : null}
          </div>
        </div>
        {refresh.error || rollBack.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {refresh.error ?? rollBack.error}
          </p>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          {status === "error" ? (
            <div className="py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : !deploys || status === "loading" ? (
            <div aria-busy="true" className="flex flex-col gap-3 p-4">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton className="h-12 w-full motion-reduce:animate-none" key={k} />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {shown.map((d) => (
                <li
                  // Phones: status | env, message, author stacked | action.
                  // md+: five columns with a flexible message column.
                  className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 px-4 py-3.5 sm:px-5 md:grid-cols-[24px_110px_minmax(0,1fr)_170px_auto] md:items-center md:gap-4"
                  key={d.id}
                >
                  <StatusGlyph label={t[d.status]} status={d.status} />
                  <div className="max-md:col-start-2 max-md:row-start-1">
                    <span className={cn("rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.25em]", ENV_TONE[d.env])}>{t[d.env]}</span>
                  </div>
                  <div className="min-w-0 max-md:col-start-2">
                    <div className="line-clamp-2 text-sm md:truncate">{d.message}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-[10px] text-muted-foreground">
                      <GitBranchIcon aria-hidden className="size-3" />
                      {d.branch}
                      <span aria-hidden>·</span>
                      <span>{d.sha}</span>
                      <span aria-hidden>·</span>
                      <span>{duration(d.durationMs)}</span>
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2 max-md:col-start-2">
                    <Avatar aria-hidden className="size-5 shrink-0">
                      <AvatarFallback className="text-[10px]">{initials(d.author)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate text-xs">{d.author}</span>
                    <time className="shrink-0 font-mono text-[10px] text-muted-foreground md:ms-auto" dateTime={d.at}>
                      {fmt.relative(d.at)}
                    </time>
                  </div>
                  {onRollBack && d.env === "production" && d.status === "succeeded" ? (
                    <button
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 max-md:col-start-3 max-md:row-start-1 pointer-coarse:min-h-10"
                      disabled={rollBack.isPending()}
                      onClick={() => void rollBack.run(d.id, d.id)}
                      type="button"
                    >
                      {rollBack.isPending(d.id) ? <Spinner className="size-3" /> : <RotateCcwIcon aria-hidden className="size-3" />}
                      <span className="sr-only">{interpolate(t.rollBackSha, { sha: d.sha })}</span>
                      <span aria-hidden className="max-sm:hidden">
                        {t.rollBack}
                      </span>
                    </button>
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground max-md:col-start-3 max-md:row-start-1">{d.id}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeployHistory(props: DeployHistoryProps) {
  return (
    <ScreenBoundary name="DeployHistory">
      <DeployHistoryScreen {...props} />
    </ScreenBoundary>
  );
}
