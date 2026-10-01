import { useMediaQuery } from "@orbit/ui/hooks/use-media-query";
import { Bar, BarChart, Cell, LabelList } from "recharts";
import {
  ChartAxis,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
} from "@/components/chart";

interface Step {
  label: string;
  value: number;
  type: "start" | "delta" | "end";
}

const STEPS: Step[] = [
  { label: "Q4 ARR", value: 1640, type: "start" },
  { label: "New", value: 412, type: "delta" },
  { label: "Expansion", value: 184, type: "delta" },
  { label: "Reactivation", value: 38, type: "delta" },
  { label: "Contraction", value: -94, type: "delta" },
  { label: "Churn", value: -126, type: "delta" },
  { label: "Q1 ARR", value: 2054, type: "end" },
];

interface Bar {
  label: string;
  value: number;
  type: Step["type"];
  base: number;
  delta: number;
  color: string;
}

function buildBars(): Bar[] {
  let running = 0;
  return STEPS.map((s) => {
    if (s.type === "start") {
      running = s.value;
      return {
        label: s.label,
        value: s.value,
        type: s.type,
        base: 0,
        delta: s.value,
        color: "rgb(82 82 91)",
      };
    }
    if (s.type === "end") {
      return {
        label: s.label,
        value: s.value,
        type: s.type,
        base: 0,
        delta: s.value,
        color: "rgb(82 82 91)",
      };
    }
    const before = running;
    running += s.value;
    const positive = s.value >= 0;
    return {
      label: s.label,
      value: s.value,
      type: s.type,
      base: positive ? before : running,
      delta: Math.abs(s.value),
      color: positive ? "rgb(16 185 129)" : "rgb(244 63 94)",
    };
  });
}

const BARS = buildBars();

export function ChartsWaterfallShowcasePage() {
  const isPhone = useMediaQuery("max-sm");
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          ARR movement · Q4 → Q1 (k)
        </div>
        <h1 className="mt-1 font-heading text-2xl">Net retention waterfall</h1>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:tracking-[0.25em]">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-foreground/70" />
              start / end
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-500" />
              addition
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-rose-500" />
              loss
            </span>
            <span className="text-foreground sm:ml-auto">
              NRR <span className="font-mono">125.2%</span>
            </span>
          </div>

          {/* Phones: every category label, angled; value labels hidden (tooltips carry them). */}
          <ChartContainer className="h-72 sm:h-80 max-sm:[&_.recharts-label-list]:hidden">
            <BarChart data={BARS} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
              <ChartGrid />
              <ChartAxis
                dataKey="label"
                interval={isPhone ? 0 : undefined}
                angle={isPhone ? -40 : undefined}
                height={isPhone ? 64 : undefined}
              />
              <ChartAxis axis="y" />
              <ChartTooltip />
              <Bar dataKey="base" stackId="w" fill="transparent" />
              <Bar dataKey="delta" stackId="w" radius={[3, 3, 0, 0]}>
                {BARS.map((b, i) => (
                  <Cell key={i} fill={b.color} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  fontSize={10}
                  fill="currentColor"
                  className="font-mono"
                  formatter={(v) => {
                    const n = Number(v);
                    return n > 0 &&
                      BARS.some((b) => b.value === n && b.type === "delta")
                      ? `+${n}`
                      : `${n}`;
                  }}
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
