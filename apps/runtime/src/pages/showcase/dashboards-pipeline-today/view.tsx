// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `accounts-crm`).
"use client";

import {
  ArrowRightIcon,
  CalendarClockIcon,
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  Clock3Icon,
  CoffeeIcon,
  EyeIcon,
  type LucideIcon,
  MailIcon,
  MoonIcon,
  PhoneIcon,
  ReplyIcon,
  SettingsIcon,
  UserMinusIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  createContext,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Avatar, AvatarFallback } from "@wirefront/ui/avatar";
import { Button } from "@wirefront/ui/button";
import { Kbd } from "@wirefront/ui/kbd";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@wirefront/ui/dropdown-menu";
import { SegmentedControl, SegmentedControlItem } from "@wirefront/ui/segmented-control";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";
import { Skeleton } from "@wirefront/ui/skeleton";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useFormat, useMessages, useWirefront, WirefrontLink } from "@wirefront/ui/wirefront/provider";
import type { Action, AsyncStatus } from "@wirefront/ui/wirefront/types";
import type { Deal, DealOwner, DealStage, Engagement, FocusAction, FocusKind, FocusSignal, MoveDealInput, PipelineData, PipelineStage, SignalActionInput } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("pipelineToday.<key>"). */
export const PIPELINE_TODAY_MESSAGES = {
  main: "Main",
  settings: "Settings",
  morning: "Good morning, {name}",
  afternoon: "Good afternoon, {name}",
  evening: "Good evening, {name}",
  nothingNeedsYou: "Nothing needs you right now. Nice work.",
  oneNeedsYou: "1 account needs you today.",
  manyNeedYou: "{count} accounts need you today.",
  dragHint: "Drag deals as they move.",
  forecast: "Weighted forecast",
  ofTarget: "{percent} of target",
  targetLine: "{percent} of {target} target",
  wonAmount: "{amount} won",
  show: "Show",
  pipeline: "Pipeline",
  focus: "Focus",
  stage: "Stage",
  laneLabelOne: "{stage}: 1 deal, {amount} {kind}",
  laneLabelMany: "{stage}: {count} deals, {amount} {kind}",
  closed: "closed",
  weighted: "weighted",
  dropHere: "Drop a deal here",
  draggableDeal: "draggable deal",
  instructions: "Press Space to pick up. Arrow keys move the deal between stages and up or down. Space or Enter drops it, Escape cancels. Press Enter to open details.",
  keyStage: "stage",
  keyOrder: "order",
  keySpace: "Space",
  keyDrop: "drop",
  keyEsc: "Esc",
  keyCancel: "cancel",
  justMoved: "Just moved",
  daysInStage: "{days}d in stage",
  closedWon: "Closed won",
  today: "Today",
  justNow: "Just now",
  focusSubtitle: "Who to act on today, and why",
  clearTitle: "You’re clear for today",
  clearHandled: "{handled} handled. New signals land here as they happen.",
  clearHandledSnoozed: "{handled} handled, {snoozed} snoozed until tomorrow. New signals land here as they happen.",
  bringBack: "Bring back snoozed",
  openDeal: "Open {company}",
  email: "Email",
  emailContact: "Email {contact}",
  logCall: "Log call",
  logCallWith: "Log call with {contact}",
  snooze: "Snooze",
  snoozeCompany: "Snooze {company} until tomorrow",
  followUpSent: "Follow-up sent to {contact}",
  callLogged: "Call with {contact} logged",
  snoozedUntilTomorrow: "Snoozed until tomorrow",
  backInFocus: "{company} is back in Focus tomorrow",
  touchedJustNow: "{company} · touched just now",
  youEmailed: "You emailed {contact}",
  youCalled: "You logged a call with {contact}",
  closeDetails: "Close details",
  value: "Value",
  owner: "Owner",
  closeDate: "Close date",
  closedOn: "Closed",
  changeStage: "Stage: {stage}. Change stage",
  nextStep: "Next step",
  contacts: "Contacts",
  lastTouches: "Last touches",
  notes: "Notes",
  markWon: "Mark as won",
  moveTo: "Move to {stage}",
  saidStays: "{company} stays in {stage}, position {position}.",
  saidMoved: "{company} moved to {stage}. Forecast now {forecast}.",
  saidWon: "{company} moved to {stage}, closed won. Forecast now {forecast}.",
  saidCancelled: "Move cancelled. {company} is back in {stage}.",
  saidPickedUp: "Picked up {company}. Drop it on a stage, or press Escape to cancel.",
  saidPickedUpKeys: "Picked up {company} in {stage}. Left and right arrows change stage, up and down reorder, Space drops, Escape cancels.",
  saidPosition: "{stage}, position {position} of {count}.",
  saidSignal: "{company}: {outcome}. {left}",
  saidFocusClear: "Focus is clear.",
  saidLeft: "{count} left in Focus.",
  saidMoveFailed: "Couldn’t move {company}: {error}",
  errorTitle: "Couldn’t load your pipeline",
  retry: "Try again",
};
type Messages = typeof PIPELINE_TODAY_MESSAGES;

export interface PipelineNavItem {
  label: string;
  href: string;
  icon: ReactNode;
  /** Marks the page you're on. */
  current?: boolean;
  /** Shows a dot, e.g. for unread items. */
  badge?: boolean;
}

export interface PipelineTodayProps {
  /** Stages, owners, deals and signals. Leave it out while it loads. */
  data?: PipelineData;
  /** "loading" shows a placeholder; "error" shows `error` and a retry. Defaults to "ready". */
  status?: AsyncStatus;
  error?: string;
  onRetry?: () => void;
  /** The signed-in owner's id; greets them and marks their avatar. */
  currentUserId: string;
  /** Your workspace's name, shown as its initial in the rail. */
  workspace: string;
  /** The app's sections, shown as an icon rail from @3xl up. */
  nav?: PipelineNavItem[];
  /** Where the rail's settings button goes. Hidden when not given. */
  settingsHref?: string;
  /** The forecast target in the provider's currency. */
  target: number;
  /** Shown above the forecast, e.g. "Q4 weighted forecast". */
  forecastLabel?: string;
  /**
   * Save a deal's new stage and position. The board moves at once; if this
   * fails the move is undone and the error announced.
   */
  onDealMove?: Action<MoveDealInput>;
  /** Email, log a call for, or snooze a signal. Its buttons show only with this. */
  onSignalAction?: Action<SignalActionInput>;
  className?: string;
}

const ease = [0.23, 1, 0.32, 1] as const;
const glide = { type: "spring", stiffness: 520, damping: 42 } as const;
const land = { type: "spring", stiffness: 380, damping: 30 } as const;

const stageDot: Record<DealStage, string> = {
  lead: "bg-muted-foreground/50",
  qualified: "bg-category-1",
  proposal: "bg-category-3",
  negotiation: "bg-category-5",
  won: "bg-category-2",
};

const engagementMeta: Record<Engagement, { level: number; bar: string; text: string }> = {
  hot: { level: 4, bar: "bg-category-2", text: "text-category-2-foreground" },
  warm: { level: 3, bar: "bg-category-2", text: "text-muted-foreground" },
  cooling: { level: 2, bar: "bg-category-3", text: "text-category-3-foreground" },
  cold: { level: 1, bar: "bg-category-4", text: "text-category-4-foreground" },
};

const warmer: Record<Engagement, Engagement> = { cold: "cooling", cooling: "warm", warm: "hot", hot: "hot" };

const signalMeta: Record<FocusKind, { icon: LucideIcon; tile: string; text: string }> = {
  quiet: {
    icon: MoonIcon,
    tile: "bg-category-3/12 text-category-3-foreground",
    text: "text-category-3-foreground",
  },
  opened: {
    icon: EyeIcon,
    tile: "bg-category-1/12 text-category-1-foreground",
    text: "text-category-1-foreground",
  },
  champion: {
    icon: UserMinusIcon,
    tile: "bg-category-4/12 text-category-4-foreground",
    text: "text-category-4-foreground",
  },
  overdue: {
    icon: CalendarClockIcon,
    tile: "bg-category-7/12 text-category-7-foreground",
    text: "text-category-7-foreground",
  },
  replied: {
    icon: ReplyIcon,
    tile: "bg-category-2/12 text-category-2-foreground",
    text: "text-category-2-foreground",
  },
};

const monogramTones = [
  "bg-category-3/15 text-category-3-foreground",
  "bg-category-1/15 text-category-1-foreground",
  "bg-category-5/15 text-category-5-foreground",
  "bg-category-2/15 text-category-2-foreground",
  "bg-category-4/15 text-category-4-foreground",
  "bg-category-6/15 text-category-6-foreground",
  "bg-category-7/15 text-category-7-foreground",
];

const ownerTones = [
  "bg-category-7/20 text-category-7-foreground",
  "bg-category-6/20 text-category-6-foreground",
  "bg-category-5/20 text-category-5-foreground",
  "bg-category-1/20 text-category-1-foreground",
];

const burstTones = [
  "bg-category-2",
  "bg-category-3",
  "bg-category-1",
  "bg-category-5",
  "bg-category-4",
  "bg-category-2",
];

/** Money formatters from the provider's locale and currency, plus the screen's messages. */
interface Fmt {
  t: Messages;
  money: (n: number) => string;
  shortMoney: (n: number) => string;
  signedMoney: (n: number) => string;
  percent: (n: number) => string;
}

function useFmt(): Fmt {
  const t = useMessages("pipelineToday", PIPELINE_TODAY_MESSAGES);
  const format = useFormat();
  return useMemo(
    () => ({
      t,
      money: (n: number) => format.money(Math.round(n), undefined, { maximumFractionDigits: 0 }),
      shortMoney: (n: number) => format.money(Math.round(n), undefined, { notation: "compact", maximumFractionDigits: 2 }),
      signedMoney: (n: number) => format.money(Math.round(n), undefined, { maximumFractionDigits: 0, signDisplay: "exceptZero" }),
      percent: (n: number) => format.number(n, { style: "percent", maximumFractionDigits: 0 }),
    }),
    [t, format],
  );
}

const FmtContext = createContext<Fmt | null>(null);
function useFmtContext(): Fmt {
  const fmt = useContext(FmtContext);
  if (!fmt) throw new Error("PipelineToday parts render inside PipelineToday");
  return fmt;
}

function initials(name: string) {
  return name
    .replace(/[^A-Za-z\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

function shortName(company: string) {
  return (company.split(/\s+/)[0] ?? company).replace(/[^\p{L}-]/gu, "");
}

function hashIndex(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % n;
}

function scaleOf(el: HTMLElement) {
  return el.getBoundingClientRect().width / (el.offsetWidth || 1) || 1;
}

function useCalmMotion() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

function moveDeal(list: Deal[], id: string, stage: DealStage, index: number, patch?: Partial<Deal>) {
  const moving = list.find((d) => d.id === id);
  if (!moving) return list;
  const rest = list.filter((d) => d.id !== id);
  const column = rest.filter((d) => d.stage === stage);
  const next: Deal = { ...moving, stage, ...(moving.stage !== stage ? { daysInStage: 0 } : {}), ...patch };
  const anchor = column[index];
  const last = column[column.length - 1];
  const at = anchor ? rest.indexOf(anchor) : last ? rest.indexOf(last) + 1 : rest.length;
  return [...rest.slice(0, at), next, ...rest.slice(at)];
}

type Rect = { left: number; top: number; width: number; rotate?: number; scale?: number };
type RectStore = RefObject<Map<string, Rect>>;

function Rolling({ value, format, reduce }: { value: number; format: (n: number) => string; reduce: boolean }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, format);
  useEffect(() => {
    if (reduce) {
      mv.jump(value);
      return;
    }
    const controls = animate(mv, value, { type: "spring", stiffness: 160, damping: 26 });
    return () => controls.stop();
  }, [value, reduce, mv]);
  return (
    <motion.span aria-hidden className="tabular-nums">
      {text}
    </motion.span>
  );
}

function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center font-semibold tracking-tight",
        monogramTones[hashIndex(name, monogramTones.length)],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

function OwnerAvatar({ owner, index, className }: { owner?: DealOwner; index: number; className?: string }) {
  return (
    <Avatar className={cn("[--avatar-size:--spacing(5)]", className)}>
      <AvatarFallback className={cn("font-semibold text-[9px]", ownerTones[index % ownerTones.length])}>
        {owner ? initials(owner.name) : "?"}
      </AvatarFallback>
    </Avatar>
  );
}

function SignalBars({ engagement }: { engagement: Engagement }) {
  const meta = engagementMeta[engagement];
  return (
    <span aria-hidden className="flex h-2.5 shrink-0 items-end gap-[2px]">
      {[0, 1, 2, 3].map((i) => (
        <span
          className={cn(
            "w-[3px] rounded-[1px] transition-colors duration-300",
            i < meta.level ? meta.bar : "bg-foreground/12",
          )}
          key={i}
          style={{ height: 4 + i * 2 }}
        />
      ))}
    </span>
  );
}

function Burst({ reduce }: { reduce: boolean }) {
  if (reduce) return null;
  return (
    <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2">
      {burstTones.map((tone, i) => {
        const angle = (i / burstTones.length) * Math.PI * 2 - Math.PI / 2;
        const degrees = Math.round((angle * 180) / Math.PI);
        return (
          <motion.span
            animate={{ x: Math.cos(angle) * 15, y: Math.sin(angle) * 15, opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
            className={cn("absolute -top-[2px] -start-[2px] size-1 rounded-full", tone)}
            initial={{ x: 0, y: 0, opacity: 0 }}
            // Each particle flies at its own angle.
            key={`burst-${degrees}`}
            transition={{ duration: 0.6, ease, opacity: { duration: 0.6, times: [0, 0.2, 1] } }}
          />
        );
      })}
    </span>
  );
}

interface FaceProps {
  deal: Deal;
  owner?: DealOwner;
  ownerIndex: number;
  flag?: FocusSignal;
  celebrate?: number;
  touched?: number;
  reduce: boolean;
  className?: string;
}

function DealFace({ deal, owner, ownerIndex, flag, celebrate, touched, reduce, className }: FaceProps) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const engagement = engagementMeta[deal.engagement];
  const won = deal.stage === "won";
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-2.5 shadow-xs/5 transition-[border-color,background-color,box-shadow] duration-200",
        className,
      )}
    >
      {celebrate ? (
        <motion.span
          animate={{ opacity: 0 }}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-category-2/12"
          initial={{ opacity: 1 }}
          key={`c${celebrate}`}
          transition={{ duration: 1.1, ease: "easeOut", delay: 0.2 }}
        />
      ) : null}
      {touched ? (
        <motion.span
          animate={{ opacity: 0 }}
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[inherit] ring-2 ring-category-1/50"
          initial={{ opacity: 1 }}
          key={`t${touched}`}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      ) : null}
      <div className="relative truncate font-medium">{deal.company}</div>
      <div className="relative mt-2 flex items-baseline justify-between gap-2">
        <span className="font-medium tabular-nums">{fmt.money(deal.value)}</span>
        <span
          className={cn(
            "shrink-0 text-xs tabular-nums",
            !won && deal.daysInStage >= 14 ? "text-category-3-foreground" : "text-muted-foreground",
          )}
        >
          {won ? deal.closeLabel : deal.daysInStage === 0 ? t.justMoved : interpolate(t.daysInStage, { days: deal.daysInStage })}
        </span>
      </div>
      <div className="relative mt-1.5 flex h-[18px] items-center gap-1.5 text-xs">
        {won ? (
          <>
            <span className="relative flex size-3.5 shrink-0 items-center justify-center">
              <motion.span
                animate={{ scale: 1, opacity: 1 }}
                className="flex"
                initial={celebrate && !reduce ? { scale: 0.6, opacity: 0 } : false}
                key={`check-${celebrate ?? 0}`}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                <CircleCheckIcon className="size-3.5 text-category-2-foreground" />
              </motion.span>
              {celebrate ? <Burst key={`burst-${celebrate}`} reduce={reduce} /> : null}
            </span>
            <span className="truncate text-category-2-foreground">{t.closedWon}</span>
            <OwnerAvatar className="ms-auto [--avatar-size:18px]" index={ownerIndex} owner={owner} />
          </>
        ) : (
          <>
            <SignalBars engagement={deal.engagement} />
            {flag ? (
              <span className={cn("truncate", signalMeta[flag.kind].text)}>{flag.tag}</span>
            ) : (
              <span className={cn("truncate", deal.engagement === "warm" ? "text-muted-foreground" : engagement.text)}>
                {deal.lastTouch}
              </span>
            )}
            <OwnerAvatar className="ms-auto [--avatar-size:18px]" index={ownerIndex} owner={owner} />
          </>
        )}
      </div>
    </div>
  );
}

function FlipSlot({
  flipKey,
  rects,
  getScale,
  reduce,
  className,
  children,
}: {
  flipKey: string;
  rects: RectStore;
  getScale: () => number;
  reduce: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const prev = rects.current.get(flipKey);
    rects.current.set(flipKey, { left: box.left, top: box.top, width: box.width });
    if (!prev || reduce || box.width === 0 || prev.width === 0) return;
    const s = getScale();
    const dx = (prev.left - box.left) / s;
    const dy = (prev.top - box.top) / s;
    const dropped = prev.rotate !== undefined;
    if (!dropped && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    x.jump(dx + (dropped ? 0 : x.get()));
    y.jump(dy + (dropped ? 0 : y.get()));
    const transition = dropped ? land : glide;
    animate(x, 0, transition);
    animate(y, 0, transition);
    if (dropped) {
      rotate.jump(prev.rotate ?? 0);
      scale.jump(prev.scale ?? 1);
      animate(rotate, 0, land);
      animate(scale, 1, land);
    }
  });

  return (
    <li className={cn("relative", className)} ref={ref}>
      <motion.div style={{ x, y, rotate, scale }}>
        {children}
      </motion.div>
    </li>
  );
}

function SignalItem({
  signal,
  deal,
  stageLabel,
  resolving,
  reduce,
  onAct,
  onOpen,
  onHint,
}: {
  signal: FocusSignal;
  deal?: Deal;
  stageLabel: string;
  resolving?: FocusAction;
  reduce: boolean;
  onAct?: (signal: FocusSignal, action: FocusAction) => void;
  onOpen: (dealId: string) => void;
  onHint: (dealId: string | null) => void;
}) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const meta = signalMeta[signal.kind];
  const Icon = meta.icon;
  const company = deal?.company ?? "";
  const outcome =
    resolving === "email"
      ? interpolate(t.followUpSent, { contact: signal.contact })
      : resolving === "call"
        ? interpolate(t.callLogged, { contact: signal.contact })
        : t.snoozedUntilTomorrow;

  return (
    <motion.li
      className="overflow-hidden"
      exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { height: 0, opacity: 0 }}
      initial={false}
      onBlur={() => onHint(null)}
      onFocus={() => onHint(signal.dealId)}
      onMouseEnter={() => onHint(signal.dealId)}
      onMouseLeave={() => onHint(null)}
      transition={{ height: { duration: 0.32, ease }, opacity: { duration: 0.18 } }}
    >
      <div className="pb-2">
        <div className="relative rounded-xl border bg-card p-3 shadow-xs/5">
          <div aria-hidden={resolving ? true : undefined} className="flex gap-3">
            <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", meta.tile)}>
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-pretty leading-5">
                <button
                  aria-label={interpolate(t.openDeal, { company })}
                  className="relative cursor-pointer rounded-sm font-medium outline-none after:absolute after:-inset-1 after:content-[''] hover:underline hover:underline-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onOpen(signal.dealId)}
                  tabIndex={resolving ? -1 : undefined}
                  type="button"
                >
                  {shortName(company)}
                </button>{" "}
                {signal.headline}
              </p>
              <p className="mt-0.5 text-pretty text-muted-foreground text-xs leading-4">{signal.detail}</p>
              {deal ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-xs tabular-nums">
                  <span className={cn("size-1.5 rounded-full", stageDot[deal.stage])} />
                  {stageLabel} · {fmt.money(deal.value)}
                </p>
              ) : null}
            </div>
          </div>
          {onAct ? (
          <div aria-hidden={resolving ? true : undefined} className="mt-2.5 flex flex-wrap gap-1.5">
            <Button
              aria-label={interpolate(t.emailContact, { contact: signal.contact })}
              disabled={Boolean(resolving)}
              onClick={() => onAct(signal, "email")}
              size="xs"
              variant="outline"
            >
              <MailIcon />
              {t.email}
            </Button>
            <Button
              aria-label={interpolate(t.logCallWith, { contact: signal.contact })}
              disabled={Boolean(resolving)}
              onClick={() => onAct(signal, "call")}
              size="xs"
              variant="outline"
            >
              <PhoneIcon />
              {t.logCall}
            </Button>
            <Button
              aria-label={interpolate(t.snoozeCompany, { company })}
              disabled={Boolean(resolving)}
              onClick={() => onAct(signal, "snooze")}
              size="xs"
              variant="ghost"
            >
              <Clock3Icon />
              {t.snooze}
            </Button>
          </div>
          ) : null}
          <AnimatePresence>
            {resolving ? (
              <motion.div
                animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center gap-3 rounded-[inherit] bg-card px-3"
                initial={{ opacity: 0 }}
                transition={{ duration: 0.16, ease }}
              >
                <motion.span
                  animate={{ scale: 1 }}
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    resolving === "snooze"
                      ? "bg-muted text-muted-foreground"
                      : "bg-category-2/14 text-category-2-foreground",
                  )}
                  initial={{ scale: 0.7 }}
                  transition={{ type: "spring", stiffness: 520, damping: 20 }}
                >
                  {resolving === "snooze" ? <Clock3Icon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
                </motion.span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-pretty font-medium leading-5">{outcome}</span>
                  <span className="text-pretty text-muted-foreground text-xs">
                    {interpolate(resolving === "snooze" ? t.backInFocus : t.touchedJustNow, { company })}
                  </span>
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.li>
  );
}

function DetailPanel({
  deal,
  owner,
  ownerIndex,
  stages,
  onClose,
  onMove,
  panelRef,
  headingId,
}: {
  deal: Deal;
  owner?: DealOwner;
  ownerIndex: number;
  stages: PipelineStage[];
  onClose: () => void;
  onMove: (stage: DealStage) => void;
  panelRef: RefObject<HTMLElement | null>;
  headingId: string;
}) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const at = stages.findIndex((s) => s.id === deal.stage);
  const stage = stages[at];
  const next = stages[at + 1];
  const close = useRef(onClose);
  close.current = onClose;

  // Escape closes the panel from anywhere inside it.
  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close.current();
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [panelRef]);

  return (
    <section aria-labelledby={headingId} className="flex h-full min-h-0 flex-col outline-none" ref={panelRef} tabIndex={-1}>
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Monogram className="size-9 rounded-lg text-xs" name={deal.company} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate font-heading font-semibold text-base" id={headingId}>
            {deal.company}
          </h2>
          <span className="truncate text-muted-foreground text-xs">{deal.domain}</span>
        </div>
        <Button aria-label={t.closeDetails} className="-me-1.5 -mt-1" onClick={onClose} size="icon-sm" variant="ghost">
          <XIcon />
        </Button>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-4">
        <dl className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border p-3 text-xs">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t.value}</dt>
            <dd className="font-medium text-sm tabular-nums">{fmt.money(deal.value)}</dd>
          </div>
          <div className="flex flex-col items-start gap-1">
            <dt className="text-muted-foreground">{t.stage}</dt>
            <dd>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={interpolate(t.changeStage, { stage: stage?.label ?? "" })}
                  className="-mx-1.5 -my-0.5 flex h-6 cursor-pointer items-center gap-1.5 rounded-md px-1.5 font-medium text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-accent"
                >
                  <span aria-hidden className={cn("size-1.5 rounded-full", stageDot[deal.stage])} />
                  {stage?.label}
                  <ChevronDownIcon aria-hidden className="size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-44 transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0"
                >
                  <DropdownMenuRadioGroup onValueChange={(v) => onMove(v as DealStage)} value={deal.stage}>
                    {stages.map((s) => (
                      <DropdownMenuRadioItem key={s.id} value={s.id}>
                        <span className="flex w-full items-center gap-2">
                          <span aria-hidden className={cn("size-1.5 rounded-full", stageDot[s.id])} />
                          <span className="flex-1">{s.label}</span>
                          <span className="font-mono text-muted-foreground text-xs">{fmt.percent(s.probability)}</span>
                        </span>
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t.owner}</dt>
            <dd className="flex min-w-0 items-center gap-1.5">
              <OwnerAvatar index={ownerIndex} owner={owner} />
              <span className="truncate font-medium text-sm">{owner?.name.split(" ")[0]}</span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{deal.stage === "won" ? t.closedOn : t.closeDate}</dt>
            <dd className="font-medium text-sm tabular-nums">{deal.closeLabel}</dd>
          </div>
        </dl>

        <section className="mt-5">
          <h3 className="font-medium text-muted-foreground text-xs">{t.nextStep}</h3>
          <p className="mt-1.5 flex gap-2 text-pretty">
            <ArrowRightIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
            {deal.nextStep}
          </p>
        </section>

        <section className="mt-5">
          <h3 className="font-medium text-muted-foreground text-xs">{t.contacts}</h3>
          <ul className="mt-2 flex flex-col gap-2.5">
            {deal.contacts.map((c, i) => (
              <li className="flex items-center gap-2.5" key={c.name}>
                <Avatar className="[--avatar-size:--spacing(7)]">
                  <AvatarFallback className={cn("font-semibold text-[10px]", ownerTones[(i + 2) % ownerTones.length])}>{initials(c.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("truncate font-medium", c.tag?.tone === "bad" && "text-muted-foreground line-through decoration-foreground/30")}>{c.name}</span>
                  <span className="truncate text-muted-foreground text-xs">{c.role}</span>
                </span>
                {c.tag ? (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-medium text-[11px]",
                      c.tag.tone === "good" && "bg-category-2/12 text-category-2-foreground",
                      c.tag.tone === "bad" && "bg-category-4/12 text-category-4-foreground",
                      c.tag.tone === "neutral" && "bg-muted text-muted-foreground",
                    )}
                  >
                    {c.tag.label}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-5">
          <h3 className="font-medium text-muted-foreground text-xs">{t.lastTouches}</h3>
          <ol className="mt-2 flex flex-col">
            {deal.activity.slice(0, 3).map((a, i, list) => (
              <li className="relative flex gap-3 pb-3 last:pb-0" key={`${a.label}-${a.when}`}>
                {i < list.length - 1 ? <span aria-hidden className="absolute top-3 bottom-0 start-[3px] w-px bg-border" /> : null}
                <span aria-hidden className={cn("mt-1.5 size-[7px] shrink-0 rounded-full", i === 0 ? "bg-foreground/70" : "bg-foreground/20")} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-pretty">{a.label}</span>
                  <span className="text-muted-foreground text-xs">{a.when}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {deal.note ? (
          <section className="mt-5">
            <h3 className="font-medium text-muted-foreground text-xs">{t.notes}</h3>
            <p className="mt-1.5 text-pretty rounded-xl bg-muted/60 p-3 text-sm dark:bg-muted/40">{deal.note}</p>
          </section>
        ) : null}
      </div>
      <div className="flex gap-2 border-t p-3">
        {next ? (
          <Button className="flex-1" onClick={() => onMove(next.id)} variant={next.id === "won" ? "default" : "outline"}>
            {next.id === "won" ? <CheckIcon /> : <ArrowRightIcon className="rtl:rotate-180" />}
            {next.id === "won" ? t.markWon : interpolate(t.moveTo, { stage: next.label })}
          </Button>
        ) : (
          <span className="flex h-8 flex-1 items-center gap-2 font-medium text-category-2-foreground">
            <CircleCheckIcon aria-hidden className="size-4" />
            {t.closedWon}
          </span>
        )}
      </div>
    </section>
  );
}

type DragState = { id: string; width: number; height: number; origin: DealStage; pointerId: number };
type Lifted = { id: string; snapshot: Deal[] };

function PipelineTodayBoard({
  data,
  currentUserId,
  workspace,
  nav = [],
  settingsHref,
  target,
  forecastLabel,
  onDealMove,
  onSignalAction,
  className,
}: PipelineTodayProps & { data: PipelineData }) {
  const fmt = useFmtContext();
  const { t } = fmt;
  const format = useFormat();
  const { now, timeZone } = useWirefront();
  const { stages, owners, signals } = data;
  const reduce = useCalmMotion();
  const uid = useId();
  const [deals, setDeals] = useState(data.deals);
  useEffect(() => setDeals(data.deals), [data.deals]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [over, setOver] = useState<{ stage: DealStage; index: number } | null>(null);
  const [lifted, setLifted] = useState<Lifted | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileStage, setMobileStage] = useState<DealStage>("negotiation");
  const [tab, setTab] = useState<"board" | "focus">("board");
  const [handled, setHandled] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [resolving, setResolving] = useState<Record<string, FocusAction>>({});
  const [celebrate, setCelebrate] = useState<{ id: string; key: number } | null>(null);
  const [touched, setTouched] = useState<{ id: string; key: number } | null>(null);
  const [delta, setDelta] = useState<{ amount: number; key: number } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [hinted, setHinted] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const chipsRef = useRef<HTMLFieldSetElement>(null);
  const beforeMove = useRef<Deal[] | null>(null);
  const rects = useRef(new Map<string, Rect>());
  const pending = useRef<{ id: string; pointerId: number; x: number; y: number; el: HTMLElement } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const overRef = useRef<{ stage: DealStage; index: number } | null>(null);
  const grabOffset = useRef({ x: 0, y: 0 });
  const lastPointerX = useRef(0);
  const pendingFocus = useRef<string | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const counter = useRef(0);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const tiltTarget = useMotionValue(0);
  const tilt = useSpring(tiltTarget, { stiffness: 260, damping: 22 });

  const ids = { instructions: `${uid}-how`, detail: `${uid}-detail`, heading: `${uid}-heading`, rail: `${uid}-rail` };
  const order = stages.map((s) => s.id);
  const stageOf = (id: DealStage) => stages.find((s) => s.id === id) ?? (stages[0] as PipelineStage);
  const prob = (id: DealStage) => stageOf(id).probability;
  const forecast = (list: Deal[]) => list.reduce((sum, d) => sum + d.value * prob(d.stage), 0);
  const ownerIndex = (id: string) => Math.max(0, owners.findIndex((o) => o.id === id));
  const ownerOf = (id: string) => owners.find((o) => o.id === id);
  const me = ownerOf(currentUserId);
  const getScale = () => (rootRef.current ? scaleOf(rootRef.current) : 1);

  const view = drag && over ? moveDeal(deals, drag.id, over.stage, over.index) : deals;
  const columns = Object.fromEntries(order.map((s) => [s, view.filter((d) => d.stage === s)])) as Record<DealStage, Deal[]>;
  const total = forecast(view);
  const won = view.filter((d) => d.stage === "won").reduce((sum, d) => sum + d.value, 0);

  const visibleSignals = signals.filter((s) => !handled.includes(s.id) && !snoozed.includes(s.id));
  const openSignals = visibleSignals.filter((s) => !resolving[s.id]);
  const flagFor = (dealId: string) => openSignals.find((s) => s.dealId === dealId);
  const selected = deals.find((d) => d.id === selectedId) ?? null;

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t);
      fn();
    }, ms);
    timers.current.add(t);
  };

  useEffect(() => {
    const all = timers.current;
    return () => {
      for (const t of all) clearTimeout(t);
      all.clear();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => rects.current.clear());
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const id = pendingFocus.current;
    if (!id) return;
    const el = [...(rootRef.current?.querySelectorAll<HTMLElement>(`[data-card-id="${id}"]`) ?? [])].find(
      (node) => node.offsetParent !== null,
    );
    if (el) {
      el.focus({ preventScroll: false });
      pendingFocus.current = null;
    }
  });

  useEffect(() => {
    if (selectedId) panelRef.current?.focus({ preventScroll: true });
  }, [selectedId]);

  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-drop-stage="${mobileStage}"]`);
    if (!row || !chip || row.scrollWidth <= row.clientWidth) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, left), behavior: reduce ? "auto" : "smooth" });
  }, [mobileStage, reduce]);

  const say = (text: string) => setAnnouncement((prev) => (prev === text ? `${text} ` : text));
  const mover = useAction(onDealMove ?? (async () => {}), {
    // The board already shows the move; undo it if saving fails.
    onError: (message, input) => {
      const snapshot = beforeMove.current;
      if (snapshot) setDeals(snapshot);
      beforeMove.current = null;
      const company = snapshot?.find((d) => d.id === input.dealId)?.company ?? "";
      say(interpolate(t.saidMoveFailed, { company, error: message }));
    },
  });
  const signalAction = useAction(onSignalAction ?? (async () => {}));
  const nextKey = () => {
    counter.current += 1;
    return counter.current;
  };

  const settle = (before: Deal[], after: Deal[], id: string) => {
    const was = before.find((d) => d.id === id);
    const now = after.find((d) => d.id === id);
    if (!was || !now) return;
    const index = after.filter((d) => d.stage === now.stage).findIndex((d) => d.id === id);
    const diff = forecast(after) - forecast(before);
    setMobileStage(now.stage);
    if (was.stage === now.stage) {
      say(interpolate(t.saidStays, { company: now.company, stage: stageOf(now.stage).label, position: index + 1 }));
      return;
    }
    if (Math.round(diff) !== 0) {
      const key = nextKey();
      setDelta({ amount: diff, key });
      later(() => setDelta((d) => (d?.key === key ? null : d)), 2600);
    }
    if (now.stage === "won") {
      const stale = signals.filter((s) => s.dealId === id).map((s) => s.id);
      if (stale.length) setHandled((h) => [...h, ...stale.filter((s) => !h.includes(s))]);
      const key = nextKey();
      setCelebrate({ id, key });
      later(() => setCelebrate((c) => (c?.key === key ? null : c)), 1500);
    }
    say(interpolate(now.stage === "won" ? t.saidWon : t.saidMoved, { company: now.company, stage: stageOf(now.stage).label, forecast: fmt.money(forecast(after)) }));
    if (onDealMove) {
      beforeMove.current = before;
      void mover.run({ dealId: id, stage: now.stage, index }, id);
    }
  };

  const commit = (id: string, stage: DealStage, index: number, base: Deal[] = deals) => {
    const original = base.find((d) => d.id === id);
    if (!original) return;
    const patch: Partial<Deal> =
      original.stage === stage ? {} : stage === "won" ? { closeLabel: t.today, lastTouch: t.justNow } : {};
    const after = moveDeal(base, id, stage, index, patch);
    setDeals(after);
    settle(base, after, id);
  };

  const moveFromPanel = (id: string, stage: DealStage) => {
    const len = deals.filter((d) => d.stage === stage && d.id !== id).length;
    commit(id, stage, len);
  };

  const endDrag = (dropped: boolean) => {
    const d = dragRef.current;
    const root = rootRef.current;
    if (!d || !root) return;
    const s = scaleOf(root);
    const box = root.getBoundingClientRect();
    rects.current.set(d.id, {
      left: box.left + dragX.get() * s,
      top: box.top + dragY.get() * s,
      width: d.width * s,
      rotate: tilt.get(),
      scale: 1.03,
    });
    const target = overRef.current;
    for (const key of [...rects.current.keys()]) if (key.startsWith("ph-")) rects.current.delete(key);
    dragRef.current = null;
    overRef.current = null;
    tiltTarget.jump(0);
    tilt.jump(0);
    setDrag(null);
    setOver(null);
    pendingFocus.current = d.id;
    if (root.hasPointerCapture(d.pointerId)) root.releasePointerCapture(d.pointerId);
    if (dropped && target) {
      commit(d.id, target.stage, target.index);
    } else {
      const deal = deals.find((x) => x.id === d.id);
      if (deal) say(interpolate(t.saidCancelled, { company: deal.company, stage: stageOf(deal.stage).label }));
    }
  };

  const startDrag = (e: PointerEvent<HTMLElement>, p: NonNullable<typeof pending.current>) => {
    const root = rootRef.current;
    const deal = deals.find((d) => d.id === p.id);
    if (!root || !deal) return;
    const s = scaleOf(root);
    const rootBox = root.getBoundingClientRect();
    const box = p.el.getBoundingClientRect();
    grabOffset.current = { x: (p.x - box.left) / s, y: (p.y - box.top) / s };
    dragX.jump((e.clientX - rootBox.left) / s - grabOffset.current.x);
    dragY.jump((e.clientY - rootBox.top) / s - grabOffset.current.y);
    lastPointerX.current = e.clientX;
    const column = deals.filter((d) => d.stage === deal.stage);
    const state: DragState = { id: deal.id, width: box.width / s, height: box.height / s, origin: deal.stage, pointerId: p.pointerId };
    const start = { stage: deal.stage, index: column.findIndex((d) => d.id === deal.id) };
    dragRef.current = state;
    overRef.current = start;
    pending.current = null;
    root.setPointerCapture(p.pointerId);
    root.focus({ preventScroll: true });
    setDrag(state);
    setOver(start);
    say(interpolate(t.saidPickedUp, { company: deal.company }));
  };

  const onRootPointerMove = (e: globalThis.PointerEvent) => {
    const d = dragRef.current;
    const root = rootRef.current;
    if (!d || !root || e.pointerId !== d.pointerId) return;
    const s = scaleOf(root);
    const box = root.getBoundingClientRect();
    dragX.set((e.clientX - box.left) / s - grabOffset.current.x);
    dragY.set((e.clientY - box.top) / s - grabOffset.current.y);
    if (!reduce) tiltTarget.set(Math.max(-5, Math.min(5, (e.clientX - lastPointerX.current) * 0.5)));
    lastPointerX.current = e.clientX;
    const zone = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-drop-stage]");
    if (!zone || !root.contains(zone)) return;
    const stage = zone.dataset.dropStage as DealStage;
    let index = deals.filter((x) => x.stage === stage && x.id !== d.id).length;
    if (zone.dataset.dropKind !== "chip") {
      const cards = [...zone.querySelectorAll<HTMLElement>("[data-card-id]")].filter((el) => el.dataset.cardId !== d.id);
      index = cards.filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top + r.height / 2 < e.clientY;
      }).length;
    }
    const prev = overRef.current;
    if (prev?.stage === stage && prev.index === index) return;
    overRef.current = { stage, index };
    setOver({ stage, index });
  };

  const onRootPointerUp = (e: globalThis.PointerEvent) => {
    const d = dragRef.current;
    const root = rootRef.current;
    if (!d || !root || e.pointerId !== d.pointerId) return;
    const box = root.getBoundingClientRect();
    const inside = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    endDrag(inside);
  };

  const dropLifted = () => {
    if (!lifted) return;
    const origin = lifted.snapshot.find((d) => d.id === lifted.id);
    const current = deals.find((d) => d.id === lifted.id);
    setLifted(null);
    if (!origin || !current) return;
    const index = deals.filter((d) => d.stage === current.stage).findIndex((d) => d.id === current.id);
    const restored = origin.stage === current.stage ? origin : current;
    const base = lifted.snapshot;
    const after = moveDeal(base, current.id, current.stage, index, {
      daysInStage: restored.daysInStage,
      ...(origin.stage !== current.stage && current.stage === "won" ? { closeLabel: t.today, lastTouch: t.justNow } : {}),
    });
    setDeals(after);
    settle(base, after, current.id);
  };

  const cancelLifted = () => {
    if (!lifted) return;
    const deal = lifted.snapshot.find((d) => d.id === lifted.id);
    setDeals(lifted.snapshot);
    setLifted(null);
    pendingFocus.current = lifted.id;
    if (deal) {
      setMobileStage(deal.stage);
      say(interpolate(t.saidCancelled, { company: deal.company, stage: stageOf(deal.stage).label }));
    }
  };

  const liveMove = (deal: Deal, stage: DealStage, index: number) => {
    const after = moveDeal(deals, deal.id, stage, index);
    const column = after.filter((d) => d.stage === stage);
    setDeals(after);
    setMobileStage(stage);
    pendingFocus.current = deal.id;
    say(interpolate(t.saidPosition, { stage: stageOf(stage).label, position: column.findIndex((d) => d.id === deal.id) + 1, count: column.length }));
  };

  const focusCard = (id: string, stage: DealStage) => {
    setMobileStage(stage);
    pendingFocus.current = id;
    const el = [...(rootRef.current?.querySelectorAll<HTMLElement>(`[data-card-id="${id}"]`) ?? [])].find(
      (node) => node.offsetParent !== null,
    );
    if (el) {
      el.focus();
      pendingFocus.current = null;
    }
  };

  const openDeal = (id: string) => {
    setSelectedId((cur) => (cur === id ? null : id));
  };

  const closeDetail = () => {
    if (selectedId) pendingFocus.current = selectedId;
    setSelectedId(null);
  };

  const onCardKeyDown = (e: KeyboardEvent<HTMLButtonElement>, deal: Deal) => {
    if (dragRef.current) return;
    const column = deals.filter((d) => d.stage === deal.stage);
    const idx = column.findIndex((d) => d.id === deal.id);
    const at = order.indexOf(deal.stage);

    if (lifted?.id === deal.id) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const to = order[at + (e.key === "ArrowLeft" ? -1 : 1)];
        if (!to) return;
        liveMove(deal, to, Math.min(idx, deals.filter((d) => d.stage === to).length));
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        const to = idx + (e.key === "ArrowUp" ? -1 : 1);
        if (to < 0 || to >= column.length) return;
        liveMove(deal, deal.stage, to);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        pendingFocus.current = deal.id;
        dropLifted();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelLifted();
      } else if (e.key === "Tab") {
        dropLifted();
      }
      return;
    }

    if (e.key === " ") {
      e.preventDefault();
      setLifted({ id: deal.id, snapshot: deals });
      say(interpolate(t.saidPickedUpKeys, { company: deal.company, stage: stageOf(deal.stage).label }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      openDeal(deal.id);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const to = column[idx + (e.key === "ArrowUp" ? -1 : 1)];
      if (to) focusCard(to.id, to.stage);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const step = e.key === "ArrowLeft" ? -1 : 1;
      for (let i = at + step; i >= 0 && i < order.length; i += step) {
        const list = deals.filter((d) => d.stage === order[i]);
        if (list.length) {
          const to = list[Math.min(idx, list.length - 1)];
          if (to) focusCard(to.id, to.stage);
          break;
        }
      }
    }
  };

  const act = (signal: FocusSignal, action: FocusAction) => {
    if (resolving[signal.id]) return;
    void signalAction.run({ signalId: signal.id, action }, signal.id);
    const deal = deals.find((d) => d.id === signal.dealId);
    setResolving((r) => ({ ...r, [signal.id]: action }));
    railRef.current?.focus({ preventScroll: true });
    if (action !== "snooze") {
      setDeals((all) =>
        all.map((d) =>
          d.id === signal.dealId
            ? {
                ...d,
                engagement: warmer[d.engagement],
                lastTouch: t.justNow,
                activity: [
                  {
                    label: interpolate(action === "email" ? t.youEmailed : t.youCalled, { contact: signal.contact }),
                    when: t.justNow,
                  },
                  ...d.activity,
                ],
              }
            : d,
        ),
      );
      setTouched({ id: signal.dealId, key: nextKey() });
    }
    const left = openSignals.length - 1;
    say(
      interpolate(t.saidSignal, {
        company: deal?.company ?? "",
        outcome: action === "email" ? interpolate(t.followUpSent, { contact: signal.contact }) : action === "call" ? interpolate(t.callLogged, { contact: signal.contact }) : t.snoozedUntilTomorrow,
        left: left === 0 ? t.saidFocusClear : interpolate(t.saidLeft, { count: left }),
      }),
    );
    later(
      () => {
        setResolving((r) => {
          const { [signal.id]: _, ...rest } = r;
          return rest;
        });
        if (action === "snooze") setSnoozed((l) => [...l, signal.id]);
        else setHandled((l) => [...l, signal.id]);
      },
      reduce ? 800 : 1150,
    );
  };

  const firstName = me?.name.split(" ")[0] ?? "";
  const progress = total / (target || 1);
  const today = now();
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(today));
  const greeting = interpolate(hour < 12 ? t.morning : hour < 18 ? t.afternoon : t.evening, { name: firstName });
  const dateLabel = format.date(today, { weekday: "long", day: "numeric", month: "long" });

  // Drag tracking, Escape and lifted-card drops listen on the root element.
  const rootHandlers = useRef({ onRootPointerMove, onRootPointerUp, endDrag, dropLifted, lifted });
  rootHandlers.current = { onRootPointerMove, onRootPointerUp, endDrag, dropLifted, lifted };
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const h = () => rootHandlers.current;
    const cancel = () => {
      if (dragRef.current) h().endDrag(false);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && dragRef.current) {
        e.preventDefault();
        h().endDrag(false);
      }
    };
    const onDown = (e: globalThis.PointerEvent) => {
      const { lifted: up, dropLifted: drop } = h();
      if (up && !(e.target instanceof Element && e.target.closest(`[data-card-id="${up.id}"]`))) drop();
    };
    const onMove = (e: globalThis.PointerEvent) => h().onRootPointerMove(e);
    const onUp = (e: globalThis.PointerEvent) => h().onRootPointerUp(e);
    const onScroll = () => {
      if (!dragRef.current) rects.current.clear();
    };
    root.addEventListener("keydown", onKey);
    root.addEventListener("lostpointercapture", cancel);
    root.addEventListener("pointercancel", cancel);
    root.addEventListener("pointerdown", onDown);
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerup", onUp);
    root.addEventListener("scroll", onScroll, true);
    return () => {
      root.removeEventListener("keydown", onKey);
      root.removeEventListener("lostpointercapture", cancel);
      root.removeEventListener("pointercancel", cancel);
      root.removeEventListener("pointerdown", onDown);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerup", onUp);
      root.removeEventListener("scroll", onScroll, true);
    };
  }, []);

  const lane = (stage: PipelineStage) => {
    const list = columns[stage.id];
    const weighted = list.reduce((sum, d) => sum + d.value * stage.probability, 0);
    const isOver = drag !== null && over?.stage === stage.id;
    const isWon = stage.id === "won";
    return (
      <section
        aria-label={interpolate(list.length === 1 ? t.laneLabelOne : t.laneLabelMany, {
          stage: stage.label,
          count: list.length,
          amount: fmt.shortMoney(weighted),
          kind: isWon ? t.closed : t.weighted,
        })}
        className={cn(
          "flex min-h-0 min-w-0 flex-col rounded-2xl bg-muted/50 p-1 transition-colors duration-150 dark:bg-muted/30",
          isOver && (isWon ? "bg-category-2/10" : "bg-accent dark:bg-accent/70"),
          stage.id !== mobileStage && "hidden @5xl:flex",
        )}
        data-drop-stage={stage.id}
        key={stage.id}
      >
        <header aria-hidden className="flex items-start justify-between gap-2 px-2 pt-1.5 pb-2.5">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={cn("size-1.5 shrink-0 rounded-full", stageDot[stage.id])} />
              <span className="truncate">{stage.label}</span>
              <span className="text-muted-foreground text-xs tabular-nums">{list.length}</span>
            </span>
            <span className="text-muted-foreground text-xs">
              <span className={cn("font-medium", isWon ? "text-category-2-foreground" : "text-foreground/80")}>
                <Rolling format={fmt.shortMoney} reduce={reduce} value={weighted} />
              </span>{" "}
              {isWon ? t.closed : t.weighted}
            </span>
          </div>
          {isWon ? (
            <CheckIcon className="mt-0.5 size-3.5 shrink-0 text-category-2-foreground" />
          ) : (
            <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
              {fmt.percent(stage.probability)}
            </span>
          )}
        </header>
        <ul className="-m-1 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-1 [scrollbar-width:thin]">
          {list.map((deal) => {
            if (drag?.id === deal.id) {
              return (
                <FlipSlot flipKey={`ph-${stage.id}`} getScale={getScale} key={`ph-${stage.id}`} reduce={reduce} rects={rects}>
                  <div
                    aria-hidden
                    className="rounded-xl border border-foreground/15 border-dashed bg-background/60 dark:bg-background/30"
                    data-placeholder
                    style={{ height: drag.height }}
                  />
                </FlipSlot>
              );
            }
            const isLifted = lifted?.id === deal.id;
            const isSelected = selectedId === deal.id;
            const flag = flagFor(deal.id);
            const owner = ownerOf(deal.ownerId);
            return (
              <FlipSlot flipKey={deal.id} getScale={getScale} key={deal.id} reduce={reduce} rects={rects}>
                <button
                  aria-controls={isSelected ? ids.detail : undefined}
                  aria-describedby={ids.instructions}
                  aria-expanded={isSelected}
                  aria-roledescription={t.draggableDeal}
                  className={cn(
                    "group/card block w-full cursor-grab touch-pan-y select-none rounded-xl text-start outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:cursor-grabbing",
                  )}
                  data-card-id={deal.id}
                  onClick={() => openDeal(deal.id)}
                  onKeyDown={(e) => onCardKeyDown(e, deal)}
                  onPointerCancel={() => {
                    pending.current = null;
                  }}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || e.pointerType === "touch") return;
                    pending.current = { id: deal.id, pointerId: e.pointerId, x: e.clientX, y: e.clientY, el: e.currentTarget };
                  }}
                  onPointerMove={(e) => {
                    const p = pending.current;
                    if (!p || dragRef.current || p.pointerId !== e.pointerId) return;
                    if (Math.hypot(e.clientX - p.x, e.clientY - p.y) < 5) return;
                    startDrag(e, p);
                  }}
                  onPointerUp={() => {
                    pending.current = null;
                  }}
                  type="button"
                >
                  <motion.div
                    animate={{ scale: isLifted && !reduce ? 1.03 : 1, rotate: isLifted && !reduce ? -1.2 : 0 }}
                    transition={{ type: "spring", stiffness: 520, damping: 32 }}
                  >
                    <DealFace
                      celebrate={celebrate?.id === deal.id ? celebrate.key : undefined}
                      className={cn(
                        "[@media(hover:hover)]:group-hover/card:border-foreground/20",
                        hinted === deal.id && "border-foreground/25 bg-accent/40",
                        isSelected && "border-foreground/35 ring-1 ring-foreground/10",
                        isLifted && "border-foreground/30 shadow-lg/10",
                      )}
                      deal={deal}
                      flag={flag}
                      owner={owner}
                      ownerIndex={ownerIndex(deal.ownerId)}
                      reduce={reduce}
                      touched={touched?.id === deal.id ? touched.key : undefined}
                    />
                  </motion.div>
                </button>
              </FlipSlot>
            );
          })}
          {list.length === 0 ? (
            <li
              aria-hidden
              className="flex h-20 items-center justify-center rounded-xl border border-foreground/10 border-dashed text-muted-foreground text-xs"
            >
              {t.dropHere}
            </li>
          ) : null}
        </ul>
      </section>
    );
  };

  const draggedDeal = drag ? deals.find((d) => d.id === drag.id) : undefined;

  const focusRail = (
    <section aria-labelledby={ids.rail} className="flex h-full min-h-0 flex-col outline-none" ref={railRef} tabIndex={-1}>
      <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex flex-col">
          <h2 className="flex items-center gap-2 font-heading font-semibold text-base" id={ids.rail}>
            {t.focus}
            <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium font-sans text-muted-foreground text-xs tabular-nums">
              {openSignals.length}
            </span>
          </h2>
          <p className="text-muted-foreground text-xs">{t.focusSubtitle}</p>
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 pb-2 [scrollbar-width:thin]">
        {visibleSignals.length ? (
          <ul>
            <AnimatePresence initial={false}>
              {visibleSignals.map((s) => {
                const deal = deals.find((d) => d.id === s.dealId);
                return (
                  <SignalItem
                    deal={deal}
                    key={s.id}
                    onAct={onSignalAction ? act : undefined}
                    onHint={setHinted}
                    onOpen={(id) => {
                      setHinted(null);
                      openDeal(id);
                    }}
                    reduce={reduce}
                    resolving={resolving[s.id]}
                    signal={s}
                    stageLabel={deal ? stageOf(deal.stage).label : ""}
                  />
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <motion.div
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-5 py-10 text-center"
            initial={{ opacity: 0 }}
            transition={{ duration: 0.25, ease }}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CoffeeIcon className="size-4.5" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-balance font-medium">{t.clearTitle}</span>
              <span className="text-pretty text-muted-foreground text-xs">
                {interpolate(snoozed.length ? t.clearHandledSnoozed : t.clearHandled, { handled: handled.length, snoozed: snoozed.length })}
              </span>
            </div>
            {snoozed.length ? (
              <Button onClick={() => setSnoozed([])} size="xs" variant="outline">
                <Clock3Icon />
                {t.bringBack}
              </Button>
            ) : null}
          </motion.div>
        )}
      </div>
    </section>
  );

  return (
    <MotionConfig reducedMotion={reduce ? "always" : "never"}>
      <div
        className={cn("@container relative isolate flex h-[760px] w-full overflow-hidden bg-background text-foreground text-sm outline-none", className)}
        ref={rootRef}
        tabIndex={-1}
      >
        <p className="sr-only" id={ids.instructions}>
          {t.instructions}
        </p>
        <p aria-live="polite" className="sr-only" role="status">
          {announcement}
        </p>

        <TooltipProvider delay={400}>
          <nav aria-label={t.main} className="hidden w-14 shrink-0 flex-col items-center gap-1 border-e py-3 @3xl:flex">
            <span
              aria-label={workspace}
              className="mb-3 flex size-9 items-center justify-center rounded-xl bg-primary font-heading font-semibold text-primary-foreground"
              role="img"
            >
              {workspace[0]}
            </span>
            {nav.map((n) => (
              <Tooltip key={n.href}>
                <TooltipTrigger
                  render={
                    <WirefrontLink
                      aria-current={n.current ? "page" : undefined}
                      aria-label={n.label}
                      className={cn(
                        "relative flex size-9 cursor-pointer items-center justify-center rounded-lg outline-none transition-[color,background-color,scale] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] [&_svg]:size-4.5",
                        n.current ? "bg-accent text-foreground" : "text-muted-foreground [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground",
                      )}
                      href={n.href}
                    />
                  }
                >
                  {n.icon}
                  {n.badge ? <span aria-hidden className="absolute top-2 end-2 size-1.5 rounded-full bg-category-4 ring-2 ring-background" /> : null}
                </TooltipTrigger>
                <TooltipContent side="right">{n.label}</TooltipContent>
              </Tooltip>
            ))}
            <div className="mt-auto flex flex-col items-center gap-3">
              {settingsHref ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <WirefrontLink
                        aria-label={t.settings}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-foreground"
                        href={settingsHref}
                      />
                    }
                  >
                    <SettingsIcon aria-hidden className="size-4.5" />
                  </TooltipTrigger>
                  <TooltipContent side="right">{t.settings}</TooltipContent>
                </Tooltip>
              ) : null}
              <Avatar aria-label={me?.name} className="[--avatar-size:--spacing(7)]" role="img">
                <AvatarFallback className={cn("font-semibold text-[10px]", ownerTones[ownerIndex(currentUserId) % ownerTones.length])}>{me ? initials(me.name) : "?"}</AvatarFallback>
              </Avatar>
            </div>
          </nav>
        </TooltipProvider>

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between border-b px-3 @3xl:hidden">
            <span className="flex h-9 items-center gap-2 px-1.5 font-medium">
              <span aria-hidden className="flex size-7 items-center justify-center rounded-lg bg-primary font-heading font-semibold text-primary-foreground text-xs">
                {workspace[0]}
              </span>
              {workspace}
            </span>
            <Avatar aria-label={me?.name} className="[--avatar-size:--spacing(7)]" role="img">
              <AvatarFallback className={cn("font-semibold text-[10px]", ownerTones[ownerIndex(currentUserId) % ownerTones.length])}>{me ? initials(me.name) : "?"}</AvatarFallback>
            </Avatar>
          </div>

          <header className="flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3 @3xl:flex-row @3xl:items-end @3xl:justify-between @3xl:px-6 @3xl:pt-5 @3xl:pb-4 @5xl:px-5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground text-xs">{dateLabel}</span>
              <h1 className="text-balance font-heading font-semibold text-xl tracking-tight">{greeting}</h1>
              <p className="text-pretty text-muted-foreground">
                {openSignals.length === 0 ? t.nothingNeedsYou : openSignals.length === 1 ? t.oneNeedsYou : interpolate(t.manyNeedYou, { count: openSignals.length })}{" "}
                <span className="hidden @5xl:inline">{t.dragHint}</span>
              </p>
            </div>
            <div className="flex flex-col gap-0.5 @3xl:items-end">
              <span className="text-muted-foreground text-xs">{forecastLabel ?? t.forecast}</span>
              <div className="flex items-center gap-2 @3xl:flex-row-reverse">
                <span className="font-heading font-semibold text-2xl tracking-tight">
                  <Rolling format={fmt.money} reduce={reduce} value={total} />
                  <span className="sr-only">{fmt.money(total)}</span>
                </span>
                <AnimatePresence>
                  {delta ? (
                    <motion.span
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-full px-2 py-0.5 font-medium text-xs tabular-nums",
                        delta.amount > 0
                          ? "bg-category-2/12 text-category-2-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      initial={{ opacity: 0, y: 4 }}
                      key={delta.key}
                      transition={{ duration: 0.2, ease }}
                    >
                      {fmt.signedMoney(delta.amount)}
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>
              <meter aria-label={interpolate(t.ofTarget, { percent: fmt.percent(progress) })} className="sr-only" max={1} min={0} value={Math.min(1, progress)} />
              <div aria-hidden className="relative mt-1.5 mb-1 h-1 w-full overflow-hidden rounded-full bg-muted @3xl:w-56">
                <motion.div
                  animate={{ scaleX: Math.min(1, progress) }}
                  className="absolute inset-0 origin-left rounded-full bg-primary"
                  initial={false}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 }}
                />
                <div className="absolute inset-y-0 start-0 bg-category-2" style={{ width: `${Math.min(100, (won / (target || 1)) * 100)}%` }} />
              </div>
              <span className="text-muted-foreground text-xs tabular-nums">
                {interpolate(t.targetLine, { percent: fmt.percent(progress), target: fmt.shortMoney(target) })} ·{" "}
                <span className="text-category-2-foreground">{interpolate(t.wonAmount, { amount: fmt.shortMoney(won) })}</span>
              </span>
            </div>
          </header>

          <div className="shrink-0 px-4 pb-3 @5xl:hidden">
            <SegmentedControl aria-label={t.show} className="w-full">
              {(["board", "focus"] as const).map((view) => (
                <SegmentedControlItem
                  aria-pressed={tab === view}
                  className="flex-1"
                  data-pressed={tab === view ? "" : undefined}
                  key={view}
                  onClick={() => setTab(view)}
                >
                  {view === "board" ? t.pipeline : t.focus}
                  {view === "focus" && openSignals.length ? (
                    <span className="text-muted-foreground text-xs tabular-nums">{openSignals.length}</span>
                  ) : null}
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>

          <div className="flex min-h-0 flex-1 @5xl:relative @5xl:border-t">
            <div
              className={cn(
                "relative flex min-w-0 flex-1 flex-col @5xl:flex",
                tab !== "board" && "hidden",
              )}
            >
              <div className="shrink-0 px-4 pb-3 @5xl:hidden">
                <fieldset
                  className="relative m-0 flex min-w-0 gap-1 overflow-x-auto rounded-xl border-0 bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  ref={chipsRef}
                >
                  <legend className="sr-only">{t.stage}</legend>
                  {stages.map((s) => {
                    const active = s.id === mobileStage;
                    const isOver = drag !== null && over?.stage === s.id;
                    return (
                      <button
                        aria-pressed={active}
                        className={cn(
                          "relative flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                          active ? "text-foreground" : "text-muted-foreground",
                          isOver && "bg-accent",
                        )}
                        data-drop-kind="chip"
                        data-drop-stage={s.id}
                        key={s.id}
                        onClick={() => setMobileStage(s.id)}
                        type="button"
                      >
                        {active ? (
                          <motion.span
                            className="absolute inset-0 -z-10 rounded-lg bg-background shadow-sm/5 dark:bg-input"
                            layoutId={`${uid}-stage`}
                            transition={glide}
                          />
                        ) : null}
                        <span className={cn("size-1.5 rounded-full", stageDot[s.id])} />
                        {s.label}
                        <span className="text-muted-foreground text-xs tabular-nums">{columns[s.id].length}</span>
                      </button>
                    );
                  })}
                </fieldset>
              </div>
              <div className="min-h-0 flex-1 overflow-x-auto px-4 pb-4 @3xl:px-6 @5xl:px-5 @5xl:pt-4">
                <div className="grid h-full grid-cols-1 gap-2 @5xl:min-w-[860px] @5xl:grid-cols-5">
                  {stages.map((s) => lane(s))}
                </div>
              </div>
              <AnimatePresence>
                {lifted ? (
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3"
                    exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }}
                    initial={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.18, ease }}
                  >
                    <div className="flex items-center gap-3 rounded-full border bg-popover px-3 py-1.5 text-muted-foreground text-xs shadow-lg/5">
                      <span className="flex items-center gap-1">
                        <Kbd>←</Kbd>
                        <Kbd>→</Kbd> {t.keyStage}
                      </span>
                      <span className="flex items-center gap-1">
                        <Kbd>↑</Kbd>
                        <Kbd>↓</Kbd> {t.keyOrder}
                      </span>
                      <span className="flex items-center gap-1">
                        <Kbd>{t.keySpace}</Kbd> {t.keyDrop}
                      </span>
                      <span className="hidden items-center gap-1 @md:flex">
                        <Kbd>{t.keyEsc}</Kbd> {t.keyCancel}
                      </span>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <aside
              className={cn(
                "min-h-0 flex-col bg-background @5xl:flex @5xl:w-[288px] @5xl:shrink-0 @5xl:border-s @[90rem]:w-[312px]",
                selected
                  ? "absolute inset-0 z-30 flex @5xl:static"
                  : tab === "focus"
                    ? "flex w-full"
                    : "hidden",
              )}
              id={ids.detail}
            >
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="flex min-h-0 flex-1 flex-col"
                initial={{ opacity: 0, x: 10 }}
                key={selected ? "detail" : "focus"}
                transition={{ duration: 0.2, ease }}
              >
                {selected ? (
                  <DetailPanel
                    deal={selected}
                    headingId={ids.heading}
                    onClose={closeDetail}
                    onMove={(stage) => moveFromPanel(selected.id, stage)}
                    owner={ownerOf(selected.ownerId)}
                    ownerIndex={ownerIndex(selected.ownerId)}
                    panelRef={panelRef}
                    stages={stages}
                  />
                ) : (
                  focusRail
                )}
              </motion.div>
            </aside>
          </div>
        </div>

        {drag && draggedDeal ? (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-0 start-0 z-50"
            style={{ x: dragX, y: dragY, rotate: tilt, width: drag.width }}
          >
            <motion.div
              animate={{ scale: 1.03 }}
              initial={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <DealFace
                className="cursor-grabbing border-foreground/20 shadow-xl/10 dark:shadow-xl/40"
                deal={draggedDeal}
                flag={flagFor(draggedDeal.id)}
                owner={ownerOf(draggedDeal.ownerId)}
                ownerIndex={ownerIndex(draggedDeal.ownerId)}
                reduce={reduce}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </MotionConfig>
  );
}

function PipelineTodayScreen(props: PipelineTodayProps) {
  const fmt = useFmt();
  const { t } = fmt;
  const { data, status = "ready", error, onRetry, className } = props;
  return (
    <FmtContext.Provider value={fmt}>
      {status === "ready" && data ? (
        <PipelineTodayBoard {...props} data={data} />
      ) : (
        <div className={cn("@container flex h-[760px] w-full flex-col overflow-hidden bg-background text-foreground text-sm", className)}>
          {status === "error" ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="font-medium">{t.errorTitle}</p>
              {error ? <p className="mt-1 max-w-xs text-pretty text-muted-foreground text-xs">{error}</p> : null}
              {onRetry ? (
                <Button className="mt-4" onClick={onRetry} size="sm" variant="outline">
                  {t.retry}
                </Button>
              ) : null}
            </div>
          ) : (
            <div aria-busy="true" className="flex h-full flex-col gap-4 p-5">
              <Skeleton className="h-16 w-full max-w-md motion-reduce:animate-none" />
              <Skeleton className="w-full flex-1 rounded-2xl motion-reduce:animate-none" />
            </div>
          )}
        </div>
      )}
    </FmtContext.Provider>
  );
}

export function PipelineToday(props: PipelineTodayProps) {
  return (
    <ScreenBoundary name="PipelineToday">
      <PipelineTodayScreen {...props} />
    </ScreenBoundary>
  );
}
