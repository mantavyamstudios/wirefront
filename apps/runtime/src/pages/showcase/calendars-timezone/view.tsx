// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import { CalendarCheckIcon, CheckCircle2Icon, GlobeIcon, MinusIcon, MoonIcon, PlusIcon, SearchIcon, SparklesIcon, SunIcon, XCircleIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { MeetingWindow, QuickPick } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("meetingPlanner.<key>"). */
export const MEETING_PLANNER_MESSAGES = {
  eyebrow: "{date} · sliding window",
  title: "Find a meeting time",
  hint: "Drag the window or grab its edges. Pick an hour to jump.",
  noZones: "Add a timezone to begin.",
  allWorking: "Everyone in working hours.",
  someEdge: "{working} working · {edge} on the edge.",
  someAsleep: "{asleep} asleep — try a different window.",
  findBest: "Find best",
  useTime: "Use this time",
  hours: "Timezone hours",
  window: "{from}–{to} · {hours}h",
  startAt: "Start at {hour}:00",
  shorter: "Shorter",
  longer: "Longer",
  working: "Working",
  edge: "Edge",
  asleep: "Asleep",
  remove: "Remove {city}",
  none: "No timezones yet.",
  add: "Add timezone",
  search: "Search zones, cities…",
  searchLabel: "Search timezones",
  noMatches: "No matches",
  count: "{zones} zone(s) · {more} more available",
  legend: "24h · home: {home} · live clock",
  morning: "morning",
  evening: "evening",
  quick: "Quick:",
  offset: "{home}{sign}{hours}h",
};

export interface MeetingPlannerProps {
  /** Zones people can add, as IANA ids. */
  availableZones: string[];
  /** The zones it starts with. */
  defaultZones: string[];
  /** Report the chosen zones, e.g. to save them. */
  onZonesChange?: (zones: string[]) => void;
  /** The zone the window's hours are read in, e.g. "America/New_York". */
  homeZone: string;
  /** Preset windows, in home-zone hours. */
  quickPicks?: QuickPick[];
  /** Book the chosen window (on today's date in the home zone). Hidden without it. */
  onUseTime?: (window: MeetingWindow) => void;
  /** Working hours and waking hours, in each zone's local time. Defaults to 9–17 and 7–22. */
  workHours?: [number, number];
  awakeHours?: [number, number];
  className?: string;
}

type Verdict = "ok" | "edge" | "asleep";
const HOURS = 24;
const HOUR_W = 36;
const MIN_DURATION = 1;
const MAX_DURATION = 8;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const city = (zone: string) => (zone.split("/").pop() ?? zone).replace(/_/g, " ");

/** The zone's UTC offset in minutes at an instant. */
function offsetMinutes(zone: string, at: Date) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "longOffset" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = name.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

function verdictFor(localHour: number, work: [number, number], awake: [number, number]): Verdict {
  if (localHour < awake[0] || localHour >= awake[1]) return "asleep";
  if (localHour < work[0] || localHour >= work[1]) return "edge";
  return "ok";
}

const VERDICT_TONE: Record<Verdict, string> = {
  ok: "bg-category-2/15 text-category-2-foreground",
  edge: "bg-category-3/15 text-category-3-foreground",
  asleep: "bg-category-4/15 text-category-4-foreground",
};

function VerdictPill({ verdict, label, compact }: { verdict: Verdict; label: string; compact?: boolean }) {
  const Icon = verdict === "ok" ? CheckCircle2Icon : verdict === "edge" ? SunIcon : XCircleIcon;
  // Compact: icon-only, shown under the city on phones.
  if (compact)
    return (
      <span className={cn("inline-grid size-3.5 place-items-center rounded-full sm:hidden", VERDICT_TONE[verdict])}>
        <Icon aria-hidden className="size-2.5" />
        <span className="sr-only">{label}</span>
      </span>
    );
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em]", VERDICT_TONE[verdict])}>
      <Icon aria-hidden className="size-2.5" />
      {label}
    </span>
  );
}

function MeetingPlannerScreen({ availableZones, defaultZones, onZonesChange, homeZone, quickPicks = [], onUseTime, workHours = [9, 17], awakeHours = [7, 22], className }: MeetingPlannerProps) {
  const t = useMessages("meetingPlanner", MEETING_PLANNER_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const uid = useId();
  const [zones, setZones] = useState(defaultZones);
  const [start, setStart] = useState(13);
  const [duration, setDuration] = useState(3);
  const [query, setQuery] = useState("");
  const [pulse, setPulse] = useState(false);
  const at = now();
  const homeOffset = offsetMinutes(homeZone, at);
  const rows = zones
    .map((zone) => ({ zone, offset: (offsetMinutes(zone, at) - homeOffset) / 60 }))
    .sort((a, b) => a.offset - b.offset);
  const localHour = (offset: number, h: number) => (((h + offset) % 24) + 24) % 24;
  const verdicts = rows.map((r) => {
    let worst: Verdict = "ok";
    for (let i = 0; i < duration; i++) {
      const v = verdictFor(localHour(r.offset, start + i), workHours, awakeHours);
      if (v === "asleep") worst = "asleep";
      else if (v === "edge" && worst === "ok") worst = "edge";
    }
    return worst;
  });
  const count = (v: Verdict) => verdicts.filter((x) => x === v).length;
  const headline = !rows.length ? t.noZones : !count("asleep") && !count("edge") ? t.allWorking : !count("asleep") ? interpolate(t.someEdge, { working: count("ok"), edge: count("edge") }) : interpolate(t.someAsleep, { asleep: count("asleep") });
  const updateZones = (next: string[]) => {
    setZones(next);
    onZonesChange?.(next);
  };
  const available = availableZones.filter((z) => !zones.includes(z));
  const q = query.trim().toLowerCase();
  const matches = available.filter((z) => !q || z.toLowerCase().includes(q) || city(z).toLowerCase().includes(q));
  const short = (zone: string) => new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(at).find((p) => p.type === "timeZoneName")?.value ?? "";
  const offsetLabel = (o: number) => interpolate(t.offset, { home: city(homeZone), sign: o > 0 ? "+" : o < 0 ? "−" : "±", hours: Math.abs(o) });

  const findBest = () => {
    let best = 0;
    let bestScore = -Infinity;
    for (let s = 0; s + duration <= HOURS; s++) {
      let score = 0;
      for (const r of rows) for (let i = 0; i < duration; i++) score += { ok: 3, edge: 1, asleep: -3 }[verdictFor(localHour(r.offset, s + i), workHours, awakeHours)];
      // Tiebreak: prefer windows centred near 13:00 home time.
      score -= Math.abs(s + duration / 2 - 13) * 0.05;
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    }
    setStart(best);
    setPulse(true);
  };
  useEffect(() => {
    if (!pulse) return;
    const id = setTimeout(() => setPulse(false), 900);
    return () => clearTimeout(id);
  }, [pulse]);

  // Pointer dragging: the window moves, its edges resize, and pressing the track jumps.
  // Listeners go on the grid with the latest state in a ref, so the markup stays static.
  const gridRef = useRef<HTMLDivElement>(null);
  const live = useRef({ start, duration });
  live.current = { start, duration };
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let drag: { mode: string; x: number; start: number; duration: number } | null = null;
    const down = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      const mode = target.closest<HTMLElement>("[data-drag]")?.dataset.drag;
      const track = target.closest<HTMLElement>("[data-track]");
      if (!track) return;
      e.preventDefault();
      if (mode) {
        drag = { mode, x: e.clientX, ...live.current };
        grid.setPointerCapture(e.pointerId);
        return;
      }
      const rect = track.getBoundingClientRect();
      const ltr = getComputedStyle(track).direction !== "rtl";
      const x = ltr ? e.clientX - rect.left : rect.right - e.clientX;
      setStart(clamp(Math.floor(x / HOUR_W), 0, HOURS - live.current.duration));
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const rtl = getComputedStyle(grid).direction === "rtl";
      const delta = Math.round(((rtl ? -1 : 1) * (e.clientX - drag.x)) / HOUR_W);
      if (drag.mode === "move") setStart(clamp(drag.start + delta, 0, HOURS - drag.duration));
      else if (drag.mode === "start") {
        const next = clamp(drag.start + delta, Math.max(0, drag.start + drag.duration - MAX_DURATION), drag.start + drag.duration - MIN_DURATION);
        setStart(next);
        setDuration(drag.start + drag.duration - next);
      } else setDuration(clamp(drag.duration + delta, MIN_DURATION, Math.min(MAX_DURATION, HOURS - drag.start)));
    };
    const up = (e: PointerEvent) => {
      if (drag && grid.hasPointerCapture(e.pointerId)) grid.releasePointerCapture(e.pointerId);
      drag = null;
    };
    grid.addEventListener("pointerdown", down);
    grid.addEventListener("pointermove", move);
    grid.addEventListener("pointerup", up);
    grid.addEventListener("pointercancel", up);
    return () => {
      grid.removeEventListener("pointerdown", down);
      grid.removeEventListener("pointermove", move);
      grid.removeEventListener("pointerup", up);
      grid.removeEventListener("pointercancel", up);
    };
  }, []);

  const bookWindow = () => {
    if (!onUseTime) return;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: homeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
    const midnight = new Date(`${day}T00:00:00Z`).getTime() - homeOffset * 60_000;
    onUseTime({ start: new Date(midnight + start * 3_600_000).toISOString(), end: new Date(midnight + (start + duration) * 3_600_000).toISOString() });
  };
  const two = (h: number) => String(Math.floor(h)).padStart(2, "0") + (h % 1 ? `:${String(Math.round((h % 1) * 60)).padStart(2, "0")}` : "");

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 text-foreground sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { date: fmt.date(at, { weekday: "long", month: "short", day: "numeric", timeZone: homeZone }) })}</div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
            <p className="mt-1 text-muted-foreground text-sm">
              {t.hint}{" "}
              <span aria-live="polite" className="text-foreground">
                {headline}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button className={cn(pulse && "ring-2 ring-category-2/40")} disabled={!rows.length} onClick={findBest} size="sm" type="button" variant="outline">
              <SparklesIcon aria-hidden />
              {t.findBest}
            </Button>
            {onUseTime ? (
              <Button disabled={!rows.length} onClick={bookWindow} size="sm" type="button">
                <CalendarCheckIcon aria-hidden />
                {t.useTime}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          {/* One scroller for the hour ruler and every row, with the zone column pinned. */}
          <ScrollRegion aria-label={t.hours} orientation="horizontal">
            <div className="min-w-max" ref={gridRef}>
              <div className="grid grid-cols-[136px_auto] sm:grid-cols-[220px_auto]">
                <div className="sticky start-0 z-20 flex items-center gap-1 border-border/40 border-e border-b bg-background px-2.5 font-mono text-[10px] text-foreground/80 tracking-[0.1em] sm:px-3">
                  <span aria-live="polite" className="flex-1">
                    {interpolate(t.window, { from: `${two(start)}:00`, to: `${two(start + duration)}:00`, hours: duration })}
                  </span>
                  <button aria-label={t.shorter} className="grid size-6 place-items-center rounded outline-none hover:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40" disabled={duration <= MIN_DURATION} onClick={() => setDuration((d) => d - 1)} type="button">
                    <MinusIcon aria-hidden className="size-3" />
                  </button>
                  <button
                    aria-label={t.longer}
                    className="grid size-6 place-items-center rounded outline-none hover:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
                    disabled={duration >= MAX_DURATION || start + duration >= HOURS}
                    onClick={() => setDuration((d) => d + 1)}
                    type="button"
                  >
                    <PlusIcon aria-hidden className="size-3" />
                  </button>
                </div>
                <div className="relative grid border-border/40 border-b" style={{ gridTemplateColumns: `repeat(${HOURS}, ${HOUR_W}px)`, width: HOURS * HOUR_W }}>
                  {Array.from({ length: HOURS }, (_, h) => h).map((h) => (
                    <button
                      aria-label={interpolate(t.startAt, { hour: two(h) })}
                      aria-pressed={h === start}
                      className={cn("border-border/40 border-s py-1.5 text-center font-mono text-[10px] outline-none hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset", h >= start && h < start + duration ? "text-foreground" : "text-muted-foreground")}
                      key={h}
                      onClick={() => setStart(clamp(h, 0, HOURS - duration))}
                      type="button"
                    >
                      <span aria-hidden>{two(h)}</span>
                    </button>
                  ))}
                </div>
              </div>
              <ul>
                {rows.map((r, ri) => {
                  const v = verdicts[ri] ?? "ok";
                  const label = { ok: t.working, edge: t.edge, asleep: t.asleep }[v];
                  return (
                    <li className="group grid grid-cols-[136px_auto] border-border/40 border-b last:border-b-0 sm:grid-cols-[220px_auto]" key={r.zone}>
                      <div className="sticky start-0 z-20 flex items-center gap-2 border-border/40 border-e bg-background px-2.5 py-2 sm:px-3 sm:py-2.5">
                        <div aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] font-mono text-[9px] max-lg:hidden">
                          {short(r.zone)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{city(r.zone)}</div>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                            <VerdictPill compact label={label} verdict={v} />
                            <time dateTime={at.toISOString()}>{fmt.time(at, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: r.zone })}</time>
                          </div>
                        </div>
                        <span className="max-sm:hidden">
                          <VerdictPill label={label} verdict={v} />
                        </span>
                        <button
                          aria-label={interpolate(t.remove, { city: city(r.zone) })}
                          className="inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 outline-none transition-all hover:bg-foreground/[0.06] hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100"
                          onClick={() => updateZones(zones.filter((z) => z !== r.zone))}
                          type="button"
                        >
                          <XIcon aria-hidden className="size-3" />
                        </button>
                      </div>
                      <div aria-hidden className="relative h-12 cursor-pointer" data-track style={{ width: HOURS * HOUR_W }}>
                        {Array.from({ length: HOURS }, (_, h) => h).map((h) => {
                          const local = localHour(r.offset, h);
                          const sleeping = local < awakeHours[0] || local >= awakeHours[1];
                          return (
                            <div
                              className={cn(
                                "absolute top-0 bottom-0 border-border/40 border-s",
                                sleeping ? "bg-category-8/[0.18]" : local < 12 ? "bg-category-3/[0.08]" : local >= 18 ? "bg-category-4/[0.06]" : "",
                              )}
                              key={h}
                              style={{ insetInlineStart: h * HOUR_W, width: HOUR_W }}
                            >
                              <span className={cn("pointer-events-none absolute start-1 top-1/2 -translate-y-1/2 font-mono text-[10px]", sleeping ? "text-muted-foreground" : "text-foreground/85")}>
                                {two(local)}
                                {local === 0 ? <MoonIcon className="ms-1 inline-block size-2.5 opacity-50" /> : null}
                                {local === 12 ? <SunIcon className="ms-1 inline-block size-2.5 opacity-50" /> : null}
                              </span>
                            </div>
                          );
                        })}
                        <div
                          className={cn(
                            // touch-none: dragging the window must not scroll the grid.
                            "absolute top-1 bottom-1 cursor-grab touch-none select-none rounded-md border-2 shadow-sm transition-all active:cursor-grabbing",
                            v === "asleep" ? "border-category-4/70 bg-category-4/[0.08]" : v === "edge" ? "border-category-3/70 bg-category-3/[0.08]" : "border-foreground bg-foreground/[0.06]",
                            pulse && "ring-2 ring-category-2/60",
                          )}
                          data-drag="move"
                          style={{ insetInlineStart: start * HOUR_W, width: duration * HOUR_W }}
                        >
                          <div className="absolute start-0 top-0 bottom-0 w-1.5 cursor-ew-resize rounded-s-md bg-foreground/20 transition-colors hover:bg-foreground/40 pointer-coarse:w-3" data-drag="start" />
                          <div className="absolute end-0 top-0 bottom-0 w-1.5 cursor-ew-resize rounded-e-md bg-foreground/20 transition-colors hover:bg-foreground/40 pointer-coarse:w-3" data-drag="end" />
                        </div>
                      </div>
                    </li>
                  );
                })}
                {!rows.length ? <li className="px-6 py-12 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.none}</li> : null}
              </ul>
            </div>
          </ScrollRegion>
          <div className="flex flex-wrap items-center justify-between gap-3 border-border/40 border-t px-3 py-2.5">
            <Popover onOpenChange={(open) => !open && setQuery("")}>
              <PopoverTrigger render={<Button disabled={!available.length} size="sm" type="button" variant="outline" />}>
                <PlusIcon aria-hidden />
                {t.add}
              </PopoverTrigger>
              <PopoverContent align="start" className="!w-80 !p-0 overflow-hidden" side="top">
                <div className="flex items-center gap-2 border-border/60 border-b px-3 py-2">
                  <SearchIcon aria-hidden className="size-3.5 opacity-50" />
                  <input
                    aria-label={t.searchLabel}
                    className="h-7 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    id={`${uid}-search`}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.search}
                    type="search"
                    value={query}
                  />
                </div>
                <ul className="max-h-80 overflow-y-auto py-1">
                  {matches.length === 0 ? (
                    <li className="px-3 py-6 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.noMatches}</li>
                  ) : (
                    matches.map((z) => (
                      <li key={z}>
                        <button
                          className="flex w-full items-center gap-3 px-3 py-2 text-start outline-none transition-colors hover:bg-foreground/[0.04] focus-visible:bg-foreground/[0.06]"
                          onClick={() => {
                            updateZones([...zones, z]);
                            setQuery("");
                          }}
                          type="button"
                        >
                          <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-md bg-foreground/[0.06] font-mono text-[9px]">
                            {short(z)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{city(z)}</span>
                            <span className="block truncate font-mono text-[10px] text-muted-foreground">
                              {z} · {offsetLabel((offsetMinutes(z, at) - homeOffset) / 60)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </PopoverContent>
            </Popover>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.count, { zones: rows.length, more: available.length })}</span>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 border-border/40 border-t px-4 py-3 sm:flex-row sm:items-center">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              <GlobeIcon aria-hidden className="size-3" />
              {interpolate(t.legend, { home: city(homeZone) })}
            </span>
            <span className="flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded bg-category-3/40" /> {t.morning}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded bg-category-4/30" /> {t.evening}
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2.5 rounded bg-category-8/40" /> {t.asleep}
              </span>
            </span>
          </div>
        </div>

        {quickPicks.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.quick}</span>
            {quickPicks.map((p) => {
              const active = p.start === start && p.hours === duration;
              return (
                <button
                  aria-pressed={active}
                  className={cn(
                    "min-h-8 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10",
                    active ? "border-foreground bg-foreground text-background" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  key={p.id}
                  onClick={() => {
                    setStart(p.start);
                    setDuration(p.hours);
                  }}
                  type="button"
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MeetingPlanner(props: MeetingPlannerProps) {
  return (
    <ScreenBoundary name="MeetingPlanner">
      <MeetingPlannerScreen {...props} />
    </ScreenBoundary>
  );
}
