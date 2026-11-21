// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ChevronLeftIcon, SearchIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("bottomTabShell.<key>"). */
export const BOTTOM_TAB_SHELL_MESSAGES = {
  main: "Main",
  back: "Back",
  search: "Search",
  badge: "{count} new",
};

export interface BottomTab {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  /** A count on the icon, e.g. new notifications. */
  badge?: number;
  /** The raised centre action (e.g. Create). Use for one tab at most. */
  primary?: boolean;
}

export interface BottomTabShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  /** The page title in the top bar. */
  title: string;
  tabs: BottomTab[];
  activeId?: string;
  /** Go back. Hidden when not given. */
  onBack?: () => void;
  /** Open your search. Hidden when not given. */
  onSearch?: () => void;
  className?: string;
}

/**
 * A mobile app frame: top bar, the page, and a tab bar that sticks to the
 * bottom of whatever scrolls it (the window, or a container in a mockup).
 */
export function BottomTabShell({ children, title, tabs, activeId, onBack, onSearch, className }: BottomTabShellProps) {
  const t = useMessages("bottomTabShell", BOTTOM_TAB_SHELL_MESSAGES);

  return (
    <div className={cn("flex min-h-full flex-col bg-background text-foreground", className)}>
      <header className="sticky top-0 z-20 flex items-center justify-between border-border/60 border-b bg-background/95 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur sm:px-5">
        <div className="flex items-center gap-1">
          {onBack ? (
            <Button aria-label={t.back} onClick={onBack} size="icon-sm" variant="ghost">
              <ChevronLeftIcon className="rtl:rotate-180" />
            </Button>
          ) : null}
          <h1 className="font-heading text-base">{title}</h1>
        </div>
        {onSearch ? (
          <Button aria-label={t.search} onClick={onSearch} size="icon-sm" variant="ghost">
            <SearchIcon />
          </Button>
        ) : null}
      </header>

      <main className="flex-1 px-4 pt-4 pb-4 sm:px-5">{children}</main>

      <nav aria-label={t.main} className="sticky bottom-0 z-30 border-border/60 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <ul className="flex h-18 items-stretch justify-around">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <li className="flex flex-1" key={tab.id}>
                {tab.primary ? (
                  <WirefrontLink aria-current={active ? "page" : undefined} className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-2 outline-none focus-visible:ring-2 focus-visible:ring-ring" href={tab.href}>
                    <span aria-hidden className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-foreground text-background shadow-md [&_svg]:size-5">
                      {tab.icon}
                    </span>
                    <span className={cn("-mt-2 text-[11px]", active ? "text-foreground" : "text-muted-foreground")}>{tab.label}</span>
                  </WirefrontLink>
                ) : (
                  <WirefrontLink
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5",
                      active ? "text-foreground [&_svg]:stroke-[2.4]" : "text-muted-foreground",
                    )}
                    href={tab.href}
                  >
                    {active ? <span aria-hidden className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-foreground" /> : null}
                    <span aria-hidden className="relative">
                      {tab.icon}
                      {tab.badge ? (
                        <span className="absolute -inset-e-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 font-medium text-[10px] text-background">{tab.badge}</span>
                      ) : null}
                    </span>
                    <span className="text-[11px]">{tab.label}</span>
                    {tab.badge ? <span className="sr-only">, {interpolate(t.badge, { count: tab.badge })}</span> : null}
                  </WirefrontLink>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
