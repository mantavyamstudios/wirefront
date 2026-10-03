import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@orbit/ui/button";

const PRESETS = [
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 14 days",
  "Last 30 days",
  "This month",
  "Last month",
  "Last quarter",
  "Year to date",
];

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

interface MonthSpec {
  label: string;
  total: number;
  offset: number;
}

const MONTHS: MonthSpec[] = [
  { label: "March 2026", total: 31, offset: 6 }, // starts Sun
  { label: "April 2026", total: 30, offset: 2 }, // starts Wed
];

type Day = { month: number; day: number };

const toDate = (p: Day) => new Date(2026, 2 + p.month, p.day);
const fmt = (p: Day) =>
  toDate(p).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const daysBetween = (a: Day, b: Day) =>
  Math.round((toDate(b).getTime() - toDate(a).getTime()) / 86_400_000) + 1;
const before = (a: Day, b: Day) => toDate(a) < toDate(b);

// md+: popover-style card with a presets rail and two months side by side.
// Phones: a full-screen sheet — presets become a scrolling chip row, the months
// stack vertically, and Apply sits in a sticky footer above the home indicator.
export function CalendarsDateRangeShowcasePage() {
  const [preset, setPreset] = useState<string | null>("Last 14 days");
  const [start, setStart] = useState<Day>({ month: 0, day: 27 });
  const [end, setEnd] = useState<Day | null>({ month: 1, day: 9 });

  const pick = (p: Day) => {
    setPreset(null);
    if (end || before(p, start)) {
      setStart(p);
      setEnd(null);
    } else {
      setEnd(p);
    }
  };

  return (
    <div className="min-h-svh bg-background sm:grid sm:place-items-center sm:p-6 lg:p-8">
      <div className="flex min-h-svh flex-col bg-background sm:min-h-0 sm:w-full sm:max-w-xl sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:shadow-xl md:grid md:max-w-none md:w-auto md:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="border-border/60 border-b bg-background p-3 md:border-r md:border-b-0">
          <div className="px-1 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] md:px-2">
            Quick range
          </div>
          <ul className="mt-1 flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-0.5">
            {PRESETS.map((p) => {
              const active = p === preset;
              return (
                <li key={p} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPreset(p)}
                    className={
                      "min-h-8 w-full whitespace-nowrap rounded-full border px-3 py-1.5 text-left text-sm pointer-coarse:min-h-10 md:rounded-md md:border-0 md:px-2 md:pointer-coarse:min-h-8 " +
                      (active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground")
                    }
                  >
                    {p}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 border-border/60 border-t pt-3">
            <div className="px-1 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] md:px-2">
              Custom
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 md:px-1">
              <Field label="From" value={fmt(start).replace(", 2026", "")} />
              <Field label="To" value={end ? fmt(end).replace(", 2026", "") : "—"} />
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-10"
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-12">
                {MONTHS.map((m, i) => (
                  <span
                    key={m.label}
                    className={"font-mono text-xs " + (i > 0 ? "max-md:hidden" : "")}
                  >
                    <span className="md:hidden">March – April 2026</span>
                    <span className="max-md:hidden">{m.label}</span>
                  </span>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next month"
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground pointer-coarse:size-10"
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              {MONTHS.map((m, mi) => (
                <Month key={m.label} m={m} mi={mi} start={start} end={end} onPick={pick} />
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 flex flex-col gap-3 border-border/60 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:flex-row sm:items-center sm:justify-between sm:pb-4">
            <div aria-live="polite" className="font-mono text-[11px] text-muted-foreground">
              {end
                ? `${daysBetween(start, end)} days · ${fmt(start).replace(", 2026", "")} → ${fmt(end)}`
                : "Pick an end date"}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button
                variant="ghost"
                type="button"
                onClick={() => {
                  setStart({ month: 0, day: 27 });
                  setEnd({ month: 1, day: 9 });
                  setPreset("Last 14 days");
                }}
              >
                Reset
              </Button>
              <Button type="button" disabled={!end}>
                Apply range
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Month({
  m,
  mi,
  start,
  end,
  onPick,
}: {
  m: MonthSpec;
  mi: number;
  start: Day;
  end: Day | null;
  onPick: (p: Day) => void;
}) {
  const cells = Array.from({ length: m.offset + m.total }, (_, i) => i);
  return (
    <div role="group" aria-label={m.label}>
      <div className="mb-2 font-mono text-xs md:hidden">{m.label}</div>
      <div className="mb-2 grid grid-cols-7 gap-1 px-0.5">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center font-mono text-[10px] text-muted-foreground uppercase"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((c) => {
          const day = c - m.offset + 1;
          const out = day < 1 || day > m.total;
          if (out) return <span key={c} />;

          const point = { month: mi, day };
          const inRange = end ? isBetween(point, start, end) : false;
          const isStart = sameDay(point, start);
          const isEnd = end ? sameDay(point, end) : false;
          const isEdge = isStart || isEnd;

          return (
            <div key={c} className="relative">
              {inRange && !isEdge ? (
                <span className="absolute inset-0 bg-foreground/[0.06]" />
              ) : null}
              {isStart && end && !isEnd ? (
                <span className="absolute inset-y-0 right-0 left-1/2 bg-foreground/[0.06]" />
              ) : null}
              {isEnd && !isStart ? (
                <span className="absolute inset-y-0 right-1/2 left-0 bg-foreground/[0.06]" />
              ) : null}
              <button
                type="button"
                onClick={() => onPick(point)}
                aria-pressed={isEdge || inRange}
                aria-label={`${m.label.split(" ")[0]} ${day}${isStart ? ", range start" : isEnd ? ", range end" : ""}`}
                className={
                  "relative mx-auto grid size-9 place-items-center rounded-full font-mono text-xs md:size-8 pointer-coarse:size-10 " +
                  (isEdge
                    ? "bg-foreground text-background"
                    : "text-foreground/85 hover:bg-foreground/[0.08]")
                }
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function sameDay(a: { month: number; day: number }, b: { month: number; day: number }) {
  return a.month === b.month && a.day === b.day;
}

function isBetween(
  p: { month: number; day: number },
  a: { month: number; day: number },
  b: { month: number; day: number },
) {
  if (p.month < a.month || p.month > b.month) return false;
  if (p.month === a.month && p.day < a.day) return false;
  if (p.month === b.month && p.day > b.day) return false;
  return true;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background px-2 py-1.5">
      <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className="mt-0.5 truncate font-mono text-[11px]">{value}</div>
    </div>
  );
}
