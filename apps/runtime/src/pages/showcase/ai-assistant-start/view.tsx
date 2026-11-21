// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `assistant-start`).
"use client";

import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  FeatherIcon,
  FileSpreadsheetIcon,
  LoaderCircleIcon,
  LogOutIcon,
  MenuIcon,
  PaperclipIcon,
  PlusIcon,
  RotateCcwIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  SquareIcon,
  SquarePenIcon,
  ThumbsUpIcon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type ReactNode, type RefObject, useCallback, useEffect, useId, useRef, useState } from "react";
import type { AssistantApp, AssistantChat, AssistantMessage, AssistantProject, AssistantRequest, AssistantSuggestion, AssistantTone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("assistantStart.<key>"). */
export const ASSISTANT_START_MESSAGES = {
  greeting: "{greeting}, {name}",
  disclaimer: "{product} can make mistakes. Check what matters.",
  stop: "Stop generating",
  send: "Send message",
  remove: "Remove {name}",
  message: "Message",
  replyPlaceholder: "Reply to {product}…",
  attach: "Attach a file",
  model: "Model",
  closeSidebar: "Close sidebar",
  openSidebar: "Open sidebar",
  navigation: "Navigation",
  newChat: "New chat",
  newChatKbd: "⌘ N",
  searchChats: "Search chats",
  main: "Main",
  projects: "Projects",
  newProject: "New project",
  recent: "Recent",
  showAll: "Show all",
  noChats: "No chats match.",
  account: "Account menu",
  settings: "Settings",
  upgrade: "Upgrade plan",
  signOut: "Sign out",
  connecting: "Connecting…",
  context: "Context",
  moreApps: "40+ apps",
  back: "Back to home",
  thinking: "Thinking…",
  steps: "Steps",
  stoppedEarly: "Stopped early.",
  stoppedBefore: "Stopped before replying.",
  copy: "Copy reply",
  copied: "Copied",
  copyFailed: "Couldn’t copy",
  good: "Good reply",
  regenerate: "Regenerate",
};
type Messages = typeof ASSISTANT_START_MESSAGES;

export interface AssistantStartProps {
  productName: string;
  user: { name: string; initials: string; workspace?: string };
  plan?: string;
  /** e.g. "Good afternoon"; pick it from the user's local time. */
  greeting: string;
  chats: AssistantChat[];
  projects: AssistantProject[];
  apps: AssistantApp[];
  suggestions: AssistantSuggestion[];
  tools: { id: string; label: string }[];
  models: { value: string; label: string }[];
  /** Placeholders that rotate in the empty box. */
  placeholders: string[];
  /** Icons by app, suggestion and tool id. */
  icons?: Record<string, ReactNode>;
  /** Primary links in the sidebar. */
  navigation?: { label: string; href: string; icon?: ReactNode; current?: boolean }[];
  /** The open conversation; empty shows the start screen. */
  messages: AssistantMessage[];
  /** The open chat's id, highlighted in the sidebar. */
  activeChat?: string;
  /** Files attached to the next message. */
  files?: string[];
  /** Sends a message with the chosen tools, apps, files and model. */
  onSend: (request: AssistantRequest) => void;
  onStop?: () => void;
  /** Hidden without it, and while a reply is being written. */
  onRegenerate?: (messageId: string) => void;
  onNewChat: () => void;
  onOpenChat: (chatId: string) => void;
  /** Connects an app; it is added to the context once connected. */
  onConnectApp?: Action<{ id: string }>;
  onAttach?: () => void;
  onRemoveFile?: (name: string) => void;
  onRate?: (messageId: string, good: boolean) => void;
  /** Each shows its control only when given. */
  onNewProject?: () => void;
  onBrowseApps?: () => void;
  onSettings?: () => void;
  onUpgrade?: () => void;
  onSignOut?: () => void;
  className?: string;
}

const tileTone: Record<AssistantTone, string> = {
  orange: "bg-category-7/12 text-category-7-foreground",
  teal: "bg-category-6/12 text-category-6-foreground",
  violet: "bg-category-5/12 text-category-5-foreground",
  amber: "bg-category-3/12 text-category-3-foreground",
  info: "bg-info/12 text-info-foreground",
  success: "bg-success/12 text-success-foreground",
  warning: "bg-warning/16 text-warning-foreground",
};
const dotTone: Record<AssistantTone, string> = { orange: "bg-category-7", teal: "bg-category-6", violet: "bg-category-5", amber: "bg-category-3", info: "bg-info", success: "bg-success", warning: "bg-warning" };

const easeOut = [0.23, 1, 0.32, 1] as const;
const spring = { type: "spring", duration: 0.3, bounce: 0 } as const;
const softSpring = { type: "spring", duration: 0.4, bounce: 0 } as const;
const fade = { duration: 0.2, ease: easeOut } as const;

function OrbFilter({ id, blur }: { id: string; blur: number }) {
  return (
    <svg aria-hidden="true" className="absolute size-0">
      <filter colorInterpolationFilters="sRGB" height="300%" id={id} width="300%" x="-100%" y="-100%">
        <feGaussianBlur in="SourceGraphic" result="shape-blur" stdDeviation={blur} />
        <feColorMatrix in="shape-blur" result="shape" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
        <feGaussianBlur in="SourceGraphic" result="tint-blur" stdDeviation={blur * 1.6} />
        <feColorMatrix in="tint-blur" result="tint" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 60 0" />
        <feComposite in="tint" in2="shape" operator="in" />
      </filter>
    </svg>
  );
}

function GooOrb({ className, busy = false, size = 48 }: { className?: string; busy?: boolean; size?: number }) {
  const id = `orb-${useId().replace(/[^\w-]/g, "")}`;
  const reduce = useReducedMotion();
  const k = size / 48;
  const loop = (duration: number, x: number[], y: number[]) => (reduce ? undefined : { x: x.map((v) => v * k), y: y.map((v) => v * k), transition: { duration, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const } });
  const blob = "absolute rounded-full";
  return (
    <span aria-hidden className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <OrbFilter blur={3.5 * k} id={id} />
      <span className="absolute inset-0" style={{ filter: `url(#${id})` }}>
        <span className={cn(blob, "inset-[12%] bg-info")} />
        <motion.span animate={loop(busy ? 3 : 7, [0, 5, 3, -1, 0], [0, 2, 6, 3, 0])} className={cn(blob, "inset-s-[20%] top-[20%] size-[38%] bg-success")} />
        <motion.span animate={loop(busy ? 3.4 : 8, [0, -4, -6, -1, 0], [0, -5, -1, 2, 0])} className={cn(blob, "inset-e-[22%] bottom-[22%] size-[34%] bg-info-foreground")} />
        <motion.span animate={busy ? loop(2.2, [0, 13, 0], [0, -13, 0]) : loop(6, [0, 2, 0], [0, -2, 0])} className={cn(blob, "inset-e-[28%] top-[28%] size-[26%] bg-info")} />
      </span>
    </span>
  );
}

interface PromptBoxProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  streaming: boolean;
  onStop?: () => void;
  tools: { id: string; label: string }[];
  activeTools: string[];
  onToggleTool: (id: string) => void;
  context: AssistantApp[];
  onRemoveContext: (id: string) => void;
  files: string[];
  onAttach?: () => void;
  onRemoveFile?: (name: string) => void;
  models: { value: string; label: string }[];
  model: string;
  onModel: (v: string) => void;
  placeholders: string[];
  icons: Record<string, ReactNode>;
  compact?: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  t: Messages;
}

function PromptBox({ value, onChange, onSubmit, streaming, onStop, tools, activeTools, onToggleTool, context, onRemoveContext, files, onAttach, onRemoveFile, models, model, onModel, placeholders, icons, compact, textareaRef, t }: PromptBoxProps) {
  const reduce = useReducedMotion();
  const [ph, setPh] = useState(0);
  const inputId = useId();

  useEffect(() => {
    if (reduce || value || placeholders.length < 2) return;
    const id = setInterval(() => setPh((p) => (p + 1) % placeholders.length), 3200);
    return () => clearInterval(id);
  }, [reduce, value, placeholders.length]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (value.trim()) onSubmit();
    }
  };

  const chips = [
    ...context.map((app) => ({ key: `app-${app.id}`, label: app.name, icon: icons[app.id], tone: app.tone, remove: () => onRemoveContext(app.id) })),
    ...files.map((f) => ({ key: `file-${f}`, label: f, icon: <FileSpreadsheetIcon />, tone: "success" as AssistantTone, remove: onRemoveFile ? () => onRemoveFile(f) : undefined })),
  ];

  return (
    <motion.div className="@container relative rounded-2xl border bg-card shadow-xs/5 transition-[border-color,box-shadow] focus-within:border-ring/64 focus-within:ring-[3px] focus-within:ring-ring/16" layoutId="assistant-prompt" transition={softSpring}>
      <AnimatePresence initial={false}>
        {chips.length > 0 ? (
          <motion.div animate={{ height: "auto", opacity: 1 }} className="overflow-hidden" exit={{ height: 0, opacity: 0 }} initial={{ height: 0, opacity: 0 }} transition={spring}>
            <div className="flex flex-wrap gap-1.5 px-3 pt-3">
              <AnimatePresence initial={false} mode="popLayout">
                {chips.map((c) => (
                  <motion.span animate={{ opacity: 1, scale: 1 }} className="inline-flex h-6 items-center gap-1.5 rounded-full border bg-background ps-0.5 pe-1 text-xs" exit={{ opacity: 0, scale: 0.95 }} initial={{ opacity: 0, scale: 0.95 }} key={c.key} layout transition={spring}>
                    <span aria-hidden className={cn("flex size-5 items-center justify-center rounded-full [&_svg]:size-3", tileTone[c.tone])}>
                      {c.icon}
                    </span>
                    <span className="max-w-36 truncate font-medium">{c.label}</span>
                    {c.remove ? (
                      <button aria-label={interpolate(t.remove, { name: c.label })} className="relative flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none after:absolute after:-inset-2 hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={c.remove} type="button">
                        <XIcon aria-hidden className="size-3" />
                      </button>
                    ) : null}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative">
        <label className="sr-only" htmlFor={inputId}>
          {t.message}
        </label>
        <textarea className={cn("field-sizing-content block max-h-44 w-full resize-none bg-transparent px-4 pt-3.5 text-foreground text-sm/6 outline-none", compact ? "min-h-12" : "min-h-22")} id={inputId} onChange={(e) => onChange(e.target.value)} onKeyDown={onKeyDown} ref={textareaRef} rows={1} value={value} />
        {value ? null : (
          <div aria-hidden className="pointer-events-none absolute inset-x-4 top-3.5 overflow-hidden text-muted-foreground text-sm/6">
            <AnimatePresence initial={false} mode="wait">
              <motion.span animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} className="block truncate" exit={{ opacity: 0, y: -6, filter: "blur(2px)" }} initial={{ opacity: 0, y: 6, filter: "blur(2px)" }} key={ph} transition={fade}>
                {placeholders[ph] ?? ""}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 p-2 ps-2.5">
        {onAttach ? (
          <Tooltip>
            <TooltipTrigger render={<Button aria-label={t.attach} className="sm:size-8" onClick={onAttach} size="icon-sm" variant="ghost" />}>
              <PaperclipIcon />
            </TooltipTrigger>
            <TooltipContent>{t.attach}</TooltipContent>
          </Tooltip>
        ) : null}
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
          {tools.map((tool) => {
            const on = activeTools.includes(tool.id);
            return (
              <motion.button
                aria-label={tool.label}
                aria-pressed={on}
                className={cn("inline-flex h-8 min-w-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2 font-medium text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring @lg:px-2.5 [&_svg]:size-3.5 [&_svg]:shrink-0", on ? "border-info/32 bg-info/10 text-info-foreground" : "border-transparent text-muted-foreground hover:bg-accent hover:text-foreground")}
                key={tool.id}
                layout
                onClick={() => onToggleTool(tool.id)}
                transition={spring}
                type="button"
                whileTap={{ scale: 0.97 }}
              >
                <span aria-hidden className="contents">
                  {icons[tool.id]}
                </span>
                <span className="hidden @lg:inline">{tool.label}</span>
              </motion.button>
            );
          })}
        </div>
        {models.length > 1 ? (
          <Select items={models} onValueChange={(v) => v && onModel(v as string)} value={model}>
            <SelectTrigger aria-label={t.model} className="w-auto min-w-0 shrink-0 border-transparent bg-transparent text-sm shadow-none before:hidden hover:bg-accent dark:bg-transparent" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {models.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <Button aria-label={streaming ? t.stop : t.send} className="rounded-full transition-[box-shadow,scale,opacity] duration-150 ease-out active:scale-[0.97] sm:size-8" disabled={streaming ? !onStop : !value.trim()} onClick={streaming ? onStop : onSubmit} size="icon-sm">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span animate={{ opacity: 1, scale: 1 }} className="flex" exit={{ opacity: 0, scale: 0.95 }} initial={{ opacity: 0, scale: 0.95 }} key={streaming ? "stop" : "send"} transition={fade}>
              {streaming ? <SquareIcon className="size-3 fill-current" /> : <ArrowUpIcon />}
            </motion.span>
          </AnimatePresence>
        </Button>
      </div>
    </motion.div>
  );
}

interface SidebarBodyProps {
  productName: string;
  user: AssistantStartProps["user"];
  plan?: string;
  chats: AssistantChat[];
  projects: AssistantProject[];
  navigation: NonNullable<AssistantStartProps["navigation"]>;
  activeChat?: string;
  onOpenChat: (id: string) => void;
  onNewChat: () => void;
  onNewProject?: () => void;
  onSettings?: () => void;
  onUpgrade?: () => void;
  onSignOut?: () => void;
  onClose?: () => void;
  t: Messages;
}

function SidebarBody({ productName, user, plan, chats, projects, navigation, activeChat, onOpenChat, onNewChat, onNewProject, onSettings, onUpgrade, onSignOut, onClose, t }: SidebarBodyProps) {
  const fmt = useFormat();
  const [query, setQuery] = useState("");
  const [project, setProject] = useState<string | null>(null);
  const groupId = useId();
  const visible = chats.filter((c) => (!project || c.projectId === project) && c.title.toLowerCase().includes(query.trim().toLowerCase()));
  const hasAccountMenu = Boolean(onSettings || onUpgrade || onSignOut);

  return (
    <LayoutGroup id={groupId}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FeatherIcon className="size-4" />
          </span>
          <span className="font-heading font-semibold">{productName}</span>
          {onClose ? (
            <Button aria-label={t.closeSidebar} className="ms-auto sm:size-8" onClick={onClose} size="icon-sm" variant="ghost">
              <XIcon />
            </Button>
          ) : plan ? (
            <Badge className="ms-auto" variant="outline">
              {plan}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 px-3 pb-2">
          <Button className="justify-start" onClick={onNewChat} variant="outline">
            <SquarePenIcon />
            {t.newChat}
            <Kbd className="ms-auto dark:text-foreground">{t.newChatKbd}</Kbd>
          </Button>
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput aria-label={t.searchChats} onChange={(e) => setQuery(e.target.value)} placeholder={t.searchChats} value={query} />
          </InputGroup>
        </div>

        {navigation.length ? (
          <nav aria-label={t.main} className="flex flex-col gap-0.5 px-2 py-1">
            {navigation.map((n) => (
              <WirefrontLink aria-current={n.current ? "page" : undefined} className={cn("relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:relative [&_svg]:size-4", n.current ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")} href={n.href} key={n.href}>
                {n.icon ? <span aria-hidden className="contents">{n.icon}</span> : null}
                <span className="relative">{n.label}</span>
              </WirefrontLink>
            ))}
          </nav>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
          <div className="flex items-center justify-between px-2.5 pt-4 pb-1.5">
            <h2 className="font-medium text-muted-foreground text-xs">{t.projects}</h2>
            {onNewProject ? (
              <Button aria-label={t.newProject} className="after:absolute after:-inset-1" onClick={onNewProject} size="icon-xs" variant="ghost">
                <PlusIcon />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5">
            {projects.map((p) => {
              const on = project === p.id;
              return (
                <button aria-pressed={on} className={cn("relative flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", on ? "text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} key={p.id} onClick={() => setProject(on ? null : p.id)} type="button">
                  {on ? <motion.span className="absolute inset-0 rounded-lg bg-accent" layoutId="project-pill" transition={spring} /> : null}
                  <motion.span animate={{ scale: on ? 1.35 : 1 }} aria-hidden className={cn("relative size-2 rounded-full", dotTone[p.tone])} transition={spring} />
                  <span className="relative truncate">{p.name}</span>
                  <span className="relative ms-auto text-muted-foreground text-xs tabular-nums">{chats.filter((c) => c.projectId === p.id).length}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between px-2.5 pt-4 pb-1.5">
            <h2 className="font-medium text-muted-foreground text-xs">{project ? projects.find((p) => p.id === project)?.name : t.recent}</h2>
            {project ? (
              <button className="relative -my-1 cursor-pointer rounded-md px-1.5 py-1 text-muted-foreground text-xs outline-none after:absolute after:inset-x-0 after:-inset-y-1 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setProject(null)} type="button">
                {t.showAll}
              </button>
            ) : null}
          </div>
          <ul className="flex flex-col gap-0.5">
            <AnimatePresence initial={false} mode="popLayout">
              {visible.map((c) => (
                <motion.li animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} initial={{ opacity: 0, x: -6 }} key={c.id} layout transition={spring}>
                  <button aria-current={activeChat === c.id ? "true" : undefined} className={cn("group/chat flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 text-start outline-none focus-visible:ring-2 focus-visible:ring-ring", activeChat === c.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground")} onClick={() => onOpenChat(c.id)} type="button">
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{fmt.relative(c.updatedAt)}</span>
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
            {visible.length === 0 ? <li className="px-2.5 py-2 text-muted-foreground text-xs">{t.noChats}</li> : null}
          </ul>
        </div>

        <div className="flex items-center gap-2.5 border-t p-3">
          <Avatar aria-hidden className="size-8">
            <AvatarFallback className="bg-category-6/12 text-category-6-foreground text-xs">{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{user.name}</div>
            {user.workspace ? <div className="truncate text-muted-foreground text-xs">{user.workspace}</div> : null}
          </div>
          {hasAccountMenu ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button aria-label={t.account} className="sm:size-8" size="icon-sm" variant="ghost" />}>
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                {onSettings ? (
                  <DropdownMenuItem onClick={onSettings}>
                    <SettingsIcon />
                    {t.settings}
                  </DropdownMenuItem>
                ) : null}
                {onUpgrade ? (
                  <DropdownMenuItem onClick={onUpgrade}>
                    <SparklesIcon />
                    {t.upgrade}
                  </DropdownMenuItem>
                ) : null}
                {onSignOut ? (
                  <>
                    {onSettings || onUpgrade ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuItem onClick={onSignOut}>
                      <LogOutIcon />
                      {t.signOut}
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </LayoutGroup>
  );
}

function FadeScroller({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const max = el.scrollWidth - el.clientWidth;
      setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    for (const child of el.children) observer.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);
  return (
    <div className={cn("overflow-x-auto scrollbar-none", className)} ref={ref} style={{ maskImage: `linear-gradient(to right, ${edges.start ? "transparent, black 1.5rem" : "black, black"}, ${edges.end ? "black calc(100% - 1.5rem), transparent" : "black, black"})` }}>
      {children}
    </div>
  );
}

function AppPill({ app, icon, selected, connecting, onClick, t }: { app: AssistantApp; icon: ReactNode; selected: boolean; connecting: boolean; onClick: () => void; t: Messages }) {
  return (
    <motion.button
      aria-pressed={app.connected ? selected : undefined}
      className={cn("inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border ps-1 pe-2.5 font-medium text-xs outline-none transition-[background-color,border-color,color] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring", selected ? "border-info/40 bg-info/10 text-info-foreground" : app.connected ? "border-border bg-background text-foreground/80 hover:border-input hover:text-foreground" : "border-dashed bg-transparent text-muted-foreground hover:bg-background hover:text-foreground")}
      layout
      onClick={onClick}
      transition={spring}
      type="button"
      whileTap={{ scale: 0.97 }}
    >
      <span aria-hidden className={cn("relative flex size-5 items-center justify-center rounded-full [&_svg]:size-3", tileTone[app.tone], !app.connected && !connecting && "opacity-64")}>
        <AnimatePresence initial={false} mode="popLayout">
          {connecting ? (
            <motion.span animate={{ opacity: 1 }} className="flex" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="spin">
              <LoaderCircleIcon className="animate-spin motion-reduce:animate-none" />
            </motion.span>
          ) : selected ? (
            <motion.span animate={{ opacity: 1, scale: 1 }} className="flex" exit={{ opacity: 0, scale: 0.9 }} initial={{ opacity: 0, scale: 0.9 }} key="on" transition={spring}>
              <CheckIcon strokeWidth={3} />
            </motion.span>
          ) : (
            <motion.span animate={{ opacity: 1 }} className="flex" exit={{ opacity: 0 }} initial={{ opacity: 0 }} key="icon">
              {icon}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      {connecting ? t.connecting : app.name}
      {!app.connected && !connecting ? <PlusIcon aria-hidden className="-me-0.5 size-3" /> : null}
    </motion.button>
  );
}

function ReplyMessage({ message, productName, onRegenerate, onRate, t }: { message: AssistantMessage; productName: string; onRegenerate?: () => void; onRate?: (good: boolean) => void; t: Messages }) {
  const streaming = Boolean(message.streaming);
  const thinking = streaming && !message.text;
  const paragraphs = message.text.split("\n\n").filter((p) => p.trim());
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [liked, setLiked] = useState(false);
  useEffect(() => {
    if (copy === "idle") return;
    const id = setTimeout(() => setCopy("idle"), 1400);
    return () => clearTimeout(id);
  }, [copy]);
  const action = "text-muted-foreground transition-[scale,background-color,color] duration-150 ease-out active:scale-[0.97] sm:size-8";

  return (
    <motion.div animate={{ opacity: 1 }} className="flex gap-3" initial={{ opacity: 0 }} transition={fade}>
      <GooOrb busy={streaming} className="mt-px" size={28} />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex h-7 items-center gap-2">
          <span className="font-medium">{productName}</span>
          <AnimatePresence initial={false}>
            {thinking ? (
              <motion.span animate={{ opacity: 1 }} className="text-muted-foreground text-xs" exit={{ opacity: 0 }} initial={{ opacity: 0 }} transition={fade}>
                {t.thinking}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </div>
        {message.steps?.length ? (
          <ul aria-label={t.steps} className="mb-3 flex flex-wrap gap-1.5">
            {message.steps.map((s, i) => (
              <motion.li animate={{ opacity: 1, scale: 1 }} className="inline-flex h-6 items-center gap-1.5 rounded-full border bg-card px-2 text-muted-foreground text-xs" initial={{ opacity: 0, scale: 0.95 }} key={s} transition={{ ...fade, delay: 0.04 * Math.min(i, 5) }}>
                {thinking ? <LoaderCircleIcon aria-hidden className="size-3 animate-spin motion-reduce:animate-none" /> : <CheckIcon aria-hidden className="size-3 text-success-foreground" />}
                {s}
              </motion.li>
            ))}
          </ul>
        ) : null}
        <div aria-live="polite" className="flex flex-col gap-3 text-pretty text-sm/6">
          {paragraphs.map((p, i) => (
            <p key={`${message.id}-${p.slice(0, 24)}-${p.length}`}>
              {p}
              {streaming && i === paragraphs.length - 1 ? <motion.span animate={{ opacity: [1, 0.25, 1] }} aria-hidden className="ms-0.5 inline-block h-4 w-1.5 translate-y-0.5 rounded-full bg-foreground/60" transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }} /> : null}
            </p>
          ))}
        </div>
        {message.stopped ? <p className="mt-2 text-muted-foreground text-xs">{paragraphs.length ? t.stoppedEarly : t.stoppedBefore}</p> : null}
        {streaming ? null : (
          <motion.div animate={{ opacity: 1 }} className="mt-2 -ms-1.5 flex gap-0.5" initial={{ opacity: 0 }} transition={fade}>
            <Button
              aria-label={copy === "copied" ? t.copied : copy === "failed" ? t.copyFailed : t.copy}
              className={action}
              disabled={!paragraphs.length}
              onClick={() => {
                if (!navigator.clipboard) {
                  setCopy("failed");
                  return;
                }
                navigator.clipboard.writeText(message.text).then(
                  () => setCopy("copied"),
                  () => setCopy("failed"),
                );
              }}
              size="icon-sm"
              variant="ghost"
            >
              {copy === "copied" ? <CheckIcon /> : <CopyIcon />}
            </Button>
            {onRate ? (
              <Button
                aria-label={t.good}
                aria-pressed={liked}
                className={cn(action, liked && "text-info-foreground")}
                onClick={() => {
                  setLiked(!liked);
                  onRate(!liked);
                }}
                size="icon-sm"
                variant="ghost"
              >
                <ThumbsUpIcon className={cn(liked && "fill-current/20")} />
              </Button>
            ) : null}
            <Button aria-label={t.regenerate} className={action} disabled={!onRegenerate} onClick={onRegenerate} size="icon-sm" variant="ghost">
              <RotateCcwIcon />
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function AssistantStartScreen({ productName, user, plan, greeting, chats, projects, apps, suggestions, tools, models, placeholders, icons = {}, navigation = [], messages, activeChat, files = [], onSend, onStop, onRegenerate, onNewChat, onOpenChat, onConnectApp, onAttach, onRemoveFile, onRate, onNewProject, onBrowseApps, onSettings, onUpgrade, onSignOut, className }: AssistantStartProps) {
  const t = useMessages("assistantStart", ASSISTANT_START_MESSAGES);
  const reduce = useReducedMotion();
  const mainGroup = useId();
  const [drawer, setDrawer] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [activeTools, setActiveTools] = useState<string[]>(() => (tools[0] ? [tools[0].id] : []));
  const [contextIds, setContextIds] = useState<string[]>([]);
  const [model, setModel] = useState(models[0]?.value ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (typeTimer.current) clearInterval(typeTimer.current);
    },
    [],
  );

  const connect = useAction(onConnectApp ?? (async () => {}), { onSuccess: (_, { id }) => setContextIds((ids) => (ids.includes(id) ? ids : [...ids, id])) });
  const [connecting, setConnecting] = useState<string | null>(null);
  const context = apps.filter((a) => contextIds.includes(a.id) && a.connected);
  const streaming = messages.some((m) => m.streaming);
  const firstName = user.name.split(" ")[0] ?? user.name;

  // Follow the conversation as the reply streams in, once per mounted chat list (React 19 ref
  // cleanup). The scroll container is the content's parent.
  const followChat = useCallback((content: HTMLDivElement | null) => {
    const viewport = content?.parentElement;
    if (!content || !viewport) return;
    const ro = new ResizeObserver(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  const submit = () => {
    const text = prompt.trim();
    if (!text || streaming) return;
    if (typeTimer.current) clearInterval(typeTimer.current);
    setPrompt("");
    onSend({ text, tools: activeTools, apps: context.map((a) => a.id), files, model });
  };
  const newChat = () => {
    setPrompt("");
    setDrawer(false);
    onNewChat();
    requestAnimationFrame(() => textareaRef.current?.focus());
  };
  const openChat = (id: string) => {
    setDrawer(false);
    onOpenChat(id);
  };
  // Type a suggestion into the box rather than pasting it, unless motion is reduced.
  const fillPrompt = (text: string) => {
    if (typeTimer.current) clearInterval(typeTimer.current);
    textareaRef.current?.focus();
    if (reduce) {
      setPrompt(text);
      return;
    }
    let i = 0;
    typeTimer.current = setInterval(() => {
      i = Math.min(text.length, i + 6);
      setPrompt(text.slice(0, i));
      if (i >= text.length && typeTimer.current) clearInterval(typeTimer.current);
    }, 16);
  };
  const onAppClick = async (app: AssistantApp) => {
    if (connecting) return;
    if (!app.connected) {
      if (!onConnectApp) return;
      setConnecting(app.id);
      await connect.run({ id: app.id }, app.id);
      setConnecting(null);
      return;
    }
    setContextIds((ids) => (ids.includes(app.id) ? ids.filter((x) => x !== app.id) : [...ids, app.id]));
  };

  const promptBox = (compact: boolean) => (
    <PromptBox
      activeTools={activeTools}
      compact={compact}
      context={context}
      files={files}
      icons={icons}
      model={model}
      models={models}
      onAttach={onAttach}
      onChange={(v) => {
        if (typeTimer.current) clearInterval(typeTimer.current);
        setPrompt(v);
      }}
      onModel={setModel}
      onRemoveContext={(id) => setContextIds((ids) => ids.filter((x) => x !== id))}
      onRemoveFile={onRemoveFile}
      onStop={onStop}
      onSubmit={submit}
      onToggleTool={(id) => setActiveTools((on) => (on.includes(id) ? on.filter((x) => x !== id) : [...on, id]))}
      placeholders={compact ? [interpolate(t.replyPlaceholder, { product: productName })] : placeholders}
      streaming={streaming}
      t={t}
      textareaRef={textareaRef}
      tools={tools}
      value={prompt}
    />
  );

  const sidebarProps: SidebarBodyProps = { productName, user, plan, chats, projects, navigation, activeChat, onOpenChat: openChat, onNewChat: newChat, onNewProject, onSettings, onUpgrade, onSignOut, t };
  const inChat = messages.length > 0;
  const chatTitle = chats.find((c) => c.id === activeChat)?.title ?? t.newChat;
  const disclaimer = interpolate(t.disclaimer, { product: productName });

  return (
    <MotionConfig reducedMotion="user">
      <div className={cn("@container relative isolate flex h-svh w-full overflow-hidden bg-background text-foreground text-sm", className)}>
        <aside className="hidden w-64 shrink-0 border-e bg-muted/40 @3xl:block">
          <SidebarBody {...sidebarProps} />
        </aside>

        <Sheet onOpenChange={setDrawer} open={drawer}>
          <SheetContent className="w-72 max-w-[85%] gap-0 p-0" showCloseButton={false} side="left">
            <SheetTitle className="sr-only">{t.navigation}</SheetTitle>
            <SidebarBody {...sidebarProps} onClose={() => setDrawer(false)} />
          </SheetContent>
        </Sheet>

        <LayoutGroup id={mainGroup}>
          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-12 shrink-0 items-center gap-2 border-b px-2 @3xl:hidden">
              <Button aria-label={t.openSidebar} className="sm:size-8" onClick={() => setDrawer(true)} size="icon-sm" variant="ghost">
                <MenuIcon />
              </Button>
              <span className="flex items-center gap-1.5 font-heading font-semibold">
                <FeatherIcon aria-hidden className="size-4" />
                {productName}
              </span>
              <Button aria-label={t.newChat} className="ms-auto sm:size-8" onClick={newChat} size="icon-sm" variant="ghost">
                <SquarePenIcon />
              </Button>
            </header>

            {inChat ? (
              <>
                <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 @3xl:px-5">
                  <Button aria-label={t.back} className="sm:size-8" onClick={newChat} size="icon-sm" variant="ghost">
                    <ArrowLeftIcon className="rtl:rotate-180" />
                  </Button>
                  <h1 className="min-w-0 flex-1 truncate font-medium">{chatTitle}</h1>
                  <Badge className="hidden @md:inline-flex" variant="outline">
                    {models.find((m) => m.value === model)?.label}
                  </Badge>
                </div>
                <motion.div className="min-h-0 flex-1 overflow-y-auto" layoutScroll>
                  <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 @3xl:px-8" ref={followChat}>
                    {messages.map((m) =>
                      m.role === "user" ? (
                        <motion.div animate={{ opacity: 1, y: 0 }} className="ms-auto max-w-[85%] text-pretty rounded-2xl rounded-ee-md bg-muted px-4 py-2.5" initial={{ opacity: 0, y: 8 }} key={m.id} transition={softSpring}>
                          {m.text}
                        </motion.div>
                      ) : (
                        <ReplyMessage key={m.id} message={m} onRate={onRate ? (good) => onRate(m.id, good) : undefined} onRegenerate={streaming || !onRegenerate ? undefined : () => onRegenerate(m.id)} productName={productName} t={t} />
                      ),
                    )}
                  </div>
                </motion.div>
                <div className="mx-auto w-full max-w-2xl shrink-0 px-3 @3xl:px-8">{promptBox(true)}</div>
                <p className="shrink-0 px-4 py-2.5 text-center text-muted-foreground text-xs">{disclaimer}</p>
              </>
            ) : (
              <motion.div className="flex min-h-0 flex-1 flex-col overflow-y-auto" layoutScroll>
                <div className="m-auto flex w-full max-w-2xl flex-col px-4 py-10 @3xl:px-8">
                  <motion.div animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col items-center gap-5 text-center" initial={{ opacity: 0, y: 8 }} transition={softSpring}>
                    <GooOrb size={48} />
                    <h1 className="text-balance font-medium text-2xl tracking-tight @3xl:text-[1.875rem] @3xl:leading-tight">{interpolate(t.greeting, { greeting, name: firstName })}</h1>
                  </motion.div>

                  <div className="relative z-10">{promptBox(false)}</div>

                  {apps.length ? (
                    <div className="-mt-3 rounded-b-2xl border border-t-0 bg-muted/48 px-3 pt-5.5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-muted-foreground text-xs">{t.context}</span>
                        <FadeScroller className="-my-1 flex min-w-0 flex-1 items-center gap-1.5 py-1">
                          {apps.map((a) => (
                            <AppPill app={a} connecting={connecting === a.id} icon={icons[a.id]} key={a.id} onClick={() => onAppClick(a)} selected={contextIds.includes(a.id) && a.connected} t={t} />
                          ))}
                          {onBrowseApps ? (
                            <button className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full px-2 text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" onClick={onBrowseApps} type="button">
                              {t.moreApps}
                              <ArrowUpRightIcon aria-hidden className="size-3 rtl:-scale-x-100" />
                            </button>
                          ) : null}
                        </FadeScroller>
                      </div>
                      {connect.error ? (
                        <p className="mt-2 text-destructive text-xs" role="alert">
                          {connect.error}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s, i) => (
                      <motion.button animate={{ opacity: 1, y: 0 }} className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border bg-background px-3 text-muted-foreground text-xs outline-none transition-[background-color,border-color,color] duration-150 ease-out hover:border-input hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring @3xl:text-sm" initial={{ opacity: 0, y: 6 }} key={s.id} onClick={() => fillPrompt(s.prompt)} title={s.description} transition={{ ...softSpring, delay: 0.04 + 0.03 * Math.min(i, 6) }} type="button" whileTap={{ scale: 0.97 }}>
                        <span aria-hidden className={cn("flex shrink-0 rounded-sm [&_svg]:size-3.5", tileTone[s.tone], "bg-transparent dark:bg-transparent")}>
                          {icons[s.id]}
                        </span>
                        {s.title}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <p className="mt-auto shrink-0 px-4 py-2.5 text-center text-muted-foreground text-xs">{disclaimer}</p>
              </motion.div>
            )}
          </main>
        </LayoutGroup>
      </div>
    </MotionConfig>
  );
}

export function AssistantStart(props: AssistantStartProps) {
  return (
    <ScreenBoundary name="AssistantStart">
      <AssistantStartScreen {...props} />
    </ScreenBoundary>
  );
}
