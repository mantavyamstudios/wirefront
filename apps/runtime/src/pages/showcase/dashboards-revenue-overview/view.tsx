// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `revenue-overview`).
"use client";

import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  DownloadIcon,
  HandshakeIcon,
  type LucideIcon,
  MegaphoneIcon,
  SettingsIcon,
  TagIcon,
  TruckIcon,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  createContext,
  Fragment,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@wirefront/ui/segmented-control";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import type {
  MomentKind,
  RangeKey,
  RevenueChannel,
  RevenueDay,
  RevenueMoment,
  RevenueStoryData,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("revenueStory.<key>"). */
export const REVENUE_STORY_MESSAGES = {
  app: "App",
  main: "Main",
  settings: "Settings",
  breadcrumb: "Breadcrumb",
  title: "Revenue",
  updated: "Updated {when}",
  export: "Export",
  copySummary: "Copy summary",
  downloadCsv: "Download CSV",
  csvDownloaded: "CSV downloaded",
  summaryCopied: "Summary copied",
  couldntCopy: "Couldn’t copy",
  summaryText: "{store} revenue, {period}: {total}.",
  summaryTextChange:
    "{store} revenue, {period}: {total}, {direction} {amount} on the previous period.",
  up: "up",
  down: "down",
  csvDay: "date,revenue,previous",
  csvWeek: "week_starting,revenue,previous",
  dateRange: "Date range",
  range7d: "Last 7 days",
  range30d: "Last 30 days",
  range90d: "Last 90 days",
  range12m: "Last 12 months",
  rangeOption: "{short}, {long}",
  periodVs: "vs {start} – {end}",
  thisPeriod: "{total} this period",
  thisPeriodChange:
    "{total} this period, {change} on the last one — {attribution} {channel}.",
  changeUp: "up {amount}",
  changeDown: "down {amount}",
  mostlyFrom: "mostly from",
  mostOfItFrom: "most of it from",
  ledBy: "led by",
  bestWorst:
    "Best {unit} was {best} at {bestValue}{bestDuring}. Slowest was {worst} at {worstValue}{worstDuring}.",
  day: "day",
  week: "week",
  during: ", during {phrase}",
  weekOf: "week of {date}",
  weekOfLong: "Week of {date}",
  theWeekOf: "the week of {date}",
  dayLong: "{weekday}, {date}",
  dateWithYear: "{date}, {year}",
  span: "{from} – {to}",
  chart: "Revenue chart",
  latest: "Latest · {label}",
  versus: "vs {label} · {value}",
  legendThis: "This period",
  legendPrevious: "Previous period",
  scrub: "Scrub revenue",
  scrubValue: "{label}: {value}",
  scrubValueChange: "{label}: {value}, {direction} {percent} on {previous}",
  chipNote: "chart note: {title}, {dates}",
  impactChannel:
    "{channel} has averaged {after} a day since, against {before} before.",
  impactDay: "{current} that day, against {previous} the day before.",
  impactDays:
    "{current} over {count} days, against {previous} the {count} days before.",
  promo: "Promotion",
  pricing: "Pricing",
  partner: "Partner",
  incident: "Incident",
  breakdown: "Where it came from",
  vsLastPeriod: "vs last period",
  shareLabel: "Share of revenue: {summary}",
  ofRevenue: "{percent} of revenue",
  new: "new",
  moments: "Moments",
  momentsCount: "{count} in this period",
  noMoments: "None logged",
  noMomentsHint:
    "Nothing happened worth pinning in this range. Add a moment to see it on the line.",
  errorTitle: "Couldn’t load revenue",
  retry: "Try again",
};
type Messages = typeof REVENUE_STORY_MESSAGES;

export interface RevenueStoryNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Marks the page you're on. */
  current?: boolean;
}

export interface RevenueStoryProps {
  /** Daily revenue, channels and moments. Leave it out while it loads. */
  data?: RevenueStoryData;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Your store, shown in the rail and the breadcrumb. */
  store: { name: string };
  /** The signed-in user, shown at the foot of the rail. */
  user?: { name: string };
  /** The app's sections, shown as an icon rail from @3xl up. */
  nav?: RevenueStoryNavItem[];
  /** Where the rail's settings button goes. Hidden when not given. */
  settingsHref?: string;
  /** When the data was last refreshed (ISO date-time). */
  updatedAt?: string;
  defaultRange?: RangeKey;
  onRangeChange?: (range: RangeKey) => void;
  className?: string;
}

const DAY = 86_400_000;

const pad2 = (n: number) => String(n).padStart(2, "0");
function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}
function isoOf(t: number) {
  const d = new Date(t);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
const yearOf = (t: number) => new Date(t).getUTCFullYear();

/** How many buckets each range shows, and how many days each bucket covers. */
const RANGE_SPEC: Record<RangeKey, { buckets: number; step: number }> = {
  "7d": { buckets: 7, step: 1 },
  "30d": { buckets: 30, step: 1 },
  "90d": { buckets: 90, step: 1 },
  "12m": { buckets: 52, step: 7 },
};
const RANGE_ORDER: RangeKey[] = ["7d", "30d", "90d", "12m"];

const KINDS: Record<
  MomentKind,
  { icon: LucideIcon; dot: string; band: string; stem: string; soft: string }
> = {
  promo: {
    icon: MegaphoneIcon,
    dot: "fill-category-5",
    band: "fill-category-5/8",
    stem: "stroke-category-5/50",
    soft: "bg-category-5/12 text-category-5-foreground",
  },
  pricing: {
    icon: TagIcon,
    dot: "fill-category-1",
    band: "fill-category-1/8",
    stem: "stroke-category-1/50",
    soft: "bg-category-1/12 text-category-1-foreground",
  },
  partner: {
    icon: HandshakeIcon,
    dot: "fill-category-6",
    band: "fill-category-6/8",
    stem: "stroke-category-6/50",
    soft: "bg-category-6/12 text-category-6-foreground",
  },
  incident: {
    icon: TruckIcon,
    dot: "fill-category-3",
    band: "fill-category-3/10",
    stem: "stroke-category-3/60",
    soft: "bg-category-3/14 text-category-3-foreground",
  },
};

const SHADES = [
  "bg-foreground",
  "bg-foreground/55",
  "bg-foreground/32",
  "bg-foreground/16",
];

/** Formatters built from the provider's locale and currency, plus the screen's messages. */
interface Fmt {
  t: Messages;
  money: (n: number) => string;
  compact: (n: number) => string;
  signed: (n: number) => string;
  percent: (n: number) => string;
  axis: (n: number) => string;
  /** "Dec 12", or "Dec 12, 2024" when `year` is given and differs. Days are UTC calendar dates. */
  day: (t: number, year?: number) => string;
  weekday: (t: number) => string;
  month: (t: number) => string;
}

function useFmt(): Fmt {
  const t = useMessages("revenueStory", REVENUE_STORY_MESSAGES);
  const format = useFormat();
  return useMemo(() => {
    const compact = (n: number) =>
      format.money(Math.abs(n), undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      });
    return {
      t,
      money: (n: number) =>
        format.money(Math.round(n), undefined, { maximumFractionDigits: 0 }),
      compact,
      signed: (n: number) => `${n < 0 ? "−" : "+"}${compact(n)}`,
      percent: (n: number) =>
        format.number(n, {
          style: "percent",
          maximumFractionDigits: 0,
          signDisplay: "exceptZero",
        }),
      axis: (n: number) =>
        format.money(n, undefined, {
          notation: "compact",
          maximumFractionDigits: 1,
        }),
      day: (time: number, year?: number) => {
        const base = format.date(time, {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        const y = new Date(time).getUTCFullYear();
        return year !== undefined && y !== year
          ? interpolate(t.dateWithYear, { date: base, year: y })
          : base;
      },
      weekday: (time: number) =>
        format.date(time, { weekday: "short", timeZone: "UTC" }),
      month: (time: number) =>
        format.date(time, { month: "short", timeZone: "UTC" }),
    };
  }, [t, format]);
}

const FmtContext = createContext<Fmt | null>(null);
function useFmtContext(): Fmt {
  const fmt = useContext(FmtContext);
  if (!fmt) throw new Error("RevenueStory parts render inside RevenueStory");
  return fmt;
}

/** Fill a message's {placeholders} with React nodes. */
function rich(template: string, values: Record<string, ReactNode>): ReactNode {
  let offset = 0;
  return template
    .split(/(\{\w+\})/)
    .filter((part) => part !== "")
    .map((part) => {
      const at = offset;
      offset += part.length;
      const key = part.match(/^\{(\w+)\}$/)?.[1];
      // Keyed by where the part starts in the template.
      return (
        <Fragment key={`at-${at}`}>
          {key !== undefined && key in values ? values[key] : part}
        </Fragment>
      );
    });
}

const tone = (n: number) =>
  n < 0 ? "text-destructive-foreground" : "text-success-foreground";
const totalOf = (day: RevenueDay) =>
  Object.values(day.byChannel).reduce((a, b) => a + b, 0);

const ease = [0.23, 1, 0.32, 1] as const;
const pressable =
  "transition-[color,background-color,scale] duration-150 ease-out active:scale-[0.97]";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function useReducedMotionAfterMount() {
  const prefers = useReducedMotion();
  return useMounted() && Boolean(prefers);
}

function useElementSize<T extends HTMLElement>(): [
  RefObject<T | null>,
  { width: number; height: number },
] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ width: el.clientWidth, height: el.clientHeight });
    const ro = new ResizeObserver(([entry]) =>
      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size];
}

function useTextWidth(ref: RefObject<HTMLElement | null>, ready: boolean) {
  const [measure, setMeasure] = useState<
    ((text: string, weight: number) => number) | null
  >(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const ctx = document.createElement("canvas").getContext("2d");
    const family = getComputedStyle(ref.current).fontFamily;
    if (!ctx) return;
    setMeasure(() => (text: string, weight: number) => {
      ctx.font = `${weight} 12px ${family}`;
      return ctx.measureText(text).width;
    });
  }, [ready, ref]);
  return measure;
}

interface Bucket {
  t: number;
  value: number;
  prev: number | null;
  prevT: number;
}

interface Impact {
  change: number;
  text: string;
}

interface PlacedMoment extends RevenueMoment {
  i0: number;
  i1: number;
  impact: Impact | null;
}

interface ChannelRow {
  key: string;
  label: string;
  total: number;
  prev: number;
}

interface Model {
  range: RangeKey;
  step: number;
  buckets: Bucket[];
  start: number;
  end: number;
  prevStart: number | null;
  prevEnd: number | null;
  total: number;
  prevTotal: number | null;
  channels: ChannelRow[];
  moments: PlacedMoment[];
}

function impactOf(
  m: RevenueMoment,
  days: RevenueDay[],
  index: Map<string, number>,
  channels: RevenueChannel[],
  fmt: Fmt
): Impact | null {
  const a = index.get(m.date);
  if (a === undefined) return null;
  if (m.channel) {
    const w = Math.min(14, days.length - a, a);
    if (w < 1) return null;
    let after = 0;
    let before = 0;
    for (let k = 0; k < w; k++) {
      after += days[a + k].byChannel[m.channel] ?? 0;
      before += days[a - w + k].byChannel[m.channel] ?? 0;
    }
    if (!before) return null;
    const label = channels.find((c) => c.key === m.channel)?.label ?? m.channel;
    return {
      change: after / before - 1,
      text: interpolate(fmt.t.impactChannel, {
        channel: label,
        after: fmt.compact(after / w),
        before: fmt.compact(before / w),
      }),
    };
  }
  const b = Math.min(index.get(m.endDate ?? m.date) ?? a, days.length - 1);
  const len = b - a + 1;
  if (a - len < 0) return null;
  let cur = 0;
  let prev = 0;
  for (let k = 0; k < len; k++) {
    cur += totalOf(days[a + k]);
    prev += totalOf(days[a - len + k]);
  }
  if (!prev) return null;
  const values = {
    current: fmt.compact(cur),
    previous: fmt.compact(prev),
    count: len,
  };
  return {
    change: cur / prev - 1,
    text: interpolate(len === 1 ? fmt.t.impactDay : fmt.t.impactDays, values),
  };
}

function buildModel(
  days: RevenueDay[],
  channels: RevenueChannel[],
  moments: RevenueMoment[],
  index: Map<string, number>,
  impacts: Map<string, Impact | null>,
  range: RangeKey
): Model {
  const spec = RANGE_SPEC[range];
  const step = spec.step;
  const n = Math.max(1, Math.min(spec.buckets, Math.floor(days.length / step)));
  const span = n * step;
  const endIdx = days.length;
  const startIdx = Math.max(0, endIdx - span);
  const prevIdx = startIdx - span;
  const sumDays = (from: number, to: number) => {
    let s = 0;
    for (let k = from; k < to; k++) s += totalOf(days[k]);
    return s;
  };
  const buckets: Bucket[] = Array.from({ length: n }, (_, b) => {
    const s = startIdx + b * step;
    const t = parseDay(days[s].date);
    return {
      t,
      value: sumDays(s, s + step),
      prev: prevIdx >= 0 ? sumDays(s - span, s - span + step) : null,
      prevT: t - span * DAY,
    };
  });
  const rows = channels.map((c) => {
    let total = 0;
    let prev = 0;
    for (let k = startIdx; k < endIdx; k++)
      total += days[k].byChannel[c.key] ?? 0;
    if (prevIdx >= 0)
      for (let k = prevIdx; k < startIdx; k++)
        prev += days[k].byChannel[c.key] ?? 0;
    return { key: c.key, label: c.label, total, prev };
  });
  const placed: PlacedMoment[] = [];
  for (const m of moments) {
    const a = index.get(m.date);
    if (a === undefined) continue;
    const b = index.get(m.endDate ?? m.date) ?? a;
    if (b < startIdx || a >= endIdx) continue;
    placed.push({
      ...m,
      i0: Math.floor((Math.max(a, startIdx) - startIdx) / step),
      i1: Math.floor((Math.min(b, endIdx - 1) - startIdx) / step),
      impact: impacts.get(m.id) ?? null,
    });
  }
  placed.sort((x, y) => x.i0 - y.i0);
  const total = buckets.reduce((s, b) => s + b.value, 0);
  return {
    range,
    step,
    buckets,
    start: parseDay(days[startIdx].date),
    end: parseDay(days[endIdx - 1].date),
    prevStart: prevIdx >= 0 ? parseDay(days[prevIdx].date) : null,
    prevEnd: prevIdx >= 0 ? parseDay(days[startIdx - 1].date) : null,
    total,
    prevTotal:
      prevIdx >= 0 ? buckets.reduce((s, b) => s + (b.prev ?? 0), 0) : null,
    channels: rows,
    moments: placed,
  };
}

function bucketLabel(fmt: Fmt, model: Model, t: number, long = false) {
  const date = fmt.day(t, yearOf(model.end));
  if (model.step === 7)
    return interpolate(long ? fmt.t.weekOfLong : fmt.t.weekOf, { date });
  return long
    ? interpolate(fmt.t.dayLong, { weekday: fmt.weekday(t), date })
    : date;
}

function momentDates(fmt: Fmt, m: RevenueMoment) {
  const a = parseDay(m.date);
  if (!m.endDate || m.endDate === m.date) return fmt.day(a);
  return interpolate(fmt.t.span, {
    from: fmt.day(a),
    to: fmt.day(parseDay(m.endDate)),
  });
}

function momentAt(model: Model, i: number) {
  return model.moments
    .filter((m) => m.phrase && i >= m.i0 && i <= m.i1)
    .sort((a, b) => (b.weight ?? 1) - (a.weight ?? 1))[0];
}

function tangents(ys: number[]) {
  const n = ys.length;
  const m = new Array<number>(n).fill(0);
  if (n < 2) return m;
  const d = ys.slice(1).map((y, i) => y - ys[i]);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++)
    m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  return m;
}

const SAMPLES = 271;

function resample(values: number[]): { at: number; v: number }[] {
  const n = values.length;
  if (n < 2)
    return Array.from({ length: SAMPLES }, () => ({
      at: 0,
      v: values[0] ?? 0,
    }));
  const m = tangents(values);
  const total = SAMPLES - 1;
  const out: { at: number; v: number }[] = [];
  for (let j = 0; j < n - 1; j++) {
    const sub =
      Math.floor(((j + 1) * total) / (n - 1)) -
      Math.floor((j * total) / (n - 1));
    for (let k = 0; k < sub; k++) {
      const u = k / sub;
      const u2 = u * u;
      const u3 = u2 * u;
      out.push({
        at: j + u,
        v:
          (2 * u3 - 3 * u2 + 1) * values[j] +
          (u3 - 2 * u2 + u) * m[j] +
          (-2 * u3 + 3 * u2) * values[j + 1] +
          (u3 - u2) * m[j + 1],
      });
    }
  }
  out.push({ at: n - 1, v: values[n - 1] });
  return out;
}

function niceTicks(max: number) {
  const raw = Math.max(max, 1) / 4;
  const exp = 10 ** Math.floor(Math.log10(raw));
  const f = raw / exp;
  const step =
    (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * exp;
  const count = Math.ceil(max / step);
  return Array.from({ length: count + 1 }, (_, k) => k * step);
}

function axisTicks(model: Model, plotW: number) {
  const n = model.buckets.length;
  const room = Math.max(3, Math.floor(plotW / 72));
  if (model.step === 7) {
    const starts = model.buckets
      .map((b, i) => ({ i, m: new Date(b.t).getUTCMonth() }))
      .filter((b, k, all) => k > 0 && b.m !== all[k - 1].m)
      .map((b) => b.i);
    const every = Math.max(1, Math.ceil(starts.length / room));
    return starts.filter((_, k) => (starts.length - 1 - k) % every === 0);
  }
  const every = Math.max(1, Math.ceil((n - 1) / (room - 1)));
  const out: number[] = [];
  for (let i = n - 1; i >= 0; i -= every) out.unshift(i);
  return out;
}

function placeChips(
  items: { id: string; x: number; weight: number; full: number }[],
  left: number,
  right: number,
  rows: number,
  labels: boolean
) {
  const taken: [number, number][][] = Array.from({ length: rows }, () => []);
  const out = new Map<
    string,
    { left: number; row: number; compact: boolean }
  >();
  const order = [...items].sort((a, b) => b.weight - a.weight || a.x - b.x);
  for (const item of order) {
    const widths = labels ? [item.full, 24] : [24];
    let done = false;
    for (const w of widths) {
      for (let row = 0; row < rows && !done; row++) {
        const l = Math.min(Math.max(item.x - w / 2, left), right - w);
        if (taken[row].every(([a, b]) => l + w + 6 <= a || l >= b + 6)) {
          taken[row].push([l, l + w]);
          out.set(item.id, { left: l, row, compact: w === 24 });
          done = true;
        }
      }
      if (done) break;
    }
  }
  return out;
}

function Rolling({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotionAfterMount();
  const spring = useSpring(value, { stiffness: 240, damping: 34 });
  const text = useTransform(spring, (v) => format(v));
  useEffect(() => {
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [value, reduce, spring]);
  return (
    <motion.span className={cn("tabular-nums", className)}>{text}</motion.span>
  );
}

function RangeSwitch({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  const { t } = useFmtContext();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(0, RANGE_ORDER.indexOf(value));
  const onKeyDown = (e: KeyboardEvent<HTMLFieldSetElement>) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: RANGE_ORDER.length - 1,
    };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next =
      ((moves[e.key] ?? index) + RANGE_ORDER.length) % RANGE_ORDER.length;
    onChange(RANGE_ORDER[next] ?? value);
    refs.current[next]?.focus();
  };
  return (
    <SegmentedControl
      aria-label={t.dateRange}
      onKeyDown={onKeyDown}
      role="radiogroup"
      size="sm"
    >
      {RANGE_ORDER.map((r, i) => {
        const checked = r === value;
        return (
          <SegmentedControlItem
            aria-checked={checked}
            aria-label={interpolate(t.rangeOption, {
              short: r,
              long: t[`range${r}`],
            })}
            className="min-w-11 px-2.5 text-muted-foreground text-xs tabular-nums focus-visible:ring-2 focus-visible:ring-ring"
            data-checked={checked ? "" : undefined}
            key={r}
            onClick={() => onChange(r)}
            ref={(el: HTMLButtonElement | null) => {
              refs.current[i] = el;
            }}
            role="radio"
            tabIndex={checked ? 0 : -1}
          >
            {r}
          </SegmentedControlItem>
        );
      })}
    </SegmentedControl>
  );
}

function Highlight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-semibold text-foreground", className)}>
      {children}
    </span>
  );
}

function Summary({ model }: { model: Model }) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const change =
    model.prevTotal === null ? null : model.total - model.prevTotal;
  const gains = model.channels.map((c) => ({
    label: c.label,
    delta: c.total - c.prev,
  }));
  const lead =
    change === null
      ? null
      : [...gains].sort((a, b) =>
          change >= 0 ? b.delta - a.delta : a.delta - b.delta
        )[0];
  const most = lead && change ? lead.delta / change >= 0.5 : false;
  const values = model.buckets.map((b) => b.value);
  const best = values.indexOf(Math.max(...values));
  const worst = values.indexOf(Math.min(...values));
  const bestMoment = momentAt(model, best);
  const worstMoment = momentAt(model, worst);
  const when = (i: number) => {
    const at = model.buckets[i]?.t ?? model.end;
    return model.step === 7
      ? interpolate(t.theWeekOf, { date: fmt.day(at, yearOf(model.end)) })
      : bucketLabel(fmt, model, at);
  };
  const strong = (node: ReactNode) => (
    <span className="font-medium text-foreground">{node}</span>
  );
  const figure = (n: number) => (
    <span className="font-medium text-foreground tabular-nums">
      {fmt.compact(n)}
    </span>
  );
  const total = (
    <Highlight>
      <Rolling format={fmt.money} value={model.total} />
    </Highlight>
  );

  return (
    <div className="min-w-0 @3xl:min-h-24">
      <p className="max-w-184 text-balance font-heading text-[22px] text-muted-foreground leading-[1.3] tracking-[-0.015em] @3xl:text-[27px] @3xl:leading-tight">
        {change !== null && lead
          ? rich(t.thisPeriodChange, {
              total,
              change: (
                <Highlight className={tone(change)}>
                  {rich(change < 0 ? t.changeDown : t.changeUp, {
                    amount: (
                      <Rolling format={fmt.compact} value={Math.abs(change)} />
                    ),
                  })}
                </Highlight>
              ),
              attribution: most
                ? change < 0
                  ? t.mostlyFrom
                  : t.mostOfItFrom
                : t.ledBy,
              channel: <Highlight>{lead.label}</Highlight>,
            })
          : rich(`${t.thisPeriod}.`, { total })}
      </p>
      <p className="mt-2 text-pretty text-muted-foreground text-sm">
        {rich(t.bestWorst, {
          unit: model.step === 7 ? t.week : t.day,
          best: strong(when(best)),
          bestValue: figure(values[best] ?? 0),
          bestDuring: bestMoment?.phrase
            ? interpolate(t.during, { phrase: bestMoment.phrase })
            : "",
          worst: strong(when(worst)),
          worstValue: figure(values[worst] ?? 0),
          worstDuring: worstMoment?.phrase
            ? interpolate(t.during, { phrase: worstMoment.phrase })
            : "",
        })}
      </p>
    </div>
  );
}

interface MomentHandlers {
  openId: string | null;
  pinnedId: string | null;
  onHover: (id: string | null) => void;
  onFocus: (id: string | null) => void;
  onToggle: (id: string) => void;
}

function KindIcon({
  kind,
  className,
}: {
  kind: MomentKind;
  className?: string;
}) {
  const k = KINDS[kind];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        k.soft,
        className
      )}
    >
      <k.icon className="size-[0.7rem]" strokeWidth={2.25} />
    </span>
  );
}

function StoryChart({
  model,
  handlers,
  cardId,
}: {
  model: Model;
  handlers: MomentHandlers;
  cardId: string;
}) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const mounted = useMounted();
  const reduce = useReducedMotionAfterMount();
  const clipId = `reveal-${useId().replace(/:/g, "")}`;
  const fadeId = `fade-${useId().replace(/:/g, "")}`;
  const [surfaceRef, size] = useElementSize<HTMLDivElement>();
  const ready = mounted && size.width > 0 && size.height > 0;
  const measure = useTextWidth(surfaceRef, ready);
  const [scrub, setScrub] = useState<{ range: RangeKey; i: number } | null>(
    null
  );
  const [focused, setFocused] = useState(false);

  const { buckets } = model;
  const n = buckets.length;
  const width = size.width;
  const height = size.height;
  const wide = width >= 560;
  const rows = wide ? 2 : 1;
  const pad = { l: 44, r: 12, t: wide ? 74 : 44, b: 28 };
  const plotW = Math.max(1, width - pad.l - pad.r);
  const base = Math.max(pad.t + 1, height - pad.b);
  const plotH = base - pad.t;
  const values = useMemo(() => buckets.map((b) => b.value), [buckets]);
  const prevValues = useMemo(
    () =>
      buckets.every((b) => b.prev !== null)
        ? buckets.map((b) => b.prev ?? 0)
        : null,
    [buckets]
  );
  const ticks = niceTicks(Math.max(...values, ...(prevValues ?? [0])) * 1.04);
  const top = ticks[ticks.length - 1] || 1;
  const x = (i: number) =>
    pad.l + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => base - (v / top) * plotH;
  const morph = reduce
    ? { duration: 0 }
    : ({ type: "spring", visualDuration: 0.38, bounce: 0 } as const);

  const samples = useMemo(() => resample(values), [values]);
  const prevSamples = useMemo(
    () => (prevValues ? resample(prevValues) : null),
    [prevValues]
  );
  const toPath = (pts: { at: number; v: number }[]) =>
    pts
      .map(
        (p, k) => `${k ? "L" : "M"}${x(p.at).toFixed(1)},${y(p.v).toFixed(1)}`
      )
      .join("");
  const line = toPath(samples);
  const area = `${line}L${x(n - 1).toFixed(1)},${base}L${x(0).toFixed(1)},${base}Z`;
  const prevLine = prevSamples ? toPath(prevSamples) : null;

  const open = model.moments.find((m) => m.id === handlers.openId) ?? null;
  const scrubIndex =
    scrub && scrub.range === model.range ? Math.min(scrub.i, n - 1) : null;
  const active = scrubIndex ?? open?.i0 ?? n - 1;
  const showCrosshair = scrubIndex !== null || open !== null;
  const bucket = buckets[active] ?? (buckets[n - 1] as Bucket);
  const delta = bucket.prev ? bucket.value / bucket.prev - 1 : null;
  const here = model.moments.filter((m) => active >= m.i0 && active <= m.i1);
  const label = bucketLabel(fmt, model, bucket.t, true);
  const prevLabel =
    model.step === 7
      ? bucketLabel(fmt, model, bucket.prevT)
      : fmt.day(bucket.prevT, yearOf(model.end));
  const widest = fmt.money(Math.max(...values)).length;

  const chipText = (m: PlacedMoment) => ({
    label: m.short ?? m.title,
    delta: m.impact ? fmt.percent(m.impact.change) : "",
  });
  // Chips are laid out once per render; it's a handful of moments.
  const placement = ready
    ? placeChips(
        model.moments.map((m) => {
          const text = chipText(m);
          const textW = measure
            ? measure(text.label, 500) + measure(text.delta, 400)
            : (text.label.length + text.delta.length) * 6.6;
          return {
            id: m.id,
            x: x(m.i0),
            weight: m.weight ?? 1,
            full: Math.ceil(textW + 46),
          };
        }),
        pad.l - 10,
        width - 2,
        rows,
        wide
      )
    : new Map<string, { left: number; row: number; compact: boolean }>();

  const xTicks = ready ? axisTicks(model, plotW) : [];
  const valueText =
    delta !== null
      ? interpolate(t.scrubValueChange, {
          label,
          value: fmt.money(bucket.value),
          direction: delta < 0 ? t.down : t.up,
          percent: fmt.percent(Math.abs(delta)),
          previous: prevLabel,
        })
      : interpolate(t.scrubValue, { label, value: fmt.money(bucket.value) });
  const surroundRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(handlers);
  pinnedRef.current = handlers;
  // Escape anywhere in the chart closes a pinned note.
  useEffect(() => {
    const el = surroundRef.current;
    if (!el) return;
    const onEscape = (e: globalThis.KeyboardEvent) => {
      const h = pinnedRef.current;
      if (e.key === "Escape" && h.pinnedId) h.onToggle(h.pinnedId);
    };
    el.addEventListener("keydown", onEscape);
    return () => el.removeEventListener("keydown", onEscape);
  }, []);

  const indexAt = (e: PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = rect.width / (width || 1);
    const px = (e.clientX - rect.left) / (scale || 1);
    return Math.min(
      n - 1,
      Math.max(0, Math.round(((px - pad.l) / plotW) * (n - 1)))
    );
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const jump = e.shiftKey ? 7 : 1;
    const moves: Record<string, number> = {
      ArrowRight: active + jump,
      ArrowUp: active + jump,
      ArrowLeft: active - jump,
      ArrowDown: active - jump,
      PageUp: active + 7,
      PageDown: active - 7,
      Home: 0,
      End: n - 1,
    };
    if (e.key === "Escape") {
      setScrub(null);
      return;
    }
    if (!(e.key in moves)) return;
    e.preventDefault();
    setScrub({
      range: model.range,
      i: Math.min(n - 1, Math.max(0, moves[e.key])),
    });
  };

  const cardW = wide ? 248 : Math.max(0, width - 8);
  const cardX = open ? x(open.i0) : 0;
  const cardRight = cardX + 14 + cardW <= width - 4;
  const cardLeft = wide
    ? cardRight
      ? cardX + 14
      : Math.max(4, cardX - 14 - cardW)
    : 4;
  const cardTop = pad.t + 2;

  return (
    <section
      aria-label={t.chart}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="flex h-5 min-w-0 items-center gap-2 text-muted-foreground text-xs">
            <span className="shrink-0 tabular-nums">
              {showCrosshair || focused
                ? label
                : interpolate(t.latest, { label })}
            </span>
            {here[0] && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-0 items-center gap-1 rounded-full ps-0.5 pe-2 font-medium",
                  KINDS[here[0].kind].soft
                )}
              >
                <KindIcon
                  className="size-4 bg-transparent"
                  kind={here[0].kind}
                />
                <span className="truncate">{here[0].title}</span>
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="font-heading font-semibold text-[28px] leading-none tracking-[-0.02em] tabular-nums"
              style={{ minWidth: `${widest * 0.6}em` }}
            >
              {fmt.money(bucket.value)}
            </span>
            {delta !== null && bucket.prev !== null && (
              <span className="inline-flex items-center gap-1 text-xs tabular-nums">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    tone(delta)
                  )}
                >
                  {delta < 0 ? (
                    <ArrowDownRightIcon aria-hidden className="size-3.5" />
                  ) : (
                    <ArrowUpRightIcon aria-hidden className="size-3.5" />
                  )}
                  {fmt.percent(delta)}
                </span>
                <span className="text-muted-foreground">
                  {interpolate(t.versus, {
                    label: prevLabel,
                    value: fmt.money(bucket.prev),
                  })}
                </span>
              </span>
            )}
          </div>
        </div>
        <div
          aria-hidden
          className="flex items-center gap-4 pb-0.5 text-muted-foreground text-xs"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-foreground" />
            {t.legendThis}
          </span>
          {prevValues && (
            <span className="inline-flex items-center gap-1.5">
              <svg
                aria-hidden
                className="h-0.5 w-4 overflow-visible"
                viewBox="0 0 16 2"
              >
                <line
                  className="stroke-muted-foreground/70"
                  strokeDasharray="3 3"
                  strokeWidth={1.5}
                  x1={0}
                  x2={16}
                  y1={1}
                  y2={1}
                />
              </svg>
              {t.legendPrevious}
            </span>
          )}
        </div>
      </div>

      <div
        className="relative mt-3 h-75 min-h-0 w-full @4xl:h-auto @4xl:min-h-65 @4xl:flex-1"
        ref={surroundRef}
      >
        <div
          aria-label={t.scrub}
          aria-valuemax={n - 1}
          aria-valuemin={0}
          aria-valuenow={active}
          aria-valuetext={valueText}
          className="absolute inset-0 cursor-crosshair touch-pan-y rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onBlur={() => {
            setFocused(false);
            setScrub(null);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={onKeyDown}
          onPointerDown={(e) => {
            if (handlers.pinnedId) handlers.onToggle(handlers.pinnedId);
            setScrub({ range: model.range, i: indexAt(e) });
          }}
          onPointerLeave={() => setScrub(null)}
          onPointerMove={(e) => setScrub({ range: model.range, i: indexAt(e) })}
          ref={surfaceRef}
          role="slider"
          tabIndex={0}
        >
          {ready && (
            <svg
              aria-hidden
              className="absolute inset-0 overflow-visible"
              height={height}
              width={width}
            >
              <defs>
                <clipPath id={clipId}>
                  <motion.rect
                    animate={{ width: width + 8 }}
                    height={height + 8}
                    initial={{ width: reduce ? width + 8 : 0 }}
                    transition={
                      reduce ? { duration: 0 } : { duration: 0.7, ease }
                    }
                    x={-4}
                    y={-4}
                  />
                </clipPath>
                <linearGradient id={fadeId} x1="0" x2="0" y1="0" y2="1">
                  <stop
                    className="[stop-color:var(--color-foreground)]"
                    offset="0%"
                    stopOpacity={0.09}
                  />
                  <stop
                    className="[stop-color:var(--color-foreground)]"
                    offset="100%"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              {model.moments
                .filter((m) => m.endDate && m.endDate !== m.date)
                .map((m) => {
                  const half = n > 1 ? plotW / (n - 1) / 2 : plotW / 2;
                  const left = Math.max(pad.l, x(m.i0) - half);
                  const right = Math.min(pad.l + plotW, x(m.i1) + half);
                  return (
                    <motion.rect
                      animate={{
                        x: left,
                        width: Math.max(2, right - left),
                        opacity: 1,
                      }}
                      className={KINDS[m.kind].band}
                      height={plotH}
                      initial={{
                        x: left,
                        width: Math.max(2, right - left),
                        opacity: 0,
                      }}
                      key={`band-${m.id}`}
                      rx={4}
                      transition={{
                        x: morph,
                        width: morph,
                        opacity: { duration: 0.2 },
                      }}
                      y={pad.t}
                    />
                  );
                })}

              {ticks.map((v, k) => (
                <motion.g
                  animate={{ y: y(v) }}
                  initial={false}
                  key={`tick-${v}`}
                  transition={morph}
                >
                  <line
                    className={k === 0 ? "stroke-border" : "stroke-border/70"}
                    strokeDasharray={k === 0 ? undefined : "2 4"}
                    x1={pad.l}
                    x2={width - pad.r}
                    y1={0}
                    y2={0}
                  />
                  <text
                    className="fill-muted-foreground text-[10px] tabular-nums"
                    dominantBaseline="middle"
                    textAnchor="end"
                    x={pad.l - 10}
                    y={0}
                  >
                    {fmt.axis(v)}
                  </text>
                </motion.g>
              ))}

              {xTicks.map((i) => {
                const px = x(i);
                const anchor =
                  i === n - 1 && n > 1
                    ? "end"
                    : px - 24 < pad.l
                      ? "start"
                      : "middle";
                const at = buckets[i]?.t ?? 0;
                return (
                  <motion.text
                    animate={{ opacity: 1 }}
                    className="fill-muted-foreground text-[10px] tabular-nums"
                    initial={{ opacity: 0 }}
                    key={`${model.range}-${i}`}
                    textAnchor={anchor}
                    transition={{ duration: reduce ? 0 : 0.18 }}
                    x={px}
                    y={height - 8}
                  >
                    {model.step === 7 ? fmt.month(at + 6 * DAY) : fmt.day(at)}
                  </motion.text>
                );
              })}

              <g clipPath={`url(#${clipId})`}>
                {prevLine && (
                  <motion.path
                    animate={{ d: prevLine }}
                    className="fill-none stroke-muted-foreground/55"
                    initial={false}
                    strokeDasharray="3 4"
                    strokeLinecap="round"
                    strokeWidth={1.5}
                    transition={morph}
                  />
                )}
                <motion.path
                  animate={{ d: area }}
                  fill={`url(#${fadeId})`}
                  initial={false}
                  transition={morph}
                />
                <motion.path
                  animate={{ d: line }}
                  className="fill-none stroke-foreground"
                  initial={false}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  transition={morph}
                />
              </g>

              {model.moments.map((m) => {
                const spot = placement.get(m.id);
                const cx = x(m.i0);
                const cy = y(values[m.i0]);
                const settle = {
                  duration: reduce ? 0 : 0.2,
                  delay: reduce ? 0 : 0.36,
                };
                return (
                  <motion.g
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    key={`mark-${model.range}-${m.id}`}
                    transition={settle}
                  >
                    {spot && (
                      <line
                        className={KINDS[m.kind].stem}
                        strokeDasharray="2 3"
                        x1={cx}
                        x2={cx}
                        y1={spot.row * 30 + 28}
                        y2={cy - 7}
                      />
                    )}
                    <circle
                      className={cn("stroke-background", KINDS[m.kind].dot)}
                      cx={cx}
                      cy={cy}
                      r={spot ? 4.5 : 3.5}
                      strokeWidth={2}
                    />
                  </motion.g>
                );
              })}

              {showCrosshair ? (
                <g>
                  <line
                    className="stroke-foreground/25"
                    x1={x(active)}
                    x2={x(active)}
                    y1={pad.t - 4}
                    y2={base}
                  />
                  {prevValues && (
                    <circle
                      className="fill-background stroke-muted-foreground"
                      cx={x(active)}
                      cy={y(prevValues[active])}
                      r={3}
                      strokeWidth={1.5}
                    />
                  )}
                  <circle
                    className="fill-foreground stroke-background"
                    cx={x(active)}
                    cy={y(values[active])}
                    r={4.5}
                    strokeWidth={2}
                  />
                </g>
              ) : (
                <motion.circle
                  animate={{ opacity: 1 }}
                  className="fill-foreground stroke-background"
                  cx={x(n - 1)}
                  cy={y(values[n - 1])}
                  initial={{ opacity: 0 }}
                  key={`end-${model.range}`}
                  r={4}
                  strokeWidth={2}
                  transition={{
                    duration: reduce ? 0 : 0.2,
                    delay: reduce ? 0 : 0.36,
                  }}
                />
              )}
            </svg>
          )}
        </div>

        <AnimatePresence initial={!reduce}>
          {ready &&
            model.moments.map((m) => {
              const spot = placement.get(m.id);
              if (!spot) return null;
              const text = chipText(m);
              const isOpen = handlers.openId === m.id;
              return (
                <motion.button
                  animate={{
                    x: spot.left,
                    y: spot.row * 30 + 4,
                    opacity: 1,
                    scale: 1,
                  }}
                  aria-controls={isOpen ? cardId : undefined}
                  aria-expanded={isOpen}
                  aria-label={`${spot.compact ? "" : `${text.label}${text.delta ? ` ${text.delta}` : ""}, `}${interpolate(t.chipNote, { title: m.title, dates: momentDates(fmt, m) })}`}
                  className={cn(
                    "absolute top-0 inset-s-0 z-10 inline-flex h-6 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border bg-background text-xs shadow-xs/5 outline-none before:absolute before:-inset-x-1 before:-inset-y-1 focus-visible:ring-2 focus-visible:ring-ring",
                    "transition-[background-color,border-color,scale] duration-150 ease-out active:scale-[0.97] [@media(hover:hover)]:hover:bg-accent",
                    spot.compact ? "w-6 justify-center" : "ps-0.75 pe-2",
                    isOpen && "border-foreground/25 bg-accent"
                  )}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.12 },
                  }}
                  initial={{
                    x: spot.left,
                    y: spot.row * 30 + 4,
                    opacity: 0,
                    scale: 0.95,
                  }}
                  key={m.id}
                  onBlur={() => handlers.onFocus(null)}
                  onClick={() => handlers.onToggle(m.id)}
                  onFocus={() => handlers.onFocus(m.id)}
                  onPointerEnter={(e) =>
                    e.pointerType === "mouse" && handlers.onHover(m.id)
                  }
                  onPointerLeave={() => handlers.onHover(null)}
                  transition={{
                    x: morph,
                    y: morph,
                    opacity: { duration: 0.18, delay: reduce ? 0 : 0.45 },
                    scale: { duration: 0.18, ease, delay: reduce ? 0 : 0.45 },
                  }}
                  type="button"
                >
                  <KindIcon className="size-4" kind={m.kind} />
                  {!spot.compact && (
                    <>
                      <span className="font-medium">{text.label}</span>
                      {text.delta && (
                        <span className="text-muted-foreground tabular-nums">
                          {text.delta}
                        </span>
                      )}
                    </>
                  )}
                </motion.button>
              );
            })}
        </AnimatePresence>

        <AnimatePresence>
          {ready && open && (
            <motion.div
              animate={{ opacity: 1, scale: 1, x: cardLeft, y: cardTop }}
              className="pointer-events-none absolute top-0 inset-s-0 z-20 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg/5"
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
              id={cardId}
              initial={{ opacity: 0, scale: 0.97, x: cardLeft, y: cardTop }}
              key="note"
              role="note"
              style={{
                width: cardW,
                originX: wide ? (cardRight ? 0 : 1) : 0.5,
                originY: 0,
              }}
              transition={
                reduce
                  ? { duration: 0 }
                  : {
                      duration: 0.16,
                      ease,
                      x: { type: "spring", visualDuration: 0.2, bounce: 0 },
                    }
              }
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <KindIcon className="size-5" kind={open.kind} />
                <span>{t[open.kind]}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{momentDates(fmt, open)}</span>
              </div>
              <p className="mt-2 font-medium text-sm">{open.title}</p>
              <p className="mt-1 text-pretty text-muted-foreground text-xs leading-relaxed">
                {open.note}
              </p>
              {open.impact && (
                <div className="mt-2.5 flex items-start justify-between gap-3 border-t pt-2.5 text-xs">
                  <span className="text-pretty text-muted-foreground">
                    {open.impact.text}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-medium tabular-nums",
                      tone(open.impact.change)
                    )}
                  >
                    {fmt.percent(open.impact.change)}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Breakdown({ model }: { model: Model }) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const share = (n: number) => fmt.percent(n).replace(/^\+/, "");
  const titleId = useId();
  const reduce = useReducedMotionAfterMount();
  const [hover, setHover] = useState<string | null>(null);
  const ranked = [...model.channels].sort((a, b) => b.total - a.total);
  const total = ranked.reduce((s, c) => s + c.total, 0) || 1;
  const hasPrev = model.prevTotal !== null;
  return (
    <section aria-labelledby={titleId} className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-medium text-sm" id={titleId}>
          {t.breakdown}
        </h2>
        {hasPrev && (
          <span className="text-muted-foreground text-xs">
            {t.vsLastPeriod}
          </span>
        )}
      </div>
      <div
        aria-label={interpolate(t.shareLabel, {
          summary: ranked
            .map((c) => `${c.label} ${share(c.total / total)}`)
            .join(", "),
        })}
        className="mt-3 flex h-2.5 gap-0.75"
        role="img"
      >
        {ranked.map((c, i) => (
          <div
            className={cn(
              "h-full min-w-1 basis-0 rounded-full transition-[flex-grow,opacity] duration-300 ease-out motion-reduce:transition-none",
              SHADES[i % SHADES.length],
              hover && hover !== c.key && "opacity-30"
            )}
            key={c.key}
            style={{ flexGrow: c.total }}
          />
        ))}
      </div>
      <ol className="-mx-2 mt-2 flex flex-col">
        {ranked.map((c, i) => {
          const change = c.total - c.prev;
          return (
            <motion.li
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2 py-1 transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent/60"
              key={c.key}
              layout={reduce ? false : "position"}
              onPointerEnter={(e) =>
                e.pointerType === "mouse" && setHover(c.key)
              }
              onPointerLeave={() => setHover(null)}
              transition={{ type: "spring", visualDuration: 0.3, bounce: 0 }}
            >
              <span
                aria-hidden
                className={cn(
                  "size-2.5 rounded-full transition-colors duration-300",
                  SHADES[i % SHADES.length]
                )}
              />
              <div className="min-w-0">
                <div className="truncate">{c.label}</div>
                <div className="text-muted-foreground text-xs tabular-nums">
                  {interpolate(t.ofRevenue, {
                    percent: share(c.total / total),
                  })}
                </div>
              </div>
              <div className="text-end">
                <Rolling
                  className="font-medium"
                  format={fmt.compact}
                  value={c.total}
                />
                {hasPrev && (
                  <div className={cn("text-xs tabular-nums", tone(change))}>
                    {fmt.signed(change)} ·{" "}
                    {c.prev ? fmt.percent(change / c.prev) : t.new}
                  </div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}

function MomentList({
  model,
  handlers,
  cardId,
}: {
  model: Model;
  handlers: MomentHandlers;
  cardId: string;
}) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-0 min-w-0 flex-col"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-medium text-sm" id={titleId}>
          {t.moments}
        </h2>
        <span className="text-muted-foreground text-xs tabular-nums">
          {model.moments.length
            ? interpolate(t.momentsCount, { count: model.moments.length })
            : t.noMoments}
        </span>
      </div>
      {model.moments.length ? (
        <ul className="-mx-2.5 mt-1.5 flex min-h-0 flex-col overflow-y-auto p-0.5 pb-3 mask-[linear-gradient(to_bottom,black_calc(100%-1.25rem),transparent)] scrollbar-thin">
          {model.moments.map((m) => {
            const isOpen = handlers.openId === m.id;
            return (
              <li key={m.id}>
                <button
                  aria-controls={isOpen ? cardId : undefined}
                  aria-expanded={isOpen}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2 py-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:hover:bg-accent/60",
                    pressable,
                    isOpen && "bg-accent [@media(hover:hover)]:hover:bg-accent"
                  )}
                  onBlur={() => handlers.onFocus(null)}
                  onClick={() => handlers.onToggle(m.id)}
                  onFocus={() => handlers.onFocus(m.id)}
                  onPointerEnter={(e) =>
                    e.pointerType === "mouse" && handlers.onHover(m.id)
                  }
                  onPointerLeave={() => handlers.onHover(null)}
                  type="button"
                >
                  <KindIcon className="size-6 [&_svg]:size-3" kind={m.kind} />
                  <span className="min-w-0">
                    <span className="block truncate">{m.title}</span>
                    <span className="block text-muted-foreground text-xs tabular-nums">
                      {momentDates(fmt, m)}
                    </span>
                  </span>
                  {m.impact && (
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        tone(m.impact.change)
                      )}
                    >
                      {fmt.percent(m.impact.change)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-pretty text-muted-foreground text-xs">
          {t.noMomentsHint}
        </p>
      )}
    </section>
  );
}

function RailLink({
  label,
  href,
  current,
  children,
}: {
  label: string;
  href: string;
  current?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <WirefrontLink
            aria-current={current ? "page" : undefined}
            aria-label={label}
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4",
              pressable,
              current
                ? "bg-accent text-foreground"
                : "text-muted-foreground [@media(hover:hover)]:hover:bg-accent/60 [@media(hover:hover)]:hover:text-foreground"
            )}
            href={href}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

function RevenueStoryScreen({
  data,
  status = "ready",
  error,
  onRetry,
  store,
  user,
  nav = [],
  settingsHref,
  updatedAt,
  defaultRange = "30d",
  onRangeChange,
  className,
}: RevenueStoryProps) {
  const fmt = useFmt();
  const { t } = fmt;
  const format = useFormat();
  const cardId = useId();
  const [range, setRange] = useState<RangeKey>(defaultRange);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const days = data?.days ?? [];
  const channels = data?.channels ?? [];
  const moments = data?.moments ?? [];
  const dayIndex = useMemo(
    () => new Map(days.map((d, i) => [d.date, i])),
    [days]
  );
  const impacts = useMemo(
    () =>
      new Map(
        moments.map((m) => [m.id, impactOf(m, days, dayIndex, channels, fmt)])
      ),
    [moments, days, dayIndex, channels, fmt]
  );
  const model = useMemo(
    () =>
      days.length
        ? buildModel(days, channels, moments, dayIndex, impacts, range)
        : null,
    [days, channels, moments, dayIndex, impacts, range]
  );
  const openId = hoverId ?? focusId ?? pinnedId;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handlers: MomentHandlers = {
    openId: model?.moments.some((m) => m.id === openId) ? openId : null,
    pinnedId,
    onHover: setHoverId,
    onFocus: setFocusId,
    onToggle: (id) => setPinnedId((p) => (p === id ? null : id)),
  };

  const changeRange = (next: RangeKey) => {
    setRange(next);
    setPinnedId(null);
    onRangeChange?.(next);
  };

  const summaryText = (m: Model) => {
    const change = m.prevTotal === null ? null : m.total - m.prevTotal;
    const period = interpolate(t.dateWithYear, {
      date: interpolate(t.span, { from: fmt.day(m.start), to: fmt.day(m.end) }),
      year: yearOf(m.end),
    });
    return change === null
      ? interpolate(t.summaryText, {
          store: store.name,
          period,
          total: fmt.money(m.total),
        })
      : interpolate(t.summaryTextChange, {
          store: store.name,
          period,
          total: fmt.money(m.total),
          direction: change < 0 ? t.down : t.up,
          amount: fmt.compact(change),
        });
  };

  const downloadCsv = (m: Model) => {
    const lines = m.buckets.map(
      (b) =>
        `${isoOf(b.t)},${Math.round(b.value)},${b.prev === null ? "" : Math.round(b.prev)}`
    );
    const url = URL.createObjectURL(
      new Blob([[m.step === 7 ? t.csvWeek : t.csvDay, ...lines].join("\n")], {
        type: "text/csv",
      })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-${m.range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice(t.csvDownloaded);
  };

  const copySummary = (m: Model) => {
    if (!navigator.clipboard) {
      setNotice(t.couldntCopy);
      return;
    }
    navigator.clipboard.writeText(summaryText(m)).then(
      () => setNotice(t.summaryCopied),
      () => setNotice(t.couldntCopy)
    );
  };

  const initials = (user?.name ?? "")
    .split(" ")
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2);
  const current = nav.find((item) => item.current);
  const ready = status === "ready" && model;

  return (
    <FmtContext.Provider value={fmt}>
      <TooltipProvider>
        <div
          className={cn(
            "@container relative isolate flex h-190 w-full overflow-hidden bg-background text-foreground text-sm",
            className
          )}
        >
          <aside
            aria-label={t.app}
            className="hidden w-14 shrink-0 flex-col items-center gap-1 border-e bg-muted/40 py-3 @3xl:flex"
          >
            <span
              aria-label={store.name}
              className="mb-3 flex size-8 items-center justify-center rounded-lg bg-primary font-heading font-semibold text-primary-foreground text-sm"
              role="img"
            >
              {store.name[0]}
            </span>
            {nav.length ? (
              <nav aria-label={t.main} className="flex flex-col gap-1">
                {nav.map((item) => (
                  <RailLink
                    current={item.current}
                    href={item.href}
                    key={item.href}
                    label={item.label}
                  >
                    {item.icon}
                  </RailLink>
                ))}
              </nav>
            ) : null}
            <div className="mt-auto flex flex-col items-center gap-2">
              {settingsHref ? (
                <RailLink href={settingsHref} label={t.settings}>
                  <SettingsIcon aria-hidden />
                </RailLink>
              ) : null}
              {user ? (
                <Avatar aria-label={user.name} className="size-7" role="img">
                  <AvatarFallback className="text-[11px]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              ) : null}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4 @3xl:px-7">
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-md bg-primary font-heading font-semibold text-primary-foreground text-xs @3xl:hidden"
              >
                {store.name[0]}
              </span>
              <nav
                aria-label={t.breadcrumb}
                className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
              >
                <span className="hidden truncate text-muted-foreground @md:inline">
                  {store.name}
                </span>
                <ChevronRightIcon
                  aria-hidden
                  className="hidden size-3.5 shrink-0 text-muted-foreground @md:block rtl:rotate-180"
                />
                <span aria-current="page" className="truncate font-medium">
                  {current?.label ?? t.title}
                </span>
              </nav>
              <span
                aria-live="polite"
                className="hidden text-muted-foreground text-xs @2xl:inline"
              >
                {notice ??
                  (updatedAt
                    ? interpolate(t.updated, {
                        when: format.relative(updatedAt),
                      })
                    : null)}
              </span>
              {ready ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        className={pressable}
                        size="sm"
                        variant="outline"
                      />
                    }
                  >
                    <DownloadIcon />
                    {t.export}
                    <ChevronDownIcon className="-me-0.5 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-48">
                    <DropdownMenuItem onClick={() => copySummary(model)}>
                      <ClipboardIcon />
                      {t.copySummary}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => downloadCsv(model)}>
                      <DownloadIcon />
                      {t.downloadCsv}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </header>

            <main
              aria-busy={status === "loading"}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {status === "error" ? (
                <div className="flex h-full flex-col items-center justify-center p-10 text-center">
                  <p className="font-medium">{t.errorTitle}</p>
                  {error ? (
                    <p className="mt-1 text-muted-foreground text-sm">
                      {error}
                    </p>
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
              ) : ready ? (
                <div className="@container mx-auto flex min-h-full max-w-7xl flex-col @5xl:h-full gap-5 px-4 pt-5 pb-6 @3xl:px-7 @3xl:pt-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                      <p className="text-muted-foreground text-xs tabular-nums">
                        <span className="font-medium text-foreground">
                          {t[`range${range}`]}
                        </span>{" "}
                        ·{" "}
                        {interpolate(t.span, {
                          from: fmt.day(model.start, yearOf(model.end)),
                          to: fmt.day(model.end),
                        })}
                        {model.prevStart !== null && model.prevEnd !== null && (
                          <span className="hidden @md:inline">
                            {" "}
                            {interpolate(t.periodVs, {
                              start: fmt.day(
                                model.prevStart,
                                yearOf(model.end)
                              ),
                              end: fmt.day(model.prevEnd, yearOf(model.end)),
                            })}
                          </span>
                        )}
                      </p>
                      <RangeSwitch onChange={changeRange} value={range} />
                    </div>
                    <Summary model={model} />
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-x-7 gap-y-8 @4xl:grid-cols-[minmax(0,1fr)_20rem] @4xl:grid-rows-[minmax(0,1fr)]">
                    <StoryChart
                      cardId={cardId}
                      handlers={handlers}
                      model={model}
                    />
                    <div className="flex min-h-0 min-w-0 flex-col gap-5 border-t pt-6 @4xl:border-t-0 @4xl:border-s @4xl:pt-0 @4xl:ps-7">
                      <Breakdown model={model} />
                      <MomentList
                        cardId={cardId}
                        handlers={handlers}
                        model={model}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex h-full max-w-7xl flex-col gap-5 px-4 pt-5 pb-6 @3xl:px-7 @3xl:pt-6">
                  <Skeleton className="h-24 w-full max-w-184 motion-reduce:animate-none" />
                  <Skeleton className="min-h-65 w-full flex-1 motion-reduce:animate-none" />
                </div>
              )}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </FmtContext.Provider>
  );
}

export function RevenueStory(props: RevenueStoryProps) {
  return (
    <ScreenBoundary name="RevenueStory">
      <RevenueStoryScreen {...props} />
    </ScreenBoundary>
  );
}
