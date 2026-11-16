// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Card, CardContent } from "@wirefront/ui/card";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { CalendarDaysIcon, MessageCircleIcon, PaperclipIcon } from "lucide-react";

import type { BoardColumn, BoardTask, TaskPriority } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("taskBoard.<key>"). */
export const TASK_BOARD_MESSAGES = {
  range: "{from} – {to}",
  stats: "{count} issues, {inFlight} in flight",
  low: "Low",
  med: "Med",
  high: "High",
  urgent: "Urgent",
  priorityPrefix: "Priority:",
  subtasks: "{done} / {total} subtasks",
  duePrefix: "Due",
  comments: "{count} comments",
  attachments: "{count} attachments",
  columnCount: "{count} tasks",
  empty: "Nothing here",
};

export interface TaskBoardProps {
  /** The sprint's name, e.g. "Sprint 24 board". */
  title: string;
  startsOn: string;
  endsOn: string;
  columns: BoardColumn[];
  /** Ids of the columns counted as "in flight" in the summary. Defaults to every column. */
  inFlightColumns?: string[];
  /** Where a task links to. Plain text when not given. */
  taskHref?: (task: BoardTask) => string;
  className?: string;
}

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  med: "bg-category-1/15 text-category-1-foreground",
  high: "bg-category-3/15 text-category-3-foreground",
  urgent: "bg-destructive/15 text-destructive-foreground",
};
const DOT = ["", "bg-category-1", "bg-category-2", "bg-category-3", "bg-category-4", "bg-category-5", "bg-category-6", "bg-category-7", "bg-category-8"];
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function TaskBoardScreen({ title, startsOn, endsOn, columns, inFlightColumns, taskHref, className }: TaskBoardProps) {
  const t = useMessages("taskBoard", TASK_BOARD_MESSAGES);
  const format = useFormat();
  const day = (iso: string) => format.date(iso, { month: "short", day: "numeric", timeZone: "UTC" });
  const count = columns.reduce((n, c) => n + c.tasks.length, 0);
  const inFlight = columns.filter((c) => !inFlightColumns || inFlightColumns.includes(c.id)).reduce((n, c) => n + c.tasks.length, 0);

  return (
    <div className={cn("min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12", className)}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="font-heading text-xl">{title}</h1>
          <p className="text-muted-foreground text-sm">
            {interpolate(t.range, { from: day(startsOn), to: day(endsOn) })} · {interpolate(t.stats, { count, inFlight })}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((col) => (
            <section aria-labelledby={`col-${col.id}`} className="flex flex-col gap-3" key={col.id}>
              <div className="flex items-center gap-2 px-1">
                <span aria-hidden className={cn("size-2 rounded-full", DOT[col.color])} />
                <h2 className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]" id={`col-${col.id}`}>
                  {col.name}
                </h2>
                <span className="font-mono text-muted-foreground text-xs">
                  <span aria-hidden>{col.tasks.length}</span>
                  <span className="sr-only">{interpolate(t.columnCount, { count: col.tasks.length })}</span>
                </span>
              </div>
              {col.tasks.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground text-xs">{t.empty}</p> : null}
              <ul className="flex flex-col gap-3">
                {col.tasks.map((task) => (
                  <li key={task.id}>
                    <Card className="relative transition-shadow focus-within:ring-2 focus-within:ring-ring hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-muted-foreground">{task.key}</span>
                          <span className={cn("ms-auto rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider", PRIORITY_CLASS[task.priority])}>
                            <span className="sr-only">{t.priorityPrefix} </span>
                            {t[task.priority]}
                          </span>
                        </div>
                        <h3 className="mt-2 text-foreground text-sm leading-snug">
                          {taskHref ? (
                            // The title's link covers the card, so the whole card opens the task.
                            <WirefrontLink className="outline-none after:absolute after:inset-0 after:content-['']" href={taskHref(task)}>
                              {task.title}
                            </WirefrontLink>
                          ) : (
                            task.title
                          )}
                        </h3>
                        {task.labels.length ? (
                          <ul className="mt-3 flex flex-wrap items-center gap-1.5">
                            {task.labels.map((l) => (
                              <li className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px]" key={l.name}>
                                <span aria-hidden className={cn("size-1.5 rounded-full", DOT[l.color])} />
                                {l.name}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {task.subtasks ? (
                          <div className="mt-3">
                            <div aria-hidden className="h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full bg-foreground/70" style={{ width: `${(task.subtasks.done / task.subtasks.total) * 100}%` }} />
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-muted-foreground">{interpolate(t.subtasks, task.subtasks)}</div>
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <ul className="flex items-center -space-x-1.5">
                            {task.assignees.map((a) => (
                              <li key={a.id}>
                                <Avatar className="size-5 border-2 border-background bg-foreground" title={a.name}>
                                  <AvatarFallback className="bg-foreground text-[10px] text-background">
                                    <span aria-hidden>{initialsOf(a.name)}</span>
                                    <span className="sr-only">{a.name}</span>
                                  </AvatarFallback>
                                </Avatar>
                              </li>
                            ))}
                          </ul>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs">
                            {task.dueAt ? (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDaysIcon aria-hidden className="size-3" />
                                <span className="sr-only">{t.duePrefix} </span>
                                {day(task.dueAt)}
                              </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1">
                              <MessageCircleIcon aria-hidden className="size-3" />
                              <span aria-hidden>{task.commentCount}</span>
                              <span className="sr-only">{interpolate(t.comments, { count: task.commentCount })}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <PaperclipIcon aria-hidden className="size-3" />
                              <span aria-hidden>{task.attachmentCount}</span>
                              <span className="sr-only">{interpolate(t.attachments, { count: task.attachmentCount })}</span>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TaskBoard(props: TaskBoardProps) {
  return (
    <ScreenBoundary name="TaskBoard">
      <TaskBoardScreen {...props} />
    </ScreenBoundary>
  );
}
