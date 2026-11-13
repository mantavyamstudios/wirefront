// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@wirefront/ui/avatar";
import { Button, buttonVariants } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import { BotIcon, CheckIcon, ChevronRightIcon, LoaderCircleIcon, MenuIcon, PanelRightIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";

import type { SplitShellItem, SplitShellUser } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("splitShell.<key>"). */
export const SPLIT_SHELL_MESSAGES = {
  sidebar: "Sidebar",
  navigation: "Navigation",
  openNavigation: "Open navigation",
  closeNavigation: "Close navigation",
  newItem: "New task",
  search: "Search",
  items: "Tasks",
  running: "Running",
  done: "Done",
  breadcrumb: "Breadcrumb",
  showPanel: "Show work panel",
  hidePanel: "Hide work panel",
  panel: "Work panel",
  resizePanel: "Resize work panel",
  panelWidth: "{width}px",
};

type Messages = typeof SPLIT_SHELL_MESSAGES;

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  count?: number;
}

export interface Crumb {
  label: string;
  href?: string;
}

export interface SplitShellProps {
  /** The main pane, e.g. the agent's thread. */
  children: ReactNode;
  /** The right-hand work panel. Given `close`, so its own header can hide it. The toggle only shows when given. */
  panel?: (controls: { close: () => void }) => ReactNode;
  /** The product or workspace at the top of the sidebar. */
  brand: { name: string; subtitle?: string };
  /** Where "New task" goes. Hidden when not given. */
  newHref?: string;
  /** Open your command palette or search page. Hidden when not given. */
  onSearch?: () => void;
  /** Links under the New button, e.g. Inbox and Library. */
  nav?: NavItem[];
  /** The sidebar list, newest first. */
  items: SplitShellItem[];
  /** The id of the open item or nav link. */
  activeId?: string;
  user: SplitShellUser;
  /** Where the account row goes. */
  accountHref?: string;
  breadcrumbs?: Crumb[];
  /** Header actions next to the panel toggle, e.g. a status badge or Re-run. */
  actions?: ReactNode;
  defaultPanelOpen?: boolean;
  defaultPanelWidth?: number;
  minPanelWidth?: number;
  maxPanelWidth?: number;
  className?: string;
}

const spring = { type: "spring", stiffness: 420, damping: 38 } as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Sidebar({
  brand,
  newHref,
  onSearch,
  nav = [],
  items,
  activeId,
  user,
  accountHref,
  onClose,
  t,
}: Pick<SplitShellProps, "brand" | "newHref" | "onSearch" | "nav" | "items" | "activeId" | "user" | "accountHref"> & { onClose?: () => void; t: Messages }) {
  const format = useFormat();
  const group = useId();
  const navRow =
    "flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  const account = (
    <>
      <Avatar className="size-7">
        {user.avatarUrl ? <AvatarImage alt="" src={user.avatarUrl} /> : null}
        <AvatarFallback className="bg-orange-500/16 text-[11px] text-orange-800 dark:text-orange-400">{initials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate font-medium">{user.name}</div>
        {user.subtitle ? <div className="truncate text-muted-foreground text-xs">{user.subtitle}</div> : null}
      </div>
    </>
  );

  return (
    <LayoutGroup id={group}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-13 items-center gap-2 px-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BotIcon className="size-4" />
          </span>
          <span className="font-semibold">{brand.name}</span>
          {brand.subtitle ? <span className="text-muted-foreground text-xs">{brand.subtitle}</span> : null}
          {onClose && (
            <Button aria-label={t.closeNavigation} className="ms-auto" onClick={onClose} size="icon-sm" variant="ghost">
              <XIcon />
            </Button>
          )}
        </div>
        {newHref ? (
          <div className="px-3 pb-2">
            <WirefrontLink className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start")} href={newHref} onClick={onClose}>
              <PlusIcon />
              {t.newItem}
            </WirefrontLink>
          </div>
        ) : null}
        {onSearch || nav.length ? (
          <nav aria-label={t.navigation} className="flex flex-col gap-0.5 px-2 pb-2">
            {onSearch ? (
              <button className={navRow} onClick={onSearch} type="button">
                <SearchIcon className="size-4 shrink-0" />
                <span className="flex-1">{t.search}</span>
                <Kbd>⌘K</Kbd>
              </button>
            ) : null}
            {nav.map((n) => (
              <WirefrontLink aria-current={activeId === n.id ? "page" : undefined} className={navRow} href={n.href} key={n.id} onClick={onClose}>
                {n.icon ? (
                  <span aria-hidden className="flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
                    {n.icon}
                  </span>
                ) : null}
                <span className="flex-1">{n.label}</span>
                {n.count ? <span className="rounded-full bg-info/14 px-1.5 font-medium text-[11px] text-info-foreground tabular-nums">{format.number(n.count)}</span> : null}
              </WirefrontLink>
            ))}
          </nav>
        ) : null}
        <div className="flex items-center justify-between px-5 pt-3 pb-1.5 text-muted-foreground text-xs">
          <span className="font-medium" id={`${group}-items`}>
            {t.items}
          </span>
          <span className="tabular-nums">{format.number(items.length)}</span>
        </div>
        <ul aria-labelledby={`${group}-items`} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2">
          {items.map((item) => {
            const on = activeId === item.id;
            return (
              <li key={item.id}>
                <WirefrontLink
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 text-left outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]",
                    on ? "text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  href={item.href}
                  onClick={onClose}
                >
                  {on && (
                    <motion.span className="absolute inset-0 rounded-lg bg-background shadow-xs/5 ring-1 ring-border dark:bg-accent dark:ring-0" layoutId="split-shell-item" transition={spring} />
                  )}
                  <span className="relative flex size-4 shrink-0 items-center justify-center">
                    {item.state === "running" ? (
                      <LoaderCircleIcon aria-label={t.running} className="size-3.5 animate-spin text-info motion-reduce:animate-none" role="img" />
                    ) : item.state === "done" ? (
                      <CheckIcon aria-label={t.done} className="size-3.5 text-success" role="img" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    )}
                  </span>
                  <span className="relative min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="relative text-muted-foreground text-xs tabular-nums">{format.relative(item.updatedAt)}</span>
                </WirefrontLink>
              </li>
            );
          })}
        </ul>
        {accountHref ? (
          <WirefrontLink className="flex items-center gap-2.5 p-3 transition-colors hover:bg-accent/60" href={accountHref}>
            {account}
          </WirefrontLink>
        ) : (
          <div className="flex items-center gap-2.5 p-3">{account}</div>
        )}
      </div>
    </LayoutGroup>
  );
}

export function SplitShell({
  children,
  panel,
  breadcrumbs = [],
  actions,
  defaultPanelOpen = true,
  defaultPanelWidth = 380,
  minPanelWidth = 300,
  maxPanelWidth = 600,
  className,
  ...sidebar
}: SplitShellProps) {
  const t = useMessages("splitShell", SPLIT_SHELL_MESSAGES);
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootWidth, setRootWidth] = useState(1280);
  const [panelOpen, setPanelOpen] = useState(defaultPanelOpen);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [width, setWidth] = useState(defaultPanelWidth);
  const [dragging, setDragging] = useState(false);
  const panelId = useId();
  const drag = useRef<{ x: number; w: number } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setRootWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const docked = rootWidth >= 1024;
  const sidebarWidth = rootWidth >= 768 ? 240 : 0;
  const maxW = Math.max(minPanelWidth, Math.min(maxPanelWidth, rootWidth - sidebarWidth - 400));
  const w = Math.min(Math.max(width, minPanelWidth), maxW);
  const showPanel = !!panel && (docked ? panelOpen : overlayOpen);
  const clamp = useCallback((v: number) => Math.min(Math.max(v, minPanelWidth), maxW), [minPanelWidth, maxW]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, w };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setWidth(clamp(drag.current.w + (drag.current.x - e.clientX)));
  };
  const onPointerUp = () => {
    drag.current = null;
    setDragging(false);
  };
  const onHandleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.shiftKey ? 64 : 16;
    if (e.key === "ArrowLeft") setWidth(clamp(w + delta));
    else if (e.key === "ArrowRight") setWidth(clamp(w - delta));
    else if (e.key === "Home") setWidth(maxW);
    else if (e.key === "End") setWidth(minPanelWidth);
    else if (e.key === "Enter") setWidth(defaultPanelWidth);
    else return;
    e.preventDefault();
  };
  const togglePanel = () => (docked ? setPanelOpen((o) => !o) : setOverlayOpen((o) => !o));

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delay={400}>
        <div
          className={cn("@container relative isolate flex h-[760px] w-full overflow-hidden bg-sidebar text-foreground text-sm", dragging && "cursor-col-resize select-none", className)}
          ref={rootRef}
        >
          <aside aria-label={t.sidebar} className="hidden w-60 shrink-0 @3xl:block">
            <Sidebar {...sidebar} t={t} />
          </aside>

          <Sheet onOpenChange={setDrawer} open={drawer}>
            <SheetContent className="w-72 max-w-[85%] bg-sidebar p-0" showCloseButton={false} side="left">
              <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
              <Sidebar {...sidebar} onClose={() => setDrawer(false)} t={t} />
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 @3xl:py-2 @3xl:pe-2">
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background @3xl:rounded-2xl @3xl:border @3xl:shadow-xs/5">
              <header className="flex h-13 shrink-0 items-center gap-2 border-b px-3 @3xl:px-4">
                <Button aria-label={t.openNavigation} className="@3xl:hidden" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
                  <MenuIcon />
                </Button>
                <nav aria-label={t.breadcrumb} className="flex min-w-0 flex-1">
                  <ol className="flex min-w-0 items-center gap-1.5">
                    {breadcrumbs.map((crumb, i) => {
                      const last = i === breadcrumbs.length - 1;
                      return (
                        <li className={cn("flex min-w-0 items-center gap-1.5", !last && "hidden @md:flex")} key={`${crumb.label}-${crumb.href ?? "page"}`}>
                          {last ? (
                            <span aria-current="page" className="truncate font-medium">
                              {crumb.label}
                            </span>
                          ) : crumb.href ? (
                            <WirefrontLink className="text-muted-foreground transition-colors hover:text-foreground" href={crumb.href}>
                              {crumb.label}
                            </WirefrontLink>
                          ) : (
                            <span className="text-muted-foreground">{crumb.label}</span>
                          )}
                          {last ? null : <ChevronRightIcon aria-hidden className="size-3.5 text-muted-foreground/60" />}
                        </li>
                      );
                    })}
                  </ol>
                </nav>
                {actions}
                {panel ? (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          aria-controls={panelId}
                          aria-expanded={showPanel}
                          aria-label={showPanel ? t.hidePanel : t.showPanel}
                          onClick={togglePanel}
                          size="icon-sm"
                          variant={showPanel ? "secondary" : "ghost"}
                        />
                      }
                    >
                      <PanelRightIcon />
                    </TooltipTrigger>
                    <TooltipContent>{showPanel ? t.hidePanel : t.showPanel}</TooltipContent>
                  </Tooltip>
                ) : null}
              </header>
              <div className="min-h-0 flex-1">{children}</div>
            </main>

            {panel && docked ? (
              <AnimatePresence initial={false}>
                {panelOpen && (
                  <motion.div
                    animate={{ width: w + 8, opacity: 1 }}
                    className="flex shrink-0 overflow-hidden"
                    exit={{ width: 0, opacity: 0 }}
                    initial={{ width: 0, opacity: 0 }}
                    transition={dragging ? { duration: 0 } : spring}
                  >
                    {/* biome-ignore lint/a11y/useSemanticElements: WAI-ARIA window splitter; <hr> can't take focus or keyboard input. Approved exception, D-017. */}
                    <div
                      aria-controls={panelId}
                      aria-label={t.resizePanel}
                      aria-orientation="vertical"
                      aria-valuemax={maxW}
                      aria-valuemin={minPanelWidth}
                      aria-valuenow={Math.round(w)}
                      className="group/handle relative flex w-2 shrink-0 cursor-col-resize touch-none items-center justify-center outline-none before:absolute before:inset-y-0 before:-inset-x-2"
                      onDoubleClick={() => setWidth(defaultPanelWidth)}
                      onKeyDown={onHandleKey}
                      onPointerCancel={onPointerUp}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      role="separator"
                      tabIndex={0}
                    >
                      <motion.span
                        animate={{ height: dragging ? 56 : 32 }}
                        className={cn(
                          "w-1 rounded-full bg-muted-foreground/24 transition-colors group-hover/handle:bg-muted-foreground/48 group-focus-visible/handle:bg-ring",
                          dragging && "bg-info!",
                        )}
                        transition={spring}
                      />
                    </div>
                    <section aria-label={t.panel} className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border bg-background shadow-xs/5" id={panelId} style={{ width: w }}>
                      {panel({ close: () => setPanelOpen(false) })}
                      <AnimatePresence>
                        {dragging && (
                          <motion.span
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 font-mono text-[11px] text-background tabular-nums"
                            exit={{ opacity: 0, y: 4 }}
                            initial={{ opacity: 0, y: 4 }}
                          >
                            {interpolate(t.panelWidth, { width: Math.round(w) })}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : null}
          </div>

          {panel && !docked ? (
            <Sheet onOpenChange={setOverlayOpen} open={overlayOpen}>
              <SheetContent className="w-[min(400px,calc(100%-1rem))] gap-0 p-0" id={panelId} showCloseButton={false} side="right">
                <SheetTitle className="sr-only">{t.panel}</SheetTitle>
                {panel({ close: () => setOverlayOpen(false) })}
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </TooltipProvider>
    </MotionConfig>
  );
}
