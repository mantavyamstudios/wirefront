// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CoffeeIcon, MapPinIcon, VideoIcon } from "lucide-react";
import type { AgendaEvent } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("dayAgenda.<key>"). */
export const DAY_AGENDA_MESSAGES = {
  eyebrow: "{date} · agenda",
  title: "Today and tomorrow",
  summary: "{count} events · {booked} booked · {focus} focus time.",
  today: "Today",
  tomorrow: "Tomorrow",
  free: "Free · {time}",
  hours: "{h}h {m}m",
  minutes: "{m}m",
  attendees: "{count} attendees: {names}",
  nothing: "Nothing scheduled.",
  errorTitle: "Couldn’t load the agenda",
  retry: "Try again",
};

export interface DayAgendaProps {
  /** Events for today and tomorrow, in order. Leave it out while they load. */
  events?: AgendaEvent[];
  /** Gaps at least this long (minutes) are shown and count as focus time. Defaults to 15 and 30. */
  minGap?: number;
  minFocus?: number;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

const BAR: Record<AgendaEvent["color"], string> = { indigo: "bg-category-8", teal: "bg-category-6", amber: "bg-category-3", rose: "bg-category-4", violet: "bg-category-5" };
const DAY_MS = 86_400_000;
const mins = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000);

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DayAgendaScreen({ events, minGap = 15, minFocus = 30, status = "ready", error, onRetry, className }: DayAgendaProps) {
  const t = useMessages("dayAgenda", DAY_AGENDA_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const dayKey = (d: Date | string) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d));
  const today = dayKey(now());
  const tomorrow = dayKey(new Date(now().getTime() + DAY_MS));
  const span = (m: number) => (m >= 60 ? interpolate(t.hours, { h: Math.floor(m / 60), m: m % 60 }) : interpolate(t.minutes, { m }));
  const list = [...(events ?? [])].sort((a, b) => a.start.localeCompare(b.start));
  const days = [
    { id: "today", label: t.today, date: now(), items: list.filter((e) => dayKey(e.start) === today) },
    { id: "tomorrow", label: t.tomorrow, date: new Date(now().getTime() + DAY_MS), items: list.filter((e) => dayKey(e.start) === tomorrow) },
  ];
  const gapsOf = (items: AgendaEvent[]) => items.slice(1).map((e, n) => ({ before: e.id, minutes: mins(items[n]?.end ?? e.start, e.start) }));
  const shown = days.flatMap((d) => d.items);
  const booked = shown.reduce((sum, e) => sum + mins(e.start, e.end), 0);
  const focus = days.flatMap((d) => gapsOf(d.items)).reduce((sum, g) => sum + (g.minutes >= minFocus ? g.minutes : 0), 0);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-2xl">
        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { date: fmt.date(now(), { weekday: "short", month: "short", day: "numeric" }) })}</div>
        <h1 className="mt-1 font-heading text-2xl tracking-tight sm:text-3xl">{t.title}</h1>

        {status === "error" ? (
          <div className="mt-8 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !events || status === "loading" ? (
          <div aria-busy="true" className="mt-8 flex flex-col gap-2">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-16 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : (
          <>
            <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.summary, { count: shown.length, booked: span(booked), focus: span(focus) })}</p>
            {days.map((d) => {
              const gaps = new Map(gapsOf(d.items).map((g) => [g.before, g.minutes]));
              return (
                <section aria-labelledby={`agenda-${d.id}`} className="mt-8" key={d.id}>
                  <div className="mb-2 flex items-end justify-between gap-3">
                    <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]" id={`agenda-${d.id}`}>
                      {d.label}
                    </h2>
                    <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{fmt.date(d.date, { weekday: "short", month: "short", day: "numeric" })}</span>
                  </div>
                  {d.items.length === 0 ? (
                    <p className="rounded-xl border border-border/60 px-3 py-6 text-center text-muted-foreground text-sm">{t.nothing}</p>
                  ) : (
                    <ol className="flex flex-col gap-1.5">
                      {d.items.map((e) => {
                        const gap = gaps.get(e.id) ?? 0;
                        return [
                          gap >= minGap ? (
                            <li className="flex items-center gap-3 px-1 py-1.5 text-muted-foreground text-xs" key={`gap-${e.id}`}>
                              <span aria-hidden className="h-px flex-1 bg-border/40" />
                              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em]">
                                <CoffeeIcon aria-hidden className="size-3" />
                                {interpolate(t.free, { time: span(gap) })}
                              </span>
                              <span aria-hidden className="h-px flex-1 bg-border/40" />
                            </li>
                          ) : null,
                          <li className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-3 transition-colors hover:bg-background/60 sm:grid-cols-[80px_minmax(0,1fr)]" key={e.id}>
                            <div className="font-mono text-[11px]">
                              <time className="block text-foreground" dateTime={e.start}>
                                {fmt.time(e.start, { hour: "2-digit", minute: "2-digit" })}
                              </time>
                              <time className="block text-muted-foreground" dateTime={e.end}>
                                {fmt.time(e.end, { hour: "2-digit", minute: "2-digit" })}
                              </time>
                            </div>
                            {/* Attendees sit beside the text from sm, under it on phones. */}
                            <div className="grid grid-cols-[4px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[4px_minmax(0,1fr)_auto]">
                              <span aria-hidden className={cn("row-span-2 h-full min-h-12 w-1 self-stretch rounded-full sm:row-span-1", BAR[e.color])} />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm">{e.title}</div>
                                {e.location ? (
                                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                                    {e.online ? <VideoIcon aria-hidden className="size-3 shrink-0" /> : <MapPinIcon aria-hidden className="size-3 shrink-0" />}
                                    <span className="min-w-0 truncate">{e.location}</span>
                                  </div>
                                ) : null}
                                {e.detail ? <div className="mt-1 text-muted-foreground text-xs">{e.detail}</div> : null}
                              </div>
                              {e.attendees.length ? (
                                <div className="flex items-center -space-x-1.5">
                                  <span className="sr-only">{interpolate(t.attendees, { count: e.attendees.length, names: e.attendees.join(", ") })}</span>
                                  {e.attendees.slice(0, 4).map((a) => (
                                    <Avatar aria-hidden className="size-6 border-2 border-background" key={a}>
                                      <AvatarFallback className="text-[10px]">{initials(a)}</AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {e.attendees.length > 4 ? (
                                    <span aria-hidden className="grid size-6 place-items-center rounded-full border-2 border-background bg-foreground/6 font-mono text-[10px]">
                                      +{e.attendees.length - 4}
                                    </span>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </li>,
                        ];
                      })}
                    </ol>
                  )}
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

export function DayAgenda(props: DayAgendaProps) {
  return (
    <ScreenBoundary name="DayAgenda">
      <DayAgendaScreen {...props} />
    </ScreenBoundary>
  );
}
