// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { ArrowLeftIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

import { cn } from "../../lib/utils";
import { useMessages, WirefrontLink } from "../../wirefront/provider";

/** Every string in the shell; override any of them with WirefrontProvider `messages` ("settingsShell.<key>"). */
export const SETTINGS_SHELL_MESSAGES = {
  settings: "Settings",
  back: "Back",
};

export interface SettingsNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface SettingsNavGroup {
  label: string;
  items: SettingsNavItem[];
}

export interface SettingsShellProps {
  /** The settings page. */
  children: ReactNode;
  /** The settings navigation, in groups. Links go through WirefrontProvider `link`. */
  groups: SettingsNavGroup[];
  /** The id of the current page's item. */
  activeId: string;
  /** Leaving settings, e.g. { href: "/", label: "Back to Ridgeline" }. Hidden when not given. */
  back?: { href: string; label: string };
  /** Who is signed in, shown at the foot of the sidebar. Hidden when not given. */
  user?: { name: string; email: string };
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

/**
 * The frame settings pages sit in: a grouped sidebar on wide screens, a back
 * bar and scrolling pills on phones, and the page in a scrolling column.
 */
export function SettingsShell({ children, groups, activeId, back, user, className }: SettingsShellProps) {
  const t = useMessages("settingsShell", SETTINGS_SHELL_MESSAGES);
  const pillsRef = useRef<HTMLDivElement>(null);

  // Keep the current pill in view on phones.
  useEffect(() => {
    const scroller = pillsRef.current;
    const el = scroller?.querySelector<HTMLElement>(`[data-section="${activeId}"]`);
    if (!scroller || !el || scroller.scrollWidth <= scroller.clientWidth) return;
    scroller.scrollLeft = el.offsetLeft - 16;
  }, [activeId]);

  const focus = "outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className={cn("flex h-[760px] w-full bg-background text-foreground", className)}>
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-muted/30 px-3 py-4 md:flex">
        {back ? (
          <WirefrontLink
            className={cn("flex h-8 items-center gap-2 rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-accent/60 hover:text-foreground", focus)}
            href={back.href}
          >
            <ArrowLeftIcon className="size-4" />
            {back.label}
          </WirefrontLink>
        ) : null}
        <nav aria-label={t.settings} className="flex flex-col">
          {groups.map((group) => (
            <div className="flex flex-col" key={group.label}>
              <span className="px-2 pt-5 pb-1.5 font-medium text-muted-foreground text-xs">{group.label}</span>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const current = item.id === activeId;
                  return (
                    <WirefrontLink
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm transition-colors [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground",
                        focus,
                        current ? "bg-accent font-medium text-foreground" : "text-foreground/80 hover:bg-accent/60",
                      )}
                      href={item.href}
                      key={item.id}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </WirefrontLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        {user ? (
          <div className="mt-auto flex items-center gap-2.5 px-2 pt-4">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground font-medium text-[11px] text-background">
              {initials(user.name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium text-sm">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </span>
          </div>
        ) : null}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <div className="flex h-12 items-center gap-2 border-b px-4">
            {back ? (
              <WirefrontLink
                aria-label={back.label}
                className={cn("-ms-1.5 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent/60", focus)}
                href={back.href}
              >
                <ArrowLeftIcon className="size-4" />
              </WirefrontLink>
            ) : null}
            <span className="font-medium text-sm">{t.settings}</span>
          </div>
          <nav
            aria-label={t.settings}
            className="overflow-x-auto border-b px-4 py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            ref={pillsRef}
          >
            <div className="flex w-max gap-1.5">
              {groups
                .flatMap((g) => g.items)
                .map((item) => {
                  const current = item.id === activeId;
                  return (
                    <WirefrontLink
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex h-7 items-center rounded-full px-3 text-xs transition-colors",
                        focus,
                        current ? "bg-foreground font-medium text-background" : "bg-muted text-muted-foreground hover:text-foreground",
                      )}
                      data-section={item.id}
                      href={item.href}
                      key={item.id}
                    >
                      {item.label}
                    </WirefrontLink>
                  );
                })}
            </div>
          </nav>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
