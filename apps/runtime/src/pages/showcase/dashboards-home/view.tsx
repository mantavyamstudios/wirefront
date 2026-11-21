// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ArrowRightIcon, CheckIcon, CircleIcon, PlusIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { SetTaskDoneInput, Task, Today } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("homeDashboard.<key>"). */
export const HOME_DASHBOARD_MESSAGES = {
  morning: "Good morning, {name}.",
  afternoon: "Good afternoon, {name}.",
  evening: "Good evening, {name}.",
  openOne: "1 thing on your plate today.",
  openMany: "{count} things on your plate today.",
  openNone: "Nothing left on your plate today.",
  shortcuts: "Shortcuts",
  tasks: "Today’s tasks",
  newTask: "New",
  markDone: "Mark “{title}” done",
  markNotDone: "Mark “{title}” not done",
  today: "Today",
  tomorrow: "Tomorrow",
  noTasks: "No tasks yet.",
  schedule: "Today’s schedule",
  eventsOne: "1 event",
  eventsMany: "{count} events",
  noEvents: "Nothing scheduled.",
  errorTitle: "Couldn’t load your day",
  retry: "Try again",
};

export interface HomeStat {
  label: string;
  /** Already formatted, e.g. "3h 12m". */
  value: string;
  detail?: string;
}

export interface HomeShortcut {
  label: string;
  href: string;
}

export interface HomeDashboardProps {
  /** Who is signed in; used in the greeting. */
  userName: string;
  /** Today's tasks and events. Leave it out while they load. */
  data?: Today;
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Tick a task done or not. The change shows at once and rolls back if this fails. Checkboxes are read-only without it. */
  onSetTaskDone?: Action<SetTaskDoneInput>;
  /** The "New" task button only shows when this is given. */
  onNewTask?: () => void;
  /** Quick links under the greeting. */
  shortcuts?: HomeShortcut[];
  /** Small figures along the bottom, e.g. a streak or focus time. */
  stats?: HomeStat[];
  className?: string;
}

/** Event dot colours by category. */
const CATEGORY_DOT: Record<number, string> = {
  1: "bg-category-1/80",
  2: "bg-category-2/80",
  3: "bg-category-3/80",
  4: "bg-category-4/80",
  5: "bg-category-5/80",
  6: "bg-category-6/80",
  7: "bg-category-7/80",
  8: "bg-category-8/80",
};
const SKELETON_ROWS = ["r1", "r2", "r3", "r4"];
const eyebrow = "font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]";

function Card({ title, trailing, children }: { title: string; trailing?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div className="flex min-h-8 items-center justify-between">
        <h2 className={eyebrow}>{title}</h2>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function HomeDashboardScreen({ userName, data, status = "ready", error, onRetry, onSetTaskDone, onNewTask, shortcuts = [], stats = [], className }: HomeDashboardProps) {
  const t = useMessages("homeDashboard", HOME_DASHBOARD_MESSAGES);
  const format = useFormat();
  const { now, timeZone } = useWirefront();
  const [tasks, setTasks] = useState<Task[]>(data?.tasks ?? []);
  useEffect(() => setTasks(data?.tasks ?? []), [data]);
  const toggle = useAction(onSetTaskDone ?? (async () => {}), {
    optimistic: ({ id, done }) => {
      setTasks((all) => all.map((task) => (task.id === id ? { ...task, done } : task)));
      return () => setTasks((all) => all.map((task) => (task.id === id ? { ...task, done: !done } : task)));
    },
  });

  const today = now();
  // The calendar date in the provider's time zone, as YYYY-MM-DD.
  const isoDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const todayIso = isoDay(today);
  const tomorrowIso = isoDay(new Date(today.getTime() + 86_400_000));
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(today));
  const greeting = hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening;
  const due = (date: string) => (date === todayIso ? t.today : date === tomorrowIso ? t.tomorrow : format.date(date, { month: "short", day: "numeric", timeZone: "UTC" }));

  const ready = status === "ready" && data ? data : undefined;
  const open = tasks.filter((task) => !task.done && task.due === todayIso).length;

  return (
    <div className={cn("min-h-svh bg-background text-foreground", className)}>
      <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{format.date(today, { weekday: "long", month: "short", day: "numeric" })}</div>
          <h1 className="mt-1 font-heading text-3xl tracking-tight sm:text-4xl">{interpolate(greeting, { name: userName })}</h1>
          {ready ? (
            <p className="mt-2 max-w-xl text-muted-foreground text-sm">{open === 0 ? t.openNone : open === 1 ? t.openOne : interpolate(t.openMany, { count: open })}</p>
          ) : null}

          {shortcuts.length ? (
            <nav aria-label={t.shortcuts} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {shortcuts.map((s) => (
                <WirefrontLink
                  className="group flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/40 px-3.5 py-2.5 text-start transition-colors hover:border-foreground/40 hover:bg-background/60 pointer-coarse:min-h-12"
                  href={s.href}
                  key={s.href}
                >
                  <span className="text-sm">{s.label}</span>
                  <ArrowRightIcon aria-hidden className="size-3.5 opacity-50 transition-transform group-hover:translate-x-0.5 group-hover:opacity-90 rtl:rotate-180" />
                </WirefrontLink>
              ))}
            </nav>
          ) : null}

          {status === "error" ? (
            <div className="mt-8 rounded-xl border border-border/60 bg-background/40 p-10 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : (
            <div aria-busy={status === "loading"} className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]">
              <Card
                title={t.tasks}
                trailing={
                  onNewTask ? (
                    <Button onClick={onNewTask} size="sm" variant="ghost">
                      <PlusIcon />
                      {t.newTask}
                    </Button>
                  ) : null
                }
              >
                {toggle.error ? (
                  <p className="mt-2 text-destructive-foreground text-xs" role="alert">
                    {toggle.error}
                  </p>
                ) : null}
                <ul className="mt-3 flex flex-col">
                  {ready ? (
                    tasks.length ? (
                      tasks.map((task) => (
                        <li className="group flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/3 sm:items-center" key={task.id}>
                          {/* 20px circle inside a 28px (44px on touch) hit area. */}
                          <button
                            aria-label={interpolate(task.done ? t.markNotDone : t.markDone, { title: task.title })}
                            className="-m-1 flex size-7 shrink-0 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default pointer-coarse:-m-3 pointer-coarse:size-11"
                            disabled={!onSetTaskDone || toggle.isPending(task.id)}
                            onClick={() => void toggle.run({ id: task.id, done: !task.done }, task.id)}
                            type="button"
                          >
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full border border-foreground/30 transition-colors",
                                task.done ? "bg-foreground/10 text-foreground" : "text-transparent hover:bg-foreground/6",
                              )}
                            >
                              {task.done ? <CheckIcon aria-hidden className="size-3" /> : <CircleIcon aria-hidden className="size-3" />}
                            </span>
                          </button>
                          {/* Title on its own line below sm; meta follows underneath. */}
                          <div className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                            <span className={cn("block text-sm sm:flex-1 sm:truncate", task.done && "text-muted-foreground line-through")}>{task.title}</span>
                            <span className="mt-1 flex items-center gap-2 sm:mt-0 sm:contents">
                              {task.project ? (
                                <span className="rounded bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em]">{task.project}</span>
                              ) : null}
                              {task.due ? <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.15em] sm:w-16 sm:text-end">{due(task.due)}</span> : null}
                            </span>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-2 py-6 text-center text-muted-foreground text-sm">{t.noTasks}</li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li className="px-2 py-2" key={key}>
                        <Skeleton className="h-6 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ul>
              </Card>

              <Card
                title={t.schedule}
                trailing={ready ? <span className={eyebrow}>{ready.events.length === 1 ? t.eventsOne : interpolate(t.eventsMany, { count: ready.events.length })}</span> : null}
              >
                <ul className="mt-3 flex flex-col gap-2">
                  {ready ? (
                    ready.events.length ? (
                      ready.events.map((e) => (
                        <li className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-foreground/3" key={e.id}>
                          <time className="w-14 shrink-0 text-center font-mono text-[11px] text-foreground" dateTime={e.start}>
                            {format.time(e.start)}
                          </time>
                          <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", CATEGORY_DOT[e.category ?? 1])} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm">{e.title}</div>
                            {e.detail ? <div className="truncate text-muted-foreground text-xs">{e.detail}</div> : null}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="px-2 py-6 text-center text-muted-foreground text-sm">{t.noEvents}</li>
                    )
                  ) : (
                    SKELETON_ROWS.map((key) => (
                      <li className="px-2 py-2" key={key}>
                        <Skeleton className="h-8 w-full motion-reduce:animate-none" />
                      </li>
                    ))
                  )}
                </ul>
              </Card>
            </div>
          )}

          {stats.length ? (
            <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {stats.map((s) => (
                <div className="rounded-xl border border-border/60 bg-background/40 p-4" key={s.label}>
                  <dt className={eyebrow}>{s.label}</dt>
                  <dd className="mt-2 font-heading text-2xl">{s.value}</dd>
                  {s.detail ? <dd className="mt-1 text-muted-foreground text-xs">{s.detail}</dd> : null}
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function HomeDashboard(props: HomeDashboardProps) {
  return (
    <ScreenBoundary name="HomeDashboard">
      <HomeDashboardScreen {...props} />
    </ScreenBoundary>
  );
}
