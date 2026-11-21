// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `prompt-test-bench`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Spinner } from "@wirefront/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@wirefront/ui/tabs";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronDownIcon, CircleCheckIcon, CircleXIcon, ClockIcon, CoinsIcon, FileTextIcon, FlaskConicalIcon, FolderKanbanIcon, GaugeIcon, MenuIcon, MessageSquareIcon, RotateCwIcon, TargetIcon, TimerIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import { type ReactNode, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BenchCase, BenchPrompt, CaseResult, PromptSummary, PromptVersion, VersionReview } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("promptTestBench.<key>"). */
export const PROMPT_TEST_BENCH_MESSAGES = {
  evals: "Evals",
  prompts: "Prompts",
  openPrompts: "Open prompts",
  latestRate: "Latest version pass rate",
  latestRateBelow: "Latest version pass rate (below ship bar)",
  queued: "Queued",
  running: "Running",
  pass: "Pass",
  fail: "Fail",
  production: "prod {id}",
  version: "Prompt version",
  versionOption: "{id} · {date}",
  prodSuffix: " · prod",
  runningCount: "Running {done}/{total}",
  rerunAll: "Re-run all",
  passRate: "Pass rate",
  scoring: "Scoring · {passed}/{done} passed",
  clears: "Clears ship bar · {passed}/{total}",
  below: "Below ship bar · {passed}/{total}",
  avgScore: "Avg. judge score",
  prodRate: "prod {id}: {rate} pass",
  serving: "serving in prod",
  latency: "Latency p50",
  latencyHint: "median per case",
  cost: "Cost",
  costHint: "per 1k runs",
  chartTitle: "Pass rate by version",
  chartLabel: "Pass rate by prompt version",
  shipBar: "Ship bar {rate}",
  barLabel: "{id}: {rate} pass rate",
  barLabelBelow: "{id}: {rate} pass rate, below ship bar",
  vsShipBar: "vs ship bar",
  points: "{sign}{count} pts",
  chartHint: "In production · pick a bar to inspect that version",
  diffTitle: "Prompt diff",
  diffRange: "{from} → {to}",
  diffInitial: "{id} (initial)",
  diffLayout: "Diff layout",
  unified: "Unified",
  split: "Split",
  approvedVersion: "approved {id}",
  changesVersion: "requested changes on {id}",
  undo: "Undo",
  reviewComment: "Review comment",
  reviewPlaceholder: "Leave a note on {id}…",
  versionMeta: "{author} · {note}",
  requestChanges: "Request changes",
  approve: "Approve",
  testCases: "Test cases",
  filter: "Filter test cases",
  all: "All",
  passed: "Passed",
  failed: "Failed",
  colCase: "Case",
  colExpected: "Expected",
  colScore: "Score",
  colStatus: "Status",
  rerunCase: "Re-run {id}",
  rerun: "Re-run",
  input: "Input",
  expected: "Expected",
  output: "Output",
  score: "score {score}",
  judge: "Judge: {note}",
  judgePass: "Judge: meets every expectation.",
  noFailing: "No failing cases on {id}",
  noPassing: "No passing cases on {id}",
  allPassed: "All {count} cases scored {mark} or higher.",
  nonePassed: "Every case scored under {mark}. Open a failing case to see what the judge flagged.",
  showAll: "Show all cases",
};
type Messages = typeof PROMPT_TEST_BENCH_MESSAGES;

export interface PromptTestBenchProps {
  workspace: string;
  user: { name: string };
  prompts: PromptSummary[];
  /** The open prompt with its versions and cases. */
  prompt: BenchPrompt;
  /** The version being inspected. */
  versionId: string;
  /** Each case's latest result on that version. */
  results: Record<string, CaseResult>;
  /** Reviews by version id. */
  reviews?: Record<string, VersionReview | undefined>;
  /** A version ships when this share of cases pass, 0 to 1. */
  threshold: number;
  /** A case passes at this judge score, 0 to 1. */
  passMark: number;
  /** Extra links at the foot of the sidebar, e.g. datasets and settings. */
  links?: { label: string; href: string; icon?: ReactNode }[];
  onSelectPrompt: (name: string) => void;
  onSelectVersion: (versionId: string) => void;
  /** Re-run some or all cases; set their results to queued while they run. Hidden without it. */
  onRun?: (caseIds: string[]) => void;
  /** Saves a review. It shows at once and is removed if this fails. Hidden without it. */
  onReview?: Action<{ versionId: string; kind: VersionReview["kind"]; comment: string }>;
  onWithdrawReview?: Action<{ versionId: string }>;
  className?: string;
}

const TONE_CLASS = {
  success: "bg-success/8 text-success-foreground dark:bg-success/16",
  info: "bg-info/8 text-info-foreground dark:bg-info/16",
  error: "bg-destructive/8 text-destructive-foreground dark:bg-destructive/16",
} as const;
const spring = { type: "spring", duration: 0.3, bounce: 0 } as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const PRESS = "transition-[box-shadow,transform,background-color] duration-150 ease-out active:scale-[0.97] motion-reduce:active:scale-100";
const TAB_HIT = "text-foreground/70 after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']";

function useFormats() {
  const fmt = useFormat();
  return {
    pct: (n: number) => fmt.number(n, { style: "percent", maximumFractionDigits: 0 }),
    score: (n: number) => fmt.number(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    sec: (ms: number) => fmt.number(ms / 1000, { style: "unit", unit: "second", unitDisplay: "narrow", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    cost: (n: number) => fmt.money(n, "USD"),
    day: (iso: string) => fmt.date(`${iso.slice(0, 10)}T00:00:00Z`, { month: "short", day: "2-digit", timeZone: "UTC" }),
    relative: fmt.relative,
  };
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2);
}

function Rolling({ value, format }: { value: number; format: (n: number) => string }) {
  const reduce = useReducedMotion();
  const s = useSpring(value, { stiffness: 160, damping: 26 });
  const text = useTransform(s, (v) => format(v));
  useEffect(() => {
    if (reduce) s.jump(value);
    else s.set(value);
  }, [value, reduce, s]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSize({ width: r.width, height: r.height });
    const ro = new ResizeObserver(([e]) => {
      if (e) setSize({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

function AutoHeight({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const [ref, { height }] = useElementSize<HTMLDivElement>();
  return (
    <motion.div animate={height ? { height } : undefined} className={cn("relative -mx-1 -mb-1 overflow-hidden", className)} initial={false} transition={reduce ? { duration: 0 } : spring}>
      <div ref={ref}>
        <div className="p-1">{children}</div>
      </div>
    </motion.div>
  );
}

function barPath(x: number, w: number, top: number, base: number) {
  const h = Math.max(0, base - top);
  const r = Math.min(4, w / 2, h);
  return `M${x},${base}L${x},${top + r}Q${x},${top} ${x + r},${top}L${x + w - r},${top}Q${x + w},${top} ${x + w},${top + r}L${x + w},${base}Z`;
}

type DiffOp = { key: string; type: "same" | "add" | "del"; text: string; a?: number; b?: number };

/** A line diff by longest common subsequence. */
function diffLines(prev: string, next: string): DiffOp[] {
  const a = prev ? prev.split("\n") : [];
  const b = next.split("\n");
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  const at = (i: number, j: number) => dp[i]?.[j] ?? 0;
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      const row = dp[i];
      if (row) row[j] = a[i] === b[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1));
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      ops.push({ key: `s${i}-${j}`, type: "same", text: a[i] ?? "", a: i + 1, b: j + 1 });
      i++;
      j++;
    } else if (at(i + 1, j) >= at(i, j + 1)) {
      ops.push({ key: `d${i}`, type: "del", text: a[i] ?? "", a: i + 1 });
      i++;
    } else {
      ops.push({ key: `a${j}`, type: "add", text: b[j] ?? "", b: j + 1 });
      j++;
    }
  }
  for (; i < a.length; i++) ops.push({ key: `d${i}`, type: "del", text: a[i] ?? "", a: i + 1 });
  for (; j < b.length; j++) ops.push({ key: `a${j}`, type: "add", text: b[j] ?? "", b: j + 1 });
  return ops;
}

type SplitRow = { key: string; left?: DiffOp; right?: DiffOp };
function toSplit(ops: DiffOp[]): SplitRow[] {
  const rows: SplitRow[] = [];
  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op?.type === "same") {
      rows.push({ key: op.key, left: op, right: op });
      k++;
      continue;
    }
    const dels: DiffOp[] = [];
    const adds: DiffOp[] = [];
    while (ops[k]?.type === "del") dels.push(ops[k++] as DiffOp);
    while (ops[k]?.type === "add") adds.push(ops[k++] as DiffOp);
    for (let r = 0; r < Math.max(dels.length, adds.length); r++) rows.push({ key: `${dels[r]?.key ?? ""}|${adds[r]?.key ?? ""}`, left: dels[r], right: adds[r] });
  }
  return rows;
}

function Card({ title, action, children, className }: { title: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("@container flex min-w-0 flex-col rounded-2xl border bg-card p-4 shadow-xs/5", className)}>
      <header className="mb-3 flex min-h-7 flex-wrap items-center justify-between gap-2">
        <h2 className="text-balance font-medium text-sm">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function StatusPill({ status, t }: { status: CaseResult["status"]; t: Messages }) {
  const reduce = useReducedMotion();
  const map = {
    queued: { tone: undefined, label: t.queued, icon: <ClockIcon aria-hidden /> },
    running: { tone: TONE_CLASS.info, label: t.running, icon: <Spinner className="size-3" /> },
    pass: { tone: TONE_CLASS.success, label: t.pass, icon: <CircleCheckIcon aria-hidden /> },
    fail: { tone: TONE_CLASS.error, label: t.fail, icon: <CircleXIcon aria-hidden /> },
  } as const;
  const m = map[status];
  return (
    <span aria-live="polite" className="relative inline-flex h-5 w-20 items-center overflow-hidden">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span animate={{ y: 0, opacity: 1, scale: 1 }} exit={reduce ? { opacity: 0 } : { y: -8, opacity: 0, scale: 0.95 }} initial={reduce ? { opacity: 0 } : { y: 8, opacity: 0, scale: 0.95 }} key={status} transition={spring}>
          <Badge className={cn(m.tone, "rounded-full px-1.5")} variant={m.tone ? "secondary" : "outline"}>
            {m.icon}
            {m.label}
          </Badge>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function StatTile({ icon, label, children, hint }: { icon: ReactNode; label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="min-w-0 px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs [&_svg]:size-3.5 [&_svg]:opacity-72">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate font-semibold text-xl tracking-tight">{children}</div>
      {hint ? <div className="mt-0.5 truncate text-muted-foreground text-xs">{hint}</div> : null}
    </div>
  );
}

function PassRateChart({ versions, rates, selected, productionId, threshold, onSelect, t }: { versions: PromptVersion[]; rates: number[]; selected: string; productionId?: string; threshold: number; onSelect: (id: string) => void; t: Messages }) {
  const reduce = useReducedMotion();
  const f = useFormats();
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = Math.max(200, height);
  const pad = { l: 30, r: 4, t: 14, b: 22 };
  const plotW = Math.max(0, width - pad.l - pad.r);
  const base = H - pad.b;
  const slot = versions.length ? plotW / versions.length : 0;
  const bw = Math.min(22, slot * 0.5);
  const y = (v: number) => pad.t + (1 - v) * (base - pad.t);
  const focus = hover ?? versions.findIndex((v) => v.id === selected);
  const entered = useRef(false);
  useEffect(() => {
    const id = setTimeout(() => {
      entered.current = true;
    }, 450);
    return () => clearTimeout(id);
  }, []);
  const hovered = hover === null ? undefined : versions[hover];
  const hoveredRate = hover === null ? 0 : (rates[hover] ?? 0);

  return (
    <Card
      action={
        <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
          <span aria-hidden className="h-0 w-4 border-foreground/50 border-t border-dashed" /> {interpolate(t.shipBar, { rate: f.pct(threshold) })}
        </span>
      }
      className="@4xl:col-span-2"
      title={t.chartTitle}
    >
      <div className="relative min-h-[200px] w-full flex-1" ref={ref}>
        {width > 0 ? (
          <svg aria-hidden="true" className="absolute inset-0 overflow-visible" height={H} width={width}>
            {[0, 0.5, 1].map((tick) => (
              <g key={tick}>
                <line className={tick === 0 ? "stroke-border" : "stroke-border/56"} x1={pad.l} x2={width - pad.r} y1={y(tick)} y2={y(tick)} />
                <text className="fill-muted-foreground text-[10px] tabular-nums" dominantBaseline="middle" textAnchor="end" x={pad.l - 6} y={y(tick)}>
                  {f.pct(tick)}
                </text>
              </g>
            ))}
            {versions.map((v, i) => {
              const rate = rates[i] ?? 0;
              const cx = pad.l + slot * i + slot / 2;
              const h = Math.max(2, base - y(rate));
              const on = v.id === selected;
              return (
                <g key={v.id}>
                  <motion.path animate={{ d: barPath(cx - bw / 2, bw, base - h, base), opacity: hover === null || hover === i || on ? 1 : 0.6 }} className={cn("transition-colors duration-150", on ? "fill-foreground" : rate >= threshold ? "fill-foreground/24" : "fill-foreground/12")} initial={reduce ? false : { d: barPath(cx - bw / 2, bw, base, base) }} transition={{ ...spring, delay: reduce || entered.current ? 0 : i * 0.03 }} />
                  <text className={cn("text-[10px]", on ? "fill-foreground font-medium" : "fill-muted-foreground")} textAnchor="middle" x={cx} y={H - 6}>
                    {v.id}
                  </text>
                  {v.id === productionId ? <circle className="fill-success" cx={cx + 11} cy={H - 9.5} r={2.5} /> : null}
                </g>
              );
            })}
            <line className="pointer-events-none stroke-foreground/50" strokeDasharray="4 3" x1={pad.l} x2={width - pad.r} y1={y(threshold)} y2={y(threshold)} />
            {versions.map((v, i) => {
              const on = v.id === selected;
              if (!(focus === i || (on && hover === null))) return null;
              const rate = rates[i] ?? 0;
              return (
                <motion.text animate={{ y: y(rate) - 6 }} className="pointer-events-none fill-foreground stroke-card font-medium text-[10px] tabular-nums [paint-order:stroke]" initial={reduce || !entered.current ? { y: y(rate) - 6 } : false} key={v.id} strokeLinejoin="round" strokeWidth={4} textAnchor="middle" transition={{ ...spring, delay: reduce || entered.current ? 0 : i * 0.03 }} x={pad.l + slot * i + slot / 2}>
                  {f.pct(rate)}
                </motion.text>
              );
            })}
          </svg>
        ) : null}
        {/* Real buttons laid over each bar: keyboard and screen readers pick a version here. */}
        <fieldset className="absolute inset-0 m-0 flex min-w-0 border-0 p-0" style={{ paddingInlineStart: pad.l, paddingInlineEnd: pad.r }}>
          <legend className="sr-only">{t.chartLabel}</legend>
          {versions.map((v, i) => {
            const rate = rates[i] ?? 0;
            return (
              <button
                aria-label={interpolate(rate < threshold ? t.barLabelBelow : t.barLabel, { id: v.id, rate: f.pct(rate) })}
                aria-pressed={v.id === selected}
                className="h-full flex-1 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
                key={v.id}
                onBlur={() => setHover(null)}
                onClick={() => onSelect(v.id)}
                onFocus={() => setHover(i)}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                type="button"
              />
            );
          })}
        </fieldset>
        <AnimatePresence>
          {hovered && hover !== null && width > 0 ? (
            <motion.div animate={{ opacity: 1, y: 0, scale: 1 }} aria-hidden className="pointer-events-none absolute top-0 z-10 w-44 origin-bottom rounded-xl border bg-popover p-2.5 text-xs shadow-xs/5" exit={{ opacity: 0, transition: { duration: 0.1 } }} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.97 }} style={{ insetInlineStart: Math.min(Math.max(0, pad.l + slot * hover + slot / 2 - 88), width - 176) }} transition={{ duration: 0.15, ease: EASE_OUT }}>
              <div className="flex items-center justify-between">
                <span className="font-medium font-mono">{hovered.id}</span>
                <span className="text-muted-foreground">{f.day(hovered.createdAt)}</span>
              </div>
              <div className="mt-0.5 truncate text-muted-foreground">{hovered.note}</div>
              <div className="mt-1.5 flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">{t.passRate}</span>
                <span className="font-mono tabular-nums">{f.pct(hoveredRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.vsShipBar}</span>
                <span className={cn("font-mono tabular-nums", hoveredRate >= threshold ? "text-success-foreground" : "text-destructive-foreground")}>{interpolate(t.points, { sign: hoveredRate >= threshold ? "+" : "−", count: Math.abs(Math.round((hoveredRate - threshold) * 100)) })}</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      {productionId ? (
        <p className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-success" />
          <span className="text-pretty">{t.chartHint}</span>
        </p>
      ) : null}
    </Card>
  );
}

function lineTone(type: DiffOp["type"] | undefined) {
  if (type === "add") return "bg-success/10";
  if (type === "del") return "bg-destructive/10";
  return "";
}
function Sign({ type }: { type?: DiffOp["type"] }) {
  return (
    <span aria-hidden className={cn("w-4 shrink-0 select-none text-center", type === "add" && "text-success-foreground", type === "del" && "text-destructive-foreground")}>
      {type === "add" ? "+" : type === "del" ? "−" : " "}
    </span>
  );
}

function PromptDiff({ prev, next, user, review, onReview, onWithdraw, pending, t }: { prev?: PromptVersion; next: PromptVersion; user: string; review?: VersionReview; onReview?: (kind: VersionReview["kind"], comment: string) => void; onWithdraw?: () => void; pending: boolean; t: Messages }) {
  const reduce = useReducedMotion();
  const f = useFormats();
  const commentId = useId();
  const [mode, setMode] = useState<"unified" | "split">("unified");
  const [comment, setComment] = useState("");
  const ops = useMemo(() => diffLines(prev?.prompt ?? "", next.prompt), [prev, next]);
  const added = ops.filter((o) => o.type === "add").length;
  const removed = ops.filter((o) => o.type === "del").length;
  const submit = (kind: VersionReview["kind"]) => {
    onReview?.(kind, comment.trim());
    setComment("");
  };

  return (
    <Card
      action={
        <Tabs onValueChange={(v) => setMode(v as "unified" | "split")} value={mode}>
          <TabsList aria-label={t.diffLayout} className="h-7 text-muted-foreground">
            <TabsTrigger className={TAB_HIT} value="unified">
              {t.unified}
            </TabsTrigger>
            <TabsTrigger className={TAB_HIT} value="split">
              {t.split}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
      className="@4xl:col-span-3"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t.diffTitle}
          <span className="font-mono text-muted-foreground text-xs">{prev ? interpolate(t.diffRange, { from: prev.id, to: next.id }) : interpolate(t.diffInitial, { id: next.id })}</span>
          <span className={cn("font-mono text-xs", added ? "text-success-foreground" : "text-muted-foreground")}>+{added}</span>
          <span className={cn("font-mono text-xs", removed ? "text-destructive-foreground" : "text-muted-foreground")}>−{removed}</span>
        </span>
      }
    >
      <ScrollRegion aria-label={t.diffTitle} className="max-h-72 rounded-xl border bg-background font-mono text-xs leading-5" orientation="both">
        <AnimatePresence initial={false} mode="wait">
          <motion.div animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={`${mode}-${next.id}`} transition={{ duration: reduce ? 0 : 0.12, ease: EASE_OUT }}>
            {mode === "unified" ? (
              <div className="py-1">
                {ops.map((o) => (
                  <div className={cn("flex", lineTone(o.type))} key={o.key}>
                    <span className="w-8 shrink-0 select-none pe-1 text-end text-muted-foreground tabular-nums">{o.a ?? ""}</span>
                    <span className="w-8 shrink-0 select-none pe-1 text-end text-muted-foreground tabular-nums">{o.b ?? ""}</span>
                    <Sign type={o.type} />
                    <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pe-3">{o.text || " "}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-1">
                {toSplit(ops).map((row) => (
                  <div className="grid grid-cols-2 divide-x" key={row.key}>
                    {(["left", "right"] as const).map((side) => {
                      const o = row[side];
                      const n = side === "left" ? o?.a : o?.b;
                      return (
                        <div className={cn("flex min-h-5 min-w-0", o ? lineTone(o.type) : "bg-muted/60")} key={side}>
                          <span className="w-7 shrink-0 select-none pe-1 text-end text-muted-foreground tabular-nums">{n ?? ""}</span>
                          <Sign type={o?.type} />
                          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words pe-2">{o?.text ?? ""}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </ScrollRegion>

      {onReview ? (
        <AutoHeight className="mt-2">
          <AnimatePresence initial={false} mode="popLayout">
            {review ? (
              <motion.div animate={{ opacity: 1, y: 0, scale: 1 }} className={cn("flex items-start gap-3 rounded-xl border p-3", review.kind === "approved" ? "border-success/30 bg-success/8" : "border-warning/30 bg-warning/8")} exit={{ opacity: 0, transition: { duration: 0.1 } }} initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }} key="review" transition={spring}>
                <Avatar aria-hidden className="size-7">
                  <AvatarFallback className="text-[11px]">{initialsOf(review.by)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-xs">
                    <span className="font-medium">{review.by}</span>
                    <span className={review.kind === "approved" ? "text-success-foreground" : "text-warning-foreground"}>{interpolate(review.kind === "approved" ? t.approvedVersion : t.changesVersion, { id: next.id })}</span>
                    <time className="text-muted-foreground" dateTime={review.at}>
                      {f.relative(review.at)}
                    </time>
                  </div>
                  {review.comment ? <p className="mt-1 text-pretty text-sm">{review.comment}</p> : null}
                </div>
                {onWithdraw && review.by === user ? (
                  <Button className={PRESS} disabled={pending} onClick={onWithdraw} size="sm" variant="ghost">
                    {t.undo}
                  </Button>
                ) : null}
              </motion.div>
            ) : (
              <motion.div animate={{ opacity: 1 }} className="flex flex-col gap-2" exit={{ opacity: 0, transition: { duration: 0.1 } }} initial={{ opacity: 0 }} key="form" transition={{ duration: 0.15, ease: EASE_OUT }}>
                <label className="sr-only" htmlFor={commentId}>
                  {t.reviewComment}
                </label>
                <div className="rounded-xl border bg-background transition-shadow focus-within:border-ring/64 focus-within:ring-[3px] focus-within:ring-ring/16 dark:bg-input/24">
                  <textarea className="field-sizing-content block max-h-28 min-h-10 w-full resize-none bg-transparent px-3 pt-2.5 pb-1 text-base outline-none placeholder:text-muted-foreground/72 sm:text-sm" id={commentId} onChange={(e) => setComment(e.target.value)} placeholder={interpolate(t.reviewPlaceholder, { id: next.id })} rows={1} value={comment} />
                  <div className="flex flex-wrap items-center justify-end gap-2 p-2 pt-1">
                    <span className="me-auto flex min-w-0 items-center gap-1.5 ps-1 text-muted-foreground text-xs">
                      <MessageSquareIcon aria-hidden className="size-3.5 shrink-0" />
                      <span className="truncate">{interpolate(t.versionMeta, { author: next.author, note: next.note })}</span>
                    </span>
                    <Button className={PRESS} disabled={pending} onClick={() => submit("changes")} size="sm" variant="outline">
                      {t.requestChanges}
                    </Button>
                    <Button className={PRESS} disabled={pending} onClick={() => submit("approved")} size="sm">
                      <CheckIcon aria-hidden />
                      {t.approve}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </AutoHeight>
      ) : null}
    </Card>
  );
}

function CaseRow({ c, result, onRerun, t }: { c: BenchCase; result: CaseResult; onRerun?: () => void; t: Messages }) {
  const reduce = useReducedMotion();
  const f = useFormats();
  const [open, setOpen] = useState(false);
  const busy = result.status === "queued" || result.status === "running";
  const panelId = useId();
  const scoreText = result.score === null || busy ? "—" : f.score(result.score);
  return (
    <motion.li animate={{ opacity: 1, y: 0 }} className="border-b last:border-b-0" exit={{ opacity: 0, scale: 0.98 }} initial={reduce ? false : { opacity: 0, y: 6 }} layout={!reduce} transition={spring}>
      <div className={cn("grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-1 py-2.5 transition-colors", "@3xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_3.5rem_5rem_auto]", result.status === "running" && "bg-info/4")}>
        <button aria-controls={panelId} aria-expanded={open} className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg text-start outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOpen((o) => !o)} type="button">
          <motion.span animate={{ rotate: open ? 0 : -90 }} className="mt-0.5 text-muted-foreground rtl:-scale-x-100" transition={reduce ? { duration: 0 } : spring}>
            <ChevronDownIcon aria-hidden className="size-4" />
          </motion.span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="hidden shrink-0 whitespace-nowrap font-mono text-muted-foreground text-xs @md:inline">{c.id}</span>
              <span className="truncate font-medium">{c.name}</span>
            </span>
            <span className="mt-0.5 block truncate text-muted-foreground text-xs">{c.input}</span>
          </span>
        </button>
        <span className="hidden truncate text-muted-foreground text-xs @3xl:block">{c.expected}</span>
        <span className={cn("hidden text-end font-mono text-xs @3xl:block", result.status === "fail" ? "text-destructive-foreground" : "text-foreground")}>{result.score === null || busy ? <span className="text-muted-foreground">—</span> : <Rolling format={f.score} value={result.score} />}</span>
        <StatusPill status={result.status} t={t} />
        {onRerun ? (
          <Button aria-label={interpolate(t.rerunCase, { id: c.id })} className={cn("hidden @3xl:inline-flex", PRESS)} disabled={busy} onClick={onRerun} size="icon" variant="ghost">
            <RotateCwIcon className={cn(busy && "animate-spin motion-reduce:animate-none")} />
          </Button>
        ) : null}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} id={panelId} initial={{ height: 0, opacity: 0 }} transition={reduce ? { duration: 0 } : spring}>
            <div className="grid gap-2 px-1 pb-3 ps-7 text-xs @2xl:grid-cols-3">
              {[
                { k: t.input, v: c.input },
                { k: t.expected, v: c.expected },
                { k: t.output, v: busy ? "—" : (result.output ?? "—") },
              ].map((x) => (
                <div className="rounded-xl bg-muted/60 p-2.5" key={x.k}>
                  <div className="mb-1 font-medium text-muted-foreground">{x.k}</div>
                  <p className="text-pretty leading-relaxed [overflow-wrap:anywhere]">{x.v}</p>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 @2xl:col-span-3">
                <span className="font-mono text-muted-foreground tabular-nums">{interpolate(t.score, { score: scoreText })}</span>
                {result.status === "fail" && result.judgeNote ? <span className="text-destructive-foreground">{interpolate(t.judge, { note: result.judgeNote })}</span> : null}
                {result.status === "pass" ? <span className="text-success-foreground">{t.judgePass}</span> : null}
                {onRerun ? (
                  <Button className={cn("ms-auto @3xl:hidden", PRESS)} disabled={busy} onClick={onRerun} size="sm" variant="outline">
                    <RotateCwIcon aria-hidden className={cn(busy && "animate-spin motion-reduce:animate-none")} />
                    {t.rerun}
                  </Button>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

function SidebarContent({ workspace, prompts, threshold, active, onSelect, user, links, t }: { workspace: string; prompts: PromptSummary[]; threshold: number; active: string; onSelect: (name: string) => void; user: string; links: NonNullable<PromptTestBenchProps["links"]>; t: Messages }) {
  const navId = useId();
  const reduce = useReducedMotion();
  const f = useFormats();
  const groups = useMemo(() => {
    const out: { name: string; prompts: PromptSummary[] }[] = [];
    for (const p of prompts) {
      const g = out.find((x) => x.name === p.project);
      if (g) g.prompts.push(p);
      else out.push({ name: p.project, prompts: [p] });
    }
    return out;
  }, [prompts]);
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center gap-2.5 px-1.5 pt-1">
        <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FlaskConicalIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium">{workspace}</div>
          <div className="text-muted-foreground text-xs">{t.evals}</div>
        </div>
      </div>
      <nav aria-label={t.prompts} className="flex flex-col gap-3">
        {groups.map((g) => (
          <div key={g.name}>
            <div className="flex items-center gap-2 px-2.5 pb-1 text-muted-foreground text-xs">
              <FolderKanbanIcon aria-hidden className="size-3.5" />
              {g.name}
            </div>
            <div className="flex flex-col gap-0.5">
              {g.prompts.map((p) => {
                const on = p.name === active;
                return (
                  <button aria-current={on ? "page" : undefined} className={cn("relative isolate flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start font-mono text-xs outline-none transition-[color,background-color,transform] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100", on ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} key={p.name} onClick={() => onSelect(p.name)} type="button">
                    {on ? <motion.span className="absolute inset-0 -z-10 rounded-lg bg-accent" layoutId={`${navId}-nav`} transition={reduce ? { duration: 0 } : spring} /> : null}
                    <FileTextIcon aria-hidden className="size-3.5 shrink-0" />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className={cn("font-sans text-[11px] tabular-nums", p.passRate >= threshold ? "text-muted-foreground" : "text-warning-foreground")} title={p.passRate < threshold ? t.latestRateBelow : t.latestRate}>
                      {f.pct(p.passRate)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        {links.map((l) => (
          <WirefrontLink className="flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4" href={l.href} key={l.href}>
            {l.icon ? <span aria-hidden className="contents">{l.icon}</span> : null}
            <span className="flex-1 text-start">{l.label}</span>
          </WirefrontLink>
        ))}
        <div className="mt-2 flex items-center gap-2.5 border-t px-1 pt-3">
          <Avatar aria-hidden className="size-7">
            <AvatarFallback className="text-[11px]">{initialsOf(user)}</AvatarFallback>
          </Avatar>
          <span className="truncate font-medium text-xs">{user}</span>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | "pass" | "fail";

function PromptBoard({ prompt, versionId, results, reviews, threshold, passMark, user, onSelectVersion, onRun, onReview, onWithdrawReview, t }: Omit<PromptTestBenchProps, "workspace" | "prompts" | "onSelectPrompt" | "links" | "className" | "user"> & { user: string; t: Messages }) {
  const reduce = useReducedMotion();
  const f = useFormats();
  const { now } = useWirefront();
  const { versions, cases, productionId } = prompt;
  const latest = versions[versions.length - 1];
  const version = versions.find((v) => v.id === versionId) ?? latest;
  const [filter, setFilter] = useState<Filter>("all");

  // Reviews show at once and come back off if saving fails.
  const [local, setLocal] = useState<{ for?: PromptTestBenchProps["reviews"]; reviews: Record<string, VersionReview | undefined> }>({ for: reviews, reviews: {} });
  const overrides = local.for === reviews ? local.reviews : {};
  const setOverride = (id: string, r: VersionReview | undefined) => setLocal((l) => ({ for: reviews, reviews: { ...(l.for === reviews ? l.reviews : {}), [id]: r } }));
  const review = useAction(onReview ?? (async () => {}), {
    optimistic: ({ versionId: id, kind, comment }) => {
      setOverride(id, { kind, comment, by: user, at: now().toISOString() });
      return () => setOverride(id, reviews?.[id]);
    },
  });
  const withdraw = useAction(onWithdrawReview ?? (async () => {}), {
    optimistic: ({ versionId: id }) => {
      const before = id in overrides ? overrides[id] : reviews?.[id];
      setOverride(id, undefined);
      return () => setOverride(id, before);
    },
  });
  if (!version) return null;
  const vIndex = versions.indexOf(version);
  const currentReview = version.id in overrides ? overrides[version.id] : reviews?.[version.id];

  const list = cases.map((c) => ({ c, s: results[c.id] ?? ({ status: "queued", score: null } as CaseResult) }));
  const done = list.filter((x) => x.s.status === "pass" || x.s.status === "fail");
  const passed = list.filter((x) => x.s.status === "pass").length;
  const failed = list.filter((x) => x.s.status === "fail").length;
  const busy = list.length - done.length;
  const liveRate = done.length ? passed / done.length : version.passRate;
  const scored = list.filter((x) => x.s.score !== null);
  const avgScore = scored.length ? scored.reduce((a, x) => a + (x.s.score ?? 0), 0) / scored.length : 0;
  const rates = versions.map((v, i) => (i === vIndex && done.length ? liveRate : v.passRate));
  const prod = versions.find((v) => v.id === productionId);
  const visible = list.filter((x) => filter === "all" || x.s.status === filter || x.s.status === "queued" || x.s.status === "running");
  const error = review.error ?? withdraw.error;

  return (
    <div className="@container mx-auto flex max-w-6xl flex-col gap-4 p-4 @3xl:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs">{prompt.project}</div>
          <h1 className="mt-0.5 flex flex-wrap items-center gap-2 text-balance font-semibold text-lg tracking-tight">
            <span className="font-mono">{prompt.name}</span>
            {productionId ? (
              <Badge className="rounded-full" variant="outline">
                <span aria-hidden className="size-1.5 rounded-full bg-success" />
                {interpolate(t.production, { id: productionId })}
              </Badge>
            ) : null}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Select items={versions.map((v) => ({ value: v.id, label: interpolate(t.versionOption, { id: v.id, date: f.day(v.createdAt) }) }))} onValueChange={(v) => v && onSelectVersion(v as string)} value={version.id}>
            <SelectTrigger aria-label={t.version} className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start">
              {[...versions].reverse().map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {interpolate(t.versionOption, { id: v.id, date: f.day(v.createdAt) })}
                  {v.id === productionId ? t.prodSuffix : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onRun ? (
            <Button aria-disabled={busy > 0} className={cn(PRESS, "aria-disabled:cursor-default aria-disabled:active:scale-100")} onClick={() => busy === 0 && onRun(cases.map((c) => c.id))} variant={busy > 0 ? "outline" : "default"}>
              <span className="grid justify-items-center tabular-nums">
                <span aria-hidden className="invisible col-start-1 row-start-1 inline-flex items-center gap-2">
                  <Spinner className="size-4" />
                  {interpolate(t.runningCount, { done: list.length, total: list.length })}
                </span>
                <span aria-live="polite" className="col-start-1 row-start-1 inline-flex items-center gap-2">
                  {busy > 0 ? <Spinner className="size-4" /> : <RotateCwIcon aria-hidden />}
                  {busy > 0 ? interpolate(t.runningCount, { done: done.length, total: list.length }) : t.rerunAll}
                </span>
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="relative grid grid-cols-2 overflow-hidden rounded-2xl border bg-card shadow-xs/5 *:border-border max-@3xl:*:nth-3:border-s-0 max-@3xl:*:nth-[n+3]:border-t @3xl:grid-cols-4 *:not-first:border-s">
        <StatTile hint={busy > 0 ? <span className="tabular-nums">{interpolate(t.scoring, { passed, done: done.length })}</span> : <span className={cn("tabular-nums", liveRate >= threshold ? "text-success-foreground" : "text-destructive-foreground")}>{interpolate(liveRate >= threshold ? t.clears : t.below, { passed, total: list.length })}</span>} icon={<TargetIcon aria-hidden />} label={t.passRate}>
          <Rolling format={f.pct} value={liveRate} />
        </StatTile>
        <StatTile hint={prod && prod.id !== version.id ? interpolate(t.prodRate, { id: prod.id, rate: f.pct(prod.passRate) }) : t.serving} icon={<GaugeIcon aria-hidden />} label={t.avgScore}>
          <Rolling format={f.score} value={avgScore} />
        </StatTile>
        <StatTile hint={t.latencyHint} icon={<TimerIcon aria-hidden />} label={t.latency}>
          <Rolling format={f.sec} value={version.latencyMs} />
        </StatTile>
        <StatTile hint={t.costHint} icon={<CoinsIcon aria-hidden />} label={t.cost}>
          <Rolling format={f.cost} value={version.costPer1k} />
        </StatTile>
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 border-0!">
          <motion.div animate={{ scaleX: list.length ? done.length / list.length : 0, opacity: busy > 0 ? 1 : 0 }} className="h-full w-full origin-left bg-info rtl:origin-right" initial={false} transition={reduce ? { duration: 0 } : spring} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-5">
        <PassRateChart onSelect={onSelectVersion} productionId={productionId} rates={rates} selected={version.id} t={t} threshold={threshold} versions={versions} />
        <PromptDiff
          next={version}
          onReview={onReview ? (kind, comment) => review.run({ versionId: version.id, kind, comment }) : undefined}
          onWithdraw={onWithdrawReview ? () => withdraw.run({ versionId: version.id }) : undefined}
          pending={review.isPending() || withdraw.isPending()}
          prev={versions[vIndex - 1]}
          review={currentReview}
          t={t}
          user={user}
        />
      </div>

      <Card
        action={
          <Tabs onValueChange={(v) => setFilter(v as Filter)} value={filter}>
            <TabsList aria-label={t.filter} className="h-7 text-muted-foreground">
              {(
                [
                  { value: "all", label: t.all, count: list.length },
                  { value: "pass", label: t.passed, count: passed },
                  { value: "fail", label: t.failed, count: failed },
                ] as const
              ).map((o) => (
                <TabsTrigger className={cn("gap-1.5 text-xs sm:text-xs", TAB_HIT)} key={o.value} value={o.value}>
                  {o.label}
                  <span className="min-w-[2ch] text-start text-muted-foreground tabular-nums">{o.count}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
        title={
          <span className="flex items-center gap-2">
            {t.testCases}
            <span className="font-mono text-muted-foreground text-xs">{version.id}</span>
          </span>
        }
      >
        <div aria-hidden className={cn("hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_3.5rem_5rem_auto] gap-x-3 border-b px-1 pb-2 text-muted-foreground text-xs", visible.length > 0 && "@3xl:grid")}>
          <span className="ps-6">{t.colCase}</span>
          <span>{t.colExpected}</span>
          <span className="text-end">{t.colScore}</span>
          <span>{t.colStatus}</span>
          <span className="w-8" />
        </div>
        <ul className="flex flex-col">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map(({ c, s }) => (
              <CaseRow c={c} key={c.id} onRerun={onRun ? () => onRun([c.id]) : undefined} result={s} t={t} />
            ))}
          </AnimatePresence>
          {visible.length === 0 ? (
            <motion.li animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-1.5 px-4 py-10 text-center" initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }} key="empty" transition={{ duration: 0.2, ease: EASE_OUT }}>
              <span aria-hidden className={cn("mb-1 flex size-9 items-center justify-center rounded-full", filter === "fail" ? "bg-success/10 text-success-foreground" : "bg-muted text-muted-foreground")}>
                {filter === "fail" ? <CircleCheckIcon className="size-4.5" /> : <CircleXIcon className="size-4.5" />}
              </span>
              <span className="text-balance font-medium">{interpolate(filter === "fail" ? t.noFailing : t.noPassing, { id: version.id })}</span>
              <span className="max-w-xs text-pretty text-muted-foreground text-xs">{filter === "fail" ? interpolate(t.allPassed, { count: list.length, mark: f.score(passMark) }) : interpolate(t.nonePassed, { mark: f.score(passMark) })}</span>
              <Button className={cn("mt-2", PRESS)} onClick={() => setFilter("all")} size="sm" variant="outline">
                {t.showAll}
              </Button>
            </motion.li>
          ) : null}
        </ul>
      </Card>
    </div>
  );
}

function PromptTestBenchScreen({ workspace, user, prompts, prompt, links = [], onSelectPrompt, className, ...board }: PromptTestBenchProps) {
  const t = useMessages("promptTestBench", PROMPT_TEST_BENCH_MESSAGES);
  const reduce = useReducedMotion();
  const [drawer, setDrawer] = useState(false);
  const [firstPrompt] = useState(prompt.name);

  const sidebar = (
    <SidebarContent
      active={prompt.name}
      links={links}
      onSelect={(name) => {
        if (name !== prompt.name) onSelectPrompt(name);
        setDrawer(false);
      }}
      prompts={prompts}
      t={t}
      threshold={board.threshold}
      user={user.name}
      workspace={workspace}
    />
  );

  return (
    <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)}>
      <aside className="hidden w-60 shrink-0 border-e bg-muted/40 @3xl:block">{sidebar}</aside>

      <Sheet onOpenChange={setDrawer} open={drawer}>
        <SheetContent className="w-64 max-w-[85%] gap-0 p-0" showCloseButton={false} side="left">
          <SheetTitle className="sr-only">{t.prompts}</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 @3xl:hidden">
          <Button aria-expanded={drawer} aria-label={t.openPrompts} className={PRESS} onClick={() => setDrawer(true)} size="icon" variant="ghost">
            <MenuIcon />
          </Button>
          <span aria-hidden className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <FlaskConicalIcon className="size-3.5" />
          </span>
          <span className="flex-1 truncate font-medium">{workspace}</span>
        </div>

        <ScrollRegion aria-label={prompt.name} className="min-h-0 flex-1" key={prompt.name}>
          <motion.div animate={{ opacity: 1, y: 0 }} initial={prompt.name === firstPrompt ? false : reduce ? { opacity: 0 } : { opacity: 0, y: 4 }} transition={{ duration: 0.18, ease: EASE_OUT }}>
            <PromptBoard {...board} prompt={prompt} t={t} user={user.name} />
          </motion.div>
        </ScrollRegion>
      </div>
    </div>
  );
}

export function PromptTestBench(props: PromptTestBenchProps) {
  return (
    <ScreenBoundary name="PromptTestBench">
      <PromptTestBenchScreen {...props} />
    </ScreenBoundary>
  );
}
