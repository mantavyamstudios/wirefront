// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `calendar-week`).
"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  PlusIcon,
  Trash2Icon,
  UsersIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Button } from "@wirefront/ui/button";
import { Calendar } from "@wirefront/ui/calendar";
import { Kbd } from "@wirefront/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { calendarLabels } from "@wirefront/ui/wirefront/calendar-labels";
import {
  interpolate,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import type {
  CalendarSource,
  CalendarTone,
  WeekEvent as CalendarEvent,
} from "./schema";

/** Unique ids and toast keys for items created in the browser; deterministic, unlike the clock. */
let keySeq = 0;
const nextKey = () => ++keySeq;

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("calendarWeek.<key>"). */
export const CALENDAR_WEEK_MESSAGES = {
  newEvent: "New event",
  newEventKey: "N",
  calendars: "Calendars",
  keysWeek: "week",
  keysToday: "today",
  keysMove: "move event",
  keysResize: "resize",
  today: "Today",
  previousWeek: "Previous week",
  previousDay: "Previous day",
  nextWeek: "Next week",
  nextDay: "Next day",
  view: "View",
  day: "day",
  week: "week",
  weekNumber: "W{n}",
  allDay: "All day",
  allDayDetail: "All day{span} · {calendar}",
  allDaySpan: " · {count} days",
  dayColumn: "{day}, drag to create an event",
  untitled: "New event",
  defaultTitle: "Busy",
  close: "Close",
  undo: "Undo",
  moved: "{title} → {when}",
  deleted: "Deleted “{title}”",
  savedFor: "Saved for {when}",
  saveFailed: "Couldn’t save the change.",
  editEvent: "Edit event",
  eventTitle: "Event title",
  addTitle: "Add a title",
  deleteEvent: "Delete event",
  save: "Save",
  move: "move",
  resize: "resize",
  hours: "{h}h",
  hoursMinutes: "{h}h {m}m",
  minutes: "{m}m",
};

export interface CalendarWeekProps {
  /** The calendars, with whether each is shown. */
  calendars: CalendarSource[];
  /** Events around the shown weeks. */
  events: CalendarEvent[];
  /** Save a created, moved, resized or edited event; return it to replace a temporary id. Without it, changes stay on the page. */
  onSaveEvent?: Action<CalendarEvent, CalendarEvent | undefined>;
  /** Delete an event. Without it, deletes stay on the page. */
  onDeleteEvent?: Action<string>;
  className?: string;
}

type Messages = typeof CALENDAR_WEEK_MESSAGES;

const toneDot: Record<CalendarTone, string> = {
  teal: "bg-category-6",
  violet: "bg-category-5",
  sky: "bg-category-1",
  amber: "bg-category-3",
  rose: "bg-category-4",
};

const toneBlock: Record<CalendarTone, string> = {
  teal: "bg-[color-mix(in_oklab,var(--category-6)_14%,var(--background))] text-foreground before:bg-category-6 dark:bg-[color-mix(in_oklab,var(--category-6)_16%,var(--background))]",
  violet:
    "bg-[color-mix(in_oklab,var(--category-5)_14%,var(--background))] text-foreground before:bg-category-5 dark:bg-[color-mix(in_oklab,var(--category-5)_18%,var(--background))]",
  sky: "bg-[color-mix(in_oklab,var(--category-1)_14%,var(--background))] text-foreground before:bg-category-1 dark:bg-[color-mix(in_oklab,var(--category-1)_16%,var(--background))]",
  amber:
    "bg-[color-mix(in_oklab,var(--category-3)_18%,var(--background))] text-foreground before:bg-category-3 dark:bg-[color-mix(in_oklab,var(--category-3)_16%,var(--background))]",
  rose: "bg-[color-mix(in_oklab,var(--category-4)_14%,var(--background))] text-foreground before:bg-category-4 dark:bg-[color-mix(in_oklab,var(--category-4)_16%,var(--background))]",
};

const toneSolid: Record<CalendarTone, string> = {
  teal: "bg-category-6-strong text-white before:bg-category-6-strong",
  violet: "bg-category-5-strong text-white before:bg-category-5-strong",
  sky: "bg-category-1-strong text-white before:bg-category-1-strong",
  amber: "bg-category-3 text-category-3-foreground before:bg-category-3-strong",
  rose: "bg-category-4-strong text-white before:bg-category-4-strong",
};

const toneCheck: Record<CalendarTone, string> = {
  teal: "border-category-6 bg-category-6",
  violet: "border-category-5 bg-category-5",
  sky: "border-category-1 bg-category-1",
  amber: "border-category-3 bg-category-3",
  rose: "border-category-4 bg-category-4",
};

const HOUR = 48;
const PX = HOUR / 60;
const SNAP = 15;
const ease = [0.23, 1, 0.32, 1] as const;
const settle = { type: "spring", stiffness: 640, damping: 46 } as const;

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

/** Locale-aware labels for days, months, times and durations. */
function useLabels(t: Messages) {
  const { locale } = useWirefront();
  const f = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...o });
  const dow = (date: string) => f({ weekday: "short" }).format(parse(date));
  const dayName = (date: string) => f({ weekday: "long" }).format(parse(date));
  const month = (date: string, style: "long" | "short" = "long") =>
    f({ month: style }).format(parse(date));
  const time = (min: number) =>
    f({ hour: "numeric", ...(min % 60 ? { minute: "2-digit" } : {}) }).format(
      new Date(Date.UTC(2026, 0, 1, 0, min))
    );
  const range = (a: number, b: number) => `${time(a)} – ${time(b)}`;
  /** A short clock time without AM/PM, for the narrow "now" badge. */
  const clock = (min: number) =>
    f({ hour: "numeric", minute: "2-digit" })
      .formatToParts(new Date(Date.UTC(2026, 0, 1, 0, min)))
      .filter((p) => p.type !== "dayPeriod")
      .map((p) => p.value)
      .join("")
      .trim();
  const duration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h
      ? interpolate(m ? t.hoursMinutes : t.hours, { h, m })
      : interpolate(t.minutes, { m });
  };
  return { dow, dayName, month, time, range, clock, duration, locale };
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10);
}
function addDays(date: string, n: number) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
}
function weekday(date: string) {
  return (parse(date).getUTCDay() + 6) % 7;
}
function startOfWeek(date: string) {
  return addDays(date, -weekday(date));
}
function isoWeek(date: string) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + 3 - ((d.getUTCDay() + 6) % 7));
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return (
    1 +
    Math.round(
      ((d.getTime() - jan4.getTime()) / 86400000 -
        3 +
        ((jan4.getUTCDay() + 6) % 7)) /
        7
    )
  );
}

function diffDays(a: string, b: string) {
  return Math.round((parse(a).getTime() - parse(b).getTime()) / 86400000);
}
const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const HOURS_24 = Array.from({ length: 24 }, (_, h) => h);

interface Placed {
  ev: CalendarEvent;
  col: number;
  cols: number;
}

function placeDay(events: CalendarEvent[]): Placed[] {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    const cols = Math.max(1, ...cluster.map((p) => p.col + 1));
    for (const p of cluster) p.cols = cols;
    out.push(...cluster);
    cluster = [];
  };
  for (const ev of sorted) {
    if (ev.start >= clusterEnd && cluster.length) flush();
    const used = new Set(
      cluster.filter((p) => p.ev.end > ev.start).map((p) => p.col)
    );
    let col = 0;
    while (used.has(col)) col++;
    cluster.push({ ev, col, cols: 1 });
    clusterEnd = Math.max(clusterEnd, ev.end);
  }
  if (cluster.length) flush();
  return out;
}

function packAllDay(list: CalendarEvent[], first: string, count: number) {
  const rows: number[][] = [];
  return [...list]
    .sort(
      (a, b) => a.date.localeCompare(b.date) || (b.days ?? 1) - (a.days ?? 1)
    )
    .map((e) => {
      const startIdx = Math.max(0, diffDays(e.date, first));
      const endIdx = Math.min(
        count - 1,
        diffDays(addDays(e.date, (e.days ?? 1) - 1), first)
      );
      let row = rows.findIndex((r) =>
        r.every((c) => c < startIdx || c > endIdx)
      );
      if (row < 0) row = rows.push([]) - 1;
      for (let c = startIdx; c <= endIdx; c++) rows[row].push(c);
      return { e, row, startIdx, endIdx };
    });
}

function toDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}
function fromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function MiniMonth({
  month,
  onMonth,
  selected,
  today,
  weekStart,
  wholeWeek,
  onPick,
  busy,
}: {
  month: string;
  onMonth: (m: string) => void;
  selected: string;
  today: string;
  weekStart: string;
  wholeWeek: boolean;
  onPick: (d: string) => void;
  busy: Set<string>;
}) {
  const range = wholeWeek
    ? { from: toDate(weekStart), to: toDate(addDays(weekStart, 6)) }
    : { from: toDate(selected), to: toDate(selected) };
  return (
    <Calendar
      labels={calendarLabels(useWirefront().locale)}
      className="mx-auto p-0 [--cell-size:--spacing(8)] sm:[--cell-size:--spacing(8)]"
      classNames={{
        day_button: "in-data-outside:text-muted-foreground",
        weekday: "text-muted-foreground",
      }}
      mode="range"
      modifiers={{ busy: [...busy].filter((d) => d !== today).map(toDate) }}
      modifiersClassNames={{
        busy: "*:before:pointer-events-none *:before:absolute *:before:bottom-1 *:before:inset-s-1/2 *:before:size-0.75 *:before:-translate-x-1/2 *:before:rounded-full *:before:bg-muted-foreground/60 [&[data-selected]:not(.range-middle)>*]:before:bg-primary-foreground/72",
      }}
      month={toDate(month)}
      onDayClick={(day) => onPick(fromDate(day))}
      onMonthChange={(m) => onMonth(fromDate(m))}
      onSelect={() => {}}
      selected={range}
      today={toDate(today)}
      weekStartsOn={1}
    />
  );
}

type DragState = {
  id: string;
  mode: "move" | "resize" | "create";
  x: number;
  y: number;
  start: number;
  end: number;
  date: string;
  moved: boolean;
  anchorMin: number;
};

type ViewMode = "day" | "week";

function CalendarWeekScreen({
  calendars: initialCalendars,
  events: initialEvents,
  onSaveEvent,
  onDeleteEvent,
  className,
}: CalendarWeekProps) {
  const t = useMessages("calendarWeek", CALENDAR_WEEK_MESSAGES);
  const L = useLabels(t);
  const { now, timeZone } = useWirefront();
  // Today and the current minute, in the provider's time zone.
  const clock = () => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now());
    const get = (type: string) =>
      parts.find((p) => p.type === type)?.value ?? "00";
    return {
      date: `${get("year")}-${get("month")}-${get("day")}`,
      minutes: Number(get("hour")) * 60 + Number(get("minute")),
    };
  };
  const today = clock().date;
  const [nowMin, setNowMin] = useState(() => clock().minutes);
  const [calendars, setCalendars] = useState(initialCalendars);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  useEffect(() => setEvents(initialEvents), [initialEvents]);
  useEffect(() => setCalendars(initialCalendars), [initialCalendars]);
  const zoneName =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(now())
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  const saveAction = useAction(onSaveEvent ?? (async () => undefined));
  const deleteAction = useAction(onDeleteEvent ?? (async () => {}));
  const [view, setView] = useState<ViewMode>("week");
  const [focusDay, setFocusDay] = useState(today);
  const [month, setMonth] = useState(`${today.slice(0, 8)}01`);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [docked, setDocked] = useState(true);
  const [toast, setToast] = useState<{
    key: number;
    text: string;
    undo?: () => void;
  } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [allDayAt, setAllDayAt] = useState({ left: 12, top: 112 });

  useEffect(() => {
    const id = window.setInterval(
      () => setNowMin((m) => Math.min(m + 1, 24 * 60 - 1)),
      60000
    );
    return () => window.clearInterval(id);
  }, []);
  /** Saves an event; reverts to `before` (or keeps the draft) if it fails, and swaps in the saved id. */
  const persist = async (ev: CalendarEvent, before?: CalendarEvent) => {
    if (!onSaveEvent) return;
    const result = await saveAction.run(ev, ev.id);
    if (!result.ok) {
      if (before)
        setEvents((es) => es.map((e) => (e.id === ev.id ? before : e)));
      setToast({ key: nextKey(), text: result.error ?? t.saveFailed });
    } else if (result.data && result.data.id !== ev.id) {
      const saved = result.data;
      setEvents((es) => es.map((e) => (e.id === ev.id ? saved : e)));
      setSelectedId((id) => (id === ev.id ? saved.id : id));
    }
  };

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setNarrow(e.contentRect.width < 672);
      setDocked(e.contentRect.width >= 896);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 8 * HOUR - 12;
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(id);
  }, [toast]);

  const mode: ViewMode = narrow ? "day" : view;
  const weekStart = startOfWeek(focusDay);
  const days =
    mode === "week"
      ? Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
      : [focusDay];
  const visibleCal = new Set(
    calendars.filter((c) => c.visible !== false).map((c) => c.id)
  );
  const calOf = (id: string) =>
    calendars.find((c) => c.id === id) ?? calendars[0];
  const shown = events.filter((e) => visibleCal.has(e.calendar));
  const timed = shown.filter((e) => !e.allDay);
  const allDay = shown.filter(
    (e) =>
      e.allDay &&
      diffDays(addDays(e.date, (e.days ?? 1) - 1), days[0]) >= 0 &&
      diffDays(e.date, days[days.length - 1]) <= 0
  );
  const busy = new Set(shown.map((e) => e.date));
  const selected = events.find((e) => e.id === selectedId) ?? null;

  const patch = (id: string, p: Partial<CalendarEvent>) =>
    setEvents((es) => es.map((e) => (e.id === id ? { ...e, ...p } : e)));

  const goto = (d: string) => {
    setFocusDay(d);
    setMonth(`${d.slice(0, 8)}01`);
  };
  const step = (dir: number) =>
    goto(addDays(focusDay, dir * (mode === "week" ? 7 : 1)));

  const header = () => {
    const a = parse(days[0] ?? today);
    const b = parse(days[days.length - 1] ?? today);
    const first = days[0] ?? today;
    const last = days[days.length - 1] ?? today;
    if (mode === "day" && !narrow)
      return {
        main: `${L.month(first)} ${a.getUTCDate()}`,
        sub: L.dayName(first),
      };
    if (a.getUTCMonth() === b.getUTCMonth())
      return { main: L.month(first), sub: String(a.getUTCFullYear()) };
    return {
      main: `${L.month(first, "short")} – ${L.month(last, "short")}`,
      sub: String(b.getUTCFullYear()),
    };
  };
  const head = header();

  const columnWidth = () =>
    gridRef.current
      ? gridRef.current.getBoundingClientRect().width / days.length
      : 1;

  const minuteAt = (clientY: number) => {
    const r = gridRef.current?.getBoundingClientRect();
    if (!r) return 0;
    return Math.max(0, Math.min(24 * 60, (clientY - r.top) / PX));
  };

  const beginDrag = (
    e: ReactPointerEvent,
    ev: CalendarEvent,
    m: "move" | "resize"
  ) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({
      id: ev.id,
      mode: m,
      x: e.clientX,
      y: e.clientY,
      start: ev.start,
      end: ev.end,
      date: ev.date,
      moved: false,
      anchorMin: 0,
    });
  };

  const beginCreate = (e: ReactPointerEvent, date: string) => {
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const at = Math.floor(minuteAt(e.clientY) / SNAP) * SNAP;
    const ev: CalendarEvent = {
      id: `new-${nextKey()}`,
      title: "",
      calendar: calendars[0]?.id ?? "me",
      date,
      start: at,
      end: at + 30,
    };
    setEvents((es) => [...es, ev]);
    setSelectedId(null);
    setEditing(null);
    setDrag({
      id: ev.id,
      mode: "create",
      x: e.clientX,
      y: e.clientY,
      start: at,
      end: at + 30,
      date,
      moved: false,
      anchorMin: at,
    });
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag) return;
    const dy = e.clientY - drag.y;
    const dx = e.clientX - drag.x;
    const moved = drag.moved || Math.abs(dy) > 3 || Math.abs(dx) > 3;
    if (!moved) return;
    if (!drag.moved) setDrag({ ...drag, moved: true });
    const deltaMin = snap(dy / PX);
    if (drag.mode === "move") {
      const len = drag.end - drag.start;
      const start = Math.max(0, Math.min(24 * 60 - len, drag.start + deltaMin));
      const dDay = mode === "week" ? Math.round(dx / columnWidth()) : 0;
      const idx = Math.max(
        0,
        Math.min(days.length - 1, diffDays(drag.date, days[0]) + dDay)
      );
      patch(drag.id, { start, end: start + len, date: days[idx] });
    } else if (drag.mode === "resize") {
      const end = Math.max(
        drag.start + SNAP,
        Math.min(24 * 60, drag.end + deltaMin)
      );
      patch(drag.id, { end });
    } else {
      const at = snap(minuteAt(e.clientY));
      const a = Math.min(drag.anchorMin, at);
      const b = Math.max(drag.anchorMin + SNAP, at);
      patch(drag.id, { start: a, end: Math.max(a + SNAP, b) });
    }
  };

  const onPointerUp = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (d.mode === "create") {
      setSelectedId(d.id);
      setEditing(d.id);
      requestAnimationFrame(() => titleRef.current?.focus());
      return;
    }
    if (!d.moved) {
      setSelectedId(d.id);
      setEditing(null);
      return;
    }
    const ev = events.find((x) => x.id === d.id);
    if (
      ev &&
      (ev.start !== d.start || ev.end !== d.end || ev.date !== d.date)
    ) {
      const before = { ...ev, start: d.start, end: d.end, date: d.date };
      setSelectedId(d.id);
      void persist(ev, before);
      setToast({
        key: nextKey(),
        text: interpolate(t.moved, {
          title: ev.title || t.untitled,
          when: `${L.dow(ev.date)} ${L.range(ev.start, ev.end)}`,
        }),
        undo: () => {
          patch(d.id, { start: d.start, end: d.end, date: d.date });
          void persist(before, ev);
          setToast(null);
          rootRef.current?.focus({ preventScroll: true });
        },
      });
    }
  };

  const remove = (id: string) => {
    const ev = events.find((e) => e.id === id);
    if (!ev) return;
    setEvents((es) => es.filter((e) => e.id !== id));
    setSelectedId(null);
    setEditing(null);
    if (onDeleteEvent && !id.startsWith("new-")) {
      void deleteAction.run(id, id).then((result) => {
        if (!result.ok) {
          setEvents((es) => [...es, ev]);
          setToast({ key: nextKey(), text: result.error ?? t.saveFailed });
        }
      });
    }
    if (ev.title) {
      setToast({
        key: nextKey(),
        text: interpolate(t.deleted, { title: ev.title }),
        undo: () => {
          setEvents((es) => [...es, ev]);
          void persist(ev);
          setToast(null);
          rootRef.current?.focus({ preventScroll: true });
        },
      });
    }
    rootRef.current?.focus({ preventScroll: true });
  };

  const closeEditor = () => {
    if (editing) {
      const ev = events.find((e) => e.id === editing);
      if (ev && !ev.title.trim())
        setEvents((es) => es.filter((e) => e.id !== editing));
    }
    setEditing(null);
    setSelectedId(null);
    rootRef.current?.focus({ preventScroll: true });
  };

  const newEventNow = () => {
    const date =
      mode === "day" ? focusDay : days.includes(today) ? today : days[0];
    const start = Math.ceil((date === today ? nowMin : 9 * 60) / 30) * 30;
    const ev: CalendarEvent = {
      id: `new-${nextKey()}`,
      title: "",
      calendar: calendars[0]?.id ?? "me",
      date,
      start,
      end: start + 30,
    };
    setEvents((es) => [...es, ev]);
    setSelectedId(ev.id);
    setEditing(ev.id);
    if (scrollRef.current)
      scrollRef.current.scrollTop = Math.max(0, start * PX - 120);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Escape") {
      if (editing || selectedId) closeEditor();
      return;
    }
    if (selected && !selected.allDay) {
      const len = selected.end - selected.start;
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const d = e.key === "ArrowUp" ? -SNAP : SNAP;
        const next = e.shiftKey
          ? {
              ...selected,
              end: Math.max(
                selected.start + SNAP,
                Math.min(1440, selected.end + d)
              ),
            }
          : {
              ...selected,
              start: Math.max(0, Math.min(1440 - len, selected.start + d)),
              end: Math.max(0, Math.min(1440 - len, selected.start + d)) + len,
            };
        patch(selected.id, next);
        if (!selected.id.startsWith("new-")) void persist(next, selected);
        return;
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const date = addDays(selected.date, e.key === "ArrowLeft" ? -1 : 1);
        patch(selected.id, { date });
        if (!selected.id.startsWith("new-"))
          void persist({ ...selected, date }, selected);
        if (!days.includes(date)) goto(date);
        return;
      }
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        remove(selected.id);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        setEditing(selected.id);
        requestAnimationFrame(() => titleRef.current?.focus());
        return;
      }
    }
    const k = e.key.toLowerCase();
    if (e.key === "ArrowLeft" || k === "k") step(-1);
    else if (e.key === "ArrowRight" || k === "j") step(1);
    else if (k === "t") goto(today);
    else if (k === "d") setView("day");
    else if (k === "w") setView("week");
    else if (k === "n" || k === "c") {
      e.preventDefault();
      newEventNow();
    }
  };

  // Keys work anywhere in the calendar; the latest handler is read through a ref.
  const keyHandler = useRef(onKeyDown);
  keyHandler.current = onKeyDown;
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const listener = (e: KeyboardEvent) => keyHandler.current(e);
    root.addEventListener("keydown", listener);
    return () => root.removeEventListener("keydown", listener);
  }, []);
  const panel = selected
    ? {
        ev: selected,
        cal: calOf(selected.calendar),
        dayIndex: days.indexOf(selected.date),
      }
    : null;

  const sidebar = (
    <div className="flex h-full flex-col gap-6 px-3 pt-3 pb-4">
      <Button
        className="w-full justify-start transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
        onClick={newEventNow}
      >
        <PlusIcon aria-hidden />
        {t.newEvent}
        <Kbd className="ms-auto bg-primary-foreground/16 text-primary-foreground">
          {t.newEventKey}
        </Kbd>
      </Button>
      <MiniMonth
        busy={busy}
        month={month}
        onMonth={setMonth}
        onPick={(d) => {
          setFocusDay(d);
          if (mode === "day" || narrow) setView("day");
        }}
        selected={focusDay}
        today={today}
        weekStart={weekStart}
        wholeWeek={mode === "week"}
      />
      <div>
        <div className="mb-1.5 ps-1.5 font-medium text-muted-foreground text-xs">
          {t.calendars}
        </div>
        <ul className="flex flex-col gap-0.5">
          {calendars.map((c) => {
            const on = c.visible !== false;
            return (
              <li key={c.id}>
                <button
                  aria-pressed={on}
                  className="flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-1.5 text-start outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() =>
                    setCalendars((cs) =>
                      cs.map((x) =>
                        x.id === c.id ? { ...x, visible: !on } : x
                      )
                    )
                  }
                  type="button"
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.5)] border-2 transition-colors duration-150",
                      on
                        ? toneCheck[c.tone]
                        : "border-muted-foreground/40 bg-transparent"
                    )}
                  >
                    <CheckIcon
                      className={cn(
                        "size-3 text-white transition-opacity duration-150",
                        on ? "opacity-100" : "opacity-0"
                      )}
                      strokeWidth={3}
                    />
                  </span>
                  <span
                    className={cn("truncate", !on && "text-muted-foreground")}
                  >
                    {c.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-auto hidden flex-col gap-1.5 text-muted-foreground text-xs @4xl:flex">
        <div className="flex items-center gap-1.5">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
          <span>{t.keysWeek}</span>
          <Kbd className="ms-2">T</Kbd>
          <span>{t.keysToday}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>{t.keysMove}</span>
          <Kbd className="ms-2">⇧</Kbd>
          <span>{t.keysResize}</span>
        </div>
      </div>
    </div>
  );

  const nowTop = nowMin * PX;
  const todayIdx = days.indexOf(today);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          "@container relative isolate flex h-190 w-full select-none overflow-hidden bg-sidebar text-foreground text-sm outline-none",
          className
        )}
        ref={rootRef}
        tabIndex={-1}
      >
        <aside
          aria-label={t.calendars}
          className="hidden w-64 shrink-0 overflow-y-auto @4xl:block"
        >
          {sidebar}
        </aside>

        <main
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background @4xl:my-2 @4xl:me-2 @4xl:rounded-2xl @4xl:border @4xl:shadow-xs/5"
          ref={mainRef}
        >
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 @lg:px-4">
            {docked ? (
              <h2 className="flex h-9 items-center gap-1.5">
                <span className="font-heading font-semibold text-lg tracking-tight">
                  {head.main}
                </span>
                <span className="text-lg text-muted-foreground tabular-nums">
                  {head.sub}
                </span>
              </h2>
            ) : (
              <Popover>
                <PopoverTrigger className="-ms-1.5 flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent">
                  <span className="font-heading font-semibold text-lg tracking-tight">
                    {head.main}
                  </span>
                  <span className="text-lg text-muted-foreground tabular-nums">
                    {head.sub}
                  </span>
                  <ChevronDownIcon className="size-4 text-muted-foreground" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72">
                  <div className="p-1">
                    <MiniMonth
                      busy={busy}
                      month={month}
                      onMonth={setMonth}
                      onPick={(d) => setFocusDay(d)}
                      selected={focusDay}
                      today={today}
                      weekStart={weekStart}
                      wholeWeek={mode === "week"}
                    />
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                      {calendars.map((c) => {
                        const on = c.visible !== false;
                        return (
                          <button
                            aria-pressed={on}
                            className={cn(
                              "flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                              on ? "bg-accent" : "text-muted-foreground"
                            )}
                            key={c.id}
                            onClick={() =>
                              setCalendars((cs) =>
                                cs.map((x) =>
                                  x.id === c.id ? { ...x, visible: !on } : x
                                )
                              )
                            }
                            type="button"
                          >
                            <span
                              className={cn(
                                "size-2 rounded-full",
                                on ? toneDot[c.tone] : "bg-muted-foreground/40"
                              )}
                            />
                            {c.name.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <div className="ms-auto flex items-center gap-1.5">
              <Button onClick={() => goto(today)} size="sm" variant="outline">
                {t.today}
              </Button>
              <div className="flex">
                <Button
                  aria-label={mode === "week" ? t.previousWeek : t.previousDay}
                  onClick={() => step(-1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ChevronLeftIcon className="rtl:rotate-180" />
                </Button>
                <Button
                  aria-label={mode === "week" ? t.nextWeek : t.nextDay}
                  onClick={() => step(1)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <ChevronRightIcon className="rtl:rotate-180" />
                </Button>
              </div>
              <RadioGroup
                aria-label={t.view}
                className="hidden rounded-lg bg-muted p-0.5 @2xl:flex"
                onValueChange={(v) => setView(v as ViewMode)}
                value={view}
              >
                {(["day", "week"] as const).map((v) => (
                  <Radio.Root
                    className={cn(
                      "relative h-7 cursor-pointer rounded-md px-2.5 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      view === v
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    key={v}
                    value={v}
                  >
                    {view === v && (
                      <motion.span
                        className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-accent"
                        layoutId="cal-view"
                        transition={{
                          type: "spring",
                          stiffness: 520,
                          damping: 42,
                        }}
                      />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      {t[v]}
                      <span
                        aria-hidden
                        className="text-[10px] text-muted-foreground uppercase"
                      >
                        {t[v][0]}
                      </span>
                    </span>
                  </Radio.Root>
                ))}
              </RadioGroup>
              <Button
                aria-label={t.newEvent}
                className="@4xl:hidden"
                onClick={newEventNow}
                size="icon-sm"
              >
                <PlusIcon />
              </Button>
            </div>
          </header>

          {narrow && (
            <div className="grid shrink-0 grid-cols-7 gap-1 border-b px-2 py-2">
              {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map(
                (d) => {
                  const on = d === focusDay;
                  const isToday = d === today;
                  return (
                    <button
                      aria-label={`${L.dow(d)} ${parse(d).getUTCDate()}`}
                      aria-pressed={on}
                      className="relative flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      key={d}
                      onClick={() => setFocusDay(d)}
                      type="button"
                    >
                      {on && (
                        <motion.span
                          className="absolute inset-0 rounded-xl bg-accent"
                          layoutId="cal-strip"
                          transition={{
                            type: "spring",
                            stiffness: 520,
                            damping: 42,
                          }}
                        />
                      )}
                      <span
                        className={cn(
                          "relative text-[11px]",
                          isToday
                            ? "font-medium text-destructive-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {L.dow(d)}
                      </span>{" "}
                      <span
                        className={cn(
                          "relative font-medium tabular-nums",
                          isToday && "text-destructive-foreground"
                        )}
                      >
                        {parse(d).getUTCDate()}
                      </span>
                      {busy.has(d) && (
                        <span className="absolute bottom-1 size-1 rounded-full bg-muted-foreground/60" />
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}

          <div className="flex shrink-0 overflow-y-hidden border-b scrollbar-gutter-stable">
            <div className="flex w-14 shrink-0 flex-col items-end pe-2 text-[10px] text-muted-foreground">
              {!narrow && (
                <span className="flex h-11 flex-col items-end justify-center leading-tight">
                  <span className="font-medium text-foreground/80 tabular-nums">
                    {interpolate(t.weekNumber, {
                      n: isoWeek(days[0] ?? today),
                    })}
                  </span>
                  <span>{zoneName}</span>
                </span>
              )}
              <span className="flex h-8 items-center">{t.allDay}</span>
            </div>
            <div className="min-w-0 flex-1">
              {!narrow && (
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                  }}
                >
                  {days.map((d) => {
                    const isToday = d === today;
                    return (
                      <button
                        className="flex h-11 cursor-pointer items-center gap-1.5 border-s ps-2.5 text-start outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                        key={d}
                        onClick={() => {
                          setFocusDay(d);
                          setView("day");
                        }}
                        type="button"
                      >
                        <span
                          className={cn(
                            "text-xs",
                            isToday
                              ? "font-medium text-destructive-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {L.dow(d)}
                        </span>
                        <span
                          className={cn(
                            "flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-medium tabular-nums",
                            isToday && "bg-category-4-strong text-white"
                          )}
                        >
                          {parse(d).getUTCDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div
                className="relative grid min-h-8 py-1"
                style={{
                  gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                }}
              >
                {days.map((d) => (
                  <div
                    className="border-s"
                    key={d}
                    style={{ gridColumn: "span 1", gridRow: "1 / span 3" }}
                  />
                ))}
                {packAllDay(allDay, days[0] ?? today, days.length).map(
                  ({ e, row, startIdx, endIdx }) => {
                    const cal = calOf(e.calendar);
                    return (
                      <button
                        className={cn(
                          "relative z-10 mx-1 my-px flex h-6 cursor-pointer items-center truncate rounded-md ps-2.5 pe-2 text-start font-medium text-xs outline-none before:absolute before:inset-y-1 before:inset-s-1 before:w-0.5 before:rounded-full focus-visible:ring-2 focus-visible:ring-ring",
                          selectedId === e.id
                            ? toneSolid[cal.tone]
                            : toneBlock[cal.tone]
                        )}
                        key={e.id}
                        onClick={(evt) => {
                          const r = evt.currentTarget.getBoundingClientRect();
                          const m = mainRef.current?.getBoundingClientRect();
                          if (m)
                            setAllDayAt({
                              left: Math.max(
                                12,
                                Math.min(r.left - m.left, m.width - 268)
                              ),
                              top: r.bottom - m.top + 6,
                            });
                          setSelectedId(e.id);
                          setEditing(null);
                        }}
                        style={{
                          gridColumn: `${startIdx + 1} / ${endIdx + 2}`,
                          gridRow: row + 1,
                        }}
                        type="button"
                      >
                        {e.title}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div
            className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
            ref={scrollRef}
          >
            <div className="relative flex" style={{ height: 24 * HOUR }}>
              <div aria-hidden className="relative w-14 shrink-0">
                {Array.from({ length: 23 }, (_, i) => i + 1).map((h) => (
                  <span
                    className={cn(
                      "absolute inset-e-2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums transition-opacity",
                      todayIdx >= 0 &&
                        Math.abs(h * 60 - nowMin) < 24 &&
                        "opacity-0"
                    )}
                    key={h}
                    style={{ top: h * HOUR }}
                  >
                    {L.time(h * 60)}
                  </span>
                ))}
                {todayIdx >= 0 && (
                  <span
                    className="absolute inset-e-1 z-20 -translate-y-1/2 rounded-md bg-category-4-strong px-1 py-px font-medium text-[10px] text-white tabular-nums"
                    style={{ top: nowTop }}
                  >
                    {L.clock(nowMin)}
                  </span>
                )}
              </div>

              <div
                className="relative grid min-w-0 flex-1"
                onPointerCancel={onPointerUp}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                ref={gridRef}
                style={{
                  gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))`,
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                >
                  {HOURS_24.map((h) => (
                    <div
                      className="absolute inset-x-0 border-t border-border/70"
                      key={h}
                      style={{ top: h * HOUR }}
                    />
                  ))}
                  {HOURS_24.map((h) => (
                    <div
                      className="absolute inset-x-0 border-t border-border/30 border-dashed"
                      key={`half-${h}`}
                      style={{ top: h * HOUR + HOUR / 2 }}
                    />
                  ))}
                  {todayIdx >= 0 && nowMin <= 24 * 60 && (
                    <div
                      className="absolute inset-x-0 h-px -translate-y-1/2 bg-destructive/25"
                      style={{ top: nowTop }}
                    />
                  )}
                </div>

                {days.map((d) => {
                  const placed = placeDay(timed.filter((e) => e.date === d));
                  const isToday = d === today;
                  return (
                    <div
                      className={cn(
                        "relative border-s",
                        weekday(d) >= 5 && "bg-muted/40"
                      )}
                      key={d}
                      onPointerDown={(e) => beginCreate(e, d)}
                      title={interpolate(t.dayColumn, {
                        day: `${L.dow(d)} ${parse(d).getUTCDate()}`,
                      })}
                    >
                      {isToday && nowMin <= 24 * 60 && (
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 z-20"
                          style={{ top: nowTop }}
                        >
                          <div className="absolute inset-x-0 h-0.5 -translate-y-1/2 bg-destructive" />
                          <div className="absolute -inset-s-1.5 size-3 -translate-y-1/2 rounded-full bg-destructive ring-2 ring-background" />
                        </div>
                      )}
                      <AnimatePresence initial={false}>
                        {placed.map(({ ev, col, cols }) => {
                          const cal = calOf(ev.calendar);
                          const isSel = selectedId === ev.id;
                          const isDrag =
                            drag?.id === ev.id &&
                            (drag.moved || drag.mode === "create");
                          const height = Math.max((ev.end - ev.start) * PX, 18);
                          const short = height < 40;
                          const past =
                            d < today || (d === today && ev.end <= nowMin);
                          const faded = past && !isSel && !isDrag;
                          return (
                            <motion.div
                              animate={{
                                opacity: 1,
                                scale: 1,
                                y: ev.start * PX,
                              }}
                              className={cn(
                                "group/ev @container absolute top-0 z-10 cursor-grab touch-none overflow-hidden rounded-md bg-clip-padding text-start outline-none before:absolute before:inset-y-1 before:inset-s-1 before:w-0.5 before:rounded-full focus-visible:ring-2 focus-visible:ring-ring",
                                isSel || isDrag
                                  ? toneSolid[cal.tone]
                                  : toneBlock[cal.tone],
                                isDrag && "z-30 cursor-grabbing shadow-lg/20",
                                faded && "[&>div]:opacity-70 before:opacity-60",
                                cols > 1 && "ring-1 ring-background"
                              )}
                              exit={{ opacity: 0, scale: 0.96 }}
                              initial={{
                                opacity: 0,
                                scale: 0.96,
                                y: ev.start * PX,
                              }}
                              key={ev.id}
                              onDoubleClick={() => {
                                setSelectedId(ev.id);
                                setEditing(ev.id);
                                requestAnimationFrame(() =>
                                  titleRef.current?.focus()
                                );
                              }}
                              onKeyDown={(e) => {
                                if (e.key === " ") {
                                  e.preventDefault();
                                  setSelectedId(ev.id);
                                }
                              }}
                              onPointerDown={(e) => beginDrag(e, ev, "move")}
                              role="button"
                              style={{
                                height,
                                left: `calc(${(col / cols) * 100}% + 2px)`,
                                width: `calc(${(col === cols - 1 ? 1 / cols : Math.min(1 - col / cols, (mode === "week" ? 1.7 : 1) / cols)) * 100}% - 6px)`,
                                zIndex: isDrag ? 30 : 10 + col,
                              }}
                              tabIndex={0}
                              onFocus={() => setSelectedId(ev.id)}
                              transition={
                                isDrag
                                  ? { duration: 0 }
                                  : {
                                      y: settle,
                                      opacity: { duration: 0.15 },
                                      scale: { duration: 0.15 },
                                    }
                              }
                            >
                              <div
                                className={cn(
                                  "flex h-full flex-col ps-3 pe-1.5",
                                  short
                                    ? "flex-row items-center gap-1.5 py-0"
                                    : "py-1"
                                )}
                              >
                                <span
                                  className={cn(
                                    "truncate font-medium text-xs leading-4",
                                    !ev.title && "italic",
                                    !ev.title && !faded && "opacity-75"
                                  )}
                                >
                                  {ev.title || t.untitled}
                                </span>
                                <span
                                  className={cn(
                                    "truncate text-[11px] tabular-nums leading-4",
                                    !faded && "opacity-75",
                                    short && "hidden shrink-0 @[8rem]:inline"
                                  )}
                                >
                                  {short
                                    ? L.time(ev.start)
                                    : L.range(ev.start, ev.end)}
                                </span>
                                {short ? (
                                  <span className="sr-only">{`, ${L.range(ev.start, ev.end)}`}</span>
                                ) : null}
                                {!short && height > 64 && ev.location && (
                                  <span
                                    className={cn(
                                      "mt-0.5 flex items-center gap-1 truncate text-[11px] leading-4",
                                      !faded && "opacity-75"
                                    )}
                                  >
                                    <MapPinIcon className="size-3 shrink-0" />
                                    {ev.location}
                                  </span>
                                )}
                              </div>
                              {isDrag && height >= 40 && (
                                <span className="pointer-events-none absolute inset-e-1.5 bottom-1.5 rounded bg-black/20 px-1 font-medium text-[10px] tabular-nums">
                                  {L.duration(ev.end - ev.start)}
                                </span>
                              )}
                              <span
                                aria-hidden
                                className="absolute inset-x-0 bottom-0 h-2.5 cursor-ns-resize"
                                onPointerDown={(e) =>
                                  beginDrag(e, ev, "resize")
                                }
                              >
                                <span className="absolute bottom-0.5 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-current opacity-0 transition-opacity group-hover/ev:opacity-40" />
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <AnimatePresence>
                  {panel &&
                    !drag &&
                    panel.dayIndex >= 0 &&
                    !panel.ev.allDay && (
                      <EventCard
                        calendars={calendars}
                        cols={days.length}
                        dayIndex={panel.dayIndex}
                        editing={editing === panel.ev.id}
                        ev={panel.ev}
                        key={`${panel.ev.id}-${editing === panel.ev.id}`}
                        t={t}
                        onCalendar={(id) =>
                          patch(panel.ev.id, { calendar: id })
                        }
                        onClose={closeEditor}
                        onDelete={() => remove(panel.ev.id)}
                        onEdit={() => {
                          setEditing(panel.ev.id);
                          requestAnimationFrame(() =>
                            titleRef.current?.focus()
                          );
                        }}
                        onSave={() => {
                          const saved = panel.ev.title.trim()
                            ? panel.ev
                            : { ...panel.ev, title: t.defaultTitle };
                          if (saved !== panel.ev)
                            patch(panel.ev.id, { title: saved.title });
                          setEditing(null);
                          void persist(saved);
                          setToast({
                            key: nextKey(),
                            text: interpolate(t.savedFor, {
                              when: `${L.dow(panel.ev.date)} ${L.range(panel.ev.start, panel.ev.end)}`,
                            }),
                          });
                          rootRef.current?.focus({ preventScroll: true });
                        }}
                        onTitle={(title) => patch(panel.ev.id, { title })}
                        scrollRef={scrollRef}
                        titleRef={titleRef}
                      />
                    )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selected?.allDay && (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className="absolute z-40 w-64 origin-top-left rounded-xl border bg-popover p-3 shadow-lg/10"
                exit={{ opacity: 0, scale: 0.97 }}
                initial={{ opacity: 0, scale: 0.97 }}
                style={allDayAt}
                transition={{ duration: 0.16, ease }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      toneDot[calOf(selected.calendar).tone]
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{selected.title}</div>
                    <div className="text-muted-foreground text-xs">
                      {interpolate(t.allDayDetail, {
                        span:
                          selected.days && selected.days > 1
                            ? interpolate(t.allDaySpan, {
                                count: selected.days,
                              })
                            : "",
                        calendar: calOf(selected.calendar).name,
                      })}
                    </div>
                  </div>
                  <Button
                    aria-label={t.close}
                    onClick={closeEditor}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <XIcon />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center px-4 @2xl:justify-start @2xl:ps-18"
          >
            <AnimatePresence mode="popLayout">
              {toast && (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="pointer-events-auto flex h-10 max-w-full items-center gap-3 rounded-full border bg-popover ps-4 pe-1.5 shadow-lg/10"
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  key={toast.key}
                  transition={{ duration: 0.2, ease }}
                >
                  <span className="truncate text-sm tabular-nums">
                    {toast.text}
                  </span>
                  {toast.undo ? (
                    <Button
                      className="rounded-full"
                      onClick={toast.undo}
                      size="xs"
                      variant="secondary"
                    >
                      {t.undo}
                    </Button>
                  ) : (
                    <span className="w-1" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </MotionConfig>
  );
}

function EventCard({
  ev,
  calendars,
  dayIndex,
  cols,
  editing,
  titleRef,
  scrollRef,
  onTitle,
  onCalendar,
  onSave,
  onClose,
  onDelete,
  onEdit,
  t,
}: {
  t: Messages;
  ev: CalendarEvent;
  calendars: CalendarSource[];
  dayIndex: number;
  cols: number;
  editing: boolean;
  titleRef: RefObject<HTMLInputElement | null>;
  scrollRef: RefObject<HTMLDivElement | null>;
  onTitle: (t: string) => void;
  onCalendar: (id: string) => void;
  onSave: () => void;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const L = useLabels(t);
  const cal = calendars.find((c) => c.id === ev.calendar) ?? calendars[0];
  const cardRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const card = cardRef.current;
    const box = scrollRef.current;
    if (!card || !box) return;
    const top = card.offsetTop;
    const bottom = top + card.offsetHeight;
    if (bottom > box.scrollTop + box.clientHeight - 12)
      box.scrollTo({ top: bottom - box.clientHeight + 12, behavior: "smooth" });
    else if (top < box.scrollTop + 8)
      box.scrollTo({ top: top - 8, behavior: "smooth" });
  }, [scrollRef]);
  const toRight = cols === 1 ? false : dayIndex < cols - 2;
  const single = cols === 1;
  const top = Math.max(4, ev.start * PX - 8);
  const style = single
    ? {
        top: ev.end * PX + 8,
        right: 12,
        width: "min(22rem, calc(100% - 24px))",
      }
    : toRight
      ? { top, left: `calc(${((dayIndex + 1) / cols) * 100}% + 6px)` }
      : { top, right: `calc(${((cols - dayIndex) / cols) * 100}% + 6px)` };
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute z-40 w-72 cursor-default select-text rounded-xl border bg-popover text-popover-foreground shadow-lg/10",
        single ? "origin-top" : toRight ? "origin-top-left" : "origin-top-right"
      )}
      exit={{ opacity: 0, scale: 0.97 }}
      initial={{ opacity: 0, scale: 0.97 }}
      onPointerDown={(e) => e.stopPropagation()}
      ref={cardRef}
      role="dialog"
      aria-label={editing ? t.editEvent : ev.title}
      style={style}
      transition={{ duration: 0.16, ease }}
    >
      <div className="flex items-start gap-2 p-3 pb-2">
        <span
          className={cn(
            "mt-1.5 size-2.5 shrink-0 rounded-full",
            toneDot[cal.tone]
          )}
        />
        {editing ? (
          <input
            aria-label={t.eventTitle}
            className="min-w-0 flex-1 bg-transparent font-medium text-sm outline-none placeholder:text-muted-foreground/70"
            onChange={(e) => onTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
              if (e.key === "Escape") onClose();
            }}
            placeholder={t.addTitle}
            ref={titleRef}
            value={ev.title}
          />
        ) : (
          <button
            className="min-w-0 flex-1 cursor-text text-start font-medium leading-5 outline-none"
            onClick={onEdit}
            type="button"
          >
            {ev.title}
          </button>
        )}
        <Button
          aria-label={t.close}
          className="-me-1 -mt-0.5"
          onClick={onClose}
          size="icon-xs"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>
      <div className="flex flex-col gap-1.5 px-3 pb-3 text-muted-foreground text-xs">
        <div className="flex items-center gap-2">
          <ClockIcon className="size-3.5 shrink-0" />
          <span className="tabular-nums">
            {L.dow(ev.date)} {L.month(ev.date, "short")}{" "}
            {parse(ev.date).getUTCDate()} · {L.range(ev.start, ev.end)}
          </span>
          <span className="ms-auto tabular-nums">
            {L.duration(ev.end - ev.start)}
          </span>
        </div>
        {ev.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="size-3.5 shrink-0" />
            {ev.location}
          </div>
        )}
        {ev.videoUrl && (
          <div className="flex items-center gap-2">
            <VideoIcon aria-hidden className="size-3.5 shrink-0" />
            <span className="truncate text-info-foreground">
              {ev.videoUrl.replace(/^https?:\/\//, "")}
            </span>
          </div>
        )}
        {ev.people?.length ? (
          <div className="flex items-start gap-2">
            <UsersIcon className="mt-px size-3.5 shrink-0" />
            <span className="text-pretty">{ev.people.join(", ")}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-3.5 shrink-0" />
          {editing ? (
            <div className="flex flex-wrap gap-1">
              {calendars
                .filter((c) => c.id !== "holidays")
                .map((c) => (
                  <button
                    aria-pressed={c.id === ev.calendar}
                    className={cn(
                      "flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      c.id === ev.calendar
                        ? "border-foreground/20 bg-accent text-foreground"
                        : "hover:text-foreground"
                    )}
                    key={c.id}
                    onClick={() => onCalendar(c.id)}
                    type="button"
                  >
                    <span
                      className={cn("size-1.5 rounded-full", toneDot[c.tone])}
                    />
                    {c.name.split(" ")[0]}
                  </button>
                ))}
            </div>
          ) : (
            cal.name
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t px-2 py-2">
        {editing ? (
          <>
            <Button
              className="transition-[box-shadow,scale] duration-150 ease-out active:scale-[0.97]"
              onClick={onSave}
              size="xs"
            >
              {t.save}
            </Button>
            <span className="text-muted-foreground text-xs">
              <Kbd className="h-4 text-[10px]">↵</Kbd>
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1 ps-1 text-muted-foreground text-xs">
            <Kbd className="h-4 text-[10px]">↑↓</Kbd> {t.move}
            <Kbd className="ms-1 h-4 text-[10px]">⇧↑↓</Kbd> {t.resize}
          </span>
        )}
        <Button
          aria-label={t.deleteEvent}
          className="ms-auto"
          onClick={onDelete}
          size="icon-xs"
          variant="ghost"
        >
          <Trash2Icon />
        </Button>
      </div>
    </motion.div>
  );
}

export function CalendarWeek(props: CalendarWeekProps) {
  return (
    <ScreenBoundary name="CalendarWeek">
      <CalendarWeekScreen {...props} />
    </ScreenBoundary>
  );
}
