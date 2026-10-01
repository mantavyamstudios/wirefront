import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const EVENTS_BY_DAY: Record<number, { count: number; tones: string[] }> = {
  3: { count: 1, tones: ["bg-indigo-500"] },
  7: { count: 2, tones: ["bg-amber-500", "bg-rose-500"] },
  9: { count: 1, tones: ["bg-teal-500"] },
  12: { count: 1, tones: ["bg-rose-500"] },
  14: { count: 3, tones: ["bg-indigo-500", "bg-violet-500", "bg-sky-500"] },
  18: { count: 1, tones: ["bg-teal-500"] },
  22: { count: 1, tones: ["bg-violet-500"] },
  24: { count: 2, tones: ["bg-amber-500", "bg-indigo-500"] },
  26: { count: 4, tones: ["bg-indigo-500", "bg-rose-500", "bg-teal-500", "bg-amber-500"] },
  28: { count: 1, tones: ["bg-sky-500"] },
  30: { count: 1, tones: ["bg-violet-500"] },
};

export function CalendarsMiniShowcasePage() {
  const offset = 2; // April 1 = Wed
  const total = 30;
  const cells = offset + total;
  const rows = Math.ceil(cells / 7);

  return (
    <div className="grid min-h-svh place-items-center bg-background p-4 sm:p-8">
      <div className="grid w-full max-w-80 grid-cols-1 gap-6 md:w-auto md:max-w-none md:grid-cols-2 md:items-start">
        <div className="w-full rounded-xl md:w-72 border border-border bg-background p-4 shadow-sm">
          <Header />
          <Days />
          <Grid offset={offset} total={total} rows={rows} />
          <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            <span>4 events today</span>
            <button
              type="button"
              className="-mr-2 min-h-8 rounded px-2 hover:text-foreground pointer-coarse:min-h-10"
            >
              Open →
            </button>
          </div>
        </div>

        {/* Embedded with selected day expanded */}
        <div className="w-full rounded-xl md:w-80 border border-border bg-background p-4 shadow-sm">
          <Header />
          <Days />
          <Grid offset={offset} total={total} rows={rows} />

          <div className="mt-4 border-border/60 border-t pt-3">
            <div className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              Sat, Apr 26
            </div>
            <ul className="flex flex-col gap-1.5 text-sm">
              {[
                { time: "09:30", tone: "bg-indigo-500", title: "Eng standup" },
                { time: "13:00", tone: "bg-rose-500", title: "Design crit" },
                { time: "16:00", tone: "bg-teal-500", title: "Audit log review" },
              ].map((e) => (
                <li key={e.time} className="flex items-center gap-3">
                  <span className={"size-1.5 rounded-full " + e.tone} />
                  <span className="w-12 font-mono text-xs text-muted-foreground">
                    {e.time}
                  </span>
                  <span className="truncate">{e.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="font-heading text-sm">April 2026</div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous month"
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
        >
          <ChevronLeftIcon className="size-3" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground pointer-coarse:size-10"
        >
          <ChevronRightIcon className="size-3" />
        </button>
      </div>
    </div>
  );
}

function Days() {
  return (
    <div className="grid grid-cols-7 gap-1">
      {DAYS.map((d) => (
        <div
          key={d}
          className="text-center font-mono text-[10px] text-muted-foreground uppercase"
        >
          {d}
        </div>
      ))}
    </div>
  );
}

function Grid({
  offset,
  total,
  rows,
}: {
  offset: number;
  total: number;
  rows: number;
}) {
  const [selected, setSelected] = useState(26);
  return (
    <div className="mt-2 grid grid-cols-7 gap-1">
      {Array.from({ length: rows * 7 }).map((_, i) => {
        const day = i - offset + 1;
        const out = day < 1 || day > total;
        const today = day === 26;
        const evt = !out ? EVENTS_BY_DAY[day] : undefined;
        if (out) return <span key={i} aria-hidden className="h-9" />;
        const count = evt?.count ?? 0;
        return (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(day)}
            aria-pressed={selected === day}
            aria-current={today ? "date" : undefined}
            aria-label={`April ${day}${count ? `, ${count} event${count > 1 ? "s" : ""}` : ""}`}
            className="relative grid h-9 place-items-center rounded-md font-mono text-xs hover:bg-foreground/[0.05] pointer-coarse:h-10"
          >
            {(
              <>
                <span
                  className={
                    "grid size-7 place-items-center rounded-full " +
                    (today
                      ? "bg-foreground text-background"
                      : selected === day
                        ? "ring-1 ring-foreground/40"
                        : "text-foreground/85")
                  }
                >
                  {day}
                </span>
                {evt ? (
                  <span aria-hidden className="absolute bottom-1 flex gap-0.5">
                    {evt.tones.slice(0, 3).map((t, ti) => (
                      <span
                        key={ti}
                        className={"size-1 rounded-full " + t}
                      />
                    ))}
                  </span>
                ) : null}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
