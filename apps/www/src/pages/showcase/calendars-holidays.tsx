// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  CircleAlertIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { Label } from "@wirefront/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";

/** Unique ids and toast keys for items created in the browser; deterministic, unlike the clock. */
let keySeq = 0;
const nextKey = () => ++keySeq;

type BlockType = "vacation" | "sick" | "remote";

interface Member {
  id: string;
  name: string;
  initials: string;
  role: string;
  // Sparse map: day-of-month -> block type. Adjacent same-type days render
  // as one merged segment.
  days: Record<number, BlockType>;
}

interface Holiday {
  day: number;
  label: string;
}

const TONE: Record<BlockType | "holiday", string> = {
  vacation: "bg-teal-500/35 border-teal-500/55 text-teal-800 dark:text-teal-300",
  sick: "bg-rose-500/30 border-rose-500/55 text-rose-700 dark:text-rose-300",
  remote:
    "bg-indigo-500/25 border-indigo-500/45 text-indigo-800 dark:text-indigo-300",
  holiday:
    "bg-amber-500/22 border-amber-500/45 text-amber-800 dark:text-amber-300",
};

const BLOCK_TYPES: { id: BlockType; label: string }[] = [
  { id: "vacation", label: "Vacation" },
  { id: "sick", label: "Sick" },
  { id: "remote", label: "Remote" },
];

const TONES = [
  "bg-emerald-500/85 text-white",
  "bg-amber-500/85 text-white",
  "bg-violet-500/85 text-white",
  "bg-sky-500/85 text-white",
  "bg-rose-500/85 text-white",
  "bg-orange-500/85 text-white",
  "bg-cyan-500/85 text-white",
  "bg-pink-500/85 text-white",
];

function initialsOf(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

function autoTone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  return TONES[Math.abs(h) % TONES.length]!;
}

function expand(
  start: number,
  span: number,
  type: BlockType,
): Record<number, BlockType> {
  const out: Record<number, BlockType> = {};
  for (let d = start; d < start + span; d++) out[d] = type;
  return out;
}

const SEED_TEAM: Member[] = [
  {
    id: "m1",
    name: "Maya Okafor",
    initials: "MO",
    role: "Engineering",
    days: expand(14, 3, "remote"),
  },
  {
    id: "m2",
    name: "James Lin",
    initials: "JL",
    role: "Engineering",
    days: { ...expand(6, 1, "sick"), ...expand(21, 5, "vacation") },
  },
  {
    id: "m3",
    name: "Riya Patel",
    initials: "RP",
    role: "Engineering",
    days: expand(21, 7, "vacation"),
  },
  {
    id: "m4",
    name: "Dani Kim",
    initials: "DK",
    role: "Design",
    days: expand(1, 4, "vacation"),
  },
  {
    id: "m5",
    name: "Mantavyam",
    initials: "MS",
    role: "Marketing",
    days: expand(11, 2, "remote"),
  },
  {
    id: "m6",
    name: "Alex Tran",
    initials: "AT",
    role: "Product",
    days: expand(17, 1, "sick"),
  },
];
// Bind tones now (post array literal so we can reuse autoTone signature):
SEED_TEAM.forEach((m) => {
  (m as Member & { tone?: string }).tone = autoTone(m.name);
});

const SEED_HOLIDAYS: Holiday[] = [{ day: 19, label: "Memorial Day" }];

const DAYS_TOTAL = 31;
// Day cell width comes from a CSS variable so touch screens get 36px cells.
const dw = (n: number, extra = 0) =>
  `calc(var(--day-w) * ${n}${extra ? ` + ${extra}px` : ""})`;

export function CalendarsHolidays() {
  const [team, setTeam] = useState<Member[]>(SEED_TEAM);
  const [holidays, setHolidays] = useState<Holiday[]>(SEED_HOLIDAYS);
  const [activeType, setActiveType] = useState<BlockType>("vacation");
  const [bestRange, setBestRange] = useState<{ start: number; end: number } | null>(null);
  const pulseTimeoutRef = useRef<number | null>(null);

  // Day load: count of (vacation + sick) per day across team
  const dayLoad = useMemo(() => {
    const load: Record<number, number> = {};
    for (const m of team) {
      for (const [dStr, t] of Object.entries(m.days)) {
        if (t === "remote") continue;
        const d = Number(dStr);
        load[d] = (load[d] ?? 0) + 1;
      }
    }
    return load;
  }, [team]);

  const overlapDays = useMemo(
    () =>
      Object.entries(dayLoad)
        .filter(([, n]) => n >= 2)
        .map(([d]) => Number(d)),
    [dayLoad],
  );

  const totalOut = useMemo(
    () => Object.values(dayLoad).reduce((a, b) => a + b, 0),
    [dayLoad],
  );

  const segmentsByMember = useMemo(
    () =>
      team.map((m) => ({ member: m, segments: mergeIntoSegments(m.days) })),
    [team],
  );

  const toggleDay = (memberId: string, day: number) => {
    setTeam((prev) =>
      prev.map((m) => {
        if (m.id !== memberId) return m;
        const next = { ...m.days };
        if (next[day] === activeType) {
          delete next[day];
        } else {
          next[day] = activeType;
        }
        return { ...m, days: next };
      }),
    );
  };

  const toggleHoliday = (day: number) => {
    setHolidays((prev) => {
      const idx = prev.findIndex((h) => h.day === day);
      if (idx >= 0) return prev.filter((_, i) => i !== idx);
      return [...prev, { day, label: "Holiday" }].sort((a, b) => a.day - b.day);
    });
  };

  const addMember = (name: string, role: string) => {
    if (!name.trim()) return;
    const m: Member = {
      id: `m_${nextKey()}`,
      name: name.trim(),
      role: role.trim() || "—",
      initials: initialsOf(name),
      days: {},
    };
    (m as Member & { tone?: string }).tone = autoTone(m.name);
    setTeam((prev) => [...prev, m]);
  };

  const removeMember = (id: string) =>
    setTeam((prev) => prev.filter((m) => m.id !== id));

  const findClearestWeek = () => {
    if (team.length === 0) return;
    // Score each Mon-Fri 5-day stretch by counting "out" days (excluding remote).
    let bestStart = 1;
    let bestScore = Infinity;
    for (let s = 1; s + 4 <= DAYS_TOTAL; s++) {
      let load = 0;
      for (const m of team) {
        for (let d = s; d < s + 5; d++) {
          const t = m.days[d];
          if (t === "vacation" || t === "sick") load++;
        }
      }
      // tie-break: earlier in the month
      if (load < bestScore) {
        bestScore = load;
        bestStart = s;
      }
    }
    setBestRange({ start: bestStart, end: bestStart + 4 });
    if (pulseTimeoutRef.current) window.clearTimeout(pulseTimeoutRef.current);
    pulseTimeoutRef.current = window.setTimeout(() => setBestRange(null), 2400);
  };

  const headline =
    team.length === 0
      ? "Add a teammate to get started."
      : `${overlapDays.length} day${overlapDays.length === 1 ? "" : "s"} with 2+ out · ${totalOut} total day${totalOut === 1 ? "" : "s"} off · ${holidays.length} holiday${holidays.length === 1 ? "" : "s"}`;

  return (
    <div className="min-h-svh bg-background px-4 py-6 [--day-w:24px] sm:px-6 sm:py-8 lg:px-10 lg:py-10 pointer-coarse:[--day-w:36px]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">
              Acme team · May 2026
            </div>
            <h1 className="mt-1 font-heading text-2xl">Holidays & PTO</h1>
            <p className="mt-1 text-muted-foreground text-sm">{headline}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={findClearestWeek}
              disabled={team.length === 0}
            >
              <SparklesIcon />
              <span className="sm:hidden">Clearest week</span>
              <span className="max-sm:hidden">Find clearest week</span>
            </Button>
            <AddMemberPopover onAdd={addMember} />
          </div>
        </div>

        <div
          role="group"
          aria-label="Block type to add"
          className="mt-5 inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-border/60 bg-background/40 p-0.5 font-mono text-[10px] uppercase tracking-[0.2em]"
        >
          <span className="px-2 text-muted-foreground">Tap adds:</span>
          {BLOCK_TYPES.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setActiveType(b.id)}
              aria-pressed={activeType === b.id}
              className={
                "min-h-7 rounded px-2 py-1 transition-colors pointer-coarse:min-h-9 " +
                (activeType === b.id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {b.label}
            </button>
          ))}
          <span className="px-2 text-muted-foreground max-sm:hidden">
            · click again to remove
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-background/40">
          {/* One scroller for the day header, holiday strip and every member row,
              with the member column pinned — previously only the header scrolled. */}
          <div
            tabIndex={0}
            aria-label="Team calendar, May 2026"
            className="overflow-x-auto overscroll-x-contain"
          >
          <div className="min-w-max">
          <div className="grid grid-cols-[148px_auto] border-border/40 border-b bg-background sm:grid-cols-[220px_auto]">
            <div className="sticky left-0 z-20 border-border/40 border-r bg-background px-3 py-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em] sm:px-4">
              Member · {team.length}
            </div>
            <div>
              <div className="relative flex" style={{ width: dw(DAYS_TOTAL) }}>
                {Array.from({ length: DAYS_TOTAL }).map((_, i) => {
                  const day = i + 1;
                  const overlap = overlapDays.includes(day);
                  const isWeekend = (i + 5) % 7 < 2;
                  const inBest =
                    bestRange && day >= bestRange.start && day <= bestRange.end;
                  return (
                    <div
                      key={day}
                      className={
                        "flex flex-col items-center border-border/40 border-r py-2 font-mono text-[10px] transition-colors " +
                        (inBest
                          ? "bg-emerald-500/[0.18] text-emerald-700 dark:text-emerald-300"
                          : overlap
                            ? "bg-rose-500/[0.08] text-rose-700 dark:text-rose-400"
                            : isWeekend
                              ? "bg-foreground/[0.02] text-muted-foreground"
                              : "text-foreground/85")
                      }
                      style={{ width: dw(1) }}
                    >
                      {day}
                      {overlap ? <CircleAlertIcon className="mt-0.5 size-2.5" /> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Holiday strip */}
          <div className="grid grid-cols-[148px_auto] border-border/40 border-b bg-amber-500/[0.04] sm:grid-cols-[220px_auto]">
            <div className="sticky left-0 z-20 flex items-center gap-2 border-border/40 border-r bg-background px-3 py-2 font-mono text-[10px] text-amber-800 uppercase tracking-[0.2em] sm:px-4 sm:tracking-[0.25em] dark:text-amber-400">
              Holidays
            </div>
            <div className="relative h-9">
              <div className="relative flex h-full" style={{ width: dw(DAYS_TOTAL) }}>
                {Array.from({ length: DAYS_TOTAL }).map((_, i) => {
                  const day = i + 1;
                  const isHoliday = holidays.some((h) => h.day === day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleHoliday(day)}
                      aria-label={isHoliday ? `Remove holiday day ${day}` : `Mark day ${day} as holiday`}
                      className={
                        "border-border/40 border-r transition-colors " +
                        (isHoliday
                          ? "bg-amber-500/30 hover:bg-amber-500/40"
                          : "hover:bg-amber-500/10")
                      }
                      style={{ width: dw(1) }}
                    />
                  );
                })}
                {holidays.map((h) => (
                  <div
                    key={h.day}
                    className={
                      "pointer-events-none absolute top-1.5 bottom-1.5 flex items-center justify-center rounded border px-1 font-mono text-[10px] " +
                      TONE.holiday
                    }
                    style={{
                      left: dw(h.day - 1, 1),
                      width: dw(1, -2),
                    }}
                  >
                    {h.label[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Members */}
          {segmentsByMember.length === 0 ? (
            <div className="px-6 py-12 text-center font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
              No teammates yet.
            </div>
          ) : (
            segmentsByMember.map(({ member: m, segments }) => (
              <div
                key={m.id}
                className="group grid grid-cols-[148px_auto] border-border/40 border-b last:border-b-0 sm:grid-cols-[220px_auto]"
              >
                <div className="sticky left-0 z-20 flex items-center gap-2 border-border/40 border-r bg-background px-3 py-3 sm:gap-2.5 sm:px-4">
                  <Avatar
                    className={
                      "size-7 shrink-0 max-sm:hidden " +
                      (((m as Member & { tone?: string }).tone) ?? autoTone(m.name))
                    }
                  >
                    <AvatarFallback className="bg-transparent text-[10px] text-current">
                      {m.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">{m.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {m.role}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    aria-label={`Remove ${m.name}`}
                    className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-foreground/[0.05] hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:size-8 pointer-coarse:opacity-100"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
                <div className="relative h-12">
                  <div className="relative h-full flex" style={{ width: dw(DAYS_TOTAL) }}>
                    {Array.from({ length: DAYS_TOTAL }).map((_, i) => {
                      const day = i + 1;
                      const isWeekend = (i + 5) % 7 < 2;
                      const filled = m.days[day];
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(m.id, day)}
                          aria-label={
                            filled
                              ? `Remove ${filled} on day ${day}`
                              : `Mark ${activeType} on day ${day}`
                          }
                          className={
                            "border-border/30 border-r transition-colors " +
                            (isWeekend
                              ? "bg-foreground/[0.02] hover:bg-foreground/[0.05]"
                              : "hover:bg-foreground/[0.04]")
                          }
                          style={{ width: dw(1) }}
                        />
                      );
                    })}
                    {segments.map((seg, si) => (
                      <div
                        key={si}
                        className={
                          "pointer-events-none absolute top-2 bottom-2 flex items-center justify-center rounded border px-2 font-mono text-[10px] " +
                          TONE[seg.type]
                        }
                        style={{
                          left: dw(seg.start - 1, 1),
                          width: dw(seg.span, -2),
                        }}
                      >
                        {seg.span > 2 ? (
                          seg.type.toUpperCase()
                        ) : (
                          <span className="size-1 rounded-full bg-current" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
          </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          <Legend tone="vacation" label="Vacation" />
          <Legend tone="sick" label="Sick" />
          <Legend tone="remote" label="Remote" />
          <Legend tone="holiday" label="Holiday" />
          <span className="sm:ml-auto">
            Click a cell to toggle · ⚠ shows when 2+ are out
          </span>
        </div>
      </div>
    </div>
  );
}

function mergeIntoSegments(
  days: Record<number, BlockType>,
): { start: number; span: number; type: BlockType }[] {
  const sorted = Object.entries(days)
    .map(([d, t]) => ({ day: Number(d), type: t as BlockType }))
    .sort((a, b) => a.day - b.day);
  const out: { start: number; span: number; type: BlockType }[] = [];
  for (const { day, type } of sorted) {
    const last = out[out.length - 1];
    if (last && last.type === type && last.start + last.span === day) {
      last.span += 1;
    } else {
      out.push({ start: day, span: 1, type });
    }
  }
  return out;
}

function AddMemberPopover({
  onAdd,
}: {
  onAdd: (name: string, role: string) => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const submit = (e: FormEvent, close: () => void) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name, role);
    setName("");
    setRole("");
    close();
  };
  return (
    <Popover>
      <PopoverTrigger
        render={<Button type="button" size="sm" />}
      >
        <PlusIcon />
        Add member
      </PopoverTrigger>
      <PopoverContent className="!w-72 !p-0" side="bottom" align="end">
        <PopoverInner onSubmit={submit} name={name} setName={setName} role={role} setRole={setRole} />
      </PopoverContent>
    </Popover>
  );
}

function PopoverInner({
  onSubmit,
  name,
  setName,
  role,
  setRole,
}: {
  onSubmit: (e: FormEvent, close: () => void) => void;
  name: string;
  setName: (v: string) => void;
  role: string;
  setRole: (v: string) => void;
}) {
  // Popover doesn't expose imperative close from child, so we just clear
  // state and let blur dismiss on submit.
  const close = () => {
    /* parent clears state; user clicks outside to close popover */
  };
  return (
    <form
      onSubmit={(e) => onSubmit(e, close)}
      className="flex flex-col gap-3 p-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-name" className="font-mono text-[10px] uppercase tracking-[0.25em]">
          Name
        </Label>
        <Input
          id="member-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Avery Stone"
          />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="member-role" className="font-mono text-[10px] uppercase tracking-[0.25em]">
          Role
        </Label>
        <Input
          id="member-role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Engineering"
          />
      </div>
      <div className="flex justify-end">
        <Button size="sm" type="submit" disabled={!name.trim()}>
          <PlusIcon />
          Add
        </Button>
      </div>
    </form>
  );
}

function Legend({
  tone,
  label,
}: {
  tone: BlockType | "holiday";
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={"h-3 w-4 rounded border " + TONE[tone]} />
      {label}
    </span>
  );
}

// re-export for type compatibility (unused export silenced)
void XIcon;
