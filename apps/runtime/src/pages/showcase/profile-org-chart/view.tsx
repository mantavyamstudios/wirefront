// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { OrgPerson } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("orgChart.<key>"). */
export const ORG_CHART_MESSAGES = {
  eyebrow: "{company} · {total} people · {levels} levels deep",
  title: "Reporting lines",
  chart: "Org chart",
  reports: "{count} reports",
  show: "Show {count} reports of {name}",
  hide: "Hide {count} reports of {name}",
  empty: "No one in the org chart yet.",
  errorTitle: "Couldn’t load the org chart",
  retry: "Try again",
};

export interface OrgChartProps {
  /** People loaded so far, with their managers. Leave it out while they load. */
  people?: OrgPerson[];
  /** How many people work there in total. */
  total?: number;
  /** Your company's name, for the header. */
  company: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Load a manager's reports that aren't in `people` yet, then pass them in. Their toggle is disabled without it. */
  onLoadReports?: Action<string>;
  className?: string;
}

type Messages = typeof ORG_CHART_MESSAGES;
type Ctx = { closed: Set<string>; toggle: (id: string) => void; childrenOf: (id: string) => OrgPerson[]; t: Messages; load?: (id: string) => void; loading: (id: string) => boolean };
const Chart = createContext<Ctx | null>(null);
const useChart = () => {
  const ctx = useContext(Chart);
  if (!ctx) throw new Error("OrgChart parts must render inside OrgChart.");
  return ctx;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Card({ node, highlight, fluid = false }: { node: OrgPerson; highlight: boolean; fluid?: boolean }) {
  const { closed, toggle, childrenOf, t, load, loading } = useChart();
  const loaded = childrenOf(node.id);
  const open = loaded.length > 0 && !closed.has(node.id);
  const canExpand = loaded.length > 0 || (node.reportsCount > 0 && Boolean(load));
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border bg-background px-3 py-2.5 shadow-sm", fluid ? "w-full" : "w-56", highlight ? "border-foreground/40 ring-2 ring-foreground/15" : "border-border/60")}>
      <Avatar aria-hidden className="size-9 shrink-0">
        {node.avatarUrl ? <AvatarImage alt="" src={node.avatarUrl} /> : null}
        <AvatarFallback className="text-xs">{initials(node.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{node.name}</div>
        <div className="truncate text-muted-foreground text-xs">{node.title}</div>
        {node.reportsCount ? <div className="mt-1 inline-flex items-center gap-1 rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{interpolate(t.reports, { count: node.reportsCount })}</div> : null}
      </div>
      {node.reportsCount ? (
        <button
          aria-expanded={open}
          aria-label={interpolate(open ? t.hide : t.show, { count: node.reportsCount, name: node.name })}
          className="-my-1 -me-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 pointer-coarse:size-10"
          disabled={!canExpand || loading(node.id)}
          onClick={() => (loaded.length ? toggle(node.id) : load?.(node.id))}
          type="button"
        >
          {loading(node.id) ? <Spinner className="size-3.5" /> : open ? <ChevronDownIcon aria-hidden className="size-3.5" /> : <ChevronRightIcon aria-hidden className="size-3.5 rtl:rotate-180" />}
        </button>
      ) : null}
    </div>
  );
}

function Tree({ node, highlight = false }: { node: OrgPerson; highlight?: boolean }) {
  const { closed, childrenOf } = useChart();
  const reports = childrenOf(node.id);
  const open = reports.length > 0 && !closed.has(node.id);
  return (
    <div className="flex flex-col items-center">
      <Card highlight={highlight} node={node} />
      {open ? (
        <>
          <div aria-hidden className="h-6 w-px bg-border/70" />
          {/* Each child draws its own slice of the horizontal connector. */}
          <div className="flex items-start">
            {reports.map((r, i) => (
              <div className="relative flex flex-col items-center px-3" key={r.id}>
                {reports.length > 1 ? <span aria-hidden className={cn("absolute top-0 h-px bg-border/70", i === 0 ? "start-1/2 end-0" : i === reports.length - 1 ? "start-0 end-1/2" : "inset-x-0")} /> : null}
                <div aria-hidden className="h-3 w-px bg-border/70" />
                <Tree node={r} />
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function OutlineNode({ node, highlight = false }: { node: OrgPerson; highlight?: boolean }) {
  const { closed, childrenOf } = useChart();
  const reports = childrenOf(node.id);
  const open = reports.length > 0 && !closed.has(node.id);
  return (
    <li className="flex flex-col gap-2">
      <Card fluid highlight={highlight} node={node} />
      {open ? (
        <ul className="ms-4 flex flex-col gap-2 border-border/70 border-s ps-3">
          {reports.map((r) => (
            <OutlineNode key={r.id} node={r} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

// md+: the classic top-down tree in a horizontal scroller. Phones: an indented,
// collapsible outline (no sideways panning to find siblings).
function OrgChartScreen({ people, total, company, status = "ready", error, onRetry, onLoadReports, className }: OrgChartProps) {
  const t = useMessages("orgChart", ORG_CHART_MESSAGES);
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const loader = useAction(onLoadReports ?? (async () => {}));
  const list = people ?? [];
  const root = list.find((p) => !p.managerId || !list.some((m) => m.id === p.managerId));
  const childrenOf = (id: string) => list.filter((p) => p.managerId === id);
  const depth = (id: string): number => 1 + Math.max(0, ...childrenOf(id).map((c) => depth(c.id)));
  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const ctx: Ctx = { closed, toggle, childrenOf, t, load: onLoadReports ? (id) => void loader.run(id, id) : undefined, loading: (id) => loader.isPending(id) };
  // Start the wide tree centred on the root instead of its start edge.
  const treeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = treeRef.current?.parentElement;
    if (viewport && list.length) viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  }, [list.length]);

  return (
    <Chart.Provider value={ctx}>
      <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10", className)}>
        <div className="mx-auto max-w-5xl">
          {root ? <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { company, total: total ?? list.length, levels: depth(root.id) })}</div> : null}
          <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          {loader.error ? (
            <p className="mt-3 text-destructive-foreground text-sm" role="alert">
              {loader.error}
            </p>
          ) : null}

          {status === "error" ? (
            <div className="mt-8 rounded-xl border border-border/60 py-12 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : !people || status === "loading" ? (
            <Skeleton aria-busy="true" className="mt-8 h-80 w-full rounded-xl motion-reduce:animate-none" />
          ) : !root ? (
            <p className="mt-8 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
          ) : (
            <>
              <ScrollRegion aria-label={t.chart} className="mt-8 rounded-xl border border-border/60 bg-background/40 max-md:hidden" orientation="horizontal">
                <div className="mx-auto w-max p-8" ref={treeRef}>
                  <Tree highlight node={root} />
                </div>
              </ScrollRegion>
              <ul aria-label={t.chart} className="mt-6 md:hidden">
                <OutlineNode highlight node={root} />
              </ul>
            </>
          )}
        </div>
      </div>
    </Chart.Provider>
  );
}

export function OrgChart(props: OrgChartProps) {
  return (
    <ScreenBoundary name="OrgChart">
      <OrgChartScreen {...props} />
    </ScreenBoundary>
  );
}
