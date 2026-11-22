// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `habits`).
"use client";

import { Button } from "@wirefront/ui/button";
import { Input } from "@wirefront/ui/input";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import { type Action, fail } from "@wirefront/ui/wirefront/types";
import {
  BikeIcon,
  BookOpenIcon,
  CarrotIcon,
  ChevronLeftIcon,
  DropletsIcon,
  DumbbellIcon,
  FlameIcon,
  Flower2Icon,
  FootprintsIcon,
  LanguagesIcon,
  type LucideIcon,
  MinusIcon,
  MoonIcon,
  MusicIcon,
  NotebookPenIcon,
  PersonStandingIcon,
  PlusIcon,
  SparklesIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  motion,
  PresenceContext,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  type SubmitEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  Habit,
  HabitGoal,
  HabitIcon,
  HabitTime,
  HabitTone,
  NewHabit,
} from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("habits.<key>"). */
export const HABITS_MESSAGES = {
  icon_water: "Water",
  icon_journal: "Journal",
  icon_stretch: "Stretch",
  icon_walk: "Walk",
  icon_read: "Read",
  icon_sleep: "Sleep",
  icon_meditate: "Meditate",
  icon_veg: "Eat well",
  icon_lift: "Strength",
  icon_music: "Practice",
  icon_sun: "Outside",
  icon_language: "Language",
  icon_bike: "Ride",
  tone_sky: "Sky",
  tone_amber: "Amber",
  tone_violet: "Violet",
  tone_teal: "Teal",
  tone_orange: "Orange",
  tone_rose: "Rose",
  time_morning: "Morning",
  time_anytime: "Anytime",
  time_evening: "Evening",
  newHabit: "New habit",
  today: "Today",
  backToToday: "Back to today",
  dayTitle: "{weekday}, {date}",
  doneShort: "{done}/{total}",
  doneStatus: "{done} of {total} habits done",
  pickDay: "Pick a day",
  dayToday: ", today",
  dayDone: ", {done} of {total} done",
  perfectDay: "A perfect {weekday}.",
  allDone: "All {total} habits done.",
  noHabits: "No habits yet",
  noHabitsHint: "Start with one small thing you want to do every day.",
  doneOf: "{done} of {total}",
  thisWeek: "This week",
  perfectDays: "Perfect days",
  topStreak: "Top streak",
  percent: "{n}%",
  weekRange: "{start} – {end}",
  habit: "Habit",
  streak: "Streak",
  whenYouShowUp: "When you show up",
  bestTime:
    "{time} habits stick best this week. Missed one? Tap a square above to fill in an earlier day.",
  cellLabel: "{habit}, {day}: {state}",
  upcoming: "upcoming",
  done: "done",
  missed: "missed",
  partial: "{value} of {count}",
  goalDone: "{count} {unit} · done",
  goalProgress: "{value} of {count} {unit}",
  doneOnce: "Done",
  onceADay: "Once a day",
  dayStreak: " day streak",
  takeOne: "Take one off {name}",
  goalReset: "{name}: {count} of {count} {unit}. Reset",
  addOne: "Add one to {name}, {value} of {count} {unit}",
  close: "Close",
  yourNewHabit: "Your new habit",
  previewMeta: "{time} · {goal}",
  countADay: "{count} {unit} a day",
  name: "Name",
  namePlaceholder: "e.g. Meditate for 5 minutes",
  nameRequired: "Give it a name you’ll recognise at a glance.",
  icon: "Icon",
  colour: "Colour",
  when: "When",
  goal: "Goal",
  countIt: "Count it",
  fewer: "Fewer",
  more: "More",
  unit: "Unit",
  unitPlaceholder: "glasses, pages…",
  defaultUnit: "times",
  aDay: "a day",
  cancel: "Cancel",
  addHabit: "Add habit",
};
type Messages = typeof HABITS_MESSAGES;

export interface HabitsProps {
  productName: string;
  /** First day of the shown week, YYYY-MM-DD. Today is taken from the provider clock. */
  weekStart: string;
  habits: Habit[];
  /** One-tap starting points in the new-habit sheet. */
  suggestions?: NewHabit[];
  /** Sets one day's value for a habit; shows at once and is undone if this fails. Ticking is off without it. */
  onLog?: Action<{ habitId: string; date: string; value: number }>;
  /** Starts a habit today and returns it. The new-habit button is hidden without it. */
  onCreate?: Action<NewHabit, Habit>;
  className?: string;
}

const spring = {
  type: "spring",
  stiffness: 520,
  damping: 44,
  mass: 1,
} as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press =
  "transition-[color,background-color,box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97]";
const card = "rounded-2xl border bg-card shadow-xs/5";
const ICONS: HabitIcon[] = [
  "water",
  "journal",
  "stretch",
  "walk",
  "read",
  "sleep",
  "meditate",
  "veg",
  "lift",
  "music",
  "sun",
  "language",
  "bike",
];
const TONES: HabitTone[] = ["sky", "amber", "violet", "teal", "orange", "rose"];
const TIMES: HabitTime[] = ["morning", "anytime", "evening"];
const WEEK = [0, 1, 2, 3, 4, 5, 6];
const BURST = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (i / 8) * Math.PI * 2);
const iconOf: Record<HabitIcon, LucideIcon> = {
  water: DropletsIcon,
  journal: NotebookPenIcon,
  stretch: PersonStandingIcon,
  walk: FootprintsIcon,
  read: BookOpenIcon,
  sleep: MoonIcon,
  meditate: Flower2Icon,
  veg: CarrotIcon,
  lift: DumbbellIcon,
  music: MusicIcon,
  sun: SunIcon,
  language: LanguagesIcon,
  bike: BikeIcon,
};
const tones: Record<
  HabitTone,
  { tile: string; fill: string; soft: string; wave: string }
> = {
  sky: {
    tile: "bg-category-1/12 text-category-1-foreground",
    fill: "bg-category-1",
    soft: "bg-category-1/30",
    wave: "fill-category-1/30",
  },
  amber: {
    tile: "bg-category-3/14 text-category-3-foreground",
    fill: "bg-category-3",
    soft: "bg-category-3/30",
    wave: "fill-category-3/30",
  },
  violet: {
    tile: "bg-category-5/12 text-category-5-foreground",
    fill: "bg-category-5",
    soft: "bg-category-5/30",
    wave: "fill-category-5/30",
  },
  teal: {
    tile: "bg-category-6/12 text-category-6-foreground",
    fill: "bg-category-6",
    soft: "bg-category-6/30",
    wave: "fill-category-6/30",
  },
  orange: {
    tile: "bg-category-7/12 text-category-7-foreground",
    fill: "bg-category-7",
    soft: "bg-category-7/30",
    wave: "fill-category-7/30",
  },
  rose: {
    tile: "bg-category-4/12 text-category-4-foreground",
    fill: "bg-category-4",
    soft: "bg-category-4/30",
    wave: "fill-category-4/30",
  },
};
const noCreate: Action<NewHabit, Habit> = async () => fail();

const isDone = (h: Habit, v: number) => (h.goal ? v >= h.goal.count : v > 0);
const addDays = (day: string, n: number) =>
  new Date(Date.parse(`${day}T12:00:00Z`) + n * 86_400_000)
    .toISOString()
    .slice(0, 10);

function streakOf(h: Habit, today: number) {
  const since = h.since ?? 0;
  let i = isDone(h, h.week[today] ?? 0) ? today : today - 1;
  let s = 0;
  while (i >= since && isDone(h, h.week[i] ?? 0)) {
    s++;
    i--;
  }
  return i < 0 ? s + h.carry : s;
}

function Tween({
  value,
  format = (n: number) => String(Math.round(n)),
}: {
  value: number;
  format?: (n: number) => string;
}) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      type: "spring",
      stiffness: 200,
      damping: 28,
    });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}

function Ring({
  value,
  size = 40,
  stroke = 4,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  return (
    <svg
      aria-hidden
      className={cn("-rotate-90", className)}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <circle
        className="stroke-muted"
        cx={size / 2}
        cy={size / 2}
        fill="none"
        r={r}
        strokeWidth={stroke}
      />
      <motion.circle
        animate={{ pathLength: value, opacity: value > 0 ? 1 : 0 }}
        className="stroke-primary"
        cx={size / 2}
        cy={size / 2}
        fill="none"
        initial={false}
        r={r}
        strokeLinecap="round"
        strokeWidth={stroke}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 180, damping: 26 }
        }
      />
    </svg>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <span className="truncate text-muted-foreground text-xs">{label}</span>
      <span className="font-heading font-semibold text-xl tracking-tight">
        {value}
      </span>
      {hint ? (
        <span className="-mt-1 truncate text-muted-foreground text-xs">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function GridCell({
  habit,
  value,
  future,
  selected,
  day,
  before,
  onToggle,
  t,
}: {
  habit: Habit;
  value: number;
  future: boolean;
  before?: boolean;
  selected: boolean;
  day: string;
  onToggle?: () => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  if (before)
    return (
      <span
        aria-hidden
        className="mx-auto block size-1 rounded-full bg-border"
      />
    );
  const done = isDone(habit, value);
  const partial =
    habit.goal && !done && value > 0 ? value / habit.goal.count : 0;
  const tone = tones[habit.tone];
  const state = future
    ? t.upcoming
    : done
      ? t.done
      : partial && habit.goal
        ? interpolate(t.partial, { value, count: habit.goal.count })
        : t.missed;
  return (
    <button
      aria-label={interpolate(t.cellLabel, { habit: habit.name, day, state })}
      aria-pressed={future ? undefined : done}
      className={cn(
        "relative mx-auto flex size-6 cursor-pointer items-center justify-center overflow-hidden rounded-[min(var(--radius-md),--spacing(2))] outline-none after:absolute after:-inset-1 after:content-[''] focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
        press,
        future ? "border border-dashed" : "bg-muted",
        selected &&
          !future &&
          "ring-1 ring-foreground/40 ring-offset-1 ring-offset-card"
      )}
      disabled={future || !onToggle}
      onClick={onToggle}
      type="button"
    >
      {partial > 0 ? (
        <motion.span
          animate={{ scaleY: partial }}
          className={cn("absolute inset-0 origin-bottom", tone.soft)}
          initial={false}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
        />
      ) : null}
      <motion.span
        animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.6 }}
        className={cn("absolute inset-0 rounded-[inherit]", tone.fill)}
        initial={false}
        transition={
          reduce
            ? { duration: 0 }
            : { type: "spring", stiffness: 600, damping: 32 }
        }
      />
    </button>
  );
}

function TickButton({
  done,
  value,
  goal,
  tone,
  label,
  burst,
  onTick,
  onUndo,
  t,
}: {
  done: boolean;
  value: number;
  goal?: HabitGoal;
  tone: HabitTone;
  label: string;
  burst: number;
  onTick: () => void;
  onUndo: () => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const c = tones[tone];
  const level = goal ? Math.min(value / goal.count, 1) : done ? 1 : 0;
  const quick = reduce
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 520, damping: 34 } as const);
  // The row sits in an AnimatePresence with initial={false}; reset that here so the burst and wave still play.
  return (
    <PresenceContext.Provider value={null}>
      <span className="relative shrink-0">
        <button
          aria-label={
            goal
              ? done
                ? interpolate(t.goalReset, {
                    name: label,
                    count: goal.count,
                    unit: goal.unit,
                  })
                : interpolate(t.addOne, {
                    name: label,
                    value,
                    count: goal.count,
                    unit: goal.unit,
                  })
              : label
          }
          aria-pressed={goal ? undefined : done}
          className={cn(
            "relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            press,
            "active:scale-[0.95]",
            "inset-ring-2 inset-ring-border hover:inset-ring-foreground/30"
          )}
          onClick={goal && done ? onUndo : onTick}
          type="button"
        >
          {goal ? (
            <>
              <motion.span
                animate={{ y: `${(1 - level) * 100}%` }}
                aria-hidden
                className={cn(
                  "absolute inset-x-0 bottom-0 h-full",
                  done ? c.fill : c.soft
                )}
                initial={false}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 160, damping: 20 }
                }
              >
                {!done && level > 0 ? (
                  <motion.svg
                    animate={reduce ? undefined : { x: ["0%", "-50%"] }}
                    aria-hidden
                    className="absolute -top-1.25 inset-s-0 h-1.5 w-[200%]"
                    key={`w${value}`}
                    preserveAspectRatio="none"
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    viewBox="0 0 80 6"
                  >
                    <path
                      className={c.wave}
                      d="M0 3 Q10 0 20 3 T40 3 T60 3 T80 3 V6 H0 Z"
                    />
                  </motion.svg>
                ) : null}
              </motion.span>
              {done ? null : (
                <span className="relative font-medium text-xs tabular-nums">
                  {value}
                </span>
              )}
            </>
          ) : (
            <motion.span
              animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.95 }}
              aria-hidden
              className={cn("absolute inset-0 rounded-full", c.fill)}
              initial={false}
              transition={quick}
            />
          )}
          <svg
            aria-hidden
            className="relative size-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
          >
            <motion.path
              animate={{ pathLength: done ? 1 : 0, opacity: done ? 1 : 0 }}
              d="M5.5 12.5 10 17 18.5 7.5"
              initial={false}
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.75}
              transition={
                reduce
                  ? { duration: 0 }
                  : { duration: 0.2, ease: easeOut, delay: done ? 0.05 : 0 }
              }
            />
          </svg>
        </button>
        {burst > 0 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            key={burst}
          >
            {BURST.map((a) => (
              <motion.span
                animate={{
                  x: Math.cos(a) * 29,
                  y: Math.sin(a) * 29,
                  opacity: 0,
                  scale: 0.5,
                }}
                className={cn(
                  "absolute top-1/2 left-1/2 -mt-0.75 -ms-0.75 size-1.5 rounded-full",
                  c.fill
                )}
                initial={{
                  x: Math.cos(a) * 19,
                  y: Math.sin(a) * 19,
                  opacity: 1,
                  scale: 1,
                }}
                key={a}
                transition={{ duration: 0.4, ease: easeOut }}
              />
            ))}
          </span>
        ) : null}
      </span>
    </PresenceContext.Provider>
  );
}

function HabitRow({
  habit,
  day,
  streak,
  fresh,
  onChange,
  t,
}: {
  habit: Habit;
  day: number;
  streak: number;
  fresh: boolean;
  onChange?: (v: number) => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const value = habit.week[day] ?? 0;
  const done = isDone(habit, value);
  const Icon = iconOf[habit.icon];
  const [burst, setBurst] = useState(0);
  const tick = () => {
    if (!onChange) return;
    if (habit.goal) {
      if (value >= habit.goal.count) return;
      const next = value + 1;
      onChange(next);
      if (next === habit.goal.count && !reduce) setBurst((b) => b + 1);
    } else {
      onChange(done ? 0 : 1);
      if (!done && !reduce) setBurst((b) => b + 1);
    }
  };
  const sub = habit.goal
    ? done
      ? interpolate(t.goalDone, {
          count: habit.goal.count,
          unit: habit.goal.unit,
        })
      : interpolate(t.goalProgress, {
          value,
          count: habit.goal.count,
          unit: habit.goal.unit,
        })
    : done
      ? t.doneOnce
      : t.onceADay;
  return (
    <motion.li
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative flex items-center gap-3 px-3 py-3 transition-colors duration-300 @md:px-4",
        fresh && "bg-accent/50"
      )}
      exit={{ opacity: 0 }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
      layout={reduce ? false : "position"}
      transition={spring}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tones[habit.tone].tile
        )}
      >
        <Icon className="size-4.5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{habit.name}</span>
        <span className="flex items-center gap-2 text-muted-foreground text-xs">
          <span className="truncate tabular-nums">{sub}</span>
          {streak > 0 ? (
            <span className="flex shrink-0 items-center gap-0.5 text-foreground">
              <FlameIcon
                aria-hidden
                className="size-3 text-category-7-foreground"
              />
              <Tween value={streak} />
              <span className="sr-only">{t.dayStreak}</span>
            </span>
          ) : null}
        </span>
      </div>
      {onChange && habit.goal && value > 0 && !done ? (
        <Button
          aria-label={interpolate(t.takeOne, { name: habit.name })}
          className={press}
          onClick={() => onChange(value - 1)}
          size="icon-sm"
          variant="ghost"
        >
          <MinusIcon />
        </Button>
      ) : null}
      {onChange ? (
        <TickButton
          burst={burst}
          done={done}
          goal={habit.goal}
          label={habit.name}
          onTick={tick}
          onUndo={() => onChange(0)}
          t={t}
          tone={habit.tone}
          value={value}
        />
      ) : null}
    </motion.li>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
  uid,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  uid: string;
}) {
  const reduce = useReducedMotion();
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex rounded-lg bg-muted p-0.5">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              aria-pressed={on}
              className={cn(
                "relative h-8 flex-1 cursor-pointer rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                press,
                on
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              key={o.value}
              onClick={() => onChange(o.value)}
              type="button"
            >
              {on ? (
                <motion.span
                  className="absolute inset-0 -z-10 rounded-md bg-background shadow-xs/5 dark:bg-input"
                  layoutId={uid}
                  transition={reduce ? { duration: 0 } : spring}
                />
              ) : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function AddHabitForm({
  suggestions,
  pending,
  error,
  onClose,
  onAdd,
  t,
}: {
  suggestions: NewHabit[];
  pending: boolean;
  error?: string;
  onClose: () => void;
  onAdd: (h: NewHabit) => void;
  t: Messages;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIcon>("meditate");
  const [tone, setTone] = useState<HabitTone>("teal");
  const [time, setTime] = useState<HabitTime>("anytime");
  const [counted, setCounted] = useState(false);
  const [count, setCount] = useState(3);
  const [unit, setUnit] = useState(t.defaultUnit);
  const [tried, setTried] = useState(false);
  useEffect(() => {
    const f = setTimeout(() => nameRef.current?.focus(), 60);
    return () => clearTimeout(f);
  }, []);

  const invalid = !name.trim();
  const submit = (e: SubmitEvent) => {
    e.preventDefault();
    setTried(true);
    if (invalid) {
      nameRef.current?.focus();
      return;
    }
    if (!pending)
      onAdd({
        name: name.trim(),
        icon,
        tone,
        time,
        goal: counted
          ? { count, unit: unit.trim() || t.defaultUnit }
          : undefined,
      });
  };
  const Icon = iconOf[icon];
  const c = tones[tone];

  return (
    <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={submit}>
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 @3xl:px-5 @3xl:pt-4">
        <SheetTitle className="flex-1 font-heading font-semibold text-base">
          {t.newHabit}
        </SheetTitle>
        <Button
          aria-label={t.close}
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pt-2 pb-4 @3xl:px-5">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
          <motion.span
            animate={{ scale: 1, opacity: 1 }}
            aria-hidden
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
              c.tile
            )}
            initial={reduce ? false : { scale: 0.9, opacity: 0.6 }}
            key={icon}
            transition={{ duration: 0.18, ease: easeOut }}
          >
            <Icon className="size-5" />
          </motion.span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span
              className={cn(
                "truncate font-medium",
                !name.trim() && "text-muted-foreground"
              )}
            >
              {name.trim() || t.yourNewHabit}
            </span>
            <span className="truncate text-muted-foreground text-xs">
              {interpolate(t.previewMeta, {
                time: t[`time_${time}`],
                goal: counted
                  ? interpolate(t.countADay, {
                      count,
                      unit: unit.trim() || t.defaultUnit,
                    })
                  : t.onceADay,
              })}
            </span>
          </div>
          <span
            aria-hidden
            className="size-10 shrink-0 rounded-full border-2 border-border"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-medium" htmlFor={`${uid}-name`}>
            {t.name}
          </label>
          <Input
            aria-describedby={tried && invalid ? `${uid}-err` : undefined}
            aria-invalid={tried && invalid ? true : undefined}
            autoComplete="off"
            id={`${uid}-name`}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            ref={nameRef}
            value={name}
          />
          <AnimatePresence initial={false}>
            {tried && invalid ? (
              <motion.p
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden text-destructive-foreground text-xs"
                exit={{ opacity: 0, height: 0 }}
                id={`${uid}-err`}
                initial={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: easeOut }}
              >
                {t.nameRequired}
              </motion.p>
            ) : null}
          </AnimatePresence>
          {suggestions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  className={cn(
                    "h-7 cursor-pointer rounded-full border bg-background px-2.5 text-xs outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                    press
                  )}
                  key={s.name}
                  onClick={() => {
                    setName(s.name);
                    setIcon(s.icon);
                    setTone(s.tone);
                    setTime(s.time);
                    setCounted(Boolean(s.goal));
                    if (s.goal) {
                      setCount(s.goal.count);
                      setUnit(s.goal.unit);
                    }
                  }}
                  type="button"
                >
                  {s.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 font-medium">{t.icon}</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {ICONS.map((k) => {
              const I = iconOf[k];
              const on = k === icon;
              return (
                <button
                  aria-label={t[`icon_${k}`]}
                  aria-pressed={on}
                  className={cn(
                    "flex aspect-square cursor-pointer items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    press,
                    on
                      ? c.tile
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    on && "ring-1 ring-current/30"
                  )}
                  key={k}
                  onClick={() => setIcon(k)}
                  type="button"
                >
                  <I aria-hidden className="size-4.5" />
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
          <legend className="mb-2 font-medium">{t.colour}</legend>
          <div className="flex gap-2.5">
            {TONES.map((k) => (
              <button
                aria-label={t[`tone_${k}`]}
                aria-pressed={k === tone}
                className={cn(
                  "relative flex size-8 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover",
                  press
                )}
                key={k}
                onClick={() => setTone(k)}
                type="button"
              >
                <span
                  aria-hidden
                  className={cn("size-6 rounded-full", tones[k].fill)}
                />
                {k === tone ? (
                  <motion.span
                    className="absolute inset-0 rounded-full ring-2 ring-foreground/70"
                    layoutId={`${uid}-swatch`}
                    transition={reduce ? { duration: 0 } : spring}
                  />
                ) : null}
              </button>
            ))}
          </div>
        </fieldset>

        <Choice
          label={t.when}
          onChange={(v) => setTime(v as HabitTime)}
          options={TIMES.map((v) => ({ value: v, label: t[`time_${v}`] }))}
          uid={`${uid}-time`}
          value={time}
        />

        <div className="flex flex-col gap-3">
          <Choice
            label={t.goal}
            onChange={(v) => setCounted(v === "count")}
            options={[
              { value: "once", label: t.onceADay },
              { value: "count", label: t.countIt },
            ]}
            uid={`${uid}-goal`}
            value={counted ? "count" : "once"}
          />
          <AnimatePresence initial={false}>
            {counted ? (
              <motion.div
                animate={{ opacity: 1, height: "auto" }}
                className="overflow-hidden"
                exit={{ opacity: 0, height: 0 }}
                initial={{ opacity: 0, height: 0 }}
                transition={
                  reduce ? { duration: 0 } : { duration: 0.22, ease: easeOut }
                }
              >
                <div className="flex items-center gap-2 pt-0.5">
                  <div className="flex items-center rounded-lg border bg-background">
                    <Button
                      aria-label={t.fewer}
                      disabled={count <= 2}
                      onClick={() => setCount((n) => Math.max(2, n - 1))}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <MinusIcon />
                    </Button>
                    <span
                      aria-live="polite"
                      className="w-7 text-center font-medium tabular-nums"
                    >
                      {count}
                    </span>
                    <Button
                      aria-label={t.more}
                      disabled={count >= 20}
                      onClick={() => setCount((n) => Math.min(20, n + 1))}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                  <Input
                    aria-label={t.unit}
                    className="flex-1"
                    maxLength={14}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t.unitPlaceholder}
                    value={unit}
                  />
                  <span className="shrink-0 text-muted-foreground">
                    {t.aDay}
                  </span>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
        {error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex gap-2 border-t px-4 py-3 @3xl:px-5">
        <Button
          className={cn("flex-1", press)}
          onClick={onClose}
          variant="outline"
        >
          {t.cancel}
        </Button>
        <Button
          className={cn("flex-1", press)}
          disabled={pending}
          type="submit"
        >
          {t.addHabit}
        </Button>
      </div>
    </form>
  );
}

function HabitsScreen({
  productName,
  weekStart,
  habits: initialHabits,
  suggestions = [],
  onLog,
  onCreate,
  className,
}: HabitsProps) {
  const t = useMessages("habits", HABITS_MESSAGES);
  const fmt = useFormat();
  const { now, timeZone } = useWirefront();
  const [habits, setHabits] = useState(initialHabits);
  const [synced, setSynced] = useState(initialHabits);
  if (synced !== initialHabits) {
    setSynced(initialHabits);
    setHabits(initialHabits);
  }
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now());
  const todayIndex = Math.min(
    6,
    Math.max(
      0,
      Math.round(
        (Date.parse(`${todayKey}T12:00:00Z`) -
          Date.parse(`${weekStart}T12:00:00Z`)) /
          86_400_000
      )
    )
  );
  const [day, setDay] = useState(todayIndex);
  const [sheet, setSheet] = useState(false);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [wide, setWide] = useState(false);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setWide((e?.contentRect.width ?? 0) >= 768)
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!freshId) return;
    const timer = setTimeout(() => setFreshId(null), 1600);
    return () => clearTimeout(timer);
  }, [freshId]);

  const dateOf = (i: number) => addDays(weekStart, i);
  const cal = (i: number, options: Intl.DateTimeFormatOptions) =>
    fmt.date(`${dateOf(i)}T12:00:00Z`, { ...options, timeZone: "UTC" });
  const dayName = (i: number, style: "long" | "short" | "narrow" = "long") =>
    cal(i, { weekday: style });

  const setLocal = (id: string, i: number, v: number) =>
    setHabits((all) =>
      all.map((h) =>
        h.id === id
          ? { ...h, week: h.week.map((x, j) => (j === i ? v : x)) }
          : h
      )
    );
  const log = useAction(onLog ?? (async () => {}), {
    optimistic: ({ habitId, date, value }) => {
      const i = WEEK.find((n) => dateOf(n) === date) ?? 0;
      const before = habits.find((h) => h.id === habitId)?.week[i] ?? 0;
      setLocal(habitId, i, value);
      return () => setLocal(habitId, i, before);
    },
  });
  const setValue = onLog
    ? (id: string, i: number, value: number) =>
        log.run({ habitId: id, date: dateOf(i), value }, `${id}:${i}`)
    : undefined;
  const create = useAction(onCreate ?? noCreate, {
    onSuccess: (h) => {
      setHabits((all) => [...all.filter((x) => x.id !== h.id), h]);
      setFreshId(h.id);
      setDay(todayIndex);
      setSheet(false);
      addRef.current?.focus();
    },
  });

  const activeOn = (i: number) => habits.filter((h) => (h.since ?? 0) <= i);
  const doneOn = (i: number) =>
    activeOn(i).filter((h) => isDone(h, h.week[i] ?? 0)).length;
  const dayRatio = (i: number) => {
    const n = activeOn(i).length;
    return n ? doneOn(i) / n : 0;
  };
  const doneToday = doneOn(day);
  const dayTotal = activeOn(day).length;
  const allDone = dayTotal > 0 && doneToday === dayTotal;
  const days = WEEK.slice(0, todayIndex + 1);
  const possible = days.reduce((s, i) => s + activeOn(i).length, 0);
  const ticked = days.reduce((s, i) => s + doneOn(i), 0);
  const weekPct = possible ? Math.round((ticked / possible) * 100) : 0;
  const perfect = days.filter(
    (i) => activeOn(i).length > 0 && doneOn(i) === activeOn(i).length
  ).length;
  const best = habits.reduce<{ h: Habit | null; s: number }>(
    (acc, h) => {
      const s = streakOf(h, todayIndex);
      return s > acc.s ? { h, s } : acc;
    },
    { h: null, s: 0 }
  );
  const byTime = TIMES.map((time) => {
    const list = habits.filter((h) => h.time === time);
    let slots = 0;
    let hit = 0;
    for (const h of list)
      for (const i of days)
        if ((h.since ?? 0) <= i) {
          slots++;
          if (isDone(h, h.week[i] ?? 0)) hit++;
        }
    return { time, slots, pct: slots ? Math.round((hit / slots) * 100) : 0 };
  }).filter((x) => x.slots > 0);
  const bestPct = Math.max(0, ...byTime.map((x) => x.pct));
  const bestTime =
    byTime.length > 1 ? byTime.find((x) => x.pct === bestPct) : undefined;
  const isToday = day === todayIndex;
  const newButton = (className?: string) =>
    onCreate ? (
      <Button
        className={cn(className, press)}
        onClick={() => setSheet(true)}
        ref={className ? addRef : undefined}
        size="sm"
      >
        <PlusIcon /> {t.newHabit}
      </Button>
    ) : null;

  return (
    <div
      className={cn(
        "@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm",
        className
      )}
      ref={rootRef}
    >
      <header className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4 @3xl:px-6">
        <span
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
        >
          <FlameIcon className="size-4" />
        </span>
        <span className="font-heading font-semibold">{productName}</span>
        {newButton("ms-auto")}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-275 flex-col gap-5 px-4 pt-5 pb-10 @3xl:px-6 @3xl:pt-6 @4xl:grid @4xl:grid-cols-[minmax(0,1fr)_--spacing(95)] @4xl:items-start @4xl:gap-6">
          <section
            aria-labelledby={`${uid}-day`}
            className="flex min-w-0 flex-col gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex h-5 items-center">
                  <AnimatePresence initial={false} mode="popLayout">
                    {isToday ? (
                      <motion.span
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground text-xs"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        key="today"
                        transition={{ duration: 0.15 }}
                      >
                        {t.today}
                      </motion.span>
                    ) : (
                      <motion.button
                        animate={{ opacity: 1 }}
                        className={cn(
                          "-ms-1 flex h-6 cursor-pointer items-center gap-0.5 rounded-md pe-1.5 text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                          press
                        )}
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        key="back"
                        onClick={() => setDay(todayIndex)}
                        transition={{ duration: 0.15 }}
                        type="button"
                      >
                        <ChevronLeftIcon
                          aria-hidden
                          className="size-3.5 rtl:-scale-x-100"
                        />{" "}
                        {t.backToToday}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <h2
                  className="truncate font-heading font-semibold text-2xl tracking-tight"
                  id={`${uid}-day`}
                >
                  {interpolate(t.dayTitle, {
                    weekday: dayName(day),
                    date: cal(day, { month: "short", day: "numeric" }),
                  })}
                </h2>
              </div>
              <div className="relative flex size-14 shrink-0 items-center justify-center">
                <Ring
                  className="absolute inset-0"
                  size={56}
                  stroke={5}
                  value={dayRatio(day)}
                />
                <span aria-hidden className="font-medium text-xs tabular-nums">
                  {interpolate(t.doneShort, {
                    done: doneToday,
                    total: dayTotal,
                  })}
                </span>
                <span className="sr-only" role="status">
                  {interpolate(t.doneStatus, {
                    done: doneToday,
                    total: dayTotal,
                  })}
                </span>
              </div>
            </div>

            <fieldset className="m-0 grid min-w-0 grid-cols-7 gap-1 border-0 p-0">
              <legend className="sr-only">{t.pickDay}</legend>
              {WEEK.map((i) => {
                const future = i > todayIndex;
                const active = i === day;
                const dayNum = cal(i, { day: "numeric" });
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center gap-1.5 rounded-xl py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default",
                      press,
                      !active && !future && "hover:bg-accent/60",
                      future && "opacity-40"
                    )}
                    disabled={future}
                    key={dateOf(i)}
                    onClick={() => setDay(i)}
                    type="button"
                  >
                    {active ? (
                      <motion.span
                        className="absolute inset-0 -z-10 rounded-xl border bg-card shadow-xs/5"
                        layoutId={`${uid}-day`}
                        transition={reduce ? { duration: 0 } : spring}
                      />
                    ) : null}
                    <span
                      className={cn(
                        "text-xs",
                        active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {dayName(i, "short")}
                    </span>{" "}
                    <span className="relative flex size-8 items-center justify-center">
                      <Ring
                        className="absolute inset-0"
                        size={32}
                        stroke={2.5}
                        value={future ? 0 : dayRatio(i)}
                      />
                      <span
                        className={cn(
                          "font-medium text-xs tabular-nums",
                          i === todayIndex && "text-foreground"
                        )}
                      >
                        {dayNum}
                      </span>
                    </span>
                    <span className="sr-only">{`${i === todayIndex ? t.dayToday : ""}${future ? "" : interpolate(t.dayDone, { done: doneOn(i), total: activeOn(i).length })}`}</span>
                  </button>
                );
              })}
            </fieldset>

            {log.error ? (
              <p className="text-destructive text-xs" role="alert">
                {log.error}
              </p>
            ) : null}

            <AnimatePresence initial={false}>
              {allDone ? (
                <motion.div
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                  exit={{ opacity: 0, height: 0 }}
                  initial={{ opacity: 0, height: 0 }}
                  transition={
                    reduce ? { duration: 0 } : { duration: 0.28, ease: easeOut }
                  }
                >
                  <div className="flex items-center gap-3 rounded-xl border border-success/24 bg-success/8 p-3 dark:bg-success/12">
                    <span
                      aria-hidden
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success text-white"
                    >
                      <SparklesIcon className="size-4" />
                    </span>
                    <p className="text-pretty">
                      <span className="font-medium">
                        {interpolate(t.perfectDay, { weekday: dayName(day) })}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {interpolate(t.allDone, { total: dayTotal })}
                      </span>
                    </p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {habits.length === 0 ? (
              <div
                className={cn(
                  card,
                  "flex flex-col items-center gap-2 px-6 py-12 text-center"
                )}
              >
                <span
                  aria-hidden
                  className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
                >
                  <FlameIcon className="size-4" />
                </span>
                <p className="font-medium">{t.noHabits}</p>
                <p className="text-muted-foreground">{t.noHabitsHint}</p>
                {newButton()}
              </div>
            ) : (
              TIMES.map((time) => {
                const list = habits.filter(
                  (h) => h.time === time && (h.since ?? 0) <= day
                );
                if (!list.length) return null;
                const doneHere = list.filter((h) =>
                  isDone(h, h.week[day] ?? 0)
                ).length;
                return (
                  <div className="flex flex-col gap-2" key={time}>
                    <div className="flex items-baseline justify-between px-1 text-xs">
                      <h3 className="font-medium text-muted-foreground">
                        {t[`time_${time}`]}
                      </h3>
                      <span className="text-muted-foreground tabular-nums">
                        {interpolate(t.doneOf, {
                          done: doneHere,
                          total: list.length,
                        })}
                      </span>
                    </div>
                    <ul className={cn(card, "divide-y overflow-hidden")}>
                      <AnimatePresence initial={false}>
                        {list.map((h) => (
                          <HabitRow
                            day={day}
                            fresh={h.id === freshId}
                            habit={h}
                            key={h.id}
                            onChange={
                              setValue
                                ? (v) => setValue(h.id, day, v)
                                : undefined
                            }
                            streak={streakOf(h, todayIndex)}
                            t={t}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>
                  </div>
                );
              })
            )}
          </section>

          <aside className="flex min-w-0 flex-col gap-4">
            <div className={cn(card, "grid grid-cols-3 divide-x")}>
              <Stat
                label={t.thisWeek}
                value={
                  <Tween
                    format={(n) => interpolate(t.percent, { n: Math.round(n) })}
                    value={weekPct}
                  />
                }
              />
              <Stat label={t.perfectDays} value={<Tween value={perfect} />} />
              <Stat
                hint={best.h ? t[`icon_${best.h.icon}`] : undefined}
                label={t.topStreak}
                value={
                  <span className="flex items-center gap-1">
                    <Tween value={best.s} />
                    <FlameIcon
                      aria-hidden
                      className="size-3.5 text-category-7-foreground"
                    />
                  </span>
                }
              />
            </div>

            <section
              aria-labelledby={`${uid}-grid`}
              className={cn(card, "p-4")}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium" id={`${uid}-grid`}>
                  {t.thisWeek}
                </h3>
                <span className="text-muted-foreground text-xs">
                  {interpolate(t.weekRange, {
                    start: cal(0, { month: "short", day: "numeric" }),
                    end: cal(6, { day: "numeric" }),
                  })}
                </span>
              </div>
              <table className="mt-3 w-full border-separate border-spacing-y-1">
                <thead>
                  <tr>
                    <th className="w-full p-0">
                      <span className="sr-only">{t.habit}</span>
                    </th>
                    {WEEK.map((i) => (
                      <th
                        className={cn(
                          "w-7 p-0 pb-1 text-center font-normal text-[11px]",
                          i === todayIndex
                            ? "font-medium text-foreground"
                            : "text-muted-foreground"
                        )}
                        key={dateOf(i)}
                        scope="col"
                      >
                        <abbr className="no-underline" title={dayName(i)}>
                          {dayName(i, "narrow")}
                        </abbr>
                      </th>
                    ))}
                    <th
                      className="w-10 p-0 pb-1 text-end font-normal text-[11px] text-muted-foreground"
                      scope="col"
                    >
                      <FlameIcon aria-hidden className="ms-auto size-3" />
                      <span className="sr-only">{t.streak}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {habits.map((h) => {
                    const Icon = iconOf[h.icon];
                    const s = streakOf(h, todayIndex);
                    return (
                      <tr key={h.id}>
                        <th
                          className="p-0 pe-2 text-start font-normal"
                          scope="row"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-md",
                                tones[h.tone].tile
                              )}
                            >
                              <Icon className="size-3.5" />
                            </span>
                            <span className="sr-only @md:not-sr-only @md:truncate @md:text-xs @4xl:max-w-30">
                              {h.name}
                            </span>
                          </span>
                        </th>
                        {WEEK.map((i) => {
                          const v = h.week[i] ?? 0;
                          return (
                            <td className="p-0 text-center" key={dateOf(i)}>
                              <GridCell
                                before={i < (h.since ?? 0)}
                                day={dayName(i)}
                                future={i > todayIndex}
                                habit={h}
                                onToggle={
                                  setValue
                                    ? () =>
                                        setValue(
                                          h.id,
                                          i,
                                          isDone(h, v)
                                            ? 0
                                            : (h.goal?.count ?? 1)
                                        )
                                    : undefined
                                }
                                selected={i === day}
                                t={t}
                                value={v}
                              />
                            </td>
                          );
                        })}
                        <td className="p-0 text-end font-medium text-xs tabular-nums">
                          <span
                            className={cn(s === 0 && "text-muted-foreground")}
                          >
                            <Tween value={s} />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section
              aria-labelledby={`${uid}-when`}
              className={cn(card, "p-4")}
            >
              <h3 className="font-medium" id={`${uid}-when`}>
                {t.whenYouShowUp}
              </h3>
              <ul className="mt-3 flex flex-col gap-2.5">
                {byTime.map((x) => (
                  <li
                    className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-3"
                    key={x.time}
                  >
                    <span className="text-muted-foreground text-xs">
                      {t[`time_${x.time}`]}
                    </span>
                    <span
                      aria-hidden
                      className="relative h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <motion.span
                        animate={{ scaleX: x.pct / 100 }}
                        className={cn(
                          "absolute inset-0 origin-left rounded-full rtl:origin-right",
                          x.pct === bestPct ? "bg-primary" : "bg-primary/40"
                        )}
                        initial={false}
                        transition={
                          reduce
                            ? { duration: 0 }
                            : { type: "spring", stiffness: 200, damping: 30 }
                        }
                      />
                    </span>
                    <span className="text-end font-medium text-xs tabular-nums">
                      <Tween
                        format={(n) =>
                          interpolate(t.percent, { n: Math.round(n) })
                        }
                        value={x.pct}
                      />
                    </span>
                  </li>
                ))}
              </ul>
              {bestTime ? (
                <p className="mt-3 text-pretty text-muted-foreground text-xs">
                  {interpolate(t.bestTime, {
                    time: t[`time_${bestTime.time}`],
                  })}
                </p>
              ) : null}
            </section>
          </aside>
        </div>
      </div>

      {onCreate ? (
        <Sheet
          onOpenChange={(open) => {
            setSheet(open);
            if (!open) addRef.current?.focus();
          }}
          open={sheet}
        >
          <SheetContent
            className={cn(
              "gap-0 p-0",
              wide ? "w-100 sm:max-w-100" : "max-h-[92svh] rounded-t-2xl"
            )}
            showCloseButton={false}
            side={wide ? "right" : "bottom"}
          >
            {sheet ? (
              <AddHabitForm
                error={create.error}
                onAdd={(h) => create.run(h)}
                onClose={() => {
                  setSheet(false);
                  addRef.current?.focus();
                }}
                pending={create.isPending()}
                suggestions={suggestions}
                t={t}
              />
            ) : null}
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

export function Habits(props: HabitsProps) {
  return (
    <ScreenBoundary name="Habits">
      <HabitsScreen {...props} />
    </ScreenBoundary>
  );
}
