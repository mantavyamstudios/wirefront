// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { ChevronDownIcon, CopyIcon, MoreHorizontalIcon, UserMinusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { Permission, Roster, RosterMember } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("memberRoster.<key>"). */
export const MEMBER_ROSTER_MESSAGES = {
  eyebrow: "Workspace members · {shown} of {total}",
  title: "Compact roster",
  handle: "@{handle}",
  online: "online",
  away: "away",
  dnd: "do not disturb",
  off: "offline",
  activeNow: "active now",
  activeAgo: "active {when}",
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
  permissionFor: "Permission for {name}: {permission}",
  moreFor: "More actions for {name}",
  copyEmail: "Copy email",
  remove: "Remove from workspace",
  empty: "No members yet.",
  errorTitle: "Couldn’t load members",
  retry: "Try again",
};

export interface MemberRosterProps {
  /** Members and the workspace total. Leave it out while they load. */
  roster?: Roster;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Change a member's permission. It shows at once and reverts if this fails. Read-only without it. */
  onChangePermission?: Action<{ id: string; permission: Permission }>;
  /** Remove a member. Hidden without it. */
  onRemove?: Action<string>;
  className?: string;
}

const PERMISSIONS: Permission[] = ["owner", "admin", "member", "viewer"];
const DOT: Record<RosterMember["presence"], string> = { online: "bg-success", away: "bg-category-3", dnd: "bg-category-4", off: "bg-muted-foreground/40" };
const TONE: Record<Permission, string> = {
  owner: "bg-category-5/15 text-category-5-foreground",
  admin: "bg-category-8/15 text-category-8-foreground",
  member: "bg-foreground/[0.06] text-foreground",
  viewer: "bg-muted text-muted-foreground",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function MemberRosterScreen({ roster, status = "ready", error, onRetry, onChangePermission, onRemove, className }: MemberRosterProps) {
  const t = useMessages("memberRoster", MEMBER_ROSTER_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const [members, setMembers] = useState(roster?.members ?? []);
  useEffect(() => setMembers(roster?.members ?? []), [roster]);
  const change = useAction(onChangePermission ?? (async () => {}), {
    optimistic: ({ id, permission }) => {
      const before = members;
      setMembers((all) => all.map((m) => (m.id === id ? { ...m, permission } : m)));
      return () => setMembers(before);
    },
  });
  const remove = useAction(onRemove ?? (async () => {}), {
    optimistic: (id) => {
      const before = members;
      setMembers((all) => all.filter((m) => m.id !== id));
      return () => setMembers(before);
    },
  });
  const active = (at: string) => (now().getTime() - new Date(at).getTime() < 5 * 60_000 ? t.activeNow : interpolate(t.activeAgo, { when: fmt.relative(at) }));

  return (
    <div className={cn("min-h-svh bg-background px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10", className)}>
      <div className="mx-auto max-w-2xl">
        {roster ? <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.eyebrow, { shown: members.length, total: roster.total })}</div> : null}
        <h1 className="mt-1 font-heading text-2xl">{t.title}</h1>
        {change.error || remove.error ? (
          <p className="mt-3 text-destructive-foreground text-sm" role="alert">
            {change.error ?? remove.error}
          </p>
        ) : null}

        {status === "error" ? (
          <div className="mt-5 rounded-xl border border-border/60 py-12 text-center">
            <p className="font-medium">{t.errorTitle}</p>
            {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
            {onRetry ? (
              <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                {t.retry}
              </Button>
            ) : null}
          </div>
        ) : !roster || status === "loading" ? (
          <div aria-busy="true" className="mt-5 flex flex-col gap-2">
            {["a", "b", "c", "d"].map((k) => (
              <Skeleton className="h-16 w-full rounded-xl motion-reduce:animate-none" key={k} />
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="mt-5 rounded-xl border border-border/60 py-12 text-center text-muted-foreground text-sm">{t.empty}</p>
        ) : (
          <ul className="mt-5 flex flex-col gap-2">
            {members.map((m) => (
              <li
                // Phones: avatar · name/team/status · permission · menu. The permission
                // column has a fixed width so rows line up; the team column appears from md.
                className="grid grid-cols-[40px_minmax(0,1fr)_5.75rem_auto] items-center gap-2 rounded-xl border border-border bg-background px-3 py-3 shadow-sm transition-colors hover:bg-background/95 sm:gap-3 sm:px-4 md:grid-cols-[44px_minmax(0,1fr)_140px_120px_auto]"
                key={m.id}
              >
                <div aria-hidden className="relative">
                  <Avatar className="size-10">
                    <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                  </Avatar>
                  <span className={cn("absolute end-0 bottom-0 size-3 rounded-full border-2 border-background", DOT[m.presence])} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm">{m.name}</span>
                    <span className="sr-only">, {t[m.presence]}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted-foreground max-sm:hidden">{interpolate(t.handle, { handle: m.handle })}</span>
                  </div>
                  <div className={cn("mt-0.5 truncate text-xs", m.customStatus ? "text-foreground/80" : "text-muted-foreground")}>
                    {m.team ? <span className="text-muted-foreground md:hidden">{m.team} · </span> : null}
                    {m.customStatus ?? active(m.lastActiveAt)}
                  </div>
                </div>
                <div className="text-muted-foreground text-xs max-md:hidden">
                  {m.team ? <div>{m.team}</div> : null}
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em]">{active(m.lastActiveAt)}</div>
                </div>
                <div>
                  {onChangePermission ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={interpolate(t.permissionFor, { name: m.name, permission: t[m.permission] })}
                        className={cn("inline-flex min-h-8 w-full items-center justify-between gap-1.5 rounded-md px-2 py-1.5 font-mono text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10", TONE[m.permission])}
                      >
                        {t[m.permission]}
                        <ChevronDownIcon aria-hidden className="size-3" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuRadioGroup onValueChange={(v) => void change.run({ id: m.id, permission: v as Permission }, m.id)} value={m.permission}>
                          {PERMISSIONS.map((p) => (
                            <DropdownMenuRadioItem key={p} value={p}>
                              {t[p]}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className={cn("inline-flex min-h-8 w-full items-center rounded-md px-2 py-1.5 font-mono text-[11px]", TONE[m.permission])}>{t[m.permission]}</span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    aria-label={interpolate(t.moreFor, { name: m.name })}
                    className="-me-1 grid size-8 place-items-center rounded-md text-muted-foreground outline-none hover:bg-foreground/[0.05] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
                  >
                    <MoreHorizontalIcon aria-hidden className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => void navigator.clipboard?.writeText(m.email)}>
                      <CopyIcon aria-hidden />
                      {t.copyEmail}
                    </DropdownMenuItem>
                    {onRemove ? (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => void remove.run(m.id, m.id)} variant="destructive">
                          <UserMinusIcon aria-hidden />
                          {t.remove}
                        </DropdownMenuItem>
                      </>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MemberRoster(props: MemberRosterProps) {
  return (
    <ScreenBoundary name="MemberRoster">
      <MemberRosterScreen {...props} />
    </ScreenBoundary>
  );
}
