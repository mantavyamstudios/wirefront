// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `connectors`).
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { Input } from "@wirefront/ui/input";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@wirefront/ui/sheet";
import { Skeleton } from "@wirefront/ui/skeleton";
import { Spinner } from "@wirefront/ui/spinner";
import { Switch } from "@wirefront/ui/switch";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import { CheckIcon, CircleAlertIcon, DatabaseIcon, EllipsisIcon, LayoutGridIcon, MailIcon, MegaphoneIcon, PlugIcon, RotateCwIcon, SearchIcon, SearchXIcon, Settings2Icon, ShieldCheckIcon, UnplugIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useMemo, useRef, useState } from "react";
import type { ConnectorApp } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("connectorMarketplace.<key>"). */
export const CONNECTOR_MARKETPLACE_MESSAGES = {
  title: "Integrations",
  workspaceSettings: "Workspace settings",
  categories: "Categories",
  all: "All",
  reviewedTitle: "Reviewed apps only",
  reviewedBody: "Every app here passed a security review. Admins approve new connections.",
  summary: "{apps} apps · {connected} connected",
  search: "Search apps",
  clearSearch: "Clear search",
  shortcut: "⌘K",
  filter: "Connection filter",
  filterAll: "All",
  filterConnected: "Connected",
  filterAvailable: "Available",
  sort: "Sort apps",
  sortPopular: "Most popular",
  sortName: "Name A–Z",
  sortNewest: "Newest",
  apps: "Apps",
  noMatch: "No apps match “{query}”",
  noneConnected: "Nothing connected here yet",
  allConnected: "Every app here is connected",
  none: "No apps in the directory yet",
  noMatchHint: "Try another name or category. Missing an app your team uses? Ask us to add it.",
  emptyHint: "Try another category, or browse the full directory.",
  clearFilters: "Clear filters",
  request: "Request “{query}”",
  requested: "Requested · we’ll email you",
  tagPopular: "Popular",
  tagNew: "New",
  tagBeta: "Beta",
  connect: "Connect",
  connectName: "Connect {name}",
  connecting: "Connecting…",
  connectingName: "Connecting {name}",
  retry: "Retry",
  retryName: "Retry connecting {name}",
  connected: "Connected",
  options: "{name} options",
  configure: "Configure",
  disconnect: "Disconnect",
  details: "App details",
  meta: "{category} · {installs} workspaces",
  statusIdle: "Not connected",
  statusConnecting: "Authorizing…",
  statusConnected: "Connected",
  statusError: "Authorization failed",
  hintIdle: "An admin approves new connections",
  hintConnecting: "Approve in the {name} window",
  hintConnected: "Connected to {workspace}",
  authFailed: "Authorization failed. Retry to try again.",
  permissions: "This app will be able to",
  settings: "Settings",
  settingsLocked: "Connect {name} to change its settings.",
  errorTitle: "Couldn’t load the app directory",
  tryAgain: "Try again",
};

export interface ConnectorMarketplaceProps {
  /** Every app in the directory. Leave it out while it loads. */
  apps?: ConnectorApp[];
  /** "loading" shows skeletons; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** Connect an app by id: run your OAuth or approval flow and resolve when it's connected; `fail()` shows the reason and a retry. Connect buttons are hidden without it. */
  onConnect?: Action<string>;
  /** Disconnect an app by id. The card flips at once and flips back if this fails. Hidden without it. */
  onDisconnect?: Action<string>;
  /** Turn a connected app's option on or off. Switches are read-only without it. */
  onSettingChange?: Action<{ appId: string; settingId: string; on: boolean }>;
  /** Ask for an app that isn't listed, by the search text. The request button is hidden without it. */
  onRequestApp?: Action<string>;
  /** The workspace the apps connect to, shown in the rail. */
  workspace: string;
  /** An icon per app id; initials are shown for apps without one. */
  icons?: Record<string, ReactNode>;
  className?: string;
}

type ConnState = "idle" | "connecting" | "connected" | "error";
type Filter = "all" | "connected" | "available";
type Sort = "popular" | "name" | "newest";
const FILTERS: Filter[] = ["all", "connected", "available"];
const FILTER_KEY = { all: "filterAll", connected: "filterConnected", available: "filterAvailable" } as const;
const SORT_KEY = { popular: "sortPopular", name: "sortName", newest: "sortNewest" } as const;
const TAG_KEY = { Popular: "tagPopular", New: "tagNew", Beta: "tagBeta" } as const;
const TAG_TONE = {
  Popular: "bg-info/8 text-info-foreground dark:bg-info/16",
  New: "bg-success/8 text-success-foreground dark:bg-success/16",
  Beta: "bg-warning/8 text-warning-foreground dark:bg-warning/16",
} as const;
const TONE_CLASS: Record<ConnectorApp["tone"], string> = {
  orange: "bg-category-7/12 text-category-7-foreground",
  teal: "bg-category-6/12 text-category-6-foreground",
  violet: "bg-category-5/12 text-category-5-foreground",
  amber: "bg-category-3/12 text-category-3-foreground",
  rose: "bg-category-4/12 text-category-4-foreground",
  info: "bg-info/12 text-info-foreground",
  success: "bg-success/12 text-success-foreground",
  warning: "bg-warning/14 text-warning-foreground",
};
const STATUS_DOT: Record<ConnState, string> = { idle: "bg-muted-foreground/40", connecting: "bg-info", connected: "bg-success", error: "bg-destructive" };
const STATUS_KEY = { idle: "statusIdle", connecting: "statusConnecting", connected: "statusConnected", error: "statusError" } as const;

const easeOut = [0.23, 1, 0.32, 1] as const;
const quick = { duration: 0.18, ease: easeOut };
const glide = { type: "spring", duration: 0.3, bounce: 0 } as const;
const press = "transition-[scale,box-shadow,background-color,color] duration-150 ease-out active:scale-[0.97]";
const menuMotion =
  "min-w-40 transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:data-ending-style:scale-100 motion-reduce:data-starting-style:scale-100";

type Messages = typeof CONNECTOR_MARKETPLACE_MESSAGES;

// Stays false until mounted so the server render and the first client render match.
function useSafeReducedMotion() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!prefers;
}

/** Fills a template's {placeholders} with nodes. */
function rich(template: string, values: Record<string, ReactNode>) {
  let offset = 0;
  return template
    .split(/(\{\w+\})/)
    .filter(Boolean)
    .map((part) => {
      const at = offset;
      offset += part.length;
      const name = part.match(/^\{(\w+)\}$/)?.[1];
      return <span key={at}>{name && name in values ? values[name] : part}</span>;
    });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function RollingNumber({ value }: { value: number }) {
  const reduce = useSafeReducedMotion();
  return (
    <span className="relative inline-flex overflow-hidden tabular-nums">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "-100%", opacity: 0 }}
          initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
          key={value}
          transition={quick}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function AppIcon({ app, icon, size }: { app: ConnectorApp; icon?: ReactNode; size: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold",
        size === "sm" ? "size-9 rounded-lg text-xs [&_svg]:size-4.5" : "size-12 rounded-xl text-sm [&_svg]:size-6",
        TONE_CLASS[app.tone],
      )}
    >
      {icon ?? initials(app.name)}
    </span>
  );
}

function TagBadge({ tag, t }: { tag: ConnectorApp["tag"]; t: Messages }) {
  if (!tag) return null;
  return (
    <Badge className={cn(TAG_TONE[tag], "h-4.5 rounded-sm px-1 text-[0.625rem]")} variant="secondary">
      {t[TAG_KEY[tag]]}
    </Badge>
  );
}

function ConnectButton({
  app,
  state,
  t,
  canConnect,
  canDisconnect,
  onConnect,
  onDisconnect,
  onConfigure,
}: {
  app: ConnectorApp;
  state: ConnState;
  t: Messages;
  canConnect: boolean;
  canDisconnect: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onConfigure: () => void;
}) {
  const reduce = useSafeReducedMotion();
  const variants = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, filter: "blur(2px)" },
        animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
        exit: { opacity: 0, scale: 0.96, filter: "blur(2px)" },
      };
  const connected = state === "connected";
  if (!connected && !canConnect) return null;
  return (
    <div className="flex h-8 min-w-24 items-center justify-end">
      <AnimatePresence initial={false} mode="popLayout">
        {connected ? (
          <motion.div animate="animate" className="flex items-center gap-0.5" exit="exit" initial="initial" key="connected" transition={quick} variants={variants}>
            <span className="inline-flex items-center gap-1.5 font-medium text-success-foreground text-xs">
              <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-success/16">
                <CheckIcon className="size-3" />
              </span>
              {t.connected}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button aria-label={interpolate(t.options, { name: app.name })} className={cn("size-8 text-muted-foreground hover:text-foreground sm:size-8", press)} size="icon" variant="ghost" />}
              >
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={menuMotion}>
                <DropdownMenuItem onClick={onConfigure}>
                  <Settings2Icon />
                  {t.configure}
                </DropdownMenuItem>
                {canDisconnect ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDisconnect} variant="destructive">
                      <UnplugIcon />
                      {t.disconnect}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </motion.div>
        ) : (
          <motion.div animate="animate" exit="exit" initial="initial" key="action" transition={quick} variants={variants}>
            <Button className={cn("h-8 min-w-24 text-xs sm:h-8 sm:text-xs", press)} disabled={state === "connecting"} onClick={onConnect} variant="outline">
              <span aria-hidden className="relative flex size-3.5 items-center justify-center">
                {state === "connecting" ? <Spinner className="size-3.5" /> : state === "error" ? <RotateCwIcon className="size-3.5" /> : <PlugIcon className="size-3.5" />}
              </span>
              <span className="sr-only">{interpolate(state === "connecting" ? t.connectingName : state === "error" ? t.retryName : t.connectName, { name: app.name })}</span>
              <span aria-hidden>{state === "connecting" ? t.connecting : state === "error" ? t.retry : t.connect}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectorMarketplaceScreen({ apps: given, status = "ready", error, onRetry, onConnect, onDisconnect, onSettingChange, onRequestApp, workspace, icons = {}, className }: ConnectorMarketplaceProps) {
  const t = useMessages("connectorMarketplace", CONNECTOR_MARKETPLACE_MESSAGES);
  const { locale } = useWirefront();
  const uid = useId();
  const reduce = useSafeReducedMotion();
  const [apps, setApps] = useState(given ?? []);
  useEffect(() => setApps(given ?? []), [given]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [requested, setRequested] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setConnected = (id: string, connected: boolean) => setApps((all) => all.map((a) => (a.id === id ? { ...a, connected } : a)));
  const connect = useAction(onConnect ?? (async () => {}), {
    optimistic: (id) => setErrors(({ [id]: _, ...rest }) => rest),
    onSuccess: (_, id) => setConnected(id, true),
    onError: (message, id) => setErrors((e) => ({ ...e, [id]: message })),
  });
  const disconnect = useAction(onDisconnect ?? (async () => {}), {
    optimistic: (id) => {
      setConnected(id, false);
      return () => setConnected(id, true);
    },
  });
  const changeSetting = useAction(onSettingChange ?? (async () => {}), {
    optimistic: ({ appId, settingId, on }) => {
      const flip = (value: boolean) =>
        setApps((all) => all.map((a) => (a.id === appId ? { ...a, settings: a.settings.map((s) => (s.id === settingId ? { ...s, on: value } : s)) } : a)));
      flip(on);
      return () => flip(!on);
    },
  });
  const request = useAction(onRequestApp ?? (async () => {}), { onSuccess: (_, name) => setRequested((r) => [...r, name.toLowerCase()]) });

  const stateOf = (app: ConnectorApp): ConnState => (connect.isPending(app.id) ? "connecting" : app.connected ? "connected" : errors[app.id] ? "error" : "idle");

  // ⌘K / Ctrl+K anywhere in the screen jumps to search.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, []);

  // Changing the category or filter scrolls the list back to the top.
  const pickCategory = (next: string | null) => {
    setCategory(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  const pickFilter = (next: Filter) => {
    setFilter(next);
    scrollRef.current?.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  const categories = useMemo(() => {
    const names = Array.from(new Set(apps.map((a) => a.category)));
    return names.map((name) => ({ name, count: apps.filter((a) => a.category === name).length }));
  }, [apps]);
  const categoryOptions = [{ id: "", name: t.all, count: apps.length }, ...categories.map((c) => ({ id: c.name, ...c }))];

  const q = query.trim().toLowerCase();
  const visible = apps
    .filter((a) => !category || a.category === category)
    .filter((a) => (filter === "connected" ? a.connected : filter === "available" ? !a.connected : true))
    .filter((a) => !q || `${a.name} ${a.blurb} ${a.category}`.toLowerCase().includes(q))
    .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name, locale) : sort === "newest" ? b.addedAt.localeCompare(a.addedAt) : b.installs - a.installs));
  const sections =
    sort !== "popular" || category || q
      ? [{ title: null as string | null, apps: visible }]
      : categories.map((c) => ({ title: c.name as string | null, apps: visible.filter((a) => a.category === c.name) })).filter((g) => g.apps.length > 0);
  const connectedCount = apps.filter((a) => a.connected).length;
  const open = apps.find((a) => a.id === openId) ?? null;
  const installs = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });

  const resetFilters = () => {
    setQuery("");
    pickCategory(null);
    pickFilter("all");
  };
  const cardProps = (app: ConnectorApp) => ({
    app,
    state: stateOf(app),
    t,
    canConnect: Boolean(onConnect),
    canDisconnect: Boolean(onDisconnect),
    onConnect: () => void connect.run(app.id, app.id),
    onDisconnect: () => void disconnect.run(app.id, app.id),
    onConfigure: () => setOpenId(app.id),
  });

  if (status === "error") {
    return (
      <div className={cn("flex min-h-[480px] w-full items-center justify-center p-6", className)}>
        <div className="rounded-xl border border-border/60 p-10 text-center">
          <p className="font-medium">{t.errorTitle}</p>
          {error ? <p className="mt-1 text-muted-foreground text-sm">{error}</p> : null}
          {onRetry ? (
            <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
              {t.tryAgain}
            </Button>
          ) : null}
        </div>
      </div>
    );
  }
  if (!given || status === "loading") {
    return (
      <div aria-busy="true" className={cn("grid w-full grid-cols-1 gap-2.5 p-6 sm:grid-cols-2", className)}>
        {["a", "b", "c", "d", "e", "f"].map((k) => (
          <Skeleton className="h-20 w-full rounded-xl motion-reduce:animate-none" key={k} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("@container/screen relative isolate flex h-[760px] w-full overflow-hidden bg-background text-foreground text-sm", className)} ref={rootRef}>
      <aside className="hidden w-56 shrink-0 flex-col gap-1 border-e bg-muted/40 p-3 @3xl/screen:flex">
        <div className="flex items-center gap-2 px-2 pt-1 pb-4">
          <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutGridIcon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{workspace}</p>
            <p className="truncate text-muted-foreground text-xs">{t.workspaceSettings}</p>
          </div>
        </div>
        <p className="px-2 pb-1 font-medium text-muted-foreground text-xs" id={`${uid}-categories`}>
          {t.categories}
        </p>
        <nav aria-labelledby={`${uid}-categories`} className="flex flex-col gap-0.5">
          {categoryOptions.map((c) => {
            const active = (category ?? "") === c.id;
            return (
              <button
                aria-current={active ? "true" : undefined}
                className={cn(
                  "relative flex h-8 cursor-pointer items-center justify-between rounded-lg px-2.5 text-start outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "font-medium text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
                key={c.id || "all"}
                onClick={() => pickCategory(c.id || null)}
                type="button"
              >
                {active && <motion.span className="absolute inset-0 -z-10 rounded-lg border bg-card shadow-xs/5" layoutId={`${uid}-rail`} transition={reduce ? { duration: 0 } : glide} />}
                <span>{c.name}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{c.count}</span>
              </button>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border bg-card p-3">
          <div className="flex items-center gap-2 font-medium text-xs">
            <ShieldCheckIcon aria-hidden className="size-4 text-success-foreground" />
            {t.reviewedTitle}
          </div>
          <p className="mt-1 text-pretty text-muted-foreground text-xs">{t.reviewedBody}</p>
        </div>
      </aside>

      <div className="@container relative flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollRef}>
          <header className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur-md">
            <div className="flex flex-col gap-3 px-4 pt-4 pb-3 @2xl:px-6">
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <h2 className="text-balance font-heading font-semibold text-lg tracking-tight">{t.title}</h2>
                  <p className="text-muted-foreground text-xs">{rich(t.summary, { apps: <RollingNumber value={visible.length} />, connected: <RollingNumber value={connectedCount} /> })}</p>
                </div>
                <div className="relative w-full @xl:w-72">
                  <SearchIcon aria-hidden className="pointer-events-none absolute start-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input aria-label={t.search} className="ps-8 pe-12" onChange={(e) => setQuery(e.target.value)} placeholder={t.search} ref={searchRef} type="search" value={query} />
                  <span className="absolute end-1.5 top-1/2 -translate-y-1/2">
                    {query ? (
                      <Button
                        aria-label={t.clearSearch}
                        className={cn("size-7 rounded-full text-muted-foreground sm:size-7", press)}
                        onClick={() => {
                          setQuery("");
                          searchRef.current?.focus();
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Kbd className="me-0.5">{t.shortcut}</Kbd>
                    )}
                  </span>
                </div>
              </div>

              <RadioGroup
                aria-label={t.categories}
                className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] @3xl/screen:hidden"
                onValueChange={(v) => pickCategory((v as string) || null)}
                value={category ?? ""}
              >
                {categoryOptions.map((c) => {
                  const active = (category ?? "") === c.id;
                  return (
                    <Radio.Root
                      className={cn(
                        "relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        press,
                        active ? "border-transparent text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      key={c.id || "all"}
                      value={c.id}
                    >
                      {active && <motion.span className="absolute -inset-px -z-10 rounded-full bg-primary" layoutId={`${uid}-chip`} transition={reduce ? { duration: 0 } : glide} />}
                      {c.name}
                      <span className={cn("tabular-nums", active ? "opacity-70" : "opacity-60")}>{c.count}</span>
                    </Radio.Root>
                  );
                })}
              </RadioGroup>

              <div className="flex items-center justify-between gap-2">
                <RadioGroup aria-label={t.filter} className="flex rounded-lg bg-muted p-0.5" onValueChange={(v) => pickFilter(v as Filter)} value={filter}>
                  {FILTERS.map((f) => (
                    <Radio.Root
                      className={cn(
                        "relative h-7 cursor-pointer rounded-md px-2.5 font-medium text-xs outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                        filter === f ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      key={f}
                      value={f}
                    >
                      {filter === f && <motion.span className="absolute inset-0 -z-10 rounded-md bg-background shadow-xs/5 dark:bg-input" layoutId={`${uid}-filter`} transition={reduce ? { duration: 0 } : glide} />}
                      {t[FILTER_KEY[f]]}
                    </Radio.Root>
                  ))}
                </RadioGroup>
                <Select items={{ popular: t.sortPopular, name: t.sortName, newest: t.sortNewest }} onValueChange={(v) => v && setSort(v as Sort)} value={sort}>
                  <SelectTrigger aria-label={t.sort} className="w-auto min-w-36 text-sm" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {(Object.keys(SORT_KEY) as Sort[]).map((value) => (
                      <SelectItem key={value} value={value}>
                        {t[SORT_KEY[value]]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </header>

          <div className="p-4 @2xl:p-6">
            {visible.length === 0 ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center rounded-2xl border border-dashed bg-muted/24 px-6 py-14 text-center"
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                transition={quick}
              >
                <div aria-hidden className="relative mb-5 h-14 w-32">
                  <span className="absolute start-0 top-3 flex size-10 -rotate-8 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5">
                    <MailIcon className="size-4" />
                  </span>
                  <span className="absolute end-0 top-3 flex size-10 rotate-8 items-center justify-center rounded-xl border bg-card text-muted-foreground shadow-xs/5">
                    <DatabaseIcon className="size-4" />
                  </span>
                  <span className="absolute start-1/2 top-0 flex size-12 -translate-x-1/2 items-center justify-center rounded-xl border bg-card text-foreground shadow-sm/5">
                    <SearchXIcon className="size-5" />
                  </span>
                </div>
                <p className="text-balance font-medium">{q ? interpolate(t.noMatch, { query: query.trim() }) : apps.length === 0 ? t.none : filter === "connected" ? t.noneConnected : t.allConnected}</p>
                {apps.length ? <p className="mt-1 max-w-72 text-pretty text-muted-foreground text-xs">{q ? t.noMatchHint : t.emptyHint}</p> : null}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {apps.length ? (
<Button className={press} onClick={resetFilters} size="sm" variant="outline">
                    {t.clearFilters}
                  </Button>
) : null}
                  {q && onRequestApp ? (
                    requested.includes(q) ? (
                      <Button aria-live="polite" disabled size="sm" variant="ghost">
                        <CheckIcon />
                        {t.requested}
                      </Button>
                    ) : (
                      <Button className={press} disabled={request.isPending()} onClick={() => void request.run(query.trim())} size="sm" variant="ghost">
                        {request.isPending() ? <Spinner /> : <MegaphoneIcon />}
                        {interpolate(t.request, { query: query.trim().slice(0, 18) })}
                      </Button>
                    )
                  ) : null}
                </div>
                {request.error ? (
                  <p className="mt-3 text-destructive-foreground text-xs" role="alert">
                    {request.error}
                  </p>
                ) : null}
              </motion.div>
            ) : (
              <div className="flex flex-col gap-8">
                {disconnect.error ? (
                  <p className="text-destructive-foreground text-sm" role="alert">
                    {disconnect.error}
                  </p>
                ) : null}
                {sections.map((section) => (
                  <section aria-label={section.title ?? t.apps} key={section.title ?? "all"}>
                    {section.title && (
                      <h3 className="mb-2.5 flex items-baseline gap-2 font-medium text-sm">
                        {section.title}
                        <span className="font-normal text-muted-foreground text-xs tabular-nums">{section.apps.length}</span>
                      </h3>
                    )}
                    <motion.ul className="grid grid-cols-1 gap-2.5 @2xl:grid-cols-2" layout={!reduce} transition={glide}>
                      <AnimatePresence initial={false} mode="popLayout">
                        {section.apps.map((app) => {
                          const s = stateOf(app);
                          return (
                            <motion.li
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "group relative flex items-start gap-3 rounded-xl border bg-card p-3.5 transition-[border-color,background-color,scale] duration-150 ease-out has-[[data-card-trigger]:active]:scale-[0.985] [@media(hover:hover)]:hover:border-foreground/16",
                                s === "error" && "border-destructive/24",
                              )}
                              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                              key={app.id}
                              layout={!reduce}
                              transition={quick}
                            >
                              <AppIcon app={app} icon={icons[app.id]} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex h-5 items-center gap-1.5">
                                  <button
                                    className="truncate text-start font-medium outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
                                    data-card-trigger
                                    onClick={() => setOpenId(app.id)}
                                    type="button"
                                  >
                                    {app.name}
                                  </button>
                                  <TagBadge t={t} tag={app.tag} />
                                </div>
                                {s === "error" ? (
                                  <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-destructive-foreground text-xs" role="status">
                                    <CircleAlertIcon aria-hidden className="size-3.5 shrink-0" />
                                    <span className="truncate">{t.authFailed}</span>
                                  </p>
                                ) : (
                                  <p className="mt-0.5 line-clamp-2 text-pretty text-muted-foreground text-xs @2xl:line-clamp-1">{app.blurb}</p>
                                )}
                              </div>
                              <div className="relative z-[1] -my-0.5 shrink-0">
                                <ConnectButton {...cardProps(app)} />
                              </div>
                            </motion.li>
                          );
                        })}
                      </AnimatePresence>
                    </motion.ul>
                  </section>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet onOpenChange={(o) => !o && setOpenId(null)} open={Boolean(open)}>
        <SheetContent className="w-full gap-0 p-0 sm:max-w-[400px]" side="right">
          {open ? <DetailPanel {...cardProps(open)} changeSetting={onSettingChange ? (settingId, on) => void changeSetting.run({ appId: open.id, settingId, on }, `${open.id}:${settingId}`) : undefined} error={errors[open.id]} icon={icons[open.id]} installs={installs.format(open.installs)} settingError={changeSetting.error} workspace={workspace} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DetailPanel({
  app,
  state,
  t,
  canConnect,
  canDisconnect,
  onConnect,
  onDisconnect,
  changeSetting,
  error,
  settingError,
  icon,
  installs,
  workspace,
}: {
  app: ConnectorApp;
  state: ConnState;
  t: Messages;
  canConnect: boolean;
  canDisconnect: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onConfigure?: () => void;
  changeSetting?: (settingId: string, on: boolean) => void;
  error?: string;
  settingError?: string;
  icon?: ReactNode;
  installs: string;
  workspace: string;
}) {
  const reduce = useSafeReducedMotion();
  const id = useId();
  const hint =
    state === "connected"
      ? interpolate(t.hintConnected, { workspace })
      : state === "connecting"
        ? interpolate(t.hintConnecting, { name: app.name })
        : state === "error"
          ? (error ?? t.authFailed)
          : t.hintIdle;
  const canAct = state === "connected" ? canDisconnect : canConnect;
  return (
    <>
      <SheetHeader className="border-b px-4 py-3">
        <SheetDescription className="font-medium text-xs">{t.details}</SheetDescription>
      </SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 text-sm">
        <div className="flex items-start gap-3">
          <AppIcon app={app} icon={icon} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <SheetTitle className="truncate font-heading font-semibold text-base">{app.name}</SheetTitle>
              <TagBadge t={t} tag={app.tag} />
            </div>
            <p className="text-muted-foreground text-xs tabular-nums">{interpolate(t.meta, { category: app.category, installs })}</p>
          </div>
        </div>

        <p className="mt-4 text-pretty text-muted-foreground">{app.description}</p>

        <div className={cn("mt-4 flex min-h-14 items-center gap-3 rounded-xl border py-2 ps-3 pe-2 transition-colors duration-200", state === "error" ? "border-destructive/24 bg-destructive/4" : "bg-background")} role="status">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span aria-hidden className={cn("relative flex size-2 shrink-0 rounded-full", STATUS_DOT[state])}>
              {state === "connecting" && !reduce && <span className="absolute inset-0 animate-ping rounded-full bg-info/60 motion-reduce:animate-none" />}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-sm">{t[STATUS_KEY[state]]}</span>
              <span className="block text-pretty text-muted-foreground text-xs">{hint}</span>
            </span>
          </div>
          {canAct ? (
            <Button
              className={cn("min-w-30 text-sm", press)}
              disabled={state === "connecting"}
              onClick={state === "connected" ? onDisconnect : onConnect}
              variant={state === "connected" ? "destructive" : state === "connecting" ? "outline" : "default"}
            >
              <span aria-hidden className="relative flex size-4 items-center justify-center">
                {state === "connected" ? <UnplugIcon /> : state === "connecting" ? <Spinner className="size-3.5" /> : state === "error" ? <RotateCwIcon /> : <PlugIcon />}
              </span>
              {state === "connected" ? t.disconnect : state === "connecting" ? t.connecting : state === "error" ? t.retry : t.connect}
            </Button>
          ) : null}
        </div>

        <section aria-labelledby={`${id}-perms`} className="mt-6">
          <h4 className="mb-2 font-medium text-xs" id={`${id}-perms`}>
            {t.permissions}
          </h4>
          <ul className="flex flex-col gap-1.5 rounded-xl border bg-background p-3">
            {app.permissions.map((p, i) => (
              <motion.li animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2" initial={reduce ? false : { opacity: 0, x: 6 }} key={p} transition={{ ...quick, delay: 0.08 + i * 0.03 }}>
                <span aria-hidden className="flex size-4 items-center justify-center rounded-full bg-success/16 text-success-foreground">
                  <CheckIcon className="size-3" />
                </span>
                {p}
              </motion.li>
            ))}
          </ul>
        </section>

        {app.settings.length ? (
          <section aria-labelledby={`${id}-settings`} className="mt-6">
            <h4 className="mb-2 font-medium text-xs" id={`${id}-settings`}>
              {t.settings}
            </h4>
            <div className={cn("flex flex-col divide-y rounded-xl border transition-opacity duration-200", state !== "connected" && "opacity-56")}>
              {app.settings.map((o) => (
                <div className="flex items-center justify-between gap-3 p-3" key={o.id}>
                  <label className="min-w-0 flex-1 cursor-pointer" htmlFor={`${id}-${o.id}`}>
                    <span className="block font-medium">{o.label}</span>
                    {o.hint ? <span className="block text-muted-foreground text-xs">{o.hint}</span> : null}
                  </label>
                  <Switch checked={o.on} disabled={state !== "connected" || !changeSetting} id={`${id}-${o.id}`} onCheckedChange={(v) => changeSetting?.(o.id, v)} />
                </div>
              ))}
            </div>
            {state !== "connected" ? <p className="mt-2 text-muted-foreground text-xs">{interpolate(t.settingsLocked, { name: app.name })}</p> : null}
            {settingError ? (
              <p className="mt-2 text-destructive-foreground text-xs" role="alert">
                {settingError}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

export function ConnectorMarketplace(props: ConnectorMarketplaceProps) {
  return (
    <ScreenBoundary name="ConnectorMarketplace">
      <ConnectorMarketplaceScreen {...props} />
    </ScreenBoundary>
  );
}
