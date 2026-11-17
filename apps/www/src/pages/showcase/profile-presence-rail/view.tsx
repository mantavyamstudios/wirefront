// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ChevronDownIcon, MoonIcon, MusicIcon, PhoneIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Presence, PresencePerson } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("presenceRail.<key>"). */
export const PRESENCE_RAIL_MESSAGES = {
  eyebrow: "Workspace",
  intro: "{active} people active right now. The rail shows live presence and current focus, including idle and do-not-disturb states.",
  onlineNow: "Online now",
  onlineCount: "{count} online now",
  awaySummary: "{idle} away · {dnd} do not disturb",
  presence: "Presence",
  online: "Online",
  idle: "Away",
  dnd: "Do not disturb",
  offline: "Offline",
  onlineStat: "Online",
  idleStat: "Idle",
  dndStat: "DND",
  you: "You",
  setDnd: "Turn on do not disturb",
  clearDnd: "Turn off do not disturb",
  errorTitle: "Couldn’t load presence",
  retry: "Try again",
};

export interface PresenceRailProps {
  /** Your workspace's name, for the header. */
  workspace: string;
  /** Everyone, including you. Leave it out while they load. */
  people?: PresencePerson[];
  /** The id of the signed-in person, shown at the foot of the rail. */
  meId?: string;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Turn do not disturb on ("dnd") or off ("online"). It flips at once and back if this fails. Hidden without it. */
  onSetPresence?: Action<Presence>;
  className?: string;
}

type Messages = typeof PRESENCE_RAIL_MESSAGES;
const ORDER: Presence[] = ["online", "idle", "dnd", "offline"];
const DOT: Record<Presence, string> = { online: "bg-success", idle: "bg-category-3", dnd: "bg-category-4", offline: "bg-muted-foreground/40" };

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Rail({ people, me, t, onToggleDnd }: { people: PresencePerson[]; me?: PresencePerson; t: Messages; onToggleDnd?: () => void }) {
  return (
    <>
      <div className="flex items-center justify-between border-border/60 border-b px-4 py-3">
        <h2 className="font-heading text-sm">{t.onlineNow}</h2>
      </div>
      {ORDER.map((presence) => {
        const group = people.filter((p) => p.presence === presence);
        if (!group.length) return null;
        return (
          <details className="group" key={presence} open={presence !== "offline"}>
            <summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 px-4 py-1.5 hover:bg-foreground/[0.02]">
              <ChevronDownIcon aria-hidden className="size-3 -rotate-90 text-muted-foreground transition-transform group-open:rotate-0" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{t[presence]}</span>
              <span className="ms-auto font-mono text-[10px] text-muted-foreground">{group.length}</span>
            </summary>
            <ul className="border-border/40 border-t">
              {group.map((p) => (
                <li className="flex items-center gap-2.5 px-4 py-2 transition-colors hover:bg-foreground/[0.02]" key={p.id}>
                  <div aria-hidden className="relative shrink-0">
                    <Avatar className={cn("size-7", p.presence === "offline" && "opacity-60")}>
                      {p.avatarUrl ? <AvatarImage alt="" src={p.avatarUrl} /> : null}
                      <AvatarFallback className="text-[10px]">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                    <span className={cn("absolute end-0 bottom-0 size-2.5 rounded-full border-2 border-background", DOT[p.presence])} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm">
                      {p.name}
                      <span className="sr-only">, {t[p.presence]}</span>
                    </div>
                    {p.activity ? (
                      <div className="flex items-center gap-1 truncate text-muted-foreground text-xs">
                        {p.activityKind === "call" ? <PhoneIcon aria-hidden className="size-3 shrink-0" /> : p.activityKind === "music" ? <MusicIcon aria-hidden className="size-3 shrink-0" /> : null}
                        {p.activity}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
      {me ? (
        <div className="border-border/60 border-t bg-background px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Avatar aria-hidden className="size-7">
              {me.avatarUrl ? <AvatarImage alt="" src={me.avatarUrl} /> : null}
              <AvatarFallback className="text-[10px]">{initials(me.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm">
                {me.name}
                <span className="sr-only"> ({t.you})</span>
              </div>
              <div className={cn("font-mono text-[10px]", me.presence === "dnd" ? "text-category-4-foreground" : "text-category-2-foreground")}>{t[me.presence]}</div>
            </div>
            {onToggleDnd ? (
              <button
                aria-label={me.presence === "dnd" ? t.clearDnd : t.setDnd}
                aria-pressed={me.presence === "dnd"}
                className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-pressed:text-category-4-foreground pointer-coarse:size-10"
                onClick={onToggleDnd}
                type="button"
              >
                <MoonIcon aria-hidden className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

// md+: intro card with the presence rail beside it. Phones: the intro card gets
// an "Online now" avatar strip, and the full rail opens in a bottom sheet.
function PresenceRailScreen({ workspace, people, meId, status = "ready", error, onRetry, onSetPresence, className }: PresenceRailProps) {
  const t = useMessages("presenceRail", PRESENCE_RAIL_MESSAGES);
  const [list, setList] = useState(people ?? []);
  useEffect(() => setList(people ?? []), [people]);
  const setMine = useAction(onSetPresence ?? (async () => {}), {
    optimistic: (presence) => {
      const before = list;
      setList((all) => all.map((p) => (p.id === meId ? { ...p, presence } : p)));
      return () => setList(before);
    },
  });
  const me = list.find((p) => p.id === meId);
  const count = (presence: Presence) => list.filter((p) => p.presence === presence).length;
  const online = list.filter((p) => p.presence === "online");
  const toggleDnd = onSetPresence && me ? () => void setMine.run(me.presence === "dnd" ? "online" : "dnd") : undefined;

  return (
    <div className={cn("min-h-svh bg-background p-4 sm:p-6 lg:p-8", className)}>
      {status === "error" ? (
        <div className="mx-auto max-w-4xl rounded-xl border border-border/60 py-12 text-center">
          <p className="font-medium">{t.errorTitle}</p>
          {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
          {onRetry ? (
            <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
              {t.retry}
            </Button>
          ) : null}
        </div>
      ) : !people || status === "loading" ? (
        <div aria-busy="true" className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <Skeleton className="h-64 w-full rounded-xl motion-reduce:animate-none" />
          <Skeleton className="h-96 w-full rounded-xl motion-reduce:animate-none max-md:hidden" />
        </div>
      ) : (
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
          <div className="rounded-xl border border-border/60 bg-background/40 p-4 sm:p-6">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{t.eyebrow}</div>
            <h1 className="mt-1 font-heading text-2xl">{workspace}</h1>
            <p className="mt-2 max-w-prose text-muted-foreground text-sm">{interpolate(t.intro, { active: count("online") + count("idle") + count("dnd") })}</p>
            {setMine.error ? (
              <p className="mt-2 text-destructive-foreground text-sm" role="alert">
                {setMine.error}
              </p>
            ) : null}
            <Sheet>
              <SheetTrigger className="mt-4 flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2.5 text-start outline-none hover:bg-foreground/[0.02] focus-visible:ring-2 focus-visible:ring-ring md:hidden">
                <span aria-hidden className="flex -space-x-2">
                  {online.slice(0, 4).map((p) => (
                    <Avatar className="size-8 border-2 border-background" key={p.id}>
                      <AvatarFallback className="text-[10px]">{initials(p.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{interpolate(t.onlineCount, { count: online.length })}</span>
                  <span className="block text-muted-foreground text-xs">{interpolate(t.awaySummary, { idle: count("idle"), dnd: count("dnd") })}</span>
                </span>
                <ChevronDownIcon aria-hidden className="size-4 -rotate-90 text-muted-foreground rtl:rotate-90" />
              </SheetTrigger>
              <SheetContent className="max-h-[85svh] pb-[env(safe-area-inset-bottom)]" side="bottom">
                <SheetTitle className="sr-only">{t.presence}</SheetTitle>
                <div className="overflow-y-auto">
                  <Rail me={me} onToggleDnd={toggleDnd} people={list} t={t} />
                </div>
              </SheetContent>
            </Sheet>
            <dl className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {(
                [
                  ["online", t.onlineStat, "text-category-2-foreground"],
                  ["idle", t.idleStat, "text-category-3-foreground"],
                  ["dnd", t.dndStat, "text-category-4-foreground"],
                ] as const
              ).map(([key, label, tone]) => (
                <div className="rounded-lg border border-border/60 bg-background px-3 py-2" key={key}>
                  <dt className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{label}</dt>
                  <dd className={cn("mt-1 font-heading text-2xl", tone)}>{count(key)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <aside aria-label={t.presence} className="overflow-hidden rounded-xl border border-border bg-background shadow-sm max-md:hidden md:self-start">
            <Rail me={me} onToggleDnd={toggleDnd} people={list} t={t} />
          </aside>
        </div>
      )}
    </div>
  );
}

export function PresenceRail(props: PresenceRailProps) {
  return (
    <ScreenBoundary name="PresenceRail">
      <PresenceRailScreen {...props} />
    </ScreenBoundary>
  );
}
