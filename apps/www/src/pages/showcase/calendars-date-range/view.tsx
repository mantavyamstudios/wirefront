// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Calendar } from "@wirefront/ui/calendar";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { calendarLabels } from "@wirefront/ui/wirefront/calendar-labels";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { useState } from "react";
import type { DayRange } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("dateRangePicker.<key>"). */
export const DATE_RANGE_PICKER_MESSAGES = {
  quickRange: "Quick range",
  today: "Today",
  yesterday: "Yesterday",
  last7: "Last 7 days",
  last14: "Last 14 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  lastQuarter: "Last quarter",
  yearToDate: "Year to date",
  custom: "Custom",
  from: "From",
  to: "To",
  none: "—",
  summary: "{count} days · {from} → {to}",
  pickEnd: "Pick an end date",
  reset: "Reset",
  apply: "Apply range",
};

export interface DateRangePickerProps {
  /** The range it opens with, and returns to on Reset. */
  defaultValue: DayRange;
  /** Use the picked range. */
  onApply: (range: DayRange) => void;
  /** 0 = Sunday, 1 = Monday, 6 = Saturday. Defaults to 1. */
  weekStartsOn?: 0 | 1 | 6;
  className?: string;
}

type PresetId = "today" | "yesterday" | "last7" | "last14" | "last30" | "thisMonth" | "lastMonth" | "lastQuarter" | "yearToDate";
const PRESETS: PresetId[] = ["today", "yesterday", "last7", "last14", "last30", "thisMonth", "lastMonth", "lastQuarter", "yearToDate"];
const DAY_MS = 86_400_000;
const utc = (d: string) => new Date(`${d}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: string, n: number) => iso(new Date(utc(d).getTime() + n * DAY_MS));
/** Day strings as local Dates for the calendar, and back. */
const toLocal = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, day ?? 1);
};
const fromLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function presetRange(id: PresetId, today: string): DayRange {
  const [y, m] = today.split("-").map(Number) as [number, number];
  const monthStart = (yy: number, mm: number) => iso(new Date(Date.UTC(yy, mm - 1, 1)));
  const monthEnd = (yy: number, mm: number) => iso(new Date(Date.UTC(yy, mm, 0)));
  switch (id) {
    case "today":
      return { from: today, to: today };
    case "yesterday":
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case "last7":
      return { from: addDays(today, -6), to: today };
    case "last14":
      return { from: addDays(today, -13), to: today };
    case "last30":
      return { from: addDays(today, -29), to: today };
    case "thisMonth":
      return { from: monthStart(y, m), to: today };
    case "lastMonth":
      return { from: monthStart(y, m - 1), to: monthEnd(y, m - 1) };
    case "lastQuarter": {
      const q = Math.floor((m - 1) / 3);
      const startMonth = q * 3 - 2; // first month of the previous quarter (may be <= 0, Date.UTC rolls back a year)
      return { from: monthStart(y, startMonth), to: monthEnd(y, startMonth + 2) };
    }
    case "yearToDate":
      return { from: `${y}-01-01`, to: today };
  }
}

function DateRangePickerScreen({ defaultValue, onApply, weekStartsOn = 1, className }: DateRangePickerProps) {
  const t = useMessages("dateRangePicker", DATE_RANGE_PICKER_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone, locale } = useWirefront();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now());
  const [from, setFrom] = useState(defaultValue.from);
  const [to, setTo] = useState<string | undefined>(defaultValue.to);
  const [month, setMonth] = useState(() => toLocal(defaultValue.from));
  const active = to ? PRESETS.find((p) => {
    const r = presetRange(p, today);
    return r.from === from && r.to === to;
  }) : undefined;
  const short = (d: string) => fmt.date(utc(d), { month: "short", day: "numeric", timeZone: "UTC" });
  const long = (d: string) => fmt.date(utc(d), { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  const choose = (r: DayRange) => {
    setFrom(r.from);
    setTo(r.to);
    setMonth(toLocal(r.from));
  };

  return (
    // md+: popover-style card with a presets rail and two months side by side.
    // Phones: a full-screen sheet — presets become a wrapping chip row, the months
    // stack, and Apply sits in a sticky footer above the home indicator.
    <div className={cn("min-h-svh bg-background sm:grid sm:place-items-center sm:p-6 lg:p-8", className)}>
      <div className="flex min-h-svh flex-col bg-background sm:min-h-0 sm:w-full sm:max-w-xl sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:shadow-xl md:grid md:w-auto md:max-w-none md:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="border-border/60 border-b bg-background p-3 md:border-e md:border-b-0">
          <h2 className="px-1 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] md:px-2" id="date-range-presets">
            {t.quickRange}
          </h2>
          <ul aria-labelledby="date-range-presets" className="mt-1 flex flex-wrap gap-1.5 md:flex-col md:flex-nowrap md:gap-0.5">
            {PRESETS.map((p) => (
              <li className="shrink-0" key={p}>
                <button
                  aria-pressed={active === p}
                  className={cn(
                    "min-h-8 w-full whitespace-nowrap rounded-full border px-3 py-1.5 text-start text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10 md:rounded-md md:border-0 md:px-2 md:pointer-coarse:min-h-8",
                    active === p ? "border-foreground bg-foreground text-background" : "border-border/60 text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground",
                  )}
                  onClick={() => choose(presetRange(p, today))}
                  type="button"
                >
                  {t[p]}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-border/60 border-t pt-3">
            <h2 className="px-1 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] md:px-2">{t.custom}</h2>
            <dl className="mt-2 grid grid-cols-2 gap-1.5 md:px-1">
              <div className="rounded-md border border-border/60 bg-background px-2 py-1.5">
                <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.from}</dt>
                <dd className="mt-0.5 truncate font-mono text-[11px]">{short(from)}</dd>
              </div>
              <div className="rounded-md border border-border/60 bg-background px-2 py-1.5">
                <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">{t.to}</dt>
                <dd className="mt-0.5 truncate font-mono text-[11px]">{to ? short(to) : t.none}</dd>
              </div>
            </dl>
          </div>
        </aside>
        <div className="flex flex-1 flex-col">
          <div className="flex-1 p-4">
            <Calendar
              className="mx-auto p-0"
              labels={calendarLabels(locale)}
              mode="range"
              month={month}
              numberOfMonths={2}
              onMonthChange={setMonth}
              onSelect={(_range, day) => {
                const picked = fromLocal(day);
                // A range is picked in two clicks: start, then end; a click before the start restarts it.
                if (to || picked < from) {
                  setFrom(picked);
                  setTo(undefined);
                } else setTo(picked);
              }}
              selected={{ from: toLocal(from), to: to ? toLocal(to) : undefined }}
              today={toLocal(today)}
              weekStartsOn={weekStartsOn}
            />
          </div>
          <div className="sticky bottom-0 flex flex-col gap-3 border-border/60 border-t bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:static sm:flex-row sm:items-center sm:justify-between sm:pb-4">
            <p aria-live="polite" className="font-mono text-[11px] text-muted-foreground">
              {to ? interpolate(t.summary, { count: Math.round((utc(to).getTime() - utc(from).getTime()) / DAY_MS) + 1, from: short(from), to: long(to) }) : t.pickEnd}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
              <Button onClick={() => choose(defaultValue)} type="button" variant="ghost">
                {t.reset}
              </Button>
              <Button disabled={!to} onClick={() => to && onApply({ from, to })} type="button">
                {t.apply}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DateRangePicker(props: DateRangePickerProps) {
  return (
    <ScreenBoundary name="DateRangePicker">
      <DateRangePickerScreen {...props} />
    </ScreenBoundary>
  );
}
