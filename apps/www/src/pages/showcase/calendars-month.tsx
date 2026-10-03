import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";

interface Event {
  day: number; // day of April
  title: string;
  span?: number; // number of days
  tone: "indigo" | "teal" | "amber" | "rose" | "violet" | "sky";
}

const EVENTS: Event[] = [
  { day: 1, title: "Q2 kickoff", span: 1, tone: "indigo" },
  { day: 3, title: "Eng offsite", span: 3, tone: "violet" },
  { day: 7, title: "1:1 Maya", tone: "amber" },
  { day: 9, title: "Sales review", tone: "teal" },
  { day: 12, title: "Design crit", tone: "rose" },
  { day: 14, title: "Launch v3.4", tone: "indigo" },
  { day: 15, title: "AMA", tone: "sky" },
  { day: 18, title: "Vacation", span: 5, tone: "teal" },
  { day: 22, title: "Board meeting", tone: "violet" },
  { day: 24, title: "Customer call · BigCorp", tone: "amber" },
  { day: 26, title: "Sprint demo", tone: "indigo" },
  { day: 26, title: "Coffee w/ Riya", tone: "rose" },
  { day: 26, title: "Audit log review", tone: "teal" },
  { day: 28, title: "Retro", tone: "sky" },
  { day: 30, title: "Q3 planning", tone: "violet" },
];

const TONE: Record<Event["tone"], string> = {
  indigo: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  rose: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  sky: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
};

const DOT: Record<Event["tone"], string> = {
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  violet: "bg-violet-500",
  sky: "bg-sky-500",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VIEWS = ["Day", "Week", "Month"] as const;

// Multi-day events show on every day they cover.
function eventsOn(day: number) {
  return EVENTS.filter((e) => day >= e.day && day < e.day + (e.span ?? 1));
}

// Month grid with chips from sm up. On phones the cells shrink to a date + dots
// and tapping a day lists its events below the grid (Google/Fantastical-style).
export function CalendarsMonthShowcasePage() {
  // April 2026 — starts on Wed (day 1)
  const offset = 2; // days before April 1 (Mon=0, Tue=1, Wed=2)
  const totalDays = 30;
  const cells = offset + totalDays;
  const rows = Math.ceil(cells / 7);
  const TODAY = 26;
  const [selected, setSelected] = useState(TODAY);
  const [view, setView] = useState<(typeof VIEWS)[number]>("Month");
  const selectedEvents = eventsOn(selected);

  return (
    <div className="min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Calendar · personal
            </div>
            <h1 className="mt-1 font-heading text-2xl">April 2026</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              className="grid size-8 place-items-center rounded-md border border-border/60 hover:bg-foreground/[0.04] pointer-coarse:size-10"
            >
              <ChevronLeftIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelected(TODAY)}
              className="min-h-8 rounded-md border border-border/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] pointer-coarse:min-h-10"
            >
              Today
            </button>
            <button
              type="button"
              aria-label="Next month"
              className="grid size-8 place-items-center rounded-md border border-border/60 hover:bg-foreground/[0.04] pointer-coarse:size-10"
            >
              <ChevronRightIcon className="size-3.5" />
            </button>
            <div
              role="group"
              aria-label="Calendar view"
              className="ml-auto flex items-center rounded-md border border-border/60 p-0.5 font-mono text-[10px] uppercase tracking-[0.2em] sm:ml-2"
            >
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className="min-h-7 rounded px-2.5 py-1 text-muted-foreground hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background pointer-coarse:min-h-9"
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="ml-2 inline-flex min-h-8 items-center gap-1 rounded-md bg-foreground px-3 py-1.5 font-mono text-[11px] text-background uppercase tracking-[0.2em] max-sm:hidden"
            >
              <PlusIcon className="size-3" />
              Event
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          <div className="grid grid-cols-7 border-border/40 border-b">
            {DAYS.map((d) => (
              <div
                key={d}
                className="px-1 py-2 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:px-3 sm:text-left sm:tracking-[0.25em]"
              >
                <span aria-hidden className="sm:hidden">{d[0]}</span>
                <span className="max-sm:sr-only">{d}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: rows * 7 }).map((_, i) => {
              const day = i - offset + 1;
              const out = day < 1 || day > totalDays;
              const isToday = day === TODAY;
              const isSelected = day === selected;
              const all = out ? [] : eventsOn(day);
              const dayEvents = all.slice(0, 3);
              const overflow = all.length - 3;
              const col = i % 7;
              return (
                <div
                  key={i}
                  className={
                    "min-h-14 border-border/40 border-b sm:min-h-[110px] " +
                    (col < 6 ? "border-r " : "") +
                    (out ? "bg-muted/20" : "")
                  }
                >
                  {!out ? (
                    <button
                      type="button"
                      onClick={() => setSelected(day)}
                      aria-pressed={isSelected}
                      aria-label={`April ${day}${all.length ? `, ${all.length} event${all.length > 1 ? "s" : ""}` : ""}`}
                      aria-current={isToday ? "date" : undefined}
                      className={
                        "flex h-full w-full flex-col items-center gap-1 p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:items-stretch sm:p-1.5 " +
                        (isSelected ? "max-sm:bg-foreground/[0.05] sm:bg-foreground/[0.02]" : "hover:bg-foreground/[0.02]")
                      }
                    >
                      <span
                        className={
                          "flex size-7 items-center justify-center rounded-full font-mono text-[12px] " +
                          (isToday
                            ? "bg-foreground text-background"
                            : isSelected
                              ? "ring-1 ring-foreground/40"
                              : "text-foreground/80")
                        }
                      >
                        {day}
                      </span>
                      {/* Phones: one dot per event (max 3). */}
                      {all.length ? (
                        <span aria-hidden className="flex gap-0.5 sm:hidden">
                          {dayEvents.map((e, ei) => (
                            <span key={ei} className={"size-1.5 rounded-full " + DOT[e.tone]} />
                          ))}
                        </span>
                      ) : null}
                      <span aria-hidden className="flex flex-col gap-0.5 max-sm:hidden">
                        {dayEvents.map((e, ei) => (
                          <span
                            key={ei}
                            className={
                              "truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight " +
                              TONE[e.tone]
                            }
                          >
                            {e.title}
                          </span>
                        ))}
                        {overflow > 0 ? (
                          <span className="px-1 font-mono text-[10px] text-muted-foreground">
                            +{overflow} more
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected-day agenda (phones only — chips already show this on wider screens). */}
        <section aria-live="polite" className="mt-5 sm:hidden">
          <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
            {DAYS[(selected - 1 + offset) % 7]}, April {selected}
          </h2>
          {selectedEvents.length ? (
            <ul className="mt-2 flex flex-col gap-2">
              {selectedEvents.map((e, i) => (
                <li
                  key={i}
                  className={"rounded-lg border px-3 py-2.5 text-sm " + TONE[e.tone]}
                >
                  {e.title}
                  {e.span && e.span > 1 ? (
                    <span className="ml-2 font-mono text-[11px] opacity-70">
                      {e.span} days
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted-foreground text-sm">No events.</p>
          )}
        </section>
      </div>

      {/* New event FAB on phones, clear of the home indicator. */}
      <button
        type="button"
        aria-label="New event"
        className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] grid size-14 place-items-center rounded-full bg-foreground text-background shadow-lg sm:hidden"
      >
        <PlusIcon className="size-5" />
      </button>
    </div>
  );
}
