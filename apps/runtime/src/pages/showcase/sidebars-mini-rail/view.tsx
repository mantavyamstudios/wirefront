// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { CheckIcon, ChevronDownIcon, PlusIcon, SettingsIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import type { RailWorkspace } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("miniRailShell.<key>"). */
export const MINI_RAIL_SHELL_MESSAGES = {
  main: "Main",
  workspaces: "Workspaces",
  switchTo: "Switch to {name}",
  switchWorkspacePrefix: "Switch workspace, current:",
  addWorkspace: "Add workspace",
  unread: "{label}, {count} unread",
  unreadCount: ", {count} unread",
  settings: "Settings",
  accountName: "Account: {name}",
};

export interface RailItem {
  id: string;
  label: string;
  href: string;
  /** An icon element, e.g. a lucide icon. */
  icon: ReactNode;
  /** Unread count shown as a badge. */
  count?: number;
}

export interface RailUser {
  name: string;
  avatarUrl?: string;
}

export interface MiniRailShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  workspaces: RailWorkspace[];
  currentWorkspaceId: string;
  onSwitchWorkspace: (id: string) => void;
  /** Create a workspace. The + buttons hide without it. */
  onAddWorkspace?: () => void;
  /** Main destinations. Phones show the first five in a bottom tab bar. */
  items: RailItem[];
  /** The id of the current page's item. */
  activeId?: string;
  /** Where the gear goes. Hidden when not given. */
  settingsHref?: string;
  user: RailUser;
  /** Where the avatar goes. Plain when not given. */
  accountHref?: string;
  className?: string;
}

const TINT = [
  "",
  "from-category-1/70 to-category-1/30",
  "from-category-2/70 to-category-2/30",
  "from-category-3/70 to-category-3/30",
  "from-category-4/70 to-category-4/30",
  "from-category-5/70 to-category-5/30",
  "from-category-6/70 to-category-6/30",
  "from-category-7/70 to-category-7/30",
  "from-category-8/70 to-category-8/30",
];
const railButton = "flex size-9 items-center justify-center rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function Tile({ workspace, size = "size-9" }: { workspace: RailWorkspace; size?: string }) {
  return (
    <span aria-hidden className={cn("flex items-center justify-center rounded-lg bg-gradient-to-br font-medium text-[12px] text-foreground/85", size, TINT[workspace.color])}>
      {workspace.name.charAt(0).toUpperCase()}
    </span>
  );
}

function Badge({ count, className }: { count: number; className?: string }) {
  return (
    <span aria-hidden className={cn("absolute flex size-4 items-center justify-center rounded-full bg-destructive font-medium text-[10px] text-white ring-2 ring-background", className)}>
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function MiniRailShell({
  children,
  workspaces,
  currentWorkspaceId,
  onSwitchWorkspace,
  onAddWorkspace,
  items,
  activeId,
  settingsHref,
  user,
  accountHref,
  className,
}: MiniRailShellProps) {
  const t = useMessages("miniRailShell", MINI_RAIL_SHELL_MESSAGES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const current = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];
  const itemLabel = (item: RailItem) => (item.count ? interpolate(t.unread, { label: item.label, count: item.count }) : item.label);
  const avatar = (
    <Avatar className="size-8">
      {user.avatarUrl ? <AvatarImage alt="" src={user.avatarUrl} /> : null}
      <AvatarFallback className="bg-foreground font-medium text-[11px] text-background">{initialsOf(user.name)}</AvatarFallback>
    </Avatar>
  );
  const account = accountHref ? (
    <WirefrontLink className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring" href={accountHref}>
      <span aria-hidden>{avatar}</span>
      <span className="sr-only">{interpolate(t.accountName, { name: user.name })}</span>
    </WirefrontLink>
  ) : (
    <span title={user.name}>{avatar}</span>
  );

  return (
    <div className={cn("min-h-svh bg-background text-foreground md:grid md:grid-cols-[60px_minmax(0,1fr)]", className)}>
      {/* Phones: top bar with the workspace switcher. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-border/60 border-b bg-background/90 px-3 backdrop-blur md:hidden">
        {current ? (
          <Sheet onOpenChange={setSheetOpen} open={sheetOpen}>
            <SheetTrigger className="flex min-h-11 items-center gap-2 rounded-md px-1.5 text-start transition-colors hover:bg-foreground/[0.04]">
              <Tile size="size-8" workspace={current} />
              <span className="sr-only">{t.switchWorkspacePrefix} </span>
              <span className="font-medium text-sm">{current.name}</span>
              <ChevronDownIcon aria-hidden className="size-3.5 opacity-60" />
            </SheetTrigger>
            <SheetContent className="pb-[env(safe-area-inset-bottom)]" side="bottom">
              <div className="px-4 pt-4 pb-2">
                <SheetTitle className="font-heading text-base">{t.workspaces}</SheetTitle>
              </div>
              <ul className="px-2 pb-3">
                {workspaces.map((w) => (
                  <li key={w.id}>
                    <button
                      aria-current={w.id === current.id ? "true" : undefined}
                      className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-start text-sm transition-colors hover:bg-foreground/[0.04]"
                      onClick={() => {
                        setSheetOpen(false);
                        if (w.id !== current.id) onSwitchWorkspace(w.id);
                      }}
                      type="button"
                    >
                      <Tile size="size-8" workspace={w} />
                      <span className="flex-1">{w.name}</span>
                      {w.id === current.id ? <CheckIcon aria-hidden className="size-4" /> : null}
                    </button>
                  </li>
                ))}
                {onAddWorkspace ? (
                  <li>
                    <button
                      className="flex min-h-12 w-full items-center gap-3 rounded-md px-2 text-start text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
                      onClick={() => {
                        setSheetOpen(false);
                        onAddWorkspace();
                      }}
                      type="button"
                    >
                      <span aria-hidden className="flex size-8 items-center justify-center rounded-lg border border-border/70 border-dashed">
                        <PlusIcon className="size-4" />
                      </span>
                      {t.addWorkspace}
                    </button>
                  </li>
                ) : null}
              </ul>
            </SheetContent>
          </Sheet>
        ) : null}
        {account}
      </header>

      {/* md+: a 60px icon rail with tooltips. */}
      <aside className="sticky top-0 hidden h-svh flex-col items-center overflow-x-clip border-border/60 border-e bg-foreground/[0.02] py-3 md:flex">
        <ul aria-label={t.workspaces} className="flex flex-col items-center gap-1.5">
          {workspaces.map((w) => (
            <li className="relative" key={w.id}>
              <Tooltip>
                <TooltipTrigger
                  aria-current={w.id === current?.id ? "true" : undefined}
                  aria-label={interpolate(t.switchTo, { name: w.name })}
                  className={cn(railButton, "transition-transform hover:scale-105 motion-reduce:hover:scale-100")}
                  onClick={() => w.id !== current?.id && onSwitchWorkspace(w.id)}
                >
                  <Tile workspace={w} />
                </TooltipTrigger>
                <TooltipContent side="right">{w.name}</TooltipContent>
              </Tooltip>
              {w.id === current?.id ? <span aria-hidden className="absolute top-1/2 -start-3 h-5 w-1 -translate-y-1/2 rounded-e-full bg-foreground" /> : null}
            </li>
          ))}
          {onAddWorkspace ? (
            <li>
              <Tooltip>
                <TooltipTrigger
                  aria-label={t.addWorkspace}
                  className={cn(railButton, "border border-border/70 border-dashed text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")}
                  onClick={onAddWorkspace}
                >
                  <PlusIcon className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{t.addWorkspace}</TooltipContent>
              </Tooltip>
            </li>
          ) : null}
        </ul>

        <div aria-hidden className="my-4 h-px w-7 bg-border/60" />

        <nav aria-label={t.main} className="flex flex-1 flex-col items-center">
          <ul className="flex flex-col items-center gap-1">
            {items.map((item) => {
              const active = item.id === activeId;
              return (
                <li className="relative" key={item.id}>
                  <Tooltip>
                    <TooltipTrigger
                      aria-current={active ? "page" : undefined}
                      aria-label={itemLabel(item)}
                      className={cn(railButton, "[&_svg]:size-4", active ? "bg-foreground/[0.08] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")}
                      render={<WirefrontLink href={item.href} />}
                    >
                      {item.icon}
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                  {active ? <span aria-hidden className="absolute top-1/2 -start-3 h-5 w-1 -translate-y-1/2 rounded-e-full bg-foreground" /> : null}
                  {item.count ? <Badge className="end-0.5 top-0.5" count={item.count} /> : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-2">
          {settingsHref ? (
            <Tooltip>
              <TooltipTrigger
                aria-label={t.settings}
                className={cn(railButton, "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground")}
                render={<WirefrontLink href={settingsHref} />}
              >
                <SettingsIcon className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="right">{t.settings}</TooltipContent>
            </Tooltip>
          ) : null}
          {account}
        </div>
      </aside>

      <main className="min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>

      {/* Phones: bottom tab bar (five destinations fit). */}
      <nav aria-label={t.main} className="fixed inset-x-0 bottom-0 z-30 border-border/60 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, minmax(0, 1fr))` }}>
          {items.slice(0, 5).map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <WirefrontLink
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors [&_svg]:size-5", active ? "text-foreground" : "text-muted-foreground")}
                  href={item.href}
                >
                  <span aria-hidden className="relative">
                    {item.icon}
                    {item.count ? <Badge className="-end-2.5 -top-1.5" count={item.count} /> : null}
                  </span>
                  {item.label}
                  {item.count ? <span className="sr-only">{interpolate(t.unreadCount, { count: item.count })}</span> : null}
                </WirefrontLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
