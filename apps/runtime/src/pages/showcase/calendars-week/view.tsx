// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { TimedEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("weekSchedule.<key>"). */
export const WEEK_SCHEDULE_MESSAGES = {
  range: "{from} – {to}",
  title: "Schedule",
  previous: "Previous week",
  next: "Next week",
  today: "Today",
  grid: "Week schedule",
  now: "Now",
  attendees: "{count} attendees",
  timeRange: "{start}–{end}",
  errorTitle: "Couldn’t load the schedule",
  retry: "Try again",
};

export interface WeekScheduleProps {
  /** The first day shown, as YYYY-MM-DD. */
  weekStart: string;
  /** How many days to show. Defaults to 5 (a working week). */
  days?: number;
  /** Go to another week (YYYY-MM-DD of its first day). Navigation is hidden without it. */
  onWeekChange?: (weekStart: string) => void;
  /** Events in the shown days. Leave it out while they load. */
  events?: TimedEvent[];
  /** The hours shown, 0–24. Defaults to 8–19. */
  dayStartHour?: number;
  dayEndHour?: number;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const TONE: Record<TimedEvent["color"], string> = {
  indigo: "bg-category-8/15 border-category-8/40 text-category-8-foreground",
  teal: "bg-category-6/15 border-category-6/40 text-category-6-foreground",
  amber: "bg-category-3/15 border-category-3/40 text-category-3-foreground",
  rose: "bg-category-4/15 border-category-4/40 text-category-4-foreground",
  violet: "bg-category-5/15 border-category-5/40 text-category-5-foreground",
  sky: "bg-category-1/15 border-category-1/40 text-category-1-foreground",
};
const HOUR_PX = 60;
const DAY_MS = 86_400_000;
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Assigns side-by-side lanes to overlapping events within a day. */
function layout<T extends { from: number; to: number }>(items: T[]) {
  const sorted = [...items].sort((a, b) => a.from - b.from || b.to - a.to);
  const out: (T & { lane: number; lanes: number })[] = [];
  let cluster: (T & { lane: number; lanes: number })[] = [];
  let clusterEnd = -1;
  const close = () => {
    const lanes = Math.max(1, ...cluster.map((c) => c.lane + 1));
    for (const c of cluster) c.lanes = lanes;
    out.push(...cluster);
    cluster = [];
  };
  for (const item of sorted) {
    if (item.from >= clusterEnd && cluster.length) close();
    const used = new Set(cluster.filter((c) => c.to > item.from).map((c) => c.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.to);
  }
  if (cluster.length) close();
  return out;
}

function WeekScheduleScreen({ weekStart, days = 5, onWeekChange, events, dayStartHour = 8, dayEndHour = 19, status = "ready", error, onRetry, className }: WeekScheduleProps) {
  const t = useMessages("weekSchedule", WEEK_SCHEDULE_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone, locale } = useWirefront();
  // Calendar date and minutes since midnight of an instant, in the provider's time zone.
  const local = (value: Date | string) => {
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
    return { date: `${get("year")}-${get("month")}-${get("day")}`, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
  };
  const dates = Array.from({ length: days }, (_, n) => iso(new Date(utc(weekStart).getTime() + n * DAY_MS)));
  const hours = Array.from({ length: dayEndHour - dayStartHour }, (_, n) => dayStartHour + n);
  const today = local(now());
  const first = dates[0] ?? weekStart;
  const last = dates[dates.length - 1] ?? weekStart;
  // The day count is a CSS variable so the class stays static for Tailwind.
  const columns = "grid-cols-[48px_repeat(var(--days),minmax(calc((100cqw-48px)/2),1fr))] sm:grid-cols-[64px_repeat(var(--days),minmax(0,1fr))]";
  const daysVar = { "--days": days } as CSSProperties;
  const placed = (date: string) =>
    layout(
      (events ?? [])
        .map((e) => ({ e, s: local(e.start), en: local(e.end) }))
        .filter(({ s }) => s.date === date)
        .map(({ e, s, en }) => ({ e, from: s.minutes, to: en.date === date ? en.minutes : 24 * 60 })),
    );
  const navButton = "grid size-8 place-items-center rounded-md border border-border/60 outline-none hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10";
  const hourLabel = (h: number) => fmt.time(new Date(Date.UTC(2026, 0, 1, h)), { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-8", className)}>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div aria-live="polite" className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {interpolate(t.range, { from: fmt.date(utc(first), { month: "short", day: "numeric", timeZone: "UTC" }), to: fmt.date(utc(last), { month: "short", day: "numeric", timeZone: "UTC" }) })}
            </div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
          </div>
          {onWeekChange ? (
            <div className="flex items-center gap-2">
              <button aria-label={t.previous} className={navButton} onClick={() => onWeekChange(iso(new Date(utc(weekStart).getTime() - 7 * DAY_MS)))} type="button">
                <ChevronLeftIcon aria-hidden className="size-3.5 rtl:rotate-180" />
              </button>
              <button
                className="min-h-8 rounded-md border border-border/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
                onClick={() => {
                  // The Monday of today's week.
                  const d = utc(today.date);
                  onWeekChange(iso(new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY_MS)));
                }}
                type="button"
              >
                {t.today}
              </button>
              <button aria-label={t.next} className={navButton} onClick={() => onWeekChange(iso(new Date(utc(weekStart).getTime() + 7 * DAY_MS)))} type="button">
                <ChevronRightIcon aria-hidden className="size-3.5 rtl:rotate-180" />
              </button>
            </div>
          ) : null}
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
          <Skeleton aria-busy="true" className="mt-6 h-165 w-full rounded-xl motion-reduce:animate-none" />
        ) : (
          // Equal day columns from sm up. On phones the grid scrolls horizontally,
          // two days per screen, while the hour rail stays pinned.
          <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
            <ScrollRegion aria-label={t.grid} className="@container" orientation="horizontal" style={daysVar}>
              <div className={cn("grid border-border/40 border-b", columns)}>
                <div className="sticky inset-s-0 z-20 border-border/40 border-e bg-background" />
                {dates.map((date) => (
                  <div className="border-border/40 border-e px-3 py-3 last:border-e-0" key={date}>
                    <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(utc(date))}</div>
                    <div aria-current={date === today.date ? "date" : undefined} className={cn("mt-0.5 inline-flex size-7 items-center justify-center rounded-full font-heading text-base", date === today.date && "bg-foreground text-background")}>
                      {utc(date).getUTCDate()}
                    </div>
                  </div>
                ))}
              </div>
              <div className={cn("grid", columns)}>
                <div aria-hidden className="sticky inset-s-0 z-20 border-border/40 border-e bg-background">
                  {hours.map((h) => (
                    <div className="flex items-start justify-end px-1.5 py-1 font-mono text-[10px] text-muted-foreground sm:px-2" key={h} style={{ height: HOUR_PX }}>
                      {hourLabel(h)}
                    </div>
                  ))}
                </div>
                {dates.map((date) => (
                  <div className="relative border-border/40 border-e last:border-e-0" key={date} style={{ height: hours.length * HOUR_PX }}>
                    {hours.map((h) => (
                      <div aria-hidden className="absolute inset-x-0 border-border/30 border-t" key={h} style={{ top: (h - dayStartHour) * HOUR_PX }} />
                    ))}
                    {date === today.date && today.minutes >= dayStartHour * 60 && today.minutes <= dayEndHour * 60 ? (
                      <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: ((today.minutes - dayStartHour * 60) / 60) * HOUR_PX }}>
                        <span aria-hidden className="size-2 rounded-full bg-category-4 ring-2 ring-category-4/30" />
                        <span aria-hidden className="h-px flex-1 bg-category-4" />
                        <span className="sr-only">{t.now}</span>
                      </div>
                    ) : null}
                    <ul>
                      {placed(date).map(({ e, from, to, lane, lanes }) => {
                        const top = Math.max(0, ((from - dayStartHour * 60) / 60) * HOUR_PX);
                        const height = ((to - from) / 60) * HOUR_PX;
                        return (
                          <li
                            className={cn("absolute overflow-hidden rounded-md border px-2 py-1", TONE[e.color])}
                            key={e.id}
                            style={{ top, height: Math.max(20, height - 2), insetInlineStart: `calc(${(lane / lanes) * 100}% + 4px)`, width: `calc(${100 / lanes}% - 8px)` }}
                          >
                            <div className="truncate font-medium text-[11px] leading-tight">{e.title}</div>
                            <div className="truncate font-mono text-[10px]">
                              {interpolate(t.timeRange, { start: fmt.time(e.start, { hour: "2-digit", minute: "2-digit" }), end: fmt.time(e.end, { hour: "2-digit", minute: "2-digit" }) })}
                              {e.attendees ? (
                                <>
                                  {" · "}
                                  <span className="sr-only">{interpolate(t.attendees, { count: e.attendees })}</span>
                                  <span aria-hidden>{e.attendees}</span>
                                </>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </ScrollRegion>
          </div>
        )}
      </div>
    </div>
  );
}

export function WeekSchedule(props: WeekScheduleProps) {
  return (
    <ScreenBoundary name="WeekSchedule">
      <WeekScheduleScreen {...props} />
    </ScreenBoundary>
  );
}
