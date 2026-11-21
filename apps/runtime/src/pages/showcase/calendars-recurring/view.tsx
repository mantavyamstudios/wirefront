// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Spinner } from "@wirefront/ui/spinner";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon, SparklesIcon } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import type { RecurrencePreset, RecurrenceRule } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("recurrenceEditor.<key>"). */
export const RECURRENCE_EDITOR_MESSAGES = {
  title: "Recurrence",
  standard: "iCalendar · RFC 5545",
  repeats: "Repeats",
  presets: "Presets",
  freq: "Frequency",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  interval: "Interval",
  every: "Every",
  dayOne: "day",
  dayOther: "days",
  weekOne: "week",
  weekOther: "weeks",
  monthOne: "month",
  monthOther: "months",
  yearOne: "year",
  yearOther: "years",
  onDays: "On days",
  on: "On",
  dayOfMonth: "Day of month",
  positionDay: "Position + day",
  monthDays: "Days of month",
  lastDay: "Last day",
  position: "Which one",
  last: "last",
  ends: "Ends",
  never: "Never",
  onDate: "On a date",
  endDate: "End date",
  afterCount: "After N times",
  count: "Number of occurrences",
  describeEvery: "Every {unit}",
  describeEveryN: "Every {count} {unit}",
  describeOnDays: "{every} on {days}",
  describeOnMonthDays: "{every} on {days}",
  describeOnPosition: "{every} on the {position} {days}",
  theNth: "the {nth}",
  weekday: "weekday",
  or: " or ",
  until: ", until {date}",
  times: ", for {count} occurrences",
  none: "—",
  rrule: "RRULE",
  next: "Next {count} occurrences",
  total: "{count} total",
  noOccurrences: "No occurrences match this rule.",
  today: "today",
  tomorrow: "tomorrow",
  inDays: "+{count}d",
  previous: "Previous month",
  nextMonth: "Next month",
  occurrence: "Occurrence",
  start: "Start",
  thisMonth: "{count} this month",
  starts: "Starts {date}",
  cancel: "Cancel",
  save: "Save recurrence",
  saved: "Saved",
};

export interface RecurrenceEditorProps {
  /** The first occurrence, as YYYY-MM-DD. */
  start: string;
  /** The rule it opens with. */
  defaultRule: RecurrenceRule;
  /** One-click rules shown beside the editor. */
  presets?: RecurrencePreset[];
  /** Save the rule and its RRULE string. Hidden without it. */
  onSave?: Action<{ rule: RecurrenceRule; rrule: string }>;
  /** Close without saving. Hidden without it. */
  onCancel?: () => void;
  className?: string;
}

type WeekDay = RecurrenceRule["byday"][number];
type Freq = RecurrenceRule["freq"];
const WEEK: WeekDay[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
const DOW: Record<WeekDay, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const FREQS: Freq[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const POSITIONS = [1, 2, 3, 4, -1];
const MAX = 100;
/** iCalendar property name, not copy. */
const RRULE_PREFIX = "RRULE:";
const DAY_MS = 86_400_000;
const utc = (d: string) => new Date(`${d}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);
const OPTION =
  "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-md border border-border/70 bg-background px-2 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground/80 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-10";

export function buildRrule(r: RecurrenceRule) {
  const tokens: { k: string; v: string }[] = [{ k: "FREQ", v: r.freq }];
  if (r.interval > 1) tokens.push({ k: "INTERVAL", v: String(r.interval) });
  if (r.freq === "WEEKLY" && r.byday.length) tokens.push({ k: "BYDAY", v: r.byday.join(",") });
  if (r.freq === "MONTHLY") {
    if (r.monthlyMode === "day" && r.bymonthday.length) tokens.push({ k: "BYMONTHDAY", v: r.bymonthday.join(",") });
    if (r.monthlyMode === "weekday") {
      if (r.bydayPositional.length) tokens.push({ k: "BYDAY", v: r.bydayPositional.join(",") });
      if (r.bysetpos !== null) tokens.push({ k: "BYSETPOS", v: String(r.bysetpos) });
    }
  }
  if (r.end.type === "until") tokens.push({ k: "UNTIL", v: `${r.end.date.replace(/-/g, "")}T000000Z` });
  if (r.end.type === "count") tokens.push({ k: "COUNT", v: String(r.end.count) });
  return { tokens, raw: tokens.map((t) => `${t.k}=${t.v}`).join(";") };
}

/** Dates the rule produces from `start`, as YYYY-MM-DD, up to `max`. */
export function expand(rule: RecurrenceRule, start: string, max = MAX): string[] {
  const out: string[] = [];
  const cap = rule.end.type === "count" ? Math.min(max, rule.end.count) : max;
  const until = rule.end.type === "until" ? rule.end.date : undefined;
  const ok = (d: string) => !until || d <= until;
  const s = utc(start);
  if (rule.freq === "DAILY" || rule.freq === "YEARLY") {
    const d = new Date(s);
    while (out.length < cap && ok(iso(d))) {
      out.push(iso(d));
      if (rule.freq === "DAILY") d.setUTCDate(d.getUTCDate() + rule.interval);
      else d.setUTCFullYear(d.getUTCFullYear() + rule.interval);
    }
  } else if (rule.freq === "WEEKLY") {
    const targets = rule.byday.map((d) => DOW[d]).sort((a, b) => a - b);
    if (!targets.length) return out;
    let week = s.getTime() - s.getUTCDay() * DAY_MS;
    for (let guard = 0; out.length < cap && guard < 600; guard++) {
      for (const t of targets) {
        const d = iso(new Date(week + t * DAY_MS));
        if (!ok(d)) return out;
        if (d >= start) out.push(d);
        if (out.length >= cap) break;
      }
      week += 7 * rule.interval * DAY_MS;
    }
  } else {
    let y = s.getUTCFullYear();
    let m = s.getUTCMonth();
    for (let guard = 0; out.length < cap && guard < 240; guard++) {
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const picks: number[] = [];
      if (rule.monthlyMode === "day") picks.push(...rule.bymonthday.map((d) => (d < 0 ? last + d + 1 : d)).filter((d) => d >= 1 && d <= last));
      else if (rule.bydayPositional.length && rule.bysetpos !== null) {
        const matches = Array.from({ length: last }, (_, i) => i + 1).filter((day) => rule.bydayPositional.some((wd) => DOW[wd] === new Date(Date.UTC(y, m, day)).getUTCDay()));
        const pick = matches[rule.bysetpos > 0 ? rule.bysetpos - 1 : matches.length + rule.bysetpos];
        if (pick) picks.push(pick);
      }
      for (const day of [...new Set(picks)].sort((a, b) => a - b)) {
        const d = iso(new Date(Date.UTC(y, m, day)));
        if (!ok(d)) return out;
        if (d >= start) out.push(d);
        if (out.length >= cap) break;
      }
      m += rule.interval;
      y += Math.floor(m / 12);
      m %= 12;
    }
  }
  return out;
}

function Row({ label, children }: { label: string; children: (labelId: string) => ReactNode }) {
  const id = useId();
  return (
    // Question on the left, answer on the right at every width.
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[110px_minmax(0,1fr)]">
      <div className="wrap-break-word pt-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-widest sm:tracking-[0.25em]" id={id}>
        {label}
      </div>
      <div className="min-w-0">{children(id)}</div>
    </div>
  );
}

function RecurrenceEditorScreen({ start, defaultRule, presets = [], onSave, onCancel, className }: RecurrenceEditorProps) {
  const t = useMessages("recurrenceEditor", RECURRENCE_EDITOR_MESSAGES);
  const fmt = useFormat();
  const { locale } = useWirefront();
  const [rule, setRule] = useState(defaultRule);
  const [offset, setOffset] = useState(0);
  const [saved, setSaved] = useState(false);
  const save = useAction(onSave ?? (async () => {}), { onSuccess: () => setSaved(true) });
  const apply = (patch: Partial<RecurrenceRule>) => {
    setSaved(false);
    setRule((r) => ({ ...r, ...patch }));
  };
  const built = buildRrule(rule);
  const all = expand(rule, start);
  const next = all.slice(0, 8);
  const anyDay = (wd: WeekDay) => new Date(Date.UTC(2026, 1, 1 + DOW[wd])); // Feb 1 2026 is a Sunday
  const dayName = (wd: WeekDay, style: "long" | "short" | "narrow") => new Intl.DateTimeFormat(locale, { weekday: style, timeZone: "UTC" }).format(anyDay(wd));
  const ordinalRules = new Intl.PluralRules(locale, { type: "ordinal" });
  const ordinal = (n: number) => `${n}${{ one: "st", two: "nd", few: "rd", other: "th", zero: "th", many: "th" }[ordinalRules.select(n)]}`;
  const unitOf = (n: number) => {
    const key = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[rule.freq] as "day" | "week" | "month" | "year";
    return t[`${key}${n > 1 ? "Other" : "One"}`];
  };
  const longDate = (d: string, weekday = false) => fmt.date(utc(d), { ...(weekday ? { weekday: "short" } : {}), month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

  const describe = () => {
    const every = rule.interval > 1 ? interpolate(t.describeEveryN, { count: rule.interval, unit: unitOf(rule.interval) }) : interpolate(t.describeEvery, { unit: unitOf(1) });
    let main = every;
    if (rule.freq === "WEEKLY") main = interpolate(t.describeOnDays, { every, days: rule.byday.map((d) => dayName(d, "short")).join(", ") || t.none });
    if (rule.freq === "MONTHLY") {
      if (rule.monthlyMode === "day") main = interpolate(t.describeOnMonthDays, { every, days: rule.bymonthday.map((d) => (d === -1 ? t.lastDay.toLowerCase() : interpolate(t.theNth, { nth: ordinal(d) }))).join(", ") || t.none });
      else {
        const weekdays = rule.bydayPositional.length === 5 && rule.bydayPositional.every((d) => !["SA", "SU"].includes(d));
        main = interpolate(t.describeOnPosition, {
          every,
          position: rule.bysetpos === -1 ? t.last : rule.bysetpos ? ordinal(rule.bysetpos) : "",
          days: weekdays ? t.weekday : rule.bydayPositional.map((d) => dayName(d, "short")).join(t.or) || t.none,
        });
      }
    }
    if (rule.end.type === "until") main += interpolate(t.until, { date: longDate(rule.end.date) });
    if (rule.end.type === "count") main += interpolate(t.times, { count: rule.end.count });
    return `${main}.`;
  };

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const weekdayPicker = (selected: WeekDay[], onToggle: (d: WeekDay) => void, labelId: string) => (
    <fieldset aria-labelledby={labelId} className="m-0 grid min-w-0 grid-cols-7 gap-1 border-0 p-0">
      {WEEK.map((d) => (
        <button
          aria-pressed={selected.includes(d)}
          className="flex h-11 min-w-0 flex-col items-center justify-center rounded-md border border-border/70 bg-background font-mono text-xs outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background"
          key={d}
          onClick={() => onToggle(d)}
          type="button"
        >
          <span className="sr-only">{dayName(d, "long")}</span>
          <span aria-hidden className="sm:hidden">
            {dayName(d, "narrow")}
          </span>
          <span aria-hidden className="max-sm:hidden">
            {dayName(d, "short")}
          </span>
        </button>
      ))}
    </fieldset>
  );

  // Preview month.
  const s = utc(start);
  const shown = new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth() + offset, 1));
  const shownMonth = iso(shown).slice(0, 7);
  const daysInMonth = new Date(Date.UTC(shown.getUTCFullYear(), shown.getUTCMonth() + 1, 0)).getUTCDate();
  const hits = new Set(all.filter((d) => d.startsWith(shownMonth)));
  const cells = [
    ...Array.from({ length: shown.getUTCDay() }, (_, n) => ({ key: `lead-${n}`, date: "" })),
    ...Array.from({ length: daysInMonth }, (_, n) => ({ key: `${shownMonth}-${String(n + 1).padStart(2, "0")}`, date: `${shownMonth}-${String(n + 1).padStart(2, "0")}` })),
  ];

  return (
    <div className={cn("min-h-svh bg-muted/30 px-3 py-6 sm:px-6 sm:py-8", className)}>
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <RepeatIcon aria-hidden className="size-4 text-muted-foreground" />
            <h1 className="font-heading text-lg">{t.title}</h1>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">{t.standard}</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          {/* The answer first: what this rule means, in words. */}
          <div aria-live="polite" className="border-border/60 border-b px-4 py-3 sm:px-5">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.repeats}</div>
            <p className="mt-0.5 text-balance font-heading text-base sm:text-lg">{describe()}</p>
          </div>

          {/* Phones: presets → editor → preview. md: presets rail | editor, preview under it. xl: three columns. */}
          <div className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_minmax(0,1fr)]">
            {presets.length ? (
              <aside className="border-border/60 border-b bg-background p-3 md:row-span-2 md:border-e md:border-b-0 xl:row-span-1">
                <h2 className="flex items-center gap-1.5 px-1 py-1 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] md:px-2" id="recurrence-presets">
                  <SparklesIcon aria-hidden className="size-3 shrink-0" />
                  {t.presets}
                </h2>
                <ul aria-labelledby="recurrence-presets" className="mt-1 flex min-w-0 flex-wrap gap-1.5 md:flex-col md:gap-0.5">
                  {presets.map((p) => {
                    const active = buildRrule({ ...defaultRule, ...rule, ...p.rule }).raw === built.raw;
                    return (
                      <li key={p.id}>
                        <button
                          aria-pressed={active}
                          className={cn(
                            "min-h-8 whitespace-nowrap rounded-full border px-3 py-1 text-start text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10 md:w-full md:rounded-md md:px-2",
                            active ? "border-foreground bg-foreground text-background" : "border-border/70 bg-background text-foreground/80 hover:border-foreground/40 md:border-transparent md:hover:bg-muted/50",
                          )}
                          onClick={() => apply({ ...p.rule })}
                          type="button"
                        >
                          {p.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </aside>
            ) : null}

            <div className="min-w-0 space-y-5 px-4 py-5 sm:px-5">
              <Row label={t.freq}>
                {(id) => (
                  <RadioGroup aria-labelledby={id} className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" onValueChange={(v) => apply({ freq: v as Freq })} value={rule.freq}>
                    {FREQS.map((f) => (
                      <Radio.Root className={OPTION} key={f} value={f}>
                        {t[f.toLowerCase() as "daily" | "weekly" | "monthly" | "yearly"]}
                      </Radio.Root>
                    ))}
                  </RadioGroup>
                )}
              </Row>
              <Row label={t.interval}>
                {(id) => (
                  <div className="flex items-center gap-2">
                    <span aria-hidden className="text-muted-foreground text-sm">
                      {t.every}
                    </span>
                    <Input aria-labelledby={id} className="w-16" min={1} onChange={(e) => apply({ interval: Math.max(1, Number(e.target.value || 1)) })} type="number" value={rule.interval} />
                    <span className="text-muted-foreground text-sm">{unitOf(rule.interval)}</span>
                  </div>
                )}
              </Row>
              {rule.freq === "WEEKLY" ? <Row label={t.onDays}>{(id) => weekdayPicker(rule.byday, (d) => apply({ byday: toggle(rule.byday, d) }), id)}</Row> : null}
              {rule.freq === "MONTHLY" ? (
                <>
                  <Row label={t.on}>
                    {(id) => (
                      <RadioGroup aria-labelledby={id} className="grid grid-cols-1 gap-1.5 sm:grid-cols-2" onValueChange={(v) => apply({ monthlyMode: v as RecurrenceRule["monthlyMode"] })} value={rule.monthlyMode}>
                        <Radio.Root className={OPTION} value="day">
                          {t.dayOfMonth}
                        </Radio.Root>
                        <Radio.Root className={OPTION} value="weekday">
                          {t.positionDay}
                        </Radio.Root>
                      </RadioGroup>
                    )}
                  </Row>
                  {rule.monthlyMode === "day" ? (
                    <Row label={t.monthDays}>
                      {(id) => (
                        <fieldset aria-labelledby={id} className="m-0 grid min-w-0 grid-cols-7 gap-1 border-0 p-0">
                          {Array.from({ length: 31 }, (_, n) => n + 1).map((n) => (
                            <button
                              aria-pressed={rule.bymonthday.includes(n)}
                              className="grid h-8 place-items-center rounded border border-border/60 font-mono text-[11px] text-foreground/80 tabular-nums outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-transparent aria-pressed:bg-foreground aria-pressed:text-background sm:h-7 pointer-coarse:h-9"
                              key={n}
                              onClick={() => apply({ bymonthday: toggle(rule.bymonthday, n).sort((a, b) => a - b) })}
                              type="button"
                            >
                              {n}
                            </button>
                          ))}
                          <button
                            aria-pressed={rule.bymonthday.includes(-1)}
                            className="col-span-3 grid h-8 place-items-center rounded border border-border/60 font-mono text-[10px] text-foreground/80 uppercase tracking-[0.2em] outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-transparent aria-pressed:bg-foreground aria-pressed:text-background sm:h-7 pointer-coarse:h-9"
                            onClick={() => apply({ bymonthday: toggle(rule.bymonthday, -1) })}
                            type="button"
                          >
                            {t.lastDay}
                          </button>
                        </fieldset>
                      )}
                    </Row>
                  ) : (
                    <>
                      <Row label={t.position}>
                        {(id) => (
                          <RadioGroup aria-labelledby={id} className="grid grid-cols-3 gap-1.5 sm:grid-cols-5" onValueChange={(v) => apply({ bysetpos: Number(v) })} value={String(rule.bysetpos)}>
                            {POSITIONS.map((p) => (
                              <Radio.Root className={OPTION} key={p} value={String(p)}>
                                {p === -1 ? t.last : ordinal(p)}
                              </Radio.Root>
                            ))}
                          </RadioGroup>
                        )}
                      </Row>
                      <Row label={t.onDays}>{(id) => weekdayPicker(rule.bydayPositional, (d) => apply({ bydayPositional: toggle(rule.bydayPositional, d) }), id)}</Row>
                    </>
                  )}
                </>
              ) : null}
              <Row label={t.ends}>
                {(id) => (
                  <RadioGroup
                    aria-labelledby={id}
                    className="flex flex-col gap-1.5"
                    onValueChange={(v) => apply({ end: v === "never" ? { type: "never" } : v === "until" ? { type: "until", date: rule.end.type === "until" ? rule.end.date : iso(new Date(utc(start).getTime() + 91 * DAY_MS)) } : { type: "count", count: rule.end.type === "count" ? rule.end.count : 12 } })}
                    value={rule.end.type}
                  >
                    {(["never", "until", "count"] as const).map((type) => (
                      <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-md border border-border/70 bg-background px-3 py-1.5 text-sm has-data-checked:border-foreground" key={type}>
                        <Radio.Root className="grid size-4 cursor-pointer place-items-center rounded-full border border-foreground/50 outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:border-foreground" id={`end-${type}`} value={type}>
                          <Radio.Indicator className="size-2 rounded-full bg-foreground" />
                        </Radio.Root>
                        <label className="cursor-pointer" htmlFor={`end-${type}`}>
                          {type === "never" ? t.never : type === "until" ? t.onDate : t.afterCount}
                        </label>
                        {type === "until" && rule.end.type === "until" ? (
                          <Input aria-label={t.endDate} className="ms-auto w-40" min={start} onChange={(e) => e.target.value && apply({ end: { type: "until", date: e.target.value } })} type="date" value={rule.end.date} />
                        ) : null}
                        {type === "count" && rule.end.type === "count" ? (
                          <Input aria-label={t.count} className="ms-auto w-20" min={1} onChange={(e) => apply({ end: { type: "count", count: Math.max(1, Number(e.target.value || 1)) } })} type="number" value={rule.end.count} />
                        ) : null}
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </Row>
            </div>

            <div className="min-w-0 space-y-5 border-border/60 bg-muted/10 px-4 py-5 max-xl:border-t sm:px-5 md:col-start-2 xl:col-start-3 xl:row-start-1 xl:border-s">
              <div>
                <h2 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t.rrule}</h2>
                <code className="mt-1.5 block break-all rounded-lg border border-border/60 bg-background px-3 py-2.5 font-mono text-[12px] leading-relaxed">
                  <span className="text-muted-foreground">{RRULE_PREFIX}</span>
                  {built.tokens.map((tok, i) => (
                    <span key={tok.k}>
                      {i > 0 ? <span className="text-muted-foreground">;</span> : null}
                      <span className="text-category-5-foreground">{tok.k}</span>
                      <span className="text-muted-foreground">=</span>
                      <span className="text-foreground">{tok.v}</span>
                    </span>
                  ))}
                </code>
              </div>

              <div className="rounded-lg border border-border/60 bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <button aria-label={t.previous} className="grid size-6 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOffset((o) => o - 1)} type="button">
                    <ChevronLeftIcon aria-hidden className="size-3.5 rtl:rotate-180" />
                  </button>
                  <h3 aria-live="polite" className="font-mono text-[11px] text-foreground">
                    {fmt.date(shown, { month: "long", year: "numeric", timeZone: "UTC" })}
                  </h3>
                  <button aria-label={t.nextMonth} className="grid size-6 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setOffset((o) => o + 1)} type="button">
                    <ChevronRightIcon aria-hidden className="size-3.5 rtl:rotate-180" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-y-1 text-center">
                  {(["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const).map((d) => (
                    <div aria-hidden className="font-mono text-[9px] text-muted-foreground uppercase tracking-[0.2em]" key={d}>
                      {dayName(d, "narrow")}
                    </div>
                  ))}
                  {cells.map((c) =>
                    c.date ? (
                      <div className="grid place-items-center" key={c.key}>
                        <div className={cn("grid size-7 place-items-center rounded-md font-mono text-[11px] tabular-nums", hits.has(c.date) ? "bg-foreground text-background" : c.date === start ? "border border-foreground/40 text-foreground" : "text-foreground/70")}>
                          {Number(c.date.slice(8))}
                          {hits.has(c.date) ? <span className="sr-only">, {t.occurrence}</span> : null}
                        </div>
                      </div>
                    ) : (
                      <div key={c.key} />
                    ),
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 border-border/60 border-t pt-2 font-mono text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-2 rounded-sm bg-foreground" />
                    {t.occurrence}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span aria-hidden className="size-2 rounded-sm border border-foreground/40" />
                    {t.start}
                  </span>
                  <span className="ms-auto tabular-nums">{interpolate(t.thisMonth, { count: hits.size })}</span>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.next, { count: next.length })}</h3>
                  <span className="font-mono text-[10px] text-muted-foreground">{interpolate(t.total, { count: all.length >= MAX ? `${MAX}+` : all.length })}</span>
                </div>
                <ol className="mt-2 divide-y divide-border/40 overflow-hidden rounded-lg border border-border/60 bg-background">
                  {next.length === 0 ? (
                    <li className="px-3 py-4 text-center text-[12px] text-muted-foreground">{t.noOccurrences}</li>
                  ) : (
                    next.map((d, i) => {
                      const days = Math.round((utc(d).getTime() - utc(start).getTime()) / DAY_MS);
                      return (
                        <li className="flex items-baseline justify-between px-3 py-1.5 font-mono text-[12px]" key={d}>
                          <span className="flex items-baseline gap-2">
                            <span aria-hidden className="w-5 text-muted-foreground tabular-nums">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <time className="text-foreground" dateTime={d}>
                              {longDate(d, true)}
                            </time>
                          </span>
                          <span className="text-muted-foreground tabular-nums">{days === 0 ? t.today : days === 1 ? t.tomorrow : interpolate(t.inDays, { count: days })}</span>
                        </li>
                      );
                    })
                  )}
                </ol>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-border/60 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span className="font-mono text-[11px] text-muted-foreground">
              {interpolate(t.starts, { date: longDate(start, true) })}
              {saved ? <span className="ms-3 text-category-2-foreground">{t.saved}</span> : null}
              {save.error ? (
                <span className="ms-3 text-destructive-foreground" role="alert">
                  {save.error}
                </span>
              ) : null}
            </span>
            {onSave || onCancel ? (
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                {onCancel ? (
                  <Button onClick={onCancel} type="button" variant="ghost">
                    {t.cancel}
                  </Button>
                ) : null}
                {onSave ? (
                  <Button disabled={save.isPending()} onClick={() => void save.run({ rule, rrule: `${RRULE_PREFIX}${built.raw}` })} type="button">
                    {save.isPending() ? <Spinner /> : null}
                    {t.save}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecurrenceEditor(props: RecurrenceEditorProps) {
  return (
    <ScreenBoundary name="RecurrenceEditor">
      <RecurrenceEditorScreen {...props} />
    </ScreenBoundary>
  );
}
