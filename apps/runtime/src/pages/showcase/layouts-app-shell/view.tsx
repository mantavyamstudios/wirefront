// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@wirefront/ui/sheet";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { BellIcon, ChevronDownIcon, ChevronUpIcon, MenuIcon, SearchIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import type { ShellUser, ShellWorkspace } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("appShell.<key>"). */
export const APP_SHELL_MESSAGES = {
  openNavigation: "Open navigation",
  navigation: "Navigation",
  workspace: "Workspace",
  switchWorkspace: "Switch workspace, current: {name}",
  search: "Search…",
  searchLabel: "Search",
  notifications: "Notifications",
  notificationsUnread: "Notifications, {count} unread",
};

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** An icon (e.g. a lucide icon element). */
  icon?: ReactNode;
  /** A coloured dot instead of an icon, e.g. a project's colour (any CSS colour). */
  color?: string;
  /** A count shown on the right, e.g. unread items. */
  count?: number;
}

export interface NavSection {
  id: string;
  /** Hidden for the first, untitled section when empty. */
  label?: string;
  items: NavItem[];
}

export interface AppShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  user: ShellUser;
  workspace: ShellWorkspace;
  /** The sidebar, top to bottom. Links go through WirefrontProvider `link`. */
  sections: NavSection[];
  /** The id of the current page's nav item. */
  activeId?: string;
  /** Open your workspace switcher. The chevron and button behaviour only show when given. */
  onSwitchWorkspace?: () => void;
  /** Open your command palette or search page. The search field only shows when given. */
  onSearch?: () => void;
  /** Where the bell goes. Hidden when not given. */
  notificationsHref?: string;
  unread?: number;
  /** Where the account row goes (profile or settings). */
  accountHref?: string;
  className?: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AppShell({
  children,
  user,
  workspace,
  sections,
  activeId,
  onSwitchWorkspace,
  onSearch,
  notificationsHref,
  unread = 0,
  accountHref,
  className,
}: AppShellProps) {
  const t = useMessages("appShell", APP_SHELL_MESSAGES);
  const [navOpen, setNavOpen] = useState(false);
  const avatar = (size: string) => (
    <Avatar className={size}>
      {user.avatarUrl ? <AvatarImage alt="" src={user.avatarUrl} /> : null}
      <AvatarFallback>{initials(user.name)}</AvatarFallback>
    </Avatar>
  );

  const workspaceLabel = (
    <>
      <span className="size-6 shrink-0 rounded bg-gradient-to-br from-category-2/80 to-category-1/70" />
      <span className="truncate whitespace-nowrap font-medium text-sm">{workspace.name}</span>
    </>
  );

  return (
    <div className={cn("flex min-h-svh flex-col bg-background text-foreground", className)}>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-border/60 border-b bg-background/95 px-2 backdrop-blur sm:gap-4 md:px-4">
        <Sheet onOpenChange={setNavOpen} open={navOpen}>
          <SheetTrigger
            aria-label={t.openNavigation}
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground md:hidden"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent className="max-w-[300px] bg-background" side="left">
            <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
            <SidebarNav accountHref={accountHref} activeId={activeId} avatar={avatar("size-7")} onNavigate={() => setNavOpen(false)} sections={sections} t={t} user={user} />
          </SheetContent>
        </Sheet>

        {onSwitchWorkspace ? (
          <button
            aria-label={interpolate(t.switchWorkspace, { name: workspace.name })}
            className="flex min-w-0 items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 transition-colors hover:bg-foreground/[0.03]"
            onClick={onSwitchWorkspace}
            type="button"
          >
            {workspaceLabel}
            <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-2 px-2 py-1.5">{workspaceLabel}</div>
        )}

        {onSearch ? (
          <button
            className="mx-auto hidden h-9 w-full max-w-md items-center justify-between rounded-lg border border-input bg-transparent px-3 text-muted-foreground text-sm transition-colors hover:bg-foreground/[0.02] md:flex"
            onClick={onSearch}
            type="button"
          >
            <span className="flex items-center gap-2">
              <SearchIcon className="size-4" />
              {t.search}
            </span>
            <Kbd>⌘K</Kbd>
          </button>
        ) : null}

        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          {onSearch ? (
            <Button aria-label={t.searchLabel} className="md:hidden" onClick={onSearch} size="icon" variant="ghost">
              <SearchIcon />
            </Button>
          ) : null}
          {notificationsHref ? (
            <WirefrontLink className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")} href={notificationsHref} aria-label={unread ? interpolate(t.notificationsUnread, { count: unread }) : t.notifications}>
              <BellIcon />
              {unread ? <span className="absolute top-2 end-2 size-2 rounded-full bg-primary ring-2 ring-background" /> : null}
            </WirefrontLink>
          ) : null}
          <div className="relative">{avatar("size-7")}</div>
        </div>
      </header>

      <div className="flex-1 md:grid md:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="sticky top-14 hidden h-[calc(100svh-3.5rem)] border-border/60 border-e bg-foreground/[0.015] md:block">
          <SidebarNav accountHref={accountHref} activeId={activeId} avatar={avatar("size-7")} sections={sections} t={t} user={user} />
        </aside>
        <main className="min-w-0 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarNav({
  sections,
  activeId,
  user,
  avatar,
  accountHref,
  onNavigate,
  t,
}: {
  sections: NavSection[];
  activeId?: string;
  user: ShellUser;
  avatar: ReactNode;
  accountHref?: string;
  onNavigate?: () => void;
  t: typeof APP_SHELL_MESSAGES;
}) {
  const format = useFormat();
  const row = (active: boolean) =>
    cn(
      "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors pointer-coarse:min-h-11",
      active ? "bg-foreground/[0.06] text-foreground" : "text-muted-foreground hover:bg-foreground/[0.04]",
    );
  const account = (
    <>
      {avatar}
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm">{user.name}</div>
        <div className="truncate text-muted-foreground text-xs">{user.email}</div>
      </div>
      {accountHref ? <ChevronUpIcon className="size-3.5 opacity-60" /> : null}
    </>
  );
  const accountClass =
    "flex items-center gap-2 border-border/60 border-t px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-start transition-colors hover:bg-foreground/[0.03]";

  return (
    <nav aria-label={t.workspace} className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto pb-3">
        {sections.map((section) => (
          <div key={section.id}>
            {section.label ? (
              <div className="px-3 pt-4 pb-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.25em]">{section.label}</div>
            ) : (
              <div className="pt-3" />
            )}
            <ul className="flex flex-col gap-0.5 px-2">
              {section.items.map((item) => {
                const active = item.id === activeId;
                return (
                  <li key={item.id}>
                    <WirefrontLink aria-current={active ? "page" : undefined} className={row(active)} href={item.href} onClick={onNavigate}>
                      {item.icon ? (
                        <span aria-hidden className="flex size-4 items-center justify-center opacity-70 [&>svg]:size-4">
                          {item.icon}
                        </span>
                      ) : item.color ? (
                        <span aria-hidden className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                      ) : null}
                      <span className="flex-1 truncate text-start">{item.label}</span>
                      {item.count !== undefined ? (
                        <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground">{format.number(item.count)}</span>
                      ) : null}
                    </WirefrontLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      {accountHref ? (
        <WirefrontLink className={accountClass} href={accountHref} onClick={onNavigate}>
          {account}
        </WirefrontLink>
      ) : (
        <div className={accountClass}>{account}</div>
      )}
    </nav>
  );
}
