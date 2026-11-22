// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import type { MiniEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("miniCalendar.<key>"). */
export const MINI_CALENDAR_MESSAGES = {
  previous: "Previous month",
  next: "Next month",
  eventsOne: "{count} event",
  eventsOther: "{count} events",
  todayCount: "{events} today",
  open: "Open →",
  noEvents: "No events.",
};

export interface MiniCalendarProps {
  /** The month shown, as YYYY-MM. */
  month: string;
  /** Go to another month. The arrows are hidden without it. */
  onMonthChange?: (month: string) => void;
  /** Events in the month; each adds a dot to its day. */
  events: MiniEvent[];
  /** 0 = Sunday, 1 = Monday, 6 = Saturday. Defaults to 1. */
  weekStartsOn?: 0 | 1 | 6;
  /** List the selected day's events under the grid. */
  showDayList?: boolean;
  /** Where "Open" goes, e.g. the full calendar. Hidden when not given. */
  openHref?: string;
  className?: string;
}

const DOT: Record<MiniEvent["color"], string> = {
  indigo: "bg-category-8",
  teal: "bg-category-6",
  amber: "bg-category-3",
  rose: "bg-category-4",
  violet: "bg-category-5",
  sky: "bg-category-1",
};
const utc = (date: string) => new Date(`${date}T00:00:00Z`);
const shiftMonth = (month: string, by: number) => {
  const d = utc(`${month}-01`);
  d.setUTCMonth(d.getUTCMonth() + by);
  return d.toISOString().slice(0, 7);
};

function MiniCalendarScreen({
  month,
  onMonthChange,
  events,
  weekStartsOn = 1,
  showDayList,
  openHref,
  className,
}: MiniCalendarProps) {
  const t = useMessages("miniCalendar", MINI_CALENDAR_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone, locale } = useWirefront();
  const dayKey = (d: Date | string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(d));
  const today = dayKey(now());
  const [picked, setPicked] = useState<string>();
  const selected = picked?.startsWith(month)
    ? picked
    : today.startsWith(month)
      ? today
      : `${month}-01`;
  const first = utc(`${month}-01`);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const offset = (first.getUTCDay() - weekStartsOn + 7) % 7;
  const rows = Math.ceil((offset + daysInMonth) / 7);
  const byDay = new Map<string, MiniEvent[]>();
  for (const e of [...events].sort((a, b) => a.start.localeCompare(b.start))) {
    const k = dayKey(e.start);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }
  const plural = (n: number) =>
    interpolate(n === 1 ? t.eventsOne : t.eventsOther, { count: n });
  const cells = Array.from({ length: rows * 7 }, (_, n) => {
    const day = n - offset + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    const date = `${month}-${String(day).padStart(2, "0")}`;
    return { key: inMonth ? date : `pad-${n}`, inMonth, date, day };
  });
  const header = Array.from(
    { length: 7 },
    (_, n) => new Date(Date.UTC(2026, 1, 1 + ((weekStartsOn + n) % 7)))
  );
  const navButton =
    "grid size-7 place-items-center rounded text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10";
  const todayCount = (byDay.get(today) ?? []).length;
  const dayEvents = byDay.get(selected) ?? [];

  return (
    <section
      aria-label={fmt.date(first, {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })}
      className={cn(
        "w-full rounded-xl border border-border bg-background p-4 shadow-sm",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 aria-live="polite" className="font-heading text-sm">
          {fmt.date(first, { month: "long", year: "numeric", timeZone: "UTC" })}
        </h2>
        {onMonthChange ? (
          <div className="flex items-center gap-1">
            <button
              aria-label={t.previous}
              className={navButton}
              onClick={() => onMonthChange(shiftMonth(month, -1))}
              type="button"
            >
              <ChevronLeftIcon aria-hidden className="size-3 rtl:rotate-180" />
            </button>
            <button
              aria-label={t.next}
              className={navButton}
              onClick={() => onMonthChange(shiftMonth(month, 1))}
              type="button"
            >
              <ChevronRightIcon aria-hidden className="size-3 rtl:rotate-180" />
            </button>
          </div>
        ) : null}
      </div>
      <div aria-hidden className="grid grid-cols-7 gap-1">
        {header.map((d) => (
          <div
            className="text-center font-mono text-[10px] text-muted-foreground uppercase"
            key={d.getUTCDay()}
          >
            {new Intl.DateTimeFormat(locale, {
              weekday: "short",
              timeZone: "UTC",
            })
              .format(d)
              .slice(0, 2)}
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {cells.map((c) => {
          if (!c.inMonth)
            return <span aria-hidden className="h-9" key={c.key} />;
          const list = byDay.get(c.date) ?? [];
          const isToday = c.date === today;
          return (
            <button
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected === c.date}
              className="relative grid h-9 place-items-center rounded-md font-mono text-xs outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10"
              key={c.key}
              onClick={() => setPicked(c.date)}
              type="button"
            >
              <span
                className={cn(
                  "grid size-7 place-items-center rounded-full",
                  isToday
                    ? "bg-foreground text-background"
                    : selected === c.date
                      ? "ring-1 ring-foreground/40"
                      : "text-foreground/85"
                )}
              >
                <span className="sr-only">
                  {fmt.date(utc(c.date), { month: "long", timeZone: "UTC" })}
                </span>{" "}
                {c.day}
              </span>
              {list.length ? (
                <>
                  <span aria-hidden className="absolute bottom-1 flex gap-0.5">
                    {list.slice(0, 3).map((e) => (
                      <span
                        className={cn("size-1 rounded-full", DOT[e.color])}
                        key={e.id}
                      />
                    ))}
                  </span>
                  <span className="sr-only">, {plural(list.length)}</span>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
      {showDayList ? (
        <div aria-live="polite" className="mt-4 border-border/60 border-t pt-3">
          <h3 className="mb-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
            {fmt.date(utc(selected), {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </h3>
          {dayEvents.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {dayEvents.map((e) => (
                <li className="flex items-center gap-3" key={e.id}>
                  <span
                    aria-hidden
                    className={cn("size-1.5 rounded-full", DOT[e.color])}
                  />
                  <time
                    className="w-12 font-mono text-muted-foreground text-xs"
                    dateTime={e.start}
                  >
                    {fmt.time(e.start, { hour: "2-digit", minute: "2-digit" })}
                  </time>
                  <span className="truncate">{e.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">{t.noEvents}</p>
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <span>
            {interpolate(t.todayCount, { events: plural(todayCount) })}
          </span>
          {openHref ? (
            <WirefrontLink
              className="-me-2 inline-flex min-h-8 items-center rounded px-2 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
              href={openHref}
            >
              {t.open}
            </WirefrontLink>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function MiniCalendar(props: MiniCalendarProps) {
  return (
    <ScreenBoundary name="MiniCalendar">
      <MiniCalendarScreen {...props} />
    </ScreenBoundary>
  );
}
