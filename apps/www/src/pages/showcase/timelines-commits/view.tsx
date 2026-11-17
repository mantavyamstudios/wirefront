// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CopyIcon, GitBranchIcon, TagIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Commit } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("commitGraph.<key>"). */
export const COMMIT_GRAPH_MESSAGES = {
  eyebrow: "Repository · {repo}",
  title: "Commits on {branch}",
  branch: "Branch",
  filesOne: "{count} file",
  filesOther: "{count} files",
  copy: "Copy commit {sha}",
  copied: "Copied {sha}",
  empty: "No commits on this branch yet.",
  errorTitle: "Couldn’t load commits",
  retry: "Try again",
};

export interface CommitGraphProps {
  /** Commits, newest first, with their graph lane. Leave it out while they load. */
  commits?: Commit[];
  repo: string;
  branch: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const LANE_COLORS = ["#6366f1", "#14b8a6", "#f472b6"];
const laneColor = (lane: number) => LANE_COLORS[lane % LANE_COLORS.length] ?? "#6366f1";
const ROW_H = 60;
const LANE_X_BASE = 18;
const LANE_GAP = 20;
const DOT_R = 5;
const laneX = (l: number) => LANE_X_BASE + l * LANE_GAP;
const rowY = (r: number) => r * ROW_H + ROW_H / 2;

type Edge = { key: string; x1: number; y1: number; x2: number; y2: number; color: string; sameLane: boolean };

function pathFor(e: Edge) {
  if (e.sameLane) return `M ${e.x1} ${e.y1} L ${e.x2} ${e.y2}`;
  // S-curve: vertical exit, lateral curve, vertical entry.
  const dy = e.y2 - e.y1;
  const corner = Math.min(dy / 2, ROW_H * 0.45);
  return [
    `M ${e.x1} ${e.y1}`,
    `L ${e.x1} ${e.y1 + dy / 2 - corner / 2}`,
    `C ${e.x1} ${e.y1 + dy / 2 + corner / 2}, ${e.x2} ${e.y2 - dy / 2 - corner / 2}, ${e.x2} ${e.y2 - dy / 2 + corner / 2}`,
    `L ${e.x2} ${e.y2}`,
  ].join(" ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CommitGraphScreen({ commits, repo, branch, status = "ready", error, onRetry, className }: CommitGraphProps) {
  const t = useMessages("commitGraph", COMMIT_GRAPH_MESSAGES);
  const fmt = useFormat();
  const { locale } = useWirefront();
  const [copied, setCopied] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = (sha: string) => {
    void navigator.clipboard?.writeText(sha).then(() => {
      setCopied(sha);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(undefined), 1500);
    });
  };
  const plural = new Intl.PluralRules(locale);
  const list = commits ?? [];
  const numLanes = Math.max(0, ...list.map((c) => c.lane)) + 1;
  const graphWidth = LANE_X_BASE * 2 + (numLanes - 1) * LANE_GAP;
  const totalHeight = list.length * ROW_H;
  const rowOf = new Map(list.map((c, i) => [c.sha, i]));
  const edges: Edge[] = list.flatMap((c, ci) =>
    c.parents.flatMap((p) => {
      const pi = rowOf.get(p);
      const parent = pi === undefined ? undefined : list[pi];
      if (pi === undefined || !parent) return [];
      return [{ key: `${c.sha}-${p}`, x1: laneX(c.lane), y1: rowY(ci), x2: laneX(parent.lane), y2: rowY(pi), color: laneColor(Math.max(c.lane, parent.lane)), sameLane: c.lane === parent.lane }];
    }),
  );

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { repo })}</div>
            <h1 className="mt-1 font-heading text-2xl">{interpolate(t.title, { branch })}</h1>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-1.5 font-mono text-xs">
            <GitBranchIcon aria-hidden className="size-3.5 opacity-60" />
            <span className="sr-only">{t.branch}</span>
            {branch}
          </div>
        </div>

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
          ) : !commits || status === "loading" ? (
            <div aria-busy="true" className="flex flex-col gap-3 p-4">
              {["a", "b", "c", "d"].map((k) => (
                <Skeleton className="h-10 w-full motion-reduce:animate-none" key={k} />
              ))}
            </div>
          ) : list.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <div className="relative" style={{ height: totalHeight }}>
              <svg aria-hidden className="pointer-events-none absolute start-4 top-0" height={totalHeight} viewBox={`0 0 ${graphWidth} ${totalHeight}`} width={graphWidth}>
                {edges.map((e) => (
                  <path d={pathFor(e)} fill="none" key={e.key} stroke={e.color} strokeLinecap="round" strokeOpacity={0.75} strokeWidth={1.75} />
                ))}
                {list.map((c, i) => {
                  const merge = c.parents.length > 1;
                  return (
                    <g key={c.sha}>
                      <circle className="fill-background" cx={laneX(c.lane)} cy={rowY(i)} r={DOT_R + 2} />
                      <circle cx={laneX(c.lane)} cy={rowY(i)} fill={merge ? "transparent" : laneColor(c.lane)} r={merge ? DOT_R - 1 : DOT_R} stroke={laneColor(c.lane)} strokeWidth={merge ? 1.75 : 0} />
                    </g>
                  );
                })}
              </svg>

              <ul className="divide-y divide-border/40">
                {list.map((c) => {
                  const merge = c.parents.length > 1;
                  return (
                    <li
                      // Rows keep a fixed height (the branch graph is drawn against it), so on
                      // phones the meta line drops low-priority bits rather than wrapping.
                      className="flex items-center gap-2 pe-2 sm:gap-4 sm:pe-4"
                      key={c.sha}
                      style={{ height: ROW_H, paddingInlineStart: 16 + graphWidth + 16 }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar aria-hidden className="size-5 shrink-0 max-sm:hidden">
                            <AvatarFallback className="text-[10px]">{initials(c.author)}</AvatarFallback>
                          </Avatar>
                          <span className={cn("truncate text-sm", merge && "text-muted-foreground italic")}>{c.message}</span>
                          {c.tag ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] max-sm:hidden">
                              <TagIcon aria-hidden className="size-2.5" />
                              {c.tag}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                          {/* On phones the tag moves here so the message keeps the first line. */}
                          {c.tag ? (
                            <span className="inline-flex items-center gap-1 text-foreground sm:hidden">
                              <TagIcon aria-hidden className="size-2.5" />
                              {c.tag} ·
                            </span>
                          ) : null}
                          <span>{c.author}</span>
                          {c.scope ? (
                            <>
                              <span aria-hidden className="max-sm:hidden">
                                ·
                              </span>
                              <span className="max-sm:hidden">{c.scope}</span>
                            </>
                          ) : null}
                          <span aria-hidden>·</span>
                          <time dateTime={c.at}>{fmt.relative(c.at)}</time>
                          {!merge && c.filesChanged !== undefined ? (
                            <>
                              <span aria-hidden className="max-md:hidden">
                                ·
                              </span>
                              <span className="max-md:hidden">{interpolate(plural.select(c.filesChanged) === "one" ? t.filesOne : t.filesOther, { count: fmt.number(c.filesChanged) })}</span>
                              {c.additions !== undefined ? <span className="text-category-2-foreground max-md:hidden">+{fmt.number(c.additions)}</span> : null}
                              {c.deletions !== undefined ? <span className="text-category-4-foreground max-md:hidden">-{fmt.number(c.deletions)}</span> : null}
                            </>
                          ) : null}
                        </div>
                      </div>

                      <button
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-9"
                        onClick={() => copy(c.sha)}
                        type="button"
                      >
                        {copied === c.sha ? <CheckIcon aria-hidden className="size-3" /> : <CopyIcon aria-hidden className="size-3" />}
                        <span className="sr-only">{interpolate(copied === c.sha ? t.copied : t.copy, { sha: c.sha })}</span>
                        <span aria-hidden className="max-sm:hidden">
                          {c.sha}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommitGraph(props: CommitGraphProps) {
  return (
    <ScreenBoundary name="CommitGraph">
      <CommitGraphScreen {...props} />
    </ScreenBoundary>
  );
}
