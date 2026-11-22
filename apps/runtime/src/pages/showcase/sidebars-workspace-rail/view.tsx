// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { cn } from "@wirefront/ui/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@wirefront/ui/sheet";
import {
  interpolate,
  useMessages,
  WirefrontLink,
} from "@wirefront/ui/wirefront/provider";
import {
  ChevronDownIcon,
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import type { RailContext } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("workspaceRailShell.<key>"). */
export const WORKSPACE_RAIL_SHELL_MESSAGES = {
  openNavigation: "Open navigation",
  navigation: "Navigation",
  workspaceNav: "Workspace",
  switchWorkspacePrefix: "Switch workspace, current:",
  search: "Search",
  quickFind: "Quick find…",
  unread: "{count} unread",
  online: "Online",
  away: "Away",
  settings: "Settings",
};

export interface RailNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  /** A coloured square instead of an icon, e.g. a project's colour (1–8). */
  color?: number;
  /** A number on the right. */
  count?: number;
  /** Read the count as unread items (badge) rather than a plain number. */
  unread?: boolean;
}

export interface RailNavSection {
  id: string;
  /** Hidden for an untitled first section. */
  label?: string;
  items: RailNavItem[];
  /** A trailing action such as "New project". */
  action?: { label: string; onClick: () => void };
}

export interface WorkspaceRailShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  context: RailContext;
  sections: RailNavSection[];
  /** The id of the current page's item. */
  activeId?: string;
  /** Open your workspace switcher. The chevron only shows when given. */
  onSwitchWorkspace?: () => void;
  /** Open your command palette. Quick find and ⌘K only work when given. */
  onSearch?: () => void;
  /** Where the gear goes. Hidden when not given. */
  settingsHref?: string;
  className?: string;
}

const DOT = [
  "",
  "bg-category-1/80",
  "bg-category-2/80",
  "bg-category-3/80",
  "bg-category-4/80",
  "bg-category-5/80",
  "bg-category-6/80",
  "bg-category-7/80",
  "bg-category-8/80",
];
// Rows grow to 44px on touch screens; desktop keeps the dense rhythm.
const ROW =
  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11";
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function Mark() {
  return (
    <div
      aria-hidden
      className="size-7 shrink-0 rounded-md bg-linear-to-br from-primary/70 to-primary/30 ring-1 ring-border/60"
    />
  );
}

export function WorkspaceRailShell({
  children,
  context,
  sections,
  activeId,
  onSwitchWorkspace,
  onSearch,
  settingsHref,
  className,
}: WorkspaceRailShellProps) {
  const t = useMessages("workspaceRailShell", WORKSPACE_RAIL_SHELL_MESSAGES);
  const [navOpen, setNavOpen] = useState(false);
  const { workspace, user } = context;

  // ⌘K / Ctrl+K opens quick find, as the hint says.
  useEffect(() => {
    if (!onSearch) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey))
        return;
      event.preventDefault();
      onSearch();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSearch]);

  const rail = (inSheet: boolean) => {
    const close = () => inSheet && setNavOpen(false);
    const header = (
      <div className="flex min-w-0 items-center gap-2.5">
        <Mark />
        <div className="min-w-0">
          <div className="truncate font-medium text-sm">{workspace.name}</div>
          {workspace.detail ? (
            <div className="truncate font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              {workspace.detail}
            </div>
          ) : null}
        </div>
      </div>
    );
    return (
      <div className="flex h-full min-h-0 flex-col">
        {onSwitchWorkspace ? (
          <button
            className={cn(
              "flex w-full items-center justify-between gap-2 border-border/60 border-b px-3.5 py-3 text-start outline-none transition-colors hover:bg-foreground/3 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
              inSheet && "pe-14"
            )}
            onClick={onSwitchWorkspace}
            type="button"
          >
            <span className="sr-only">{t.switchWorkspacePrefix} </span>
            {header}
            <ChevronDownIcon
              aria-hidden
              className="size-3.5 shrink-0 opacity-60"
            />
          </button>
        ) : (
          <div
            className={cn(
              "border-border/60 border-b px-3.5 py-3",
              inSheet && "pe-14"
            )}
          >
            {header}
          </div>
        )}

        {onSearch ? (
          <div className="px-3 pt-3">
            <button
              className="flex w-full items-center gap-2 rounded-md border border-border/60 bg-background/60 px-2.5 py-1.5 text-start outline-none transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11"
              onClick={() => {
                close();
                onSearch();
              }}
              type="button"
            >
              <SearchIcon aria-hidden className="size-3.5 opacity-50" />
              <span className="flex-1 truncate text-muted-foreground text-xs">
                {t.quickFind}
              </span>
              <kbd className="rounded border border-border/60 bg-background/80 px-1 font-mono text-[10px] text-muted-foreground pointer-coarse:hidden">
                ⌘K
              </kbd>
            </button>
          </div>
        ) : null}

        <nav
          aria-label={t.workspaceNav}
          className="mt-3 flex-1 overflow-y-auto px-2 pb-4"
        >
          {sections.map((section) => (
            <div key={section.id}>
              {section.label ? (
                <h2 className="mt-5 mb-1 px-2 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">
                  {section.label}
                </h2>
              ) : null}
              <ul className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <WirefrontLink
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          ROW,
                          "justify-between",
                          active
                            ? "bg-foreground/6 text-foreground"
                            : "text-muted-foreground hover:bg-foreground/3 hover:text-foreground"
                        )}
                        href={item.href}
                        onClick={close}
                      >
                        <span className="flex min-w-0 items-center gap-2.5 [&_svg]:size-4 [&_svg]:opacity-70">
                          {item.color ? (
                            <span
                              aria-hidden
                              className={cn(
                                "size-2 shrink-0 rounded-sm",
                                DOT[item.color]
                              )}
                            />
                          ) : (
                            item.icon
                          )}
                          <span className="truncate">{item.label}</span>
                        </span>
                        {item.count !== undefined ? (
                          item.unread ? (
                            <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
                              <span aria-hidden>{item.count}</span>
                              <span className="sr-only">
                                , {interpolate(t.unread, { count: item.count })}
                              </span>
                            </span>
                          ) : (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.count}
                            </span>
                          )
                        ) : null}
                      </WirefrontLink>
                    </li>
                  );
                })}
                {section.action ? (
                  <li>
                    <button
                      className={cn(
                        ROW,
                        "gap-2 text-muted-foreground text-xs hover:bg-foreground/3 hover:text-foreground"
                      )}
                      onClick={() => {
                        close();
                        section.action?.onClick();
                      }}
                      type="button"
                    >
                      <PlusIcon aria-hidden className="size-3.5" />
                      {section.action.label}
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2 border-border/60 border-t px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <Avatar className="size-7">
            {user.avatarUrl ? (
              <AvatarImage alt="" src={user.avatarUrl} />
            ) : null}
            <AvatarFallback className="bg-foreground font-medium text-[11px] text-background">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-sm">{user.name}</div>
            {user.online !== undefined ? (
              <div className="flex items-center gap-1.5 truncate text-muted-foreground text-xs">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    user.online ? "bg-category-2" : "bg-muted-foreground/50"
                  )}
                />
                {user.online ? t.online : t.away}
              </div>
            ) : null}
          </div>
          {settingsHref ? (
            <WirefrontLink
              aria-label={t.settings}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground outline-none transition-colors hover:bg-foreground/4 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11"
              href={settingsHref}
              onClick={close}
            >
              <SettingsIcon className="size-4" />
            </WirefrontLink>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div
      className={cn(
        "min-h-svh bg-background text-foreground md:grid md:grid-cols-[260px_minmax(0,1fr)]",
        className
      )}
    >
      {/* Phones: top bar + off-canvas rail. */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-border/60 border-b bg-background/90 px-2 backdrop-blur md:hidden">
        <Sheet onOpenChange={setNavOpen} open={navOpen}>
          <SheetTrigger
            aria-label={t.openNavigation}
            className="flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/4 hover:text-foreground"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent className="max-w-75 bg-background" side="left">
            <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
            {rail(true)}
          </SheetContent>
        </Sheet>
        <Mark />
        <span className="truncate font-medium text-sm">{workspace.name}</span>
        {onSearch ? (
          <button
            aria-label={t.search}
            className="ms-auto flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/4 hover:text-foreground"
            onClick={onSearch}
            type="button"
          >
            <SearchIcon className="size-4" />
          </button>
        ) : null}
      </header>

      {/* md+: docked rail. */}
      <aside className="sticky top-0 hidden h-svh flex-col border-border/60 border-e bg-foreground/2 md:flex">
        {rail(false)}
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}
