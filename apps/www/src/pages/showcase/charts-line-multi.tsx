import { Line, LineChart } from "recharts";
import {
  ChartAxis,
  ChartContainer,
  ChartGrid,
  ChartTooltip,
  chartColor,
} from "@/components/chart";

const SERIES = [
  { key: "web", name: "Web", color: chartColor(0) },
  { key: "ios", name: "iOS", color: chartColor(1) },
  { key: "android", name: "Android", color: chartColor(2) },
] as const;

const WEB = [120, 142, 138, 152, 168, 174, 198, 210, 195, 218, 232, 248, 264, 252, 280, 296, 314, 322, 308, 332, 348, 358, 372, 388, 402, 414, 428, 446, 458, 472];
const IOS = [62, 70, 68, 78, 88, 92, 96, 102, 110, 116, 124, 130, 138, 144, 152, 158, 164, 170, 178, 186, 194, 202, 210, 218, 224, 232, 240, 248, 256, 262];
const ANDROID = [42, 44, 50, 52, 58, 60, 64, 66, 72, 74, 80, 84, 88, 92, 96, 100, 104, 108, 112, 116, 122, 126, 130, 134, 138, 142, 146, 150, 154, 158];

const DATA = WEB.map((_, i) => ({
  day: `Apr ${i + 1}`,
  web: WEB[i],
  ios: IOS[i],
  android: ANDROID[i],
}));

export function ChartsLineMultiShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
          Daily active users · Apr 2026
        </div>
        <h1 className="mt-1 font-heading text-2xl">DAU by platform</h1>

        <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {SERIES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed="true"
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/40 px-2 py-1 text-xs pointer-coarse:min-h-10"
              >
                <span
                  className="size-2 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                {s.name}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {DATA[DATA.length - 1][s.key].toLocaleString()}
                </span>
              </button>
            ))}
            <div role="tablist" aria-label="Range" className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] max-sm:w-full sm:ml-auto">
              {["7d", "30d", "90d"].map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={r === "30d"}
                  className={`min-h-7 rounded px-2.5 py-1 pointer-coarse:min-h-10 ${
                    r === "30d" ? "bg-foreground/[0.08] text-foreground" : "hover:bg-foreground/[0.05]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <ChartContainer className="mt-4 h-56 sm:h-72">
            <LineChart data={DATA} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <ChartGrid />
              <ChartAxis dataKey="day" />
              <ChartAxis axis="y" />
              <ChartTooltip />
              {SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
