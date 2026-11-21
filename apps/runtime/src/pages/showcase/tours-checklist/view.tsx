// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CircleIcon } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import type { SetupTask } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("setupChecklist.<key>"). */
export const SETUP_CHECKLIST_MESSAGES = {
  region: "Setup checklist",
  title: "Get set up",
  progress: "{done} of {total} complete",
  allDone: "You’re set. Great work.",
  hide: "Hide for good",
};

export interface SetupChecklistProps {
  tasks: SetupTask[];
  /** An icon per task id, shown at the end of the row. */
  icons?: Record<string, ReactNode>;
  /** Saves a tick or untick. The row flips at once and flips back if this fails. */
  onToggle?: Action<{ id: string; done: boolean }>;
  /** Hide the checklist for good. Offered once every task is done; hidden without it. */
  onHide?: () => void;
}

// Docked bottom-end on sm+, a bottom sheet on phones. Phones start collapsed to a pill so it
// doesn't cover the page (decided after mount, so SSR-safe).
function SetupChecklistScreen({ tasks: initial, icons = {}, onToggle, onHide }: SetupChecklistProps) {
  const t = useMessages("setupChecklist", SETUP_CHECKLIST_MESSAGES);
  const listId = useId();
  const [tasks, setTasks] = useState(initial);
  useEffect(() => setTasks(initial), [initial]);
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 639px)").matches) setOpen(false);
  }, []);
  const flip = (id: string, done: boolean) => setTasks((ts) => ts.map((x) => (x.id === id ? { ...x, done } : x)));
  const toggle = useAction(onToggle ?? (async () => {}), {
    optimistic: ({ id, done }) => {
      flip(id, done);
      return () => flip(id, !done);
    },
  });
  const done = tasks.filter((x) => x.done).length;
  const total = tasks.length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <section aria-label={t.region} className="fixed inset-x-0 bottom-0 z-50 flex max-h-[75svh] flex-col rounded-t-2xl border border-border/70 bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl sm:inset-x-auto sm:end-6 sm:bottom-6 sm:max-h-[calc(100svh-3rem)] sm:w-96 sm:rounded-xl sm:pb-0">
      <button aria-controls={listId} aria-expanded={open} className="flex w-full shrink-0 items-center justify-between gap-3 rounded-t-2xl px-4 py-3 text-start outline-none transition-colors hover:bg-foreground/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:rounded-t-xl" onClick={() => setOpen((o) => !o)} type="button">
        <div>
          <div className="font-medium text-sm">{t.title}</div>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{interpolate(t.progress, { done, total })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div aria-hidden className="relative size-9">
            <svg aria-hidden="true" className="size-9 -rotate-90" viewBox="0 0 36 36">
              <circle className="stroke-foreground/10" cx="18" cy="18" fill="none" r="14" strokeWidth="3" />
              <circle className="stroke-foreground transition-[stroke-dashoffset]" cx="18" cy="18" fill="none" r="14" strokeDasharray={`${(pct / 100) * 88} 88`} strokeLinecap="round" strokeWidth="3" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px]">{Math.round(pct)}%</span>
          </div>
          {open ? <ChevronDownIcon aria-hidden className="size-4 opacity-60" /> : <ChevronUpIcon aria-hidden className="size-4 opacity-60" />}
        </div>
      </button>
      {open ? (
        <ul className="divide-y divide-border/50 overflow-y-auto overscroll-contain border-border/60 border-t" id={listId}>
          {tasks.map((x) => (
            <li key={x.id}>
              <label className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-foreground/[0.02] has-focus-visible:ring-2 has-focus-visible:ring-ring has-focus-visible:ring-inset">
                <input checked={x.done} className="sr-only" onChange={() => toggle.run({ id: x.id, done: !x.done }, x.id)} type="checkbox" />
                <span aria-hidden className={cn("flex size-6 shrink-0 items-center justify-center rounded-full transition-colors", x.done ? "bg-category-2/15 text-category-2-foreground" : "border border-foreground/30 text-transparent")}>
                  {x.done ? <CheckIcon className="size-3.5" /> : <CircleIcon className="size-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("font-medium text-sm", x.done && "text-muted-foreground line-through")}>{x.title}</div>
                  <p className="mt-0.5 text-muted-foreground text-xs leading-snug">{x.description}</p>
                </div>
                {icons[x.id] ? (
                  <span aria-hidden className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">
                    {icons[x.id]}
                  </span>
                ) : null}
              </label>
            </li>
          ))}
          {toggle.error ? (
            <li className="px-4 py-2 text-destructive text-xs" role="alert">
              {toggle.error}
            </li>
          ) : null}
          {total > 0 && done === total ? (
            <li className="bg-foreground/[0.02] px-4 py-3 text-center">
              <p className="text-sm">{t.allDone}</p>
              {onHide ? (
                <Button className="mt-1" onClick={onHide} size="sm" type="button" variant="ghost">
                  {t.hide}
                </Button>
              ) : null}
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  );
}

export function SetupChecklist(props: SetupChecklistProps) {
  return (
    <ScreenBoundary name="SetupChecklist">
      <SetupChecklistScreen {...props} />
    </ScreenBoundary>
  );
}
