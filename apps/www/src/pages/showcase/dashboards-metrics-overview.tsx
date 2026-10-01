import { useId } from "react";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TrendingUpIcon,
} from "lucide-react";
import { Button } from "@orbit/ui/button";

const STATS = [
  { label: "Active users", value: "12,408", delta: "+8.2%", trend: "up" as const, sub: "vs. last 30d" },
  { label: "MRR", value: "$48.6k", delta: "+12.4%", trend: "up" as const, sub: "vs. last 30d" },
  { label: "Churn", value: "1.8%", delta: "-0.3%", trend: "up" as const, sub: "vs. last 30d" },
  { label: "Avg. session", value: "6m 22s", delta: "-1.1%", trend: "down" as const, sub: "vs. last 30d" },
];

const SPARK = [12, 18, 14, 22, 19, 28, 24, 33, 29, 38, 34, 42];

const ACTIVITY = [
  { who: "Maya Okafor", what: "deployed", target: "main → production", time: "2m" },
  { who: "James Lin", what: "created", target: "PR #128 — audit log", time: "8m" },
  { who: "Riya Patel", what: "invited", target: "5 new members", time: "21m" },
  { who: "Dani Kim", what: "archived", target: "marketing-v1 project", time: "1h" },
  { who: "Alex Tran", what: "rolled back", target: "release 0.4.1", time: "2h" },
];

export function DashboardsMetricsOverviewShowcasePage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="border-b border-border/60 px-4 py-5 sm:px-6 sm:py-6 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Workspace · Acme inc.
            </div>
            <h1 className="mt-1 font-heading text-2xl">Overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangePill />
            <Button size="sm" type="button">
              <PlusIcon />
              New report
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <ChartCard />
          <ActivityCard />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  trend,
  sub,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  sub: string;
}) {
  const Up = trend === "up";
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
          {label}
        </div>
        <button
          type="button"
          aria-label={`More options for ${label}`}
          className="-mr-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-10"
        >
          <MoreHorizontalIcon className="size-4" />
        </button>
      </div>
      <div className="mt-2 font-heading text-3xl tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        <span
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] ${
            Up
              ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/12 text-rose-600 dark:text-rose-400"
          }`}
        >
          {Up ? (
            <ArrowUpRightIcon className="size-3" />
          ) : (
            <ArrowDownRightIcon className="size-3" />
          )}
          {delta}
        </span>
        <span className="text-muted-foreground">{sub}</span>
      </div>
    </div>
  );
}

function ChartCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-5 lg:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
            Active users · daily
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-heading text-2xl">12,408</span>
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-500/12 px-1.5 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              <TrendingUpIcon className="size-3" />
              +8.2%
            </span>
          </div>
        </div>
        <div role="tablist" aria-label="Range" className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          {["7d", "30d", "90d"].map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={r === "30d"}
              className={`min-h-7 rounded px-2.5 py-1 transition-colors pointer-coarse:min-h-10 ${
                r === "30d" ? "bg-foreground/[0.08] text-foreground" : "hover:bg-foreground/[0.05]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-36 w-full sm:h-44">
        <Sparkline data={SPARK} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const gradientId = useId();
  const W = 600;
  const H = 160;
  const PAD = 8;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - PAD * 2) / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = PAD + i * stepX;
      const y = PAD + (1 - (v - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `M ${PAD} ${H - PAD} L ${points
    .split(" ")
    .join(" L ")} L ${W - PAD} ${H - PAD} Z`;
  const last = data[data.length - 1]!;
  const lastX = PAD + (data.length - 1) * stepX;
  const lastY = PAD + (1 - (last - min) / range) * (H - PAD * 2);
  // The SVG stretches to the card width (preserveAspectRatio="none"), so the
  // stroke opts out of scaling and the end marker is HTML, not an SVG circle
  // that would turn into an ellipse.
  return (
    <div className="relative h-full w-full">
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-full w-full"
      role="img"
      aria-label={`Trend over ${data.length} periods, latest ${last}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} className="text-primary" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className="text-primary"
      />
    </svg>
    <span
      aria-hidden
      className="-translate-x-1/2 -translate-y-1/2 absolute flex size-3 items-center justify-center rounded-full bg-primary/25"
      style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%` }}
    >
      <span className="size-1.5 rounded-full bg-primary" />
    </span>
    </div>
  );
}

function ActivityCard() {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-5">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
          Recent activity
        </div>
        <button
          type="button"
          className="min-h-8 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] transition-colors hover:text-foreground pointer-coarse:min-h-10"
        >
          See all
        </button>
      </div>
      <ul className="mt-4 flex flex-col gap-3.5">
        {ACTIVITY.map((a, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="mt-1 flex size-6 items-center justify-center rounded-full bg-foreground/[0.06] font-medium text-[10px]">
              {a.who.split(" ").map((n) => n[0]).join("")}
            </span>
            <div className="min-w-0 flex-1 leading-snug">
              <span className="font-medium">{a.who}</span>{" "}
              <span className="text-muted-foreground">{a.what}</span>{" "}
              <span className="text-foreground/85">{a.target}</span>
              <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.2em]">
                {a.time} ago
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DateRangePill() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-md border border-border/70 bg-background/40 px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground pointer-coarse:min-h-10"
    >
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Mar 27 – Apr 25
    </button>
  );
}
