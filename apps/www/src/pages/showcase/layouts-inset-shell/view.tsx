// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Breadcrumb, BreadcrumbList, BreadcrumbPage } from "@wirefront/ui/breadcrumb";
import { Button, buttonVariants } from "@wirefront/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronsUpDownIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MenuIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { type ReactElement, type ReactNode, useId, useState } from "react";

import type { ShellUser, ShellWorkspace } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("insetShell.<key>"). */
export const INSET_SHELL_MESSAGES = {
  sidebar: "Sidebar",
  navigation: "Navigation",
  primary: "Primary",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  expand: "Expand sidebar",
  collapse: "Collapse sidebar",
  plan: "{plan} plan",
  workspaces: "Workspaces",
  createWorkspace: "Create workspace",
  workspaceSettings: "Workspace settings",
  search: "Search",
  addTo: "New in {section}",
  help: "Help & support",
  signOut: "Sign out",
  notifications: "Notifications",
  notificationsUnread: "Notifications, {count} unread",
  breadcrumb: "Breadcrumb",
};

type Messages = typeof INSET_SHELL_MESSAGES;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** An icon (e.g. a lucide icon element). */
  icon?: ReactNode;
  /** A coloured dot instead of an icon, e.g. a project's colour (any CSS colour). */
  color?: string;
  /** A count shown on the right, e.g. open issues. */
  count?: number;
  /** Highlight the count, e.g. unread items. */
  attention?: boolean;
}

export interface NavSection {
  id: string;
  /** Labelled sections can be collapsed; the first section is usually unlabelled. */
  label?: string;
  items: NavItem[];
  /** A "+" next to the label, e.g. to a new-project page. */
  addHref?: string;
}

export interface Crumb {
  label: string;
  /** The last crumb is the current page and needs no link. */
  href?: string;
}

export interface MenuLink {
  label: string;
  href: string;
  icon?: ReactNode;
}

export interface InsetShellProps {
  /** The page. Screens render inside the inset card. */
  children: ReactNode;
  user: ShellUser;
  workspace: ShellWorkspace;
  /** Every workspace the user can switch to; the list shows with `onSwitchWorkspace`. */
  workspaces?: ShellWorkspace[];
  onSwitchWorkspace?: (id: string) => void;
  createWorkspaceHref?: string;
  workspaceSettingsHref?: string;
  /** The sidebar, top to bottom. Links go through WirefrontProvider `link`. */
  sections: NavSection[];
  /** The id of the current page's nav item. */
  activeId?: string;
  breadcrumbs?: Crumb[];
  /** Page actions on the right of the header, e.g. Share. */
  actions?: ReactNode;
  /** Open your command palette or search page. The search row only shows when given. */
  onSearch?: () => void;
  helpHref?: string;
  /** Where the bell goes. Hidden when not given. */
  notificationsHref?: string;
  unread?: number;
  /** Links in the account menu, e.g. Profile and Preferences. */
  accountLinks?: MenuLink[];
  /** Sign the user out. The menu item only shows when given. */
  onSignOut?: Action;
  defaultCollapsed?: boolean;
  className?: string;
}

const spring = { type: "spring", stiffness: 420, damping: 36 } as const;
const widthSpring = { type: "spring", stiffness: 380, damping: 38 } as const;
const row =
  "group/row relative flex h-8 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function SidebarRow({ collapsed, label, tip, children }: { collapsed: boolean; label: string; tip?: ReactNode; children: (props: { "aria-label"?: string }) => ReactNode }) {
  return (
    <Tooltip disabled={!collapsed}>
      <TooltipTrigger render={children({ "aria-label": collapsed ? label : undefined }) as ReactElement} />
      <TooltipContent side="right" sideOffset={10}>
        {tip ?? label}
      </TooltipContent>
    </Tooltip>
  );
}

function Label({ collapsed, children, className }: { collapsed: boolean; children: ReactNode; className?: string }) {
  return (
    <span aria-hidden={collapsed || undefined} className={cn("min-w-0 truncate transition-[opacity,translate] duration-200", collapsed && "pointer-events-none -translate-x-1 opacity-0", className)}>
      {children}
    </span>
  );
}

function UserAvatar({ user, className }: { user: ShellUser; className?: string }) {
  return (
    <Avatar className={cn("size-7 shrink-0", className)}>
      {user.avatarUrl ? <AvatarImage alt="" src={user.avatarUrl} /> : null}
      <AvatarFallback className="bg-teal-500/16 text-[11px] text-teal-800 dark:text-teal-400">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

type SidebarProps = Omit<InsetShellProps, "children" | "breadcrumbs" | "actions" | "notificationsHref" | "unread" | "defaultCollapsed" | "className"> & {
  collapsed: boolean;
  onClose?: () => void;
  t: Messages;
};

function SidebarBody({
  collapsed,
  user,
  workspace,
  workspaces,
  onSwitchWorkspace,
  createWorkspaceHref,
  workspaceSettingsHref,
  sections,
  activeId,
  onSearch,
  helpHref,
  accountLinks = [],
  onSignOut,
  onClose,
  t,
}: SidebarProps) {
  const format = useFormat();
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());
  const pill = useId();
  const switchable = !!onSwitchWorkspace && !!workspaces?.length;
  const workspaceMenu = switchable || !!createWorkspaceHref || !!workspaceSettingsHref;
  const accountMenu = accountLinks.length > 0 || !!onSignOut;

  const workspaceFace = (
    <>
      <span aria-hidden className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-[11px] text-primary-foreground">{initials(workspace.name)}</span>
      <span className={cn("flex min-w-0 flex-1 flex-col transition-opacity duration-200", collapsed && "opacity-0")}>
        <span className="truncate font-medium leading-tight">{workspace.name}</span>
        {workspace.plan ? <span className="truncate text-muted-foreground text-xs leading-tight">{interpolate(t.plan, { plan: workspace.plan })}</span> : null}
      </span>
    </>
  );
  const accountFace = (
    <>
      <UserAvatar user={user} />
      <span className={cn("flex min-w-0 flex-1 flex-col transition-opacity duration-200", collapsed && "opacity-0")}>
        <span className="truncate font-medium leading-tight">{user.name}</span>
        <span className="truncate text-muted-foreground text-xs leading-tight">{user.email}</span>
      </span>
    </>
  );
  const faceClass = "flex min-w-0 items-center gap-2.5 overflow-hidden rounded-xl px-1.5 text-start";

  return (
    <LayoutGroup id={pill}>
      <div className="flex h-full min-h-0 flex-col whitespace-nowrap">
        <div className="flex items-center gap-1 p-2">
          {workspaceMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(faceClass, "h-11 flex-1 cursor-pointer outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent")}
              >
                {workspaceFace}
                <ChevronsUpDownIcon className={cn("size-4 shrink-0 text-muted-foreground", collapsed && "opacity-0")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-60">
                {switchable ? (
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t.workspaces}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup onValueChange={(v) => onSwitchWorkspace?.(v as string)} value={workspace.id}>
                      {workspaces?.map((w) => (
                        <DropdownMenuRadioItem key={w.id} value={w.id}>
                          <span className="flex items-center gap-2">
                            {w.name}
                            {w.plan ? <span className="text-muted-foreground text-xs">{w.plan}</span> : null}
                          </span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                ) : null}
                {switchable && (createWorkspaceHref || workspaceSettingsHref) ? <DropdownMenuSeparator /> : null}
                {createWorkspaceHref ? (
                  <DropdownMenuItem render={<WirefrontLink href={createWorkspaceHref} />}>
                    <PlusIcon />
                    {t.createWorkspace}
                  </DropdownMenuItem>
                ) : null}
                {workspaceSettingsHref ? (
                  <DropdownMenuItem render={<WirefrontLink href={workspaceSettingsHref} />}>
                    <SettingsIcon />
                    {t.workspaceSettings}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn(faceClass, "h-11 flex-1")}>{workspaceFace}</div>
          )}
          {onClose && (
            <Button aria-label={t.closeNavigation} onClick={onClose} size="icon-sm" variant="ghost">
              <XIcon />
            </Button>
          )}
        </div>

        {onSearch ? (
          <div className="px-2 pb-2">
            <SidebarRow
              collapsed={collapsed}
              label={t.search}
              tip={
                <span>
                  {t.search} <Kbd className="ms-1">⌘K</Kbd>
                </span>
              }
            >
              {(a) => (
                <button
                  {...a}
                  className={cn(
                    row,
                    "border bg-background text-muted-foreground shadow-xs/5 hover:text-foreground dark:bg-input/32",
                    collapsed && "border-transparent bg-transparent shadow-none dark:bg-transparent",
                  )}
                  onClick={onSearch}
                  type="button"
                >
                  <SearchIcon className="size-4 shrink-0" />
                  <Label collapsed={collapsed}>{t.search}</Label>
                  <Kbd className={cn("ms-auto transition-opacity", collapsed && "opacity-0")}>⌘K</Kbd>
                </button>
              )}
            </SidebarRow>
          </div>
        ) : null}

        <nav aria-label={t.primary} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 [scrollbar-width:thin]">
          {sections.map((section, index) => {
            const open = collapsed || !closed.has(section.id);
            return (
              <div className={cn(index > 0 && "mt-5")} key={section.id}>
                {section.label ? (
                  <div className="relative flex h-7 items-center px-3">
                    <button
                      aria-expanded={open}
                      className={cn(
                        "flex cursor-pointer items-center gap-1 rounded font-medium text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                        collapsed && "pointer-events-none opacity-0",
                      )}
                      onClick={() =>
                        setClosed((c) => {
                          const next = new Set(c);
                          if (next.has(section.id)) next.delete(section.id);
                          else next.add(section.id);
                          return next;
                        })
                      }
                      tabIndex={collapsed ? -1 : 0}
                      type="button"
                    >
                      {section.label}
                      <ChevronDownIcon className={cn("size-3 transition-transform duration-200", !open && "-rotate-90")} />
                    </button>
                    {collapsed && <span className="absolute start-4 h-px w-6 bg-border" />}
                    {section.addHref ? (
                      <WirefrontLink
                        aria-label={interpolate(t.addTo, { section: section.label })}
                        className={cn(buttonVariants({ size: "icon-xs", variant: "ghost" }), "ms-auto", collapsed && "pointer-events-none opacity-0")}
                        href={section.addHref}
                        tabIndex={collapsed ? -1 : 0}
                      >
                        <PlusIcon />
                      </WirefrontLink>
                    ) : null}
                  </div>
                ) : null}
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.ul
                      animate={{ height: "auto", opacity: 1 }}
                      className="flex flex-col gap-0.5 overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={spring}
                    >
                      {section.items.map((item) => {
                        const on = activeId === item.id;
                        return (
                          <li key={item.id}>
                            <SidebarRow collapsed={collapsed} label={item.label}>
                              {(a) => (
                                <WirefrontLink
                                  {...a}
                                  aria-current={on ? "page" : undefined}
                                  className={cn(row, on ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
                                  href={item.href}
                                  onClick={onClose}
                                >
                                  {on && (
                                    <motion.span
                                      className="absolute inset-0 rounded-lg bg-background shadow-xs/5 ring-1 ring-border dark:bg-accent dark:ring-0"
                                      layoutId="inset-shell-pill"
                                      transition={spring}
                                    />
                                  )}
                                  {!on && <span className="absolute inset-0 rounded-lg transition-colors group-hover/row:bg-accent" />}
                                  {item.icon ? (
                                    <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
                                      {item.icon}
                                    </span>
                                  ) : (
                                    <span aria-hidden className="relative flex size-4 shrink-0 items-center justify-center">
                                      <span className="size-2 rounded-full bg-muted-foreground" style={item.color ? { backgroundColor: item.color } : undefined} />
                                    </span>
                                  )}
                                  <Label className={cn("relative", item.icon && "font-medium")} collapsed={collapsed}>
                                    {item.label}
                                  </Label>
                                  {item.count !== undefined && (
                                    <span
                                      className={cn(
                                        "relative ms-auto rounded-full px-1.5 text-xs tabular-nums transition-opacity",
                                        item.attention ? "bg-info/12 font-medium text-info-foreground" : "text-muted-foreground",
                                        collapsed && "opacity-0",
                                      )}
                                    >
                                      {format.number(item.count)}
                                    </span>
                                  )}
                                  {collapsed && item.attention && item.count ? (
                                    <span className="absolute top-1.5 start-7 size-1.5 rounded-full bg-info ring-2 ring-sidebar" />
                                  ) : null}
                                </WirefrontLink>
                              )}
                            </SidebarRow>
                          </li>
                        );
                      })}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="flex flex-col gap-0.5 p-2">
          {helpHref ? (
            <SidebarRow collapsed={collapsed} label={t.help}>
              {(a) => (
                <WirefrontLink {...a} className={cn(row, "text-muted-foreground hover:bg-accent hover:text-foreground")} href={helpHref}>
                  <LifeBuoyIcon className="size-4 shrink-0" />
                  <Label collapsed={collapsed}>{t.help}</Label>
                </WirefrontLink>
              )}
            </SidebarRow>
          ) : null}
          {accountMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(faceClass, "mt-1 h-12 w-full cursor-pointer outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent")}
              >
                {accountFace}
                <ChevronsUpDownIcon className={cn("size-4 shrink-0 text-muted-foreground", collapsed && "opacity-0")} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" side="top">
                <div className="flex items-center gap-2.5 px-2 py-1.5">
                  <UserAvatar className="size-8" user={user} />
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">{user.name}</div>
                    <div className="truncate text-muted-foreground text-xs">{user.email}</div>
                  </div>
                </div>
                {accountLinks.length ? <DropdownMenuSeparator /> : null}
                {accountLinks.map((link) => (
                  <DropdownMenuItem key={link.href} render={<WirefrontLink href={link.href} />}>
                    {link.icon}
                    {link.label}
                  </DropdownMenuItem>
                ))}
                {onSignOut ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => void onSignOut()}>
                      <LogOutIcon />
                      {t.signOut}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn(faceClass, "mt-1 h-12")}>{accountFace}</div>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}

export function InsetShell({
  children,
  breadcrumbs = [],
  actions,
  notificationsHref,
  unread = 0,
  defaultCollapsed = false,
  className,
  ...sidebar
}: InsetShellProps) {
  const t = useMessages("insetShell", INSET_SHELL_MESSAGES);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawer, setDrawer] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}>
        <div className={cn("@container relative isolate flex h-[760px] w-full overflow-hidden bg-sidebar text-foreground text-sm", className)}>
          <motion.aside
            animate={{ width: collapsed ? 56 : 248 }}
            aria-label={t.sidebar}
            className="hidden shrink-0 overflow-hidden @3xl:block"
            initial={false}
            transition={widthSpring}
          >
            <div className="h-full w-full">
              <SidebarBody {...sidebar} collapsed={collapsed} t={t} />
            </div>
          </motion.aside>

          <Sheet onOpenChange={setDrawer} open={drawer}>
            <SheetContent className="w-[272px] max-w-[calc(100%-3rem)] bg-sidebar p-0" showCloseButton={false} side="left">
              <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
              <SidebarBody {...sidebar} collapsed={false} onClose={() => setDrawer(false)} t={t} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col @3xl:py-2 @3xl:pe-2">
            <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background @3xl:rounded-2xl @3xl:border @3xl:shadow-xs/5">
              <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 @3xl:px-4">
                <Button aria-label={t.openNavigation} className="@3xl:hidden" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
                  <MenuIcon />
                </Button>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        aria-expanded={!collapsed}
                        aria-label={collapsed ? t.expand : t.collapse}
                        className="hidden @3xl:inline-flex"
                        onClick={() => setCollapsed((c) => !c)}
                        size="icon-sm"
                        variant="ghost"
                      />
                    }
                  >
                    <PanelLeftIcon />
                  </TooltipTrigger>
                  <TooltipContent>{collapsed ? t.expand : t.collapse}</TooltipContent>
                </Tooltip>
                <span className="h-4 w-px bg-border" />
                <Breadcrumb aria-label={t.breadcrumb} className="min-w-0 flex-1">
                  <BreadcrumbList className="flex-nowrap gap-1.5 sm:gap-1.5">
                    {breadcrumbs.map((crumb, i) => {
                      const last = i === breadcrumbs.length - 1;
                      return (
                        <li className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden @md:flex")} key={`${crumb.label}-${crumb.href ?? "page"}`}>
                          {last || !crumb.href ? (
                            <BreadcrumbPage className={cn("truncate", last ? "font-medium" : "text-muted-foreground")}>{crumb.label}</BreadcrumbPage>
                          ) : (
                            <WirefrontLink className="truncate text-muted-foreground transition-colors hover:text-foreground" href={crumb.href}>
                              {crumb.label}
                            </WirefrontLink>
                          )}
                          {last ? null : <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 text-muted-foreground/60" />}
                        </li>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
                <div className="flex items-center gap-1.5">
                  {actions}
                  {notificationsHref ? (
                    <WirefrontLink
                      aria-label={unread ? interpolate(t.notificationsUnread, { count: unread }) : t.notifications}
                      className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }), "relative")}
                      href={notificationsHref}
                    >
                      <BellIcon />
                      {unread ? <span className="absolute top-1.5 end-1.5 size-1.5 rounded-full bg-info" /> : null}
                    </WirefrontLink>
                  ) : null}
                </div>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}
