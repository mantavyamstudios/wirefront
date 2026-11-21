// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `hairline-shell`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { interpolate, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { ChevronDownIcon, ChevronRightIcon, ChevronsUpDownIcon, KeyboardIcon, LogOutIcon, MenuIcon, PanelLeftIcon, PlusIcon, SearchIcon, SettingsIcon, SquarePenIcon, UserRoundIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { type ReactElement, type ReactNode, useEffect, useId, useRef, useState } from "react";

import type { HairlineProject, HairlineWorkspace } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("hairlineShell.<key>"). */
export const HAIRLINE_SHELL_MESSAGES = {
  sidebar: "Sidebar",
  navigation: "Navigation",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  switchWorkspace: "Switch workspace",
  currentWorkspace: "Workspace: {name}",
  newWorkspace: "New workspace",
  new: "New",
  search: "Search",
  projects: "Projects",
  count: "{count} open",
  account: "Account: {name}",
  profile: "Profile",
  settings: "Settings",
  shortcuts: "Shortcuts",
  signOut: "Log out",
  collapse: "Collapse sidebar",
  expand: "Expand sidebar",
  collapseShort: "Collapse",
  expandShort: "Expand",
};

export interface HairlineNavItem {
  id: string;
  label: string;
  href: string;
  icon: ReactNode;
  count?: number;
}

export interface HairlineShellProps {
  /** The page. Screens render inside the shell. */
  children: ReactNode;
  workspaces: HairlineWorkspace[];
  currentWorkspaceId: string;
  onSwitchWorkspace: (id: string) => void;
  /** Create a workspace. Hidden when not given. */
  onNewWorkspace?: () => void;
  nav: HairlineNavItem[];
  projects: HairlineProject[];
  /** The id of the current page's nav item or project. */
  activeId?: string;
  user: { name: string };
  /** Account menu entries; each hides when not given. */
  profileHref?: string;
  settingsHref?: string;
  onShortcuts?: () => void;
  onSignOut?: () => void;
  /** The pen button: create the main thing (an issue, a doc…). Hidden when not given. */
  onNew?: () => void;
  /** Open search. The Search row and "/" only work when given. */
  onSearch?: () => void;
  /** The top bar's title area, e.g. a breadcrumb. */
  title: ReactNode;
  /** Buttons on the right of the top bar. */
  actions?: ReactNode;
  /** A status line under the page. */
  footer?: ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

const SWATCH = ["", "bg-category-1", "bg-category-2", "bg-category-3", "bg-category-4", "bg-category-5", "bg-category-6", "bg-category-7", "bg-category-8"];
const spring = { type: "spring", stiffness: 500, damping: 40 } as const;
const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

function RailTip({ collapsed, label, children }: { collapsed: boolean; label: ReactNode; children: ReactElement }) {
  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

type SidebarProps = Omit<HairlineShellProps, "children" | "title" | "actions" | "footer" | "defaultCollapsed" | "className"> & {
  collapsed: boolean;
  onToggle?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
};

function Sidebar({
  collapsed,
  workspaces,
  currentWorkspaceId,
  onSwitchWorkspace,
  onNewWorkspace,
  nav,
  projects,
  activeId,
  user,
  profileHref,
  settingsHref,
  onShortcuts,
  onSignOut,
  onNew,
  onSearch,
  onToggle,
  onClose,
  onNavigate,
}: SidebarProps) {
  const t = useMessages("hairlineShell", HAIRLINE_SHELL_MESSAGES);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const ws = workspaces.find((w) => w.id === currentWorkspaceId) ?? workspaces[0];
  const group = useId();
  const fade = cn("transition-opacity duration-150", collapsed && "pointer-events-none opacity-0");
  const row =
    "group/row relative flex h-7 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2.5 text-start text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset pointer-coarse:h-11";

  const link = (id: string, label: string, href: string, icon: ReactNode, count?: number) => {
    const on = activeId === id;
    return (
      <RailTip collapsed={collapsed} key={id} label={label}>
        <WirefrontLink
          aria-current={on ? "page" : undefined}
          className={cn(row, on ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")}
          href={href}
          onClick={onNavigate}
        >
          {on && <motion.span className="absolute start-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-foreground" layoutId="hairline-active" transition={spring} />}
          {icon}
          <span className={cn("min-w-0 flex-1 truncate", fade)}>{label}</span>
          {count ? (
            <span className={cn("text-muted-foreground text-xs tabular-nums", fade)}>
              <span aria-hidden>{count}</span>
              <span className="sr-only">, {interpolate(t.count, { count })}</span>
            </span>
          ) : null}
        </WirefrontLink>
      </RailTip>
    );
  };

  const hasAccountMenu = profileHref || settingsHref || onShortcuts || onSignOut;
  const accountBody = (
    <>
      <Avatar className="size-5 shrink-0">
        <AvatarFallback className="bg-muted text-[9px]">{initialsOf(user.name)}</AvatarFallback>
      </Avatar>
      <span className={cn("min-w-0 flex-1 truncate", fade)}>{user.name}</span>
    </>
  );

  return (
    <LayoutGroup id={group}>
      <div className="flex h-full min-h-0 flex-col whitespace-nowrap">
        <div className="flex h-11 shrink-0 items-center gap-1 border-b px-1.5">
          {ws ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent">
                <span aria-hidden className={cn("flex size-5 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.5)] font-semibold text-[11px] text-white", SWATCH[ws.color])}>
                  {ws.name.charAt(0).toUpperCase()}
                </span>
                <span className={cn("min-w-0 truncate font-medium", fade)}>{ws.name}</span>
                {collapsed ? <span className="sr-only">{interpolate(t.currentWorkspace, { name: ws.name })}</span> : null}
                <ChevronDownIcon aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground", fade)} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{t.switchWorkspace}</DropdownMenuLabel>
                  <DropdownMenuRadioGroup onValueChange={(v) => v !== ws.id && onSwitchWorkspace(v as string)} value={ws.id}>
                    {workspaces.map((w) => (
                      <DropdownMenuRadioItem key={w.id} value={w.id}>
                        {w.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuGroup>
                {onNewWorkspace ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onNewWorkspace}>
                      <PlusIcon />
                      {t.newWorkspace}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {onClose ? (
            <Button aria-label={t.closeNavigation} onClick={onClose} size="icon-sm" variant="ghost">
              <XIcon />
            </Button>
          ) : onNew ? (
            <Button aria-label={t.new} className={cn(collapsed && "hidden")} onClick={onNew} size="icon-sm" variant="ghost">
              <SquarePenIcon />
            </Button>
          ) : null}
        </div>

        <nav aria-label={t.navigation} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 [scrollbar-width:thin]">
          <div className="flex flex-col gap-px">
            {onSearch ? (
              <RailTip collapsed={collapsed} label={t.search}>
                <button className={cn(row, "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={onSearch} type="button">
                  <SearchIcon aria-hidden className="size-4 shrink-0" />
                  <span className={cn("min-w-0 flex-1 truncate", fade)}>{t.search}</span>
                  <Kbd className={cn("h-4.5 min-w-4.5 text-[10px]", fade)}>/</Kbd>
                </button>
              </RailTip>
            ) : null}
            {nav.map((n) =>
              link(
                n.id,
                n.label,
                n.href,
                <span className="relative shrink-0 [&_svg]:size-4">
                  {n.icon}
                  {collapsed && n.count ? <span aria-hidden className="absolute -end-0.5 -top-0.5 size-1.5 rounded-full bg-info ring-2 ring-background" /> : null}
                </span>,
                n.count,
              ),
            )}
          </div>

          {projects.length ? (
            <>
              <div className="relative mt-4 mb-1 flex h-6 items-center px-2.5">
                <button
                  aria-expanded={projectsOpen}
                  className={cn("flex cursor-pointer items-center gap-1 rounded text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring", fade)}
                  onClick={() => setProjectsOpen((o) => !o)}
                  tabIndex={collapsed ? -1 : 0}
                  type="button"
                >
                  {t.projects}
                  <ChevronRightIcon aria-hidden className={cn("size-3 transition-transform duration-200 motion-reduce:transition-none rtl:rotate-180", projectsOpen && "rotate-90 rtl:rotate-90")} />
                </button>
                {collapsed && <span aria-hidden className="absolute inset-x-3 top-1/2 h-px bg-border" />}
              </div>
              <AnimatePresence initial={false}>
                {(projectsOpen || collapsed) && (
                  <motion.div animate={{ height: "auto", opacity: 1 }} className="flex flex-col gap-px overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={spring}>
                    {projects.map((p) =>
                      link(
                        p.id,
                        p.name,
                        p.href,
                        <span aria-hidden className="flex size-4 shrink-0 items-center justify-center">
                          <span className={cn("size-2.5 rounded-[calc(var(--radius)*0.3)]", SWATCH[p.color])} />
                        </span>,
                        p.count,
                      ),
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : null}
        </nav>

        <div className="flex h-10 shrink-0 items-center gap-1 border-t px-1.5">
          {hasAccountMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-7 min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-start outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent">
                {accountBody}
                {collapsed ? <span className="sr-only">{interpolate(t.account, { name: user.name })}</span> : null}
                <ChevronsUpDownIcon aria-hidden className={cn("size-3.5 shrink-0 text-muted-foreground", fade)} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52" side="top">
                {profileHref ? (
                  <DropdownMenuItem render={<WirefrontLink href={profileHref} />}>
                    <UserRoundIcon />
                    {t.profile}
                  </DropdownMenuItem>
                ) : null}
                {settingsHref ? (
                  <DropdownMenuItem render={<WirefrontLink href={settingsHref} />}>
                    <SettingsIcon />
                    {t.settings}
                  </DropdownMenuItem>
                ) : null}
                {onShortcuts ? (
                  <DropdownMenuItem onClick={onShortcuts}>
                    <KeyboardIcon />
                    {t.shortcuts}
                    <DropdownMenuShortcut>?</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ) : null}
                {onSignOut ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onSignOut}>
                      <LogOutIcon />
                      {t.signOut}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex h-7 min-w-0 flex-1 items-center gap-2 overflow-hidden px-2">{accountBody}</div>
          )}
          {onToggle ? (
            <RailTip
              collapsed
              label={
                <span className="flex items-center gap-1.5">
                  {collapsed ? t.expandShort : t.collapseShort}
                  <Kbd className="h-4.5 min-w-4.5 text-[10px]">[</Kbd>
                </span>
              }
            >
              <Button aria-label={collapsed ? t.expand : t.collapse} className={cn(collapsed && "hidden")} onClick={onToggle} size="icon-sm" variant="ghost">
                <PanelLeftIcon className="rtl:-scale-x-100" />
              </Button>
            </RailTip>
          ) : null}
        </div>
      </div>
    </LayoutGroup>
  );
}

export function HairlineShell({ children, title, actions, footer, defaultCollapsed = false, className, ...sidebar }: HairlineShellProps) {
  const t = useMessages("hairlineShell", HAIRLINE_SHELL_MESSAGES);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawer, setDrawer] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { onSearch } = sidebar;

  useEffect(() => {
    if (drawer) drawerRef.current?.focus();
  }, [drawer]);

  // Shortcuts while focus is inside the shell: Esc closes the drawer, "["
  // toggles the sidebar, "/" opens search.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && drawer) setDrawer(false);
      const target = e.target;
      if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (e.key === "[") setCollapsed((c) => !c);
      if (e.key === "/" && onSearch) {
        e.preventDefault();
        onSearch();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [drawer, onSearch]);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}>
        <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)} ref={rootRef}>
          <motion.aside animate={{ width: collapsed ? 48 : 232 }} aria-label={t.sidebar} className="hidden shrink-0 overflow-hidden border-e @3xl:block" initial={false} transition={spring}>
            <Sidebar {...sidebar} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
          </motion.aside>

          <AnimatePresence>
            {drawer && (
              <>
                <motion.div animate={{ opacity: 1 }} aria-hidden className="absolute inset-0 z-40 bg-black/32 @3xl:hidden" exit={{ opacity: 0 }} initial={{ opacity: 0 }} onClick={() => setDrawer(false)} />
                <motion.div
                  animate={{ x: 0 }}
                  aria-label={t.navigation}
                  aria-modal="true"
                  className="absolute inset-y-0 start-0 z-50 w-64 max-w-[85%] border-e bg-background outline-none @3xl:hidden"
                  exit={{ x: "-100%" }}
                  initial={{ x: "-100%" }}
                  ref={drawerRef}
                  role="dialog"
                  tabIndex={-1}
                  transition={spring}
                >
                  <Sidebar {...sidebar} collapsed={false} onClose={() => setDrawer(false)} onNavigate={() => setDrawer(false)} />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-11 shrink-0 items-center gap-2 border-b px-2 @3xl:px-3">
              <Button aria-label={t.openNavigation} className="@3xl:hidden" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
                <MenuIcon />
              </Button>
              {collapsed && (
                <Button aria-label={t.expand} className="hidden @3xl:inline-flex" onClick={() => setCollapsed(false)} size="icon-sm" variant="ghost">
                  <PanelLeftIcon className="rtl:-scale-x-100" />
                </Button>
              )}
              <div className="flex min-w-0 flex-1 items-center gap-1 ps-1">{title}</div>
              {actions}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            {footer ? <footer className="flex h-10 shrink-0 items-center gap-3 border-t px-4 text-muted-foreground text-xs @3xl:px-5">{footer}</footer> : null}
          </main>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}
