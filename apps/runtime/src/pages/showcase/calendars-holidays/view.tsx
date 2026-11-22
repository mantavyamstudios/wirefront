// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Field } from "@base-ui/react/field";
import { Form } from "@base-ui/react/form";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { useActionForm } from "@wirefront/ui/wirefront/form";
import {
  interpolate,
  useFormat,
  useMessages,
} from "@wirefront/ui/wirefront/provider";
import { ScrollRegion } from "@wirefront/ui/wirefront/scroll-region";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import {
  CircleAlertIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react";
import { type CSSProperties, useEffect, useState } from "react";
import {
  type AbsenceType,
  NewMember,
  type TeamMember,
  type TeamMonth,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("teamTimeOff.<key>"). */
export const TEAM_TIME_OFF_MESSAGES = {
  eyebrow: "{team} · {month}",
  title: "Holidays & PTO",
  empty: "Add a teammate to get started.",
  summary:
    "{overlap} day(s) with 2+ out · {off} day(s) off · {holidays} holiday(s)",
  clearest: "Find clearest week",
  clearestShort: "Clearest week",
  clearestResult: "Clearest week: {from} – {to}",
  addMember: "Add member",
  name: "Name",
  namePlaceholder: "e.g. Avery Stone",
  role: "Role",
  rolePlaceholder: "Engineering",
  add: "Add",
  tapAdds: "Tap adds:",
  againRemoves: "· tap again to remove",
  vacation: "Vacation",
  sick: "Sick",
  remote: "Remote",
  holiday: "Holiday",
  grid: "Team calendar, {month}",
  members: "Member · {count}",
  holidays: "Holidays",
  markHoliday: "Mark {date} as a holiday",
  removeHoliday: "Remove the holiday on {date}",
  markDay: "Mark {type} for {name} on {date}",
  clearDay: "Clear {type} for {name} on {date}",
  dayState: "{name}, {date}: {type}",
  removeMember: "Remove {name}",
  noMembers: "No teammates yet.",
  manyOut: "2 or more out",
  hint: "⚠ shows when 2+ are out",
  errorTitle: "Couldn’t load time off",
  retry: "Try again",
};

export interface TeamTimeOffProps {
  /** The month shown, as YYYY-MM. */
  month: string;
  /** Your team's name, for the header. */
  team: string;
  /** Members and holidays for the month. Leave it out while it loads. */
  data?: TeamMonth;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Set or clear one member's day. Shows at once and reverts if this fails. The grid is read-only without it. */
  onSetDay?: Action<{
    memberId: string;
    date: string;
    type: AbsenceType | null;
  }>;
  /** Mark or unmark a team holiday. Read-only without it. */
  onSetHoliday?: Action<{ date: string; on: boolean }>;
  /** Add a member; return the saved member. Hidden without it. */
  onAddMember?: Action<NewMember, TeamMember>;
  /** Remove a member. Hidden without it. */
  onRemoveMember?: Action<string>;
  className?: string;
}

const TONE: Record<AbsenceType | "holiday", string> = {
  vacation: "bg-category-6/35 border-category-6/55 text-category-6-foreground",
  sick: "bg-category-4/30 border-category-4/55 text-category-4-foreground",
  remote: "bg-category-8/25 border-category-8/45 text-category-8-foreground",
  holiday: "bg-category-3/22 border-category-3/45 text-category-3-foreground",
};
const TYPES: AbsenceType[] = ["vacation", "sick", "remote"];
const AVATAR_TONES = [
  "bg-category-2-strong",
  "bg-category-3-strong",
  "bg-category-5-strong",
  "bg-category-1-strong",
  "bg-category-4-strong",
  "bg-category-7-strong",
  "bg-category-6-strong",
];
const toneFor = (seed: string) =>
  AVATAR_TONES[
    Math.abs([...seed].reduce((h, c) => (h << 5) - h + c.charCodeAt(0), 0)) %
      AVATAR_TONES.length
  ] ?? "bg-category-2-strong";
const dw = (n: number, extra = 0) =>
  `calc(var(--day-w) * ${n}${extra ? ` + ${extra}px` : ""})`;
const utc = (d: string) => new Date(`${d}T00:00:00Z`);

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => (p[0] ?? "").toUpperCase())
    .join("");
}

const toRows = (d?: TeamMonth) =>
  (d?.members ?? []).map((m) => ({
    ...m,
    map: Object.fromEntries(m.days.map((x) => [x.date, x.type])) as Record<
      string,
      AbsenceType
    >,
  }));

function segments(days: Record<string, AbsenceType>, dates: string[]) {
  const out: { start: number; span: number; type: AbsenceType }[] = [];
  dates.forEach((d, i) => {
    const type = days[d];
    if (!type) return;
    const last = out[out.length - 1];
    if (last && last.type === type && last.start + last.span === i)
      last.span += 1;
    else out.push({ start: i, span: 1, type });
  });
  return out;
}

function TeamTimeOffScreen({
  month,
  team,
  data,
  status = "ready",
  error,
  onRetry,
  onSetDay,
  onSetHoliday,
  onAddMember,
  onRemoveMember,
  className,
}: TeamTimeOffProps) {
  const t = useMessages("teamTimeOff", TEAM_TIME_OFF_MESSAGES);
  const fmt = useFormat();
  const [members, setMembers] = useState(() => toRows(data));
  const [holidays, setHolidays] = useState(data?.holidays ?? []);
  useEffect(() => {
    setMembers(toRows(data));
    setHolidays(data?.holidays ?? []);
  }, [data]);
  const [activeType, setActiveType] = useState<AbsenceType>("vacation");
  const [best, setBest] = useState<{ start: number; end: number }>();
  const [addOpen, setAddOpen] = useState(false);

  const first = utc(`${month}-01`);
  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
  ).getUTCDate();
  const dates = Array.from(
    { length: daysInMonth },
    (_, n) => `${month}-${String(n + 1).padStart(2, "0")}`
  );
  const weekend = (d: string) => [0, 6].includes(utc(d).getUTCDay());
  const monthLabel = fmt.date(first, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const dayLabel = (d: string) =>
    fmt.date(utc(d), { month: "short", day: "numeric", timeZone: "UTC" });

  const setDay = useAction(onSetDay ?? (async () => {}), {
    optimistic: ({ memberId, date, type }) => {
      const before = members;
      setMembers((all) =>
        all.map((m) => {
          if (m.id !== memberId) return m;
          const map = { ...m.map };
          if (type) map[date] = type;
          else delete map[date];
          return { ...m, map };
        })
      );
      return () => setMembers(before);
    },
  });
  const setHoliday = useAction(onSetHoliday ?? (async () => {}), {
    optimistic: ({ date, on }) => {
      const before = holidays;
      setHolidays((all) =>
        on
          ? [...all, { date, label: t.holiday }]
          : all.filter((h) => h.date !== date)
      );
      return () => setHolidays(before);
    },
  });
  const remove = useAction(onRemoveMember ?? (async () => {}), {
    optimistic: (id) => {
      const before = members;
      setMembers((all) => all.filter((m) => m.id !== id));
      return () => setMembers(before);
    },
  });
  const addForm = useActionForm({
    schema: NewMember,
    action: onAddMember ?? (async () => {}),
    onSuccess: (member) => {
      if (member)
        setMembers((all) => [
          ...all,
          {
            ...member,
            map: Object.fromEntries(
              member.days.map((x) => [x.date, x.type])
            ) as Record<string, AbsenceType>,
          },
        ]);
      setAddOpen(false);
    },
  });

  const load = Object.fromEntries(
    dates.map((d) => [
      d,
      members.filter((m) => m.map[d] === "vacation" || m.map[d] === "sick")
        .length,
    ])
  );
  const overlap = dates.filter((d) => (load[d] ?? 0) >= 2);
  const totalOff = dates.reduce((sum, d) => sum + (load[d] ?? 0), 0);
  const findClearest = () => {
    let bestStart = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    for (let s = 0; s + 5 <= dates.length; s++) {
      const score = dates
        .slice(s, s + 5)
        .reduce((sum, d) => sum + (load[d] ?? 0), 0);
      if (score < bestScore) {
        bestScore = score;
        bestStart = s;
      }
    }
    setBest({ start: bestStart, end: bestStart + 4 });
  };
  useEffect(() => {
    if (!best) return;
    const id = setTimeout(() => setBest(undefined), 4000);
    return () => clearTimeout(id);
  }, [best]);
  const actionError = setDay.error ?? setHoliday.error ?? remove.error;
  const gridStyle = { "--day-w": "24px" } as CSSProperties;

  return (
    <div
      className={cn(
        "min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10",
        className
      )}
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              {interpolate(t.eyebrow, { team, month: monthLabel })}
            </div>
            <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
            {data && status === "ready" ? (
              <p
                aria-live="polite"
                className="mt-1 text-muted-foreground text-sm"
              >
                {best
                  ? interpolate(t.clearestResult, {
                      from: dayLabel(dates[best.start] ?? ""),
                      to: dayLabel(dates[best.end] ?? ""),
                    })
                  : members.length
                    ? interpolate(t.summary, {
                        overlap: overlap.length,
                        off: totalOff,
                        holidays: holidays.length,
                      })
                    : t.empty}
              </p>
            ) : null}
          </div>
          {data && status === "ready" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={!members.length}
                onClick={findClearest}
                size="sm"
                type="button"
                variant="outline"
              >
                <SparklesIcon aria-hidden />
                <span className="sm:hidden">{t.clearestShort}</span>
                <span className="max-sm:hidden">{t.clearest}</span>
              </Button>
              {onAddMember ? (
                <Popover onOpenChange={setAddOpen} open={addOpen}>
                  <PopoverTrigger render={<Button size="sm" type="button" />}>
                    <PlusIcon aria-hidden />
                    {t.addMember}
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-72! p-0!"
                    side="bottom"
                  >
                    <Form
                      className="flex flex-col gap-3 p-3"
                      errors={addForm.formProps.errors}
                      noValidate
                      onFormSubmit={(values) => void addForm.submit(values)}
                    >
                      <Field.Root className="flex flex-col gap-1.5" name="name">
                        <Field.Label className="font-mono text-[10px] uppercase tracking-[0.25em]">
                          {t.name}
                        </Field.Label>
                        <Field.Control
                          render={
                            <Input
                              autoComplete="name"
                              placeholder={t.namePlaceholder}
                            />
                          }
                        />
                        <Field.Error className="text-destructive-foreground text-xs" />
                      </Field.Root>
                      <Field.Root className="flex flex-col gap-1.5" name="role">
                        <Field.Label className="font-mono text-[10px] uppercase tracking-[0.25em]">
                          {t.role}
                        </Field.Label>
                        <Field.Control
                          render={
                            <Input
                              autoComplete="organization-title"
                              placeholder={t.rolePlaceholder}
                            />
                          }
                        />
                      </Field.Root>
                      {addForm.formError ? (
                        <p
                          className="text-destructive-foreground text-xs"
                          role="alert"
                        >
                          {addForm.formError}
                        </p>
                      ) : null}
                      <div className="flex justify-end">
                        <Button
                          disabled={addForm.pending}
                          size="sm"
                          type="submit"
                        >
                          <PlusIcon aria-hidden />
                          {t.add}
                        </Button>
                      </div>
                    </Form>
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          ) : null}
        </div>

        {status === "error" ? (
          <div className="mt-6 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? (
              <p className="mt-1 text-muted-foreground text-sm">{error}</p>
            ) : null}
            {onRetry ? (
              <Button
                className="mt-4"
                onClick={onRetry}
                size="sm"
                variant="outline"
              >
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !data || status === "loading" ? (
          <Skeleton
            aria-busy="true"
            className="mt-6 h-96 w-full rounded-xl motion-reduce:animate-none"
          />
        ) : (
          <>
            {onSetDay ? (
              <RadioGroup
                aria-label={t.tapAdds}
                className="mt-5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-border/60 bg-background/40 p-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
                onValueChange={(v) => setActiveType(v as AbsenceType)}
                value={activeType}
              >
                <span aria-hidden className="px-2 text-muted-foreground">
                  {t.tapAdds}
                </span>
                {TYPES.map((type) => (
                  <Radio.Root
                    className="inline-flex min-h-7 cursor-pointer items-center rounded px-2 py-1 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground data-checked:text-background pointer-coarse:min-h-9"
                    key={type}
                    value={type}
                  >
                    {t[type]}
                  </Radio.Root>
                ))}
                <span
                  aria-hidden
                  className="px-2 text-muted-foreground max-sm:hidden"
                >
                  {t.againRemoves}
                </span>
              </RadioGroup>
            ) : null}
            {actionError ? (
              <p
                className="mt-3 text-destructive-foreground text-sm"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}

            <div
              className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40 pointer-coarse:[--day-w:36px]"
              style={gridStyle}
            >
              {/* One scroller for the day header, holiday strip and every member row, with the member column pinned. */}
              <ScrollRegion
                aria-label={interpolate(t.grid, { month: monthLabel })}
                orientation="horizontal"
              >
                <div className="min-w-max">
                  <div className="grid grid-cols-[148px_auto] border-border/40 border-b bg-background sm:grid-cols-[220px_auto]">
                    <div className="sticky inset-s-0 z-20 border-border/40 border-e bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:px-4">
                      {interpolate(t.members, { count: members.length })}
                    </div>
                    <div
                      className="relative flex"
                      style={{ width: dw(dates.length) }}
                    >
                      {dates.map((d, i) => {
                        const inBest = best && i >= best.start && i <= best.end;
                        const busy = overlap.includes(d);
                        return (
                          <div
                            className={cn(
                              "flex flex-col items-center border-border/40 border-e py-2 font-mono text-[10px] transition-colors",
                              inBest
                                ? "bg-category-2/18 text-category-2-foreground"
                                : busy
                                  ? "bg-category-4/8 text-category-4-foreground"
                                  : weekend(d)
                                    ? "bg-foreground/2 text-muted-foreground"
                                    : "text-foreground/85"
                            )}
                            key={d}
                            style={{ width: dw(1) }}
                          >
                            {i + 1}
                            {busy ? (
                              <>
                                <CircleAlertIcon
                                  aria-hidden
                                  className="mt-0.5 size-2.5"
                                />
                                <span className="sr-only">{t.manyOut}</span>
                              </>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-[148px_auto] border-border/40 border-b bg-category-3/4 sm:grid-cols-[220px_auto]">
                    <div className="sticky inset-s-0 z-20 flex items-center gap-2 border-border/40 border-e bg-background px-3 py-2 font-mono text-[10px] text-category-3-foreground uppercase tracking-[0.2em] sm:px-4 sm:tracking-[0.25em]">
                      {t.holidays}
                    </div>
                    <div
                      className="relative flex h-9"
                      style={{ width: dw(dates.length) }}
                    >
                      {dates.map((d) => {
                        const holiday = holidays.find((h) => h.date === d);
                        return onSetHoliday ? (
                          <button
                            aria-label={interpolate(
                              holiday ? t.removeHoliday : t.markHoliday,
                              { date: dayLabel(d) }
                            )}
                            aria-pressed={Boolean(holiday)}
                            className={cn(
                              "border-border/40 border-e outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                              holiday
                                ? "bg-category-3/30 hover:bg-category-3/40"
                                : "hover:bg-category-3/10"
                            )}
                            key={d}
                            onClick={() =>
                              void setHoliday.run({ date: d, on: !holiday }, d)
                            }
                            style={{ width: dw(1) }}
                            type="button"
                          />
                        ) : (
                          <span
                            className={cn(
                              "border-border/40 border-e",
                              holiday && "bg-category-3/30"
                            )}
                            key={d}
                            style={{ width: dw(1) }}
                          />
                        );
                      })}
                      {holidays.map((h) => {
                        const i = dates.indexOf(h.date);
                        if (i < 0) return null;
                        return (
                          <div
                            className={cn(
                              "pointer-events-none absolute top-1.5 bottom-1.5 flex items-center justify-center rounded border px-1 font-mono text-[10px]",
                              TONE.holiday
                            )}
                            key={h.date}
                            style={{
                              insetInlineStart: dw(i, 1),
                              width: dw(1, -2),
                            }}
                            title={h.label}
                          >
                            <span aria-hidden>{h.label[0]}</span>
                            <span className="sr-only">
                              {h.label}, {dayLabel(h.date)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {members.length === 0 ? (
                    <div className="px-6 py-12 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                      {t.noMembers}
                    </div>
                  ) : (
                    members.map((m) => (
                      <div
                        className="group grid grid-cols-[148px_auto] border-border/40 border-b last:border-b-0 sm:grid-cols-[220px_auto]"
                        key={m.id}
                      >
                        <div className="sticky inset-s-0 z-20 flex items-center gap-2 border-border/40 border-e bg-background px-3 py-3 sm:gap-2.5 sm:px-4">
                          <Avatar
                            aria-hidden
                            className={cn(
                              "size-7 shrink-0 text-white max-sm:hidden",
                              toneFor(m.name)
                            )}
                          >
                            <AvatarFallback className="bg-transparent text-[10px] text-current">
                              {initials(m.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{m.name}</div>
                            {m.role ? (
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {m.role}
                              </div>
                            ) : null}
                          </div>
                          {onRemoveMember ? (
                            <button
                              aria-label={interpolate(t.removeMember, {
                                name: m.name,
                              })}
                              className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 outline-none transition-all hover:bg-foreground/5 hover:text-destructive focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100"
                              onClick={() => void remove.run(m.id, m.id)}
                              type="button"
                            >
                              <TrashIcon aria-hidden className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                        <div
                          className="relative flex h-12"
                          style={{ width: dw(dates.length) }}
                        >
                          {dates.map((d) => {
                            const filled = m.map[d];
                            const cell = cn(
                              "border-border/30 border-e transition-colors",
                              weekend(d) ? "bg-foreground/2" : ""
                            );
                            return onSetDay ? (
                              <button
                                aria-label={interpolate(
                                  filled ? t.clearDay : t.markDay,
                                  {
                                    type: t[filled ?? activeType],
                                    name: m.name,
                                    date: dayLabel(d),
                                  }
                                )}
                                className={cn(
                                  cell,
                                  "outline-none hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                                )}
                                key={d}
                                onClick={() =>
                                  void setDay.run(
                                    {
                                      memberId: m.id,
                                      date: d,
                                      type:
                                        filled === activeType
                                          ? null
                                          : activeType,
                                    },
                                    `${m.id}:${d}`
                                  )
                                }
                                style={{ width: dw(1) }}
                                type="button"
                              />
                            ) : (
                              <span
                                className={cell}
                                key={d}
                                style={{ width: dw(1) }}
                              >
                                {filled ? (
                                  <span className="sr-only">
                                    {interpolate(t.dayState, {
                                      name: m.name,
                                      date: dayLabel(d),
                                      type: t[filled],
                                    })}
                                  </span>
                                ) : null}
                              </span>
                            );
                          })}
                          {segments(m.map, dates).map((seg) => (
                            <div
                              aria-hidden
                              className={cn(
                                "pointer-events-none absolute top-2 bottom-2 flex items-center justify-center rounded border px-2 font-mono text-[10px] uppercase",
                                TONE[seg.type]
                              )}
                              key={`${seg.type}-${seg.start}`}
                              style={{
                                insetInlineStart: dw(seg.start, 1),
                                width: dw(seg.span, -2),
                              }}
                            >
                              {seg.span > 2 ? (
                                t[seg.type]
                              ) : (
                                <span className="size-1 rounded-full bg-current" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollRegion>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              {(["vacation", "sick", "remote", "holiday"] as const).map((k) => (
                <span className="flex items-center gap-1.5" key={k}>
                  <span
                    aria-hidden
                    className={cn("h-3 w-4 rounded border", TONE[k])}
                  />
                  {t[k]}
                </span>
              ))}
              <span className="sm:ms-auto">{t.hint}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TeamTimeOff(props: TeamTimeOffProps) {
  return (
    <ScreenBoundary name="TeamTimeOff">
      <TeamTimeOffScreen {...props} />
    </ScreenBoundary>
  );
}
