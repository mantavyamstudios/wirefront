// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { CalendarEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("monthCalendar.<key>"). */
export const MONTH_CALENDAR_MESSAGES = {
  eyebrow: "Calendar · personal",
  previous: "Previous month",
  next: "Next month",
  today: "Today",
  newEvent: "Event",
  newEventLabel: "New event",
  more: "+{count} more",
  eventsOne: "{count} event",
  eventsOther: "{count} events",
  days: "{count} days",
  noEvents: "No events.",
  errorTitle: "Couldn’t load the calendar",
  retry: "Try again",
};

export interface MonthCalendarProps {
  /** The month shown, as YYYY-MM. */
  month: string;
  /** Go to another month (YYYY-MM). Prev, next and Today are hidden without it. */
  onMonthChange?: (month: string) => void;
  /** Events overlapping the month. Leave it out while they load. */
  events?: CalendarEvent[];
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** 0 = Sunday, 1 = Monday, 6 = Saturday. Defaults to 1. */
  weekStartsOn?: 0 | 1 | 6;
  /** Start a new event, on the selected day. Hidden without it. */
  onCreateEvent?: (date: string) => void;
  className?: string;
}

const TONE: Record<CalendarEvent["color"], string> = {
  indigo: "bg-category-8/15 text-category-8-foreground border-category-8/30",
  teal: "bg-category-6/15 text-category-6-foreground border-category-6/30",
  amber: "bg-category-3/15 text-category-3-foreground border-category-3/30",
  rose: "bg-category-4/15 text-category-4-foreground border-category-4/30",
  violet: "bg-category-5/15 text-category-5-foreground border-category-5/30",
  sky: "bg-category-1/15 text-category-1-foreground border-category-1/30",
};
const DOT: Record<CalendarEvent["color"], string> = { indigo: "bg-category-8", teal: "bg-category-6", amber: "bg-category-3", rose: "bg-category-4", violet: "bg-category-5", sky: "bg-category-1" };
const DAY_MS = 86_400_000;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const shiftMonth = (month: string, by: number) => {
  const d = utc(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return iso(d).slice(0, 7);
};

function MonthCalendarScreen({ month, onMonthChange, events, status = "ready", error, onRetry, weekStartsOn = 1, onCreateEvent, className }: MonthCalendarProps) {
  const t = useMessages("monthCalendar", MONTH_CALENDAR_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone, locale } = useWirefront();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now());
  const first = utc(`${month}-01`);
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const rows = Math.ceil((offset + daysInMonth) / 7);
  const [picked, setPicked] = useState<string>();
  const selected = picked?.startsWith(month) ? picked : today.startsWith(month) ? today : `${month}-01`;
  const list = events ?? [];
  const eventsOn = (date: string) => list.filter((e) => date >= e.start && date <= (e.end ?? e.start));
  const weekday = (d: Date, style: "short" | "narrow" | "long") => new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(d);
  const header = Array.from({ length: 7 }, (_, n) => new Date(Date.UTC(2026, 1, 1 + ((weekStartsOn + n) % 7)))); // Feb 1 2026 is a Sunday
  const cells = Array.from({ length: rows * 7 }, (_, n) => {
    const day = n - offset + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    return { key: inMonth ? `${month}-${String(day).padStart(2, "0")}` : `pad-${n}`, inMonth, date: inMonth ? `${month}-${String(day).padStart(2, "0")}` : "", col: n % 7, day };
  });
  const plural = (n: number) => interpolate(n === 1 ? t.eventsOne : t.eventsOther, { count: n });
  const selectedEvents = eventsOn(selected);
  const spanDays = (e: CalendarEvent) => (e.end ? Math.round((utc(e.end).getTime() - utc(e.start).getTime()) / DAY_MS) + 1 : 1);
  const navButton = "grid size-8 place-items-center rounded-md border border-border/60 outline-none hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10";

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8", className)}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 aria-live="polite" className="mt-1 font-heading text-2xl">
              {fmt.date(first, { month: "long", year: "numeric", timeZone: "UTC" })}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onMonthChange ? (
              <>
                <button aria-label={t.previous} className={navButton} onClick={() => onMonthChange(shiftMonth(month, -1))} type="button">
                  <ChevronLeftIcon aria-hidden className="size-3.5 rtl:rotate-180" />
                </button>
                <button
                  className="min-h-8 rounded-md border border-border/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
                  onClick={() => {
                    setPicked(today);
                    onMonthChange(today.slice(0, 7));
                  }}
                  type="button"
                >
                  {t.today}
                </button>
                <button aria-label={t.next} className={navButton} onClick={() => onMonthChange(shiftMonth(month, 1))} type="button">
                  <ChevronRightIcon aria-hidden className="size-3.5 rtl:rotate-180" />
                </button>
              </>
            ) : null}
            {onCreateEvent ? (
              <button
                className="ms-2 inline-flex min-h-8 items-center gap-1 rounded-md bg-foreground px-3 py-1.5 font-mono text-[11px] text-background uppercase tracking-[0.2em] outline-none focus-visible:ring-2 focus-visible:ring-ring max-sm:hidden"
                onClick={() => onCreateEvent(selected)}
                type="button"
              >
                <PlusIcon aria-hidden className="size-3" />
                <span className="sr-only">{t.newEventLabel}</span>
                <span aria-hidden>{t.newEvent}</span>
              </button>
            ) : null}
          </div>
        </div>

        {status === "error" ? (
          <div className="mt-6 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !events || status === "loading" ? (
          <Skeleton aria-busy="true" className="mt-6 h-[560px] w-full rounded-xl motion-reduce:animate-none" />
        ) : (
          <>
            {/* Month grid with chips from sm up. On phones the cells shrink to a date + dots
                and tapping a day lists its events below the grid. */}
            <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
              <div className="grid grid-cols-7 border-border/40 border-b">
                {header.map((d) => (
                  <div className="px-1 py-2 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:px-3 sm:text-start sm:tracking-[0.25em]" key={d.getUTCDay()}>
                    <span aria-hidden className="sm:hidden">
                      {weekday(d, "narrow")}
                    </span>
                    <span className="max-sm:sr-only">{weekday(d, "short")}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((c) => {
                  const all = c.inMonth ? eventsOn(c.date) : [];
                  const shown = all.slice(0, 3);
                  const isToday = c.date === today;
                  const isSelected = c.date === selected;
                  return (
                    <div className={cn("min-h-14 border-border/40 border-b sm:min-h-[110px]", c.col < 6 && "border-e", !c.inMonth && "bg-muted/20")} key={c.key}>
                      {c.inMonth ? (
                        <button
                          aria-current={isToday ? "date" : undefined}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex h-full w-full flex-col items-center gap-1 p-1 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:items-stretch sm:p-1.5",
                            isSelected ? "max-sm:bg-foreground/[0.05] sm:bg-foreground/[0.02]" : "hover:bg-foreground/[0.02]",
                          )}
                          onClick={() => setPicked(c.date)}
                          type="button"
                        >
                          <span className={cn("flex size-7 items-center justify-center rounded-full font-mono text-[12px]", isToday ? "bg-foreground text-background" : isSelected ? "ring-1 ring-foreground/40" : "text-foreground/80")}>
                            <span className="sr-only">{fmt.date(utc(c.date), { month: "long", timeZone: "UTC" })}</span>{" "}
                            {c.day}
                          </span>
                          {/* Phones: one dot per event (max 3). */}
                          {all.length ? (
                            <span aria-hidden className="flex gap-0.5 sm:hidden">
                              {shown.map((e) => (
                                <span className={cn("size-1.5 rounded-full", DOT[e.color])} key={e.id} />
                              ))}
                            </span>
                          ) : null}
                          <span aria-hidden className="flex flex-col gap-0.5 max-sm:hidden">
                            {shown.map((e) => (
                              <span className={cn("truncate rounded border px-1.5 py-0.5 text-[11px] leading-tight", TONE[e.color])} key={e.id}>
                                {e.title}
                              </span>
                            ))}
                            {all.length > 3 ? <span className="px-1 font-mono text-[10px] text-muted-foreground">{interpolate(t.more, { count: all.length - 3 })}</span> : null}
                          </span>
                          {all.length ? <span className="sr-only">{`, ${plural(all.length)}: ${all.map((e) => e.title).join(", ")}`}</span> : null}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected-day agenda (phones only — chips already show this on wider screens). */}
            <section aria-live="polite" className="mt-5 sm:hidden">
              <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{fmt.date(utc(selected), { weekday: "short", month: "long", day: "numeric", timeZone: "UTC" })}</h2>
              {selectedEvents.length ? (
                <ul className="mt-2 flex flex-col gap-2">
                  {selectedEvents.map((e) => (
                    <li className={cn("rounded-lg border px-3 py-2.5 text-sm", TONE[e.color])} key={e.id}>
                      {e.title}
                      {spanDays(e) > 1 ? <span className="ms-2 font-mono text-[11px] opacity-70">{interpolate(t.days, { count: spanDays(e) })}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-muted-foreground text-sm">{t.noEvents}</p>
              )}
            </section>
          </>
        )}
      </div>
      {onCreateEvent ? (
        // New event FAB on phones, clear of the home indicator.
        <button
          aria-label={t.newEventLabel}
          className="fixed end-4 bottom-[max(1rem,env(safe-area-inset-bottom))] grid size-14 place-items-center rounded-full bg-foreground text-background shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
          onClick={() => onCreateEvent(selected)}
          type="button"
        >
          <PlusIcon aria-hidden className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

export function MonthCalendar(props: MonthCalendarProps) {
  return (
    <ScreenBoundary name="MonthCalendar">
      <MonthCalendarScreen {...props} />
    </ScreenBoundary>
  );
}
