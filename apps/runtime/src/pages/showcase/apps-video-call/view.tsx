// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
// Ported from devl.dev (sean-brydon/devl.dev, registry item `video-call`).
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
  DropdownMenuTrigger,
} from "@wirefront/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@wirefront/ui/input-group";
import { Kbd } from "@wirefront/ui/kbd";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@wirefront/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@wirefront/ui/tooltip";
import { useAction } from "@wirefront/ui/wirefront/action";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import {
  interpolate,
  useFormat,
  useMessages,
  useWirefront,
} from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import {
  CheckIcon,
  ChevronUpIcon,
  CopyIcon,
  EllipsisIcon,
  HandIcon,
  LayoutGridIcon,
  MessageSquareIcon,
  MicIcon,
  MicOffIcon,
  MonitorUpIcon,
  PhoneOffIcon,
  PresentationIcon,
  SendHorizontalIcon,
  SmilePlusIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  UsersIcon,
  VideoIcon,
  VideoOffIcon,
  XIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { CallHue, CallMessage, CallPerson, CallReaction } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("videoCall.<key>"). */
export const VIDEO_CALL_MESSAGES = {
  inCall: "{count} in call",
  youLeft: "You left",
  layout: "Layout",
  grid: "Grid",
  spotlight: "Spotlight",
  gridLayout: "Grid layout",
  spotlightLayout: "Spotlight layout",
  participants: "Participants",
  leftTitle: "You left the call",
  rejoin: "Rejoin",
  thanksRating: "Thanks, that helps us tune call quality.",
  howWasIt: "How was the audio and video?",
  good: "Good",
  poor: "Poor",
  chat: "Chat",
  people: "People",
  panels: "Panels",
  closePanel: "Close panel",
  hostedBy: "Hosted by {name}",
  hostedByYou: "Hosted by you",
  controls: "Call controls",
  mute: "Mute",
  unmute: "Unmute",
  cameraOn: "Turn camera on",
  cameraOff: "Turn camera off",
  present: "Present screen",
  stopPresenting: "Stop presenting",
  react: "Send a reaction",
  reactions: "Reactions",
  reactWith: "React {emoji}",
  raiseHand: "Raise hand",
  lowerHand: "Lower hand",
  more: "More options",
  leave: "Leave",
  leaveCall: "Leave call",
  microphone: "Microphone",
  camera: "Camera",
  deviceSettings: "{kind} settings",
  noMessages: "No messages yet",
  chatHint:
    "Only people in the call can see chat. It disappears when the call ends.",
  you: "You",
  youTag: "you",
  host: "Host",
  messageEveryone: "Message everyone",
  send: "Send message",
  inCallCount: "In call · {count}",
  muteAll: "Mute all",
  handRaised: "Hand raised",
  muted: "Muted",
  micOn: "Mic on",
  cameraIsOff: "Camera off",
  optionsFor: "Options for {name}",
  muteOne: "Mute",
  spotlightOne: "Spotlight",
  remove: "Remove from call",
  copyInvite: "Copy invite link",
  linkCopied: "Link copied",
  copyFailed: "Couldn’t copy the link",
  yourScreen: "Your shared screen",
  screenOf: "{name}’s screen",
  tileLabel: "{name}",
  tileMuted: "{name}, muted",
  tileSpeaking: "{name}, speaking",
  joined: "{name} joined",
  left: "{name} left",
  youRaised: "You raised your hand",
  presenting: "You’re presenting to everyone",
  everyoneMuted: "Everyone else is muted",
  removed: "{name} was removed",
  shareTitle: "Onboarding v3 · flow review",
  shareSteps: "Welcome|Workspace|Invite|Done",
};
type Messages = typeof VIDEO_CALL_MESSAGES;

/** Reactions offered in the picker unless you pass your own. */
export const CALL_REACTIONS = ["👏", "🎉", "❤️", "😂", "👍", "🤔"];

export interface VideoCallProps {
  title: string;
  meetingCode: string;
  /** ISO timestamp the call started; the timer counts from it. */
  startedAt: string;
  you: CallPerson;
  /** Everyone else in the call. Joins and leaves show a toast. */
  participants: CallPerson[];
  /** Who is talking now. */
  speakerId?: string | null;
  messages: CallMessage[];
  /** Reactions to float over the stage; each id plays once. */
  reactions?: CallReaction[];
  reactionChoices?: string[];
  devices?: { microphones: string[]; cameras: string[] };
  /** Each control shows only when its handler is given. */
  onToggleMic?: (muted: boolean) => void;
  onToggleCamera?: (off: boolean) => void;
  onToggleHand?: (raised: boolean) => void;
  onToggleShare?: (sharing: boolean) => void;
  onReact?: (emoji: string) => void;
  /** Sends a chat message; it shows at once and is removed if this fails. */
  onSendMessage?: Action<{ text: string }>;
  onMuteParticipant?: (id: string) => void;
  onMuteAll?: () => void;
  onRemoveParticipant?: (id: string) => void;
  onSelectDevice?: (kind: "microphone" | "camera", device: string) => void;
  onLeave?: () => void;
  onRejoin?: () => void;
  onRateCall?: (good: boolean) => void;
  /** Copied by the invite buttons. */
  inviteUrl?: string;
  className?: string;
}

const spring = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 1,
} as const;
const easeOut = [0.23, 1, 0.32, 1] as const;
const press =
  "transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97]";
const menuPop =
  "transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0 data-ending-style:duration-100";

const hues: Record<
  CallHue,
  { wash: string; glowA: string; glowB: string; avatar: string; solid: string }
> = {
  rose: {
    wash: "bg-category-4/8",
    glowA: "bg-category-4/19",
    glowB: "bg-category-7/14",
    avatar: "bg-category-4/15 text-category-4-foreground",
    solid: "bg-category-4-strong text-white",
  },
  amber: {
    wash: "bg-category-3/8",
    glowA: "bg-category-3/19",
    glowB: "bg-category-7/14",
    avatar: "bg-category-3/15 text-category-3-foreground",
    solid: "bg-category-3-strong text-white",
  },
  emerald: {
    wash: "bg-category-2/8",
    glowA: "bg-category-2/19",
    glowB: "bg-category-6/14",
    avatar: "bg-category-2/15 text-category-2-foreground",
    solid: "bg-category-2-strong text-white",
  },
  sky: {
    wash: "bg-category-1/8",
    glowA: "bg-category-1/19",
    glowB: "bg-category-8/14",
    avatar: "bg-category-1/15 text-category-1-foreground",
    solid: "bg-category-1-strong text-white",
  },
  violet: {
    wash: "bg-category-5/8",
    glowA: "bg-category-5/19",
    glowB: "bg-category-5/14",
    avatar: "bg-category-5/15 text-category-5-foreground",
    solid: "bg-category-5-strong text-white",
  },
  orange: {
    wash: "bg-category-7/8",
    glowA: "bg-category-7/19",
    glowB: "bg-category-4/14",
    avatar: "bg-category-7/15 text-category-7-foreground",
    solid: "bg-category-7-strong text-white",
  },
  teal: {
    wash: "bg-category-6/8",
    glowA: "bg-category-6/19",
    glowB: "bg-category-1/14",
    avatar: "bg-category-6/15 text-category-6-foreground",
    solid: "bg-category-6-strong text-white",
  },
  indigo: {
    wash: "bg-category-8/8",
    glowA: "bg-category-8/19",
    glowB: "bg-category-5/14",
    avatar: "bg-category-8/15 text-category-8-foreground",
    solid: "bg-category-8-strong text-white",
  },
};

function useReducedMotionSafe() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
const firstName = (name: string) => name.split(" ")[0] ?? name;

function clock(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h ? `${h}:` : ""}${String(m).padStart(h ? 2 : 1, "0")}:${String(s).padStart(2, "0")}`;
}

function gridShape(n: number) {
  const wide = n <= 1 ? 1 : n <= 4 ? 2 : n <= 9 ? 3 : 4;
  const narrow = n <= 2 ? 1 : 2;
  return {
    c: wide,
    r: Math.ceil(n / wide),
    cs: narrow,
    rs: Math.ceil(n / narrow),
  };
}

function PersonAvatar({
  person,
  size = 7,
  className,
}: {
  person: CallPerson;
  size?: 6 | 7 | 8;
  className?: string;
}) {
  const sizes = {
    6: "[--avatar-size:--spacing(6)]",
    7: "[--avatar-size:--spacing(7)]",
    8: "[--avatar-size:--spacing(8)]",
  };
  return (
    <Avatar aria-hidden className={cn(sizes[size], className)}>
      <AvatarFallback className={cn("font-semibold", hues[person.hue].avatar)}>
        {initials(person.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function SpeakingBars({ reduce }: { reduce: boolean }) {
  return (
    <span aria-hidden className="flex h-3 items-center gap-0.5">
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          animate={
            reduce ? { scaleY: 0.7 } : { scaleY: [0.35, 1, 0.5, 0.85, 0.35] }
          }
          className="h-3 w-0.75 origin-center rounded-full bg-category-2"
          key={delay}
          transition={
            reduce
              ? { duration: 0 }
              : {
                  duration: 0.9,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay,
                }
          }
        />
      ))}
    </span>
  );
}

function Ambient({ hue }: { hue: CallHue }) {
  return (
    <div aria-hidden className={cn("absolute inset-0", hues[hue].wash)}>
      <div
        className={cn(
          "absolute -inset-s-1/4 -top-1/3 h-full w-3/4 rounded-full blur-3xl",
          hues[hue].glowA
        )}
      />
      <div
        className={cn(
          "absolute -inset-e-1/4 -bottom-1/2 h-full w-3/4 rounded-full blur-3xl",
          hues[hue].glowB
        )}
      />
    </div>
  );
}

function TileAvatar({
  person,
  live,
  speaking,
  compact,
}: {
  person: CallPerson;
  live: boolean;
  speaking: boolean;
  compact?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <div aria-hidden className="relative flex items-center justify-center">
      {speaking && !reduce
        ? [0, 0.8].map((delay) => (
            <motion.span
              animate={{ opacity: [0.45, 0], scale: [1, 1.45] }}
              className={cn(
                "absolute inset-0 rounded-full",
                live ? hues[person.hue].solid : "bg-category-2/40"
              )}
              key={delay}
              transition={{
                duration: 1.6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeOut",
                delay,
              }}
            />
          ))
        : null}
      <span
        className={cn(
          "relative flex size-12 items-center justify-center rounded-full font-semibold text-base tracking-tight",
          !compact &&
            "@[15rem]/tile:size-18 @[26rem]/tile:size-22 @[15rem]/tile:text-2xl @[26rem]/tile:text-3xl",
          live ? hues[person.hue].solid : hues[person.hue].avatar
        )}
      >
        {initials(person.name)}
      </span>
    </div>
  );
}

function ScreenShare({ t }: { t: Messages }) {
  const steps = t.shareSteps.split("|");
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex items-center justify-center bg-muted p-[6%]"
    >
      <div className="flex aspect-video max-h-full w-full max-w-full flex-col gap-[5%] overflow-hidden rounded-lg border bg-card p-[4%] shadow-xs/5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-category-7" />
          <span className="truncate font-medium text-[clamp(9px,1.6cqw,14px)]">
            {t.shareTitle}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-[4%]">
          {steps.map((step, i) => (
            <div
              className="flex flex-1 flex-col gap-[8%] self-stretch rounded-md border bg-background p-[4%]"
              key={step}
            >
              <span className="truncate text-[clamp(7px,1.1cqw,11px)] text-muted-foreground">
                {i + 1}. {step}
              </span>
              <span className="h-[10%] w-3/4 rounded-sm bg-muted" />
              <span className="h-[10%] w-1/2 rounded-sm bg-muted" />
              <span
                className={cn(
                  "mt-auto h-[14%] rounded-sm",
                  i === 2 ? "bg-category-7/70" : "bg-primary/15"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type Tile =
  | { kind: "person"; person: CallPerson; isYou: boolean }
  | { kind: "screen" };
const tileKey = (tile: Tile) =>
  tile.kind === "screen" ? "screen" : tile.person.id;

/** Reads the theme's radius so layout animations keep the same corners. */
function useThemeRadius(scale: number) {
  const probe = useRef<HTMLSpanElement>(null);
  const [radius, setRadius] = useState(scale * 10);
  useLayoutEffect(() => {
    const el = probe.current;
    if (!el) return;
    const read = () => setRadius(el.offsetWidth);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const marker = (
    <span
      aria-hidden
      className="pointer-events-none invisible absolute h-0"
      ref={probe}
      style={{ width: `calc(var(--radius) * ${scale})` }}
    />
  );
  return [radius, marker] as const;
}

function CallTile({
  tile,
  speaking,
  compact,
  style,
  className,
  you,
  ns,
  t,
}: {
  tile: Tile;
  speaking: boolean;
  compact?: boolean;
  style?: CSSProperties;
  className?: string;
  you: CallPerson;
  ns?: string;
  t: Messages;
}) {
  const reduce = useReducedMotionSafe();
  const [radius, radiusProbe] = useThemeRadius(1.6);
  const p = tile.kind === "person" ? tile.person : null;
  const label =
    tile.kind === "screen"
      ? interpolate(t.screenOf, { name: firstName(you.name) })
      : tile.isYou
        ? t.you
        : p?.name;
  const aria =
    tile.kind === "screen"
      ? t.yourScreen
      : interpolate(
          p?.muted ? t.tileMuted : speaking ? t.tileSpeaking : t.tileLabel,
          { name: p?.name ?? "" }
        );
  return (
    <motion.figure
      animate={{ opacity: 1, scale: 1 }}
      aria-label={aria}
      className={cn("relative m-0 shrink-0", className)}
      exit={{
        opacity: 0,
        scale: 0.96,
        transition: { duration: 0.16, ease: easeOut },
      }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      layout={!reduce && Boolean(ns)}
      layoutId={ns ? `${ns}-${tileKey(tile)}` : undefined}
      style={{ borderRadius: radius, ...style }}
      transition={reduce ? { duration: 0.15 } : spring}
    >
      {radiusProbe}
      <div className="@container/tile absolute inset-0 overflow-hidden rounded-[inherit] bg-muted">
        {tile.kind === "screen" ? (
          <ScreenShare t={t} />
        ) : p ? (
          <>
            {p.cameraOff ? null : <Ambient hue={p.hue} />}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              layout={!reduce}
            >
              <TileAvatar
                compact={compact}
                live={!p.cameraOff}
                person={p}
                speaking={speaking}
              />
            </motion.div>
          </>
        ) : null}
        {p?.hand ? (
          <motion.span
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-s-2 top-2 flex h-6 items-center gap-1 rounded-full bg-category-3/60 px-2 font-medium text-category-3-foreground text-xs"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            layout={!reduce}
            transition={{ duration: 0.2, ease: easeOut }}
          >
            <HandIcon aria-hidden className="size-3.5" />
            {compact ? (
              <span className="sr-only">{t.handRaised}</span>
            ) : (
              <span className="hidden @[10rem]/tile:inline">
                {t.handRaised}
              </span>
            )}
          </motion.span>
        ) : null}
        {p && (p.muted || p.cameraOff) ? (
          <motion.span
            aria-hidden
            className="absolute inset-e-2 top-2 flex items-center gap-1"
            layout={!reduce}
          >
            {p.cameraOff && !compact ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-background/85 text-muted-foreground shadow-xs/5 backdrop-blur-sm">
                <VideoOffIcon className="size-3.5" />
              </span>
            ) : null}
            {p.muted ? (
              <span className="flex size-6 items-center justify-center rounded-full bg-background/85 text-destructive-foreground shadow-xs/5 backdrop-blur-sm">
                <MicOffIcon className="size-3.5" />
              </span>
            ) : null}
          </motion.span>
        ) : null}
        <motion.span
          aria-hidden
          className="absolute inset-s-2 bottom-2 flex h-6 max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-md bg-background/85 px-2 font-medium text-foreground text-xs shadow-xs/5 backdrop-blur-sm"
          layout={!reduce}
        >
          {tile.kind === "screen" ? (
            <MonitorUpIcon className="size-3.5 shrink-0 text-muted-foreground" />
          ) : null}
          {speaking ? <SpeakingBars reduce={reduce} /> : null}
          <span className={cn("truncate", compact && "max-w-16")}>{label}</span>
        </motion.span>
      </div>
      <motion.span
        animate={{ opacity: speaking ? 1 : 0 }}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] ring-2 ring-category-2 ring-inset"
        initial={false}
        transition={{ duration: reduce ? 0 : 0.2, ease: easeOut }}
      />
    </motion.figure>
  );
}

function ControlButton({
  label,
  shortcut,
  onClick,
  tone = "default",
  children,
  badge,
  className,
  pressed,
}: {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  tone?: "default" | "off" | "on";
  children: ReactNode;
  badge?: number;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            aria-label={label}
            aria-pressed={pressed}
            className={cn(
              "relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4.5",
              press,
              tone === "off" &&
                "bg-destructive text-white hover:bg-destructive/90",
              tone === "on" &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
              tone === "default" &&
                "bg-secondary text-secondary-foreground hover:bg-accent",
              className
            )}
            onClick={onClick}
            type="button"
          />
        }
      >
        {children}
        <AnimatePresence>
          {badge ? (
            <motion.span
              animate={{ opacity: 1, scale: 1 }}
              aria-hidden
              className="absolute -inset-e-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-primary px-1 font-medium text-[10px] text-primary-foreground tabular-nums ring-2 ring-background"
              exit={{ opacity: 0, scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, ease: easeOut }}
            >
              {badge}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </TooltipTrigger>
      <TooltipContent
        className="flex items-center gap-2"
        side="top"
        sideOffset={8}
      >
        <span className="flex items-center gap-2">
          {label}
          {shortcut ? (
            <Kbd className="h-4 min-w-4 text-[10px]">{shortcut}</Kbd>
          ) : null}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}

function DeviceSplit({
  kind,
  label,
  devices,
  onSelect,
  children,
  t,
}: {
  kind: "microphone" | "camera";
  label: string;
  devices?: string[];
  onSelect?: (kind: "microphone" | "camera", device: string) => void;
  children: ReactNode;
  t: Messages;
}) {
  const [device, setDevice] = useState(devices?.[0] ?? "");
  return (
    <div className="flex shrink-0 items-center rounded-full bg-secondary">
      {children}
      {devices?.length ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={interpolate(t.deviceSettings, { kind: label })}
            className="-ms-0.5 hidden h-10 w-7 cursor-pointer items-center justify-center rounded-e-full pe-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-popup-open:text-foreground @md:flex [&_svg]:size-4"
          >
            <ChevronUpIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className={cn("w-60", menuPop)}
            side="top"
            sideOffset={10}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>{label}</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                onValueChange={(v) => {
                  setDevice(v as string);
                  onSelect?.(kind, v as string);
                }}
                value={device}
              >
                {devices.map((d) => (
                  <DropdownMenuRadioItem key={d} value={d}>
                    {d}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}

function PanelTabs({
  panel,
  onTab,
  onClose,
  messages,
  people,
  t,
}: {
  panel: "chat" | "people";
  onTab: (p: "chat" | "people") => void;
  onClose: () => void;
  messages: number;
  people: number;
  t: Messages;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <div className="flex h-13 shrink-0 items-center gap-2 border-b ps-2 pe-2">
      <fieldset className="m-0 flex min-w-0 items-center gap-0.5 border-0 p-0">
        <legend className="sr-only">{t.panels}</legend>
        {(
          [
            { value: "chat", label: t.chat, count: messages },
            { value: "people", label: t.people, count: people },
          ] as const
        ).map((tab) => (
          <button
            aria-pressed={panel === tab.value}
            className="relative flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
            key={tab.value}
            onClick={() => onTab(tab.value)}
            type="button"
          >
            {panel === tab.value ? (
              <motion.span
                className="absolute inset-0 rounded-lg bg-accent"
                layoutId="vc-panel-tab"
                transition={reduce ? { duration: 0 } : spring}
              />
            ) : null}
            <span
              className={cn(
                "relative transition-colors",
                panel === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {tab.label}
            </span>
            <span className="relative text-muted-foreground text-xs tabular-nums">
              {tab.count}
            </span>
          </button>
        ))}
      </fieldset>
      <Button
        aria-label={t.closePanel}
        className="ms-auto"
        onClick={onClose}
        size="icon-sm"
        variant="ghost"
      >
        <XIcon />
      </Button>
    </div>
  );
}

type Toast = {
  id: number;
  text: string;
  person?: CallPerson;
  icon?: ReactNode;
};
type FloatingReaction = CallReaction & { x: number };

function VideoCallScreen({
  title,
  meetingCode,
  startedAt,
  you: youProp,
  participants,
  speakerId = null,
  messages: initialMessages,
  reactions: incoming = [],
  reactionChoices = CALL_REACTIONS,
  devices,
  onToggleMic,
  onToggleCamera,
  onToggleHand,
  onToggleShare,
  onReact,
  onSendMessage,
  onMuteParticipant,
  onMuteAll,
  onRemoveParticipant,
  onSelectDevice,
  onLeave,
  onRejoin,
  onRateCall,
  inviteUrl,
  className,
}: VideoCallProps) {
  const t = useMessages("videoCall", VIDEO_CALL_MESSAGES);
  const fmt = useFormat();
  const { now } = useWirefront();
  const reduce = useReducedMotionSafe();
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const nextId = () => ++counter.current;

  const [me, setMe] = useState(youProp);
  useEffect(() => setMe(youProp), [youProp]);
  const [layout, setLayout] = useState<"grid" | "spotlight">("grid");
  const [panel, setPanel] = useState<null | "chat" | "people">(null);
  const [messages, setMessages] = useState(initialMessages);
  useEffect(() => setMessages(initialMessages), [initialMessages]);
  const [unread, setUnread] = useState(0);
  const [draft, setDraft] = useState("");
  const [floating, setFloating] = useState<FloatingReaction[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [sharing, setSharing] = useState(false);
  const [left, setLeft] = useState(false);
  const [rated, setRated] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const [wide, setWide] = useState(true);
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Tick once a second for the timer.
  useEffect(() => {
    if (left) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [left]);
  const elapsed = Math.max(
    0,
    Math.floor((now().getTime() - Date.parse(startedAt)) / 1000)
  );

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setWide((entry?.contentRect.width ?? 0) >= 896)
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const showToast = (toastInfo: Omit<Toast, "id">) =>
    setToast({ ...toastInfo, id: nextId() });
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);
  useEffect(() => {
    if (copy === "idle") return;
    const id = setTimeout(() => setCopy("idle"), 1800);
    return () => clearTimeout(id);
  }, [copy]);

  // Announce joins and leaves by comparing with the last participant list.
  const [seen, setSeen] = useState(participants);
  if (seen !== participants) {
    const before = new Set(seen.map((p) => p.id));
    const after = new Set(participants.map((p) => p.id));
    const joined = participants.find((p) => !before.has(p.id));
    const leftPerson = seen.find((p) => !after.has(p.id));
    setSeen(participants);
    if (joined)
      showToast({
        text: interpolate(t.joined, { name: firstName(joined.name) }),
        person: joined,
      });
    else if (leftPerson)
      showToast({
        text: interpolate(t.left, { name: firstName(leftPerson.name) }),
        person: leftPerson,
      });
  }
  // Count new chat messages while chat is closed.
  const [seenMessages, setSeenMessages] = useState(initialMessages.length);
  if (seenMessages !== messages.length) {
    if (panel !== "chat" && messages.length > seenMessages)
      setUnread((u) => u + messages.length - seenMessages);
    setSeenMessages(messages.length);
  }
  // Float each incoming reaction once.
  const [seenReactions, setSeenReactions] = useState<string[]>([]);
  const fresh = incoming.filter((r) => !seenReactions.includes(r.id));
  if (fresh.length) {
    setSeenReactions((s) => [...s, ...fresh.map((r) => r.id)].slice(-50));
    setFloating((all) => [
      ...all.slice(-7),
      ...fresh.map((r, i) => ({
        ...r,
        x: 8 + ((counter.current + i * 7) % 30),
      })),
    ]);
  }

  useEffect(() => {
    if (panel !== "chat") return;
    setUnread(0);
    const box = chatEndRef.current?.parentElement;
    box?.scrollTo?.({ top: box.scrollHeight });
  });

  const send = useAction(onSendMessage ?? (async () => {}), {
    optimistic: ({ text }) => {
      const id = `${uid}-m${nextId()}`;
      setMessages((m) => [
        ...m,
        { id, authorId: me.id, text, sentAt: now().toISOString() },
      ]);
      return () => setMessages((m) => m.filter((x) => x.id !== id));
    },
  });

  const toggleMic = () => {
    if (!onToggleMic) return;
    setMe((p) => ({ ...p, muted: !p.muted }));
    onToggleMic(!me.muted);
  };
  const toggleCam = () => {
    if (!onToggleCamera) return;
    setMe((p) => ({ ...p, cameraOff: !p.cameraOff }));
    onToggleCamera(!me.cameraOff);
  };
  const toggleHand = () => {
    if (!onToggleHand) return;
    setMe((p) => ({ ...p, hand: !p.hand }));
    onToggleHand(!me.hand);
    if (!me.hand)
      showToast({ text: t.youRaised, icon: <HandIcon className="size-3.5" /> });
  };
  const toggleShare = () => {
    if (!onToggleShare) return;
    const next = !sharing;
    setSharing(next);
    onToggleShare(next);
    setLayout(next ? "spotlight" : "grid");
    if (next)
      showToast({
        text: t.presenting,
        icon: <MonitorUpIcon className="size-3.5" />,
      });
  };
  const react = (emoji: string) => {
    onReact?.(emoji);
    setFloating((all) => [
      ...all.slice(-7),
      {
        id: `${uid}-r${nextId()}`,
        emoji,
        name: t.you,
        x: 8 + ((counter.current * 7) % 30),
      },
    ]);
  };
  const muteAll = () => {
    onMuteAll?.();
    showToast({
      text: t.everyoneMuted,
      icon: <MicOffIcon className="size-3.5" />,
    });
  };
  const removePerson = (p: CallPerson) => {
    onRemoveParticipant?.(p.id);
    showToast({
      text: interpolate(t.removed, { name: firstName(p.name) }),
      person: p,
    });
  };
  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    send.run({ text });
    setDraft("");
  };
  const leave = () => {
    setLeft(true);
    setPanel(null);
    setSharing(false);
    setFloating([]);
    setToast(null);
    onLeave?.();
  };
  const rejoin = () => {
    setLeft(false);
    setRated(false);
    setLayout("grid");
    onRejoin?.();
  };
  const copyInvite = () => {
    if (!inviteUrl || !navigator.clipboard) {
      setCopy("failed");
      return;
    }
    navigator.clipboard.writeText(inviteUrl).then(
      () => setCopy("copied"),
      () => setCopy("failed")
    );
  };

  // M toggles the mic and V the camera, outside text fields.
  const keysRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keysRef.current = (e) => {
    const target = e.target as HTMLElement;
    if (
      left ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      target.closest("input, textarea")
    )
      return;
    if (e.key === "m") toggleMic();
    if (e.key === "v") toggleCam();
  };
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => keysRef.current(e);
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, []);

  const people = [...participants, me];
  const byId = (id: string) => people.find((p) => p.id === id);
  const ordered = [...people].sort(
    (a, b) => Number(Boolean(b.hand)) - Number(Boolean(a.hand))
  );
  const tiles: Tile[] = [
    ...(sharing ? [{ kind: "screen" } as Tile] : []),
    ...ordered.map(
      (p) => ({ kind: "person", person: p, isYou: p.id === me.id }) as Tile
    ),
  ];
  const shape = gridShape(tiles.length);
  const activeSpeaker =
    speakerId && people.some((p) => p.id === speakerId) ? speakerId : null;
  const spotKey = sharing
    ? "screen"
    : (spotlightId ?? activeSpeaker ?? ordered[0]?.id);
  const spotTile = tiles.find((tile) => tileKey(tile) === spotKey) ?? tiles[0];
  const stripTiles = tiles.filter((tile) => tile !== spotTile);
  const host = people.find((p) => p.host);
  const isSpeaking = (tile: Tile) =>
    tile.kind === "person" &&
    tile.person.id === activeSpeaker &&
    !tile.person.muted;
  const hasMenuItems = Boolean(onToggleShare || onToggleHand);

  const panelBody =
    panel === "chat" ? (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"
              >
                <MessageSquareIcon className="size-4.5" />
              </span>
              <span className="font-medium">{t.noMessages}</span>
              <span className="text-pretty text-muted-foreground text-xs">
                {t.chatHint}
              </span>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const author = byId(m.authorId);
                  const grouped = messages[i - 1]?.authorId === m.authorId;
                  return (
                    <motion.li
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex gap-2.5", grouped && "-mt-3")}
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                      key={m.id}
                      transition={{ duration: 0.2, ease: easeOut }}
                    >
                      {grouped ? (
                        <span className="w-7 shrink-0" />
                      ) : author ? (
                        <PersonAvatar person={author} />
                      ) : null}
                      <div className="flex min-w-0 flex-col gap-0.5">
                        {grouped ? null : (
                          <span className="flex items-baseline gap-2">
                            <span className="font-medium text-xs">
                              {m.authorId === me.id ? t.you : author?.name}
                            </span>
                            <time
                              className="text-muted-foreground text-xs tabular-nums"
                              dateTime={m.sentAt}
                            >
                              {fmt.time(m.sentAt)}
                            </time>
                          </span>
                        )}
                        <p className="text-pretty wrap-break-word">{m.text}</p>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
          <div ref={chatEndRef} />
        </div>
        {onSendMessage ? (
          <form
            className="border-t p-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {send.error ? (
              <p className="mb-2 text-destructive text-xs" role="alert">
                {send.error}
              </p>
            ) : null}
            <InputGroup>
              <InputGroupInput
                aria-label={t.messageEveryone}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t.messageEveryone}
                value={draft}
              />
              <InputGroupAddon align="inline-end">
                <Button
                  aria-label={t.send}
                  disabled={!draft.trim()}
                  size="icon-xs"
                  type="submit"
                  variant="ghost"
                >
                  <SendHorizontalIcon className="rtl:-scale-x-100" />
                </Button>
              </InputGroupAddon>
            </InputGroup>
          </form>
        ) : null}
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="font-medium text-muted-foreground text-xs">
            {interpolate(t.inCallCount, { count: people.length })}
          </span>
          {onMuteAll ? (
            <Button
              className={press}
              onClick={muteAll}
              size="xs"
              variant="outline"
            >
              <MicOffIcon /> {t.muteAll}
            </Button>
          ) : null}
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 py-1">
          <AnimatePresence initial={false}>
            {ordered.map((p) => {
              const isYou = p.id === me.id;
              return (
                <motion.li
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 rounded-lg px-2 py-2"
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  initial={{ opacity: 0 }}
                  key={p.id}
                  layout={reduce ? false : "position"}
                  transition={spring}
                >
                  <PersonAvatar person={p} size={8} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="flex items-center gap-1.5 truncate font-medium">
                      <span className="truncate">{p.name}</span>
                      {isYou ? (
                        <span className="font-normal text-muted-foreground text-xs">
                          {t.youTag}
                        </span>
                      ) : null}
                      {p.host ? (
                        <span className="rounded-full bg-muted px-1.5 py-px font-medium text-[10px] text-muted-foreground">
                          {t.host}
                        </span>
                      ) : null}
                    </span>
                    {p.title ? (
                      <span className="truncate text-muted-foreground text-xs">
                        {p.title}
                      </span>
                    ) : null}
                  </div>
                  <span className="flex items-center gap-1.5 text-muted-foreground [&_svg]:size-4">
                    {p.hand ? (
                      <>
                        <HandIcon
                          aria-hidden
                          className="text-category-3-foreground"
                        />
                        <span className="sr-only">{t.handRaised}</span>
                      </>
                    ) : null}
                    {p.cameraOff ? (
                      <>
                        <VideoOffIcon aria-hidden />
                        <span className="sr-only">{t.cameraIsOff}</span>
                      </>
                    ) : null}
                    {p.muted ? (
                      <>
                        <MicOffIcon
                          aria-hidden
                          className="text-destructive-foreground"
                        />
                        <span className="sr-only">{t.muted}</span>
                      </>
                    ) : activeSpeaker === p.id ? (
                      <span className="flex size-4 items-center justify-center">
                        <SpeakingBars reduce={reduce} />
                      </span>
                    ) : (
                      <>
                        <MicIcon aria-hidden />
                        <span className="sr-only">{t.micOn}</span>
                      </>
                    )}
                  </span>
                  {isYou ? null : (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={interpolate(t.optionsFor, { name: p.name })}
                        render={
                          <Button
                            className="-me-1"
                            size="icon-sm"
                            variant="ghost"
                          />
                        }
                      >
                        <EllipsisIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className={cn("w-44", menuPop)}
                      >
                        {onMuteParticipant ? (
                          <DropdownMenuItem
                            disabled={p.muted}
                            onClick={() => onMuteParticipant(p.id)}
                          >
                            <MicOffIcon /> {t.muteOne}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => {
                            setSpotlightId(p.id);
                            setLayout("spotlight");
                          }}
                        >
                          <PresentationIcon /> {t.spotlightOne}
                        </DropdownMenuItem>
                        {onRemoveParticipant ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => removePerson(p)}
                              variant="destructive"
                            >
                              <XIcon /> {t.remove}
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        {inviteUrl ? (
          <div className="border-t p-3">
            <Button
              className={cn("w-full", press)}
              onClick={copyInvite}
              variant="outline"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                  exit={{ opacity: 0, scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.95 }}
                  key={copy}
                  transition={{ duration: 0.15, ease: easeOut }}
                >
                  {copy === "copied" ? (
                    <CheckIcon className="size-4" />
                  ) : (
                    <CopyIcon className="size-4" />
                  )}
                  {copy === "copied"
                    ? t.linkCopied
                    : copy === "failed"
                      ? t.copyFailed
                      : t.copyInvite}
                </motion.span>
              </AnimatePresence>
            </Button>
          </div>
        ) : null}
      </div>
    );

  const panelTabs = panel ? (
    <PanelTabs
      messages={messages.length}
      onClose={() => setPanel(null)}
      onTab={setPanel}
      panel={panel}
      people={people.length}
      t={t}
    />
  ) : null;

  return (
    <TooltipProvider delay={500}>
      <div
        className={cn(
          "@container relative isolate flex h-svh w-full flex-col overflow-hidden bg-background text-foreground text-sm",
          className
        )}
        ref={rootRef}
      >
        <header className="flex h-14 shrink-0 items-center gap-3 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex min-w-0 flex-col">
              <h1 className="truncate font-heading font-semibold">{title}</h1>
              <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <span className="tabular-nums">{fmt.time(now())}</span>
                <span aria-hidden>·</span>
                <span className="truncate tabular-nums">
                  {left
                    ? t.youLeft
                    : interpolate(t.inCall, { count: people.length })}
                </span>
              </span>
            </div>
            {left ? null : (
              <span className="flex h-6 shrink-0 items-center gap-1.5 rounded-md bg-destructive/10 px-2 font-medium text-destructive-foreground text-xs tabular-nums">
                <span aria-hidden className="relative flex size-1.5">
                  {reduce ? null : (
                    <span className="absolute inset-0 animate-ping rounded-full bg-destructive/60 motion-reduce:animate-none" />
                  )}
                  <span className="relative size-1.5 rounded-full bg-destructive" />
                </span>
                {clock(elapsed)}
              </span>
            )}
          </div>
          {left ? null : (
            <fieldset className="relative m-0 hidden h-8 min-w-0 items-center rounded-lg border-0 bg-muted p-0.5 @md:flex">
              <legend className="sr-only">{t.layout}</legend>
              {(
                [
                  {
                    value: "grid",
                    label: t.grid,
                    aria: t.gridLayout,
                    icon: <LayoutGridIcon />,
                  },
                  {
                    value: "spotlight",
                    label: t.spotlight,
                    aria: t.spotlightLayout,
                    icon: <PresentationIcon />,
                  },
                ] as const
              ).map((o) => (
                <button
                  aria-label={o.aria}
                  aria-pressed={layout === o.value}
                  className="relative flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 font-medium text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
                  key={o.value}
                  onClick={() => setLayout(o.value)}
                  type="button"
                >
                  {layout === o.value ? (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-background shadow-xs/5 dark:bg-input"
                      layoutId="vc-layout-pill"
                      transition={reduce ? { duration: 0 } : spring}
                    />
                  ) : null}
                  <span
                    aria-hidden
                    className={cn(
                      "relative flex items-center gap-1.5 transition-colors",
                      layout === o.value
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {o.icon}
                    <span className="hidden @3xl:inline">{o.label}</span>
                  </span>
                </button>
              ))}
            </fieldset>
          )}
        </header>

        <div className="flex min-h-0 flex-1 gap-3 px-3 pb-0 @md:px-4">
          <LayoutGroup id="vc-stage">
            <section
              aria-label={t.participants}
              className="@container/stage relative min-w-0 flex-1"
            >
              {left ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col items-center justify-center gap-6 rounded-2xl border bg-card px-6 text-center"
                  initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                >
                  <span
                    aria-hidden
                    className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
                  >
                    <PhoneOffIcon className="size-5" />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-balance font-heading font-semibold text-lg">
                      {t.leftTitle}
                    </h2>
                    <p className="text-muted-foreground">
                      {title} ·{" "}
                      <span className="tabular-nums">{clock(elapsed)}</span>
                    </p>
                  </div>
                  {onRejoin ? (
                    <Button className={press} onClick={rejoin}>
                      {t.rejoin}
                    </Button>
                  ) : null}
                  {onRateCall ? (
                    <div className="flex min-h-9 flex-col items-center gap-2">
                      <AnimatePresence initial={false} mode="popLayout">
                        {rated ? (
                          <motion.span
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex h-9 items-center gap-1.5 text-muted-foreground text-xs"
                            initial={{ opacity: 0, scale: 0.97 }}
                            key="thanks"
                            role="status"
                            transition={{ duration: 0.2, ease: easeOut }}
                          >
                            <CheckIcon
                              aria-hidden
                              className="size-3.5 text-success-foreground"
                            />{" "}
                            {t.thanksRating}
                          </motion.span>
                        ) : (
                          <motion.div
                            className="flex items-center gap-2 text-muted-foreground text-xs"
                            exit={{
                              opacity: 0,
                              scale: 0.97,
                              transition: { duration: 0.12 },
                            }}
                            key="ask"
                          >
                            {t.howWasIt}
                            {[true, false].map((good) => (
                              <Button
                                aria-label={good ? t.good : t.poor}
                                className={press}
                                key={String(good)}
                                onClick={() => {
                                  setRated(true);
                                  onRateCall(good);
                                }}
                                size="icon-sm"
                                variant="outline"
                              >
                                {good ? <ThumbsUpIcon /> : <ThumbsDownIcon />}
                              </Button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="size-full"
                    exit={{
                      opacity: 0,
                      transition: { duration: 0.12, ease: easeOut },
                    }}
                    initial={
                      reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }
                    }
                    key={layout}
                    transition={{ duration: 0.2, ease: easeOut }}
                  >
                    {layout === "grid" ? (
                      <div
                        className="flex h-full flex-wrap content-center justify-center gap-2 [--cc:var(--cs)] [--rr:var(--rs)] @xl/stage:[--cc:var(--c)] @xl/stage:[--rr:var(--r)]"
                        style={
                          {
                            "--c": shape.c,
                            "--r": shape.r,
                            "--cs": shape.cs,
                            "--rs": shape.rs,
                          } as CSSProperties
                        }
                      >
                        <AnimatePresence initial={false} mode="popLayout">
                          {tiles.map((tile) => (
                            <CallTile
                              key={tileKey(tile)}
                              ns="grid"
                              speaking={isSpeaking(tile)}
                              style={{
                                width:
                                  "calc((100% - (var(--cc) - 1) * var(--spacing) * 2) / var(--cc))",
                                height:
                                  "calc((100% - (var(--rr) - 1) * var(--spacing) * 2) / var(--rr))",
                              }}
                              t={t}
                              tile={tile}
                              you={me}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col gap-2">
                        <div className="relative min-h-0 flex-1">
                          <AnimatePresence initial={false} mode="popLayout">
                            {spotTile ? (
                              <CallTile
                                className="size-full"
                                key={tileKey(spotTile)}
                                speaking={isSpeaking(spotTile)}
                                t={t}
                                tile={spotTile}
                                you={me}
                              />
                            ) : null}
                          </AnimatePresence>
                        </div>
                        <div className="-mx-1 -mb-1 flex h-26 shrink-0 justify-center-safe gap-2 overflow-x-auto p-1 scrollbar-none @xl/stage:h-30">
                          <AnimatePresence initial={false} mode="popLayout">
                            {stripTiles.map((tile) => (
                              <CallTile
                                className="aspect-4/3 h-full"
                                compact
                                key={tileKey(tile)}
                                ns="strip"
                                speaking={isSpeaking(tile)}
                                t={t}
                                tile={tile}
                                you={me}
                              />
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl"
              >
                <AnimatePresence>
                  {floating.map((r) => (
                    <motion.div
                      animate={
                        reduce
                          ? { opacity: [0, 1, 1, 0] }
                          : {
                              opacity: [0, 1, 1, 0],
                              y: -260,
                              x: [0, 10, -6, 4],
                              scale: [0.9, 1.05, 1, 1],
                            }
                      }
                      className="absolute bottom-3 flex flex-col items-center gap-1"
                      initial={{ opacity: 0, y: 0, scale: 0.9 }}
                      key={r.id}
                      onAnimationComplete={() =>
                        setFloating((all) => all.filter((x) => x.id !== r.id))
                      }
                      style={{ insetInlineStart: `${r.x}%` }}
                      transition={{
                        duration: reduce ? 1.6 : 2.4,
                        ease: easeOut,
                        times: [0, 0.12, 0.7, 1],
                      }}
                    >
                      <span className="text-3xl leading-none drop-shadow-sm">
                        {r.emoji}
                      </span>
                      <span className="rounded-md bg-background/85 px-1.5 py-px font-medium text-[10px] text-foreground shadow-xs/5 backdrop-blur-sm">
                        {r.name}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div
                aria-live="polite"
                className="pointer-events-none absolute inset-x-0 top-3 z-30 flex justify-center px-3"
              >
                <AnimatePresence mode="popLayout">
                  {toast ? (
                    <motion.div
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex h-8 max-w-full items-center gap-2 rounded-full border bg-popover ps-1 pe-3 text-popover-foreground text-xs shadow-lg/5"
                      exit={{
                        opacity: 0,
                        y: -4,
                        scale: 0.97,
                        transition: { duration: 0.15, ease: easeOut },
                      }}
                      initial={
                        reduce
                          ? { opacity: 0 }
                          : { opacity: 0, y: -8, scale: 0.97 }
                      }
                      key={toast.id}
                      transition={{ duration: 0.22, ease: easeOut }}
                    >
                      {toast.person ? (
                        <PersonAvatar person={toast.person} size={6} />
                      ) : (
                        <span
                          aria-hidden
                          className="flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground"
                        >
                          {toast.icon}
                        </span>
                      )}
                      <span className="truncate font-medium">{toast.text}</span>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </section>
          </LayoutGroup>

          <AnimatePresence initial={false}>
            {wide && panel && !left ? (
              <motion.aside
                animate={{ opacity: 1, x: 0 }}
                aria-label={panel === "chat" ? t.chat : t.people}
                className="flex w-80 shrink-0 flex-col overflow-hidden rounded-2xl border bg-card"
                exit={{
                  opacity: 0,
                  x: 16,
                  transition: { duration: 0.15, ease: easeOut },
                }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                key="dock"
                transition={{ duration: 0.22, ease: easeOut }}
              >
                {panelTabs}
                {panelBody}
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </div>

        <footer className="flex h-18 shrink-0 items-center gap-3 px-4">
          <div className="hidden min-w-0 flex-1 items-center gap-2 text-muted-foreground text-xs @4xl:flex">
            {inviteUrl ? (
              <button
                className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 font-mono outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={copyInvite}
                title={t.copyInvite}
                type="button"
              >
                {copy === "copied" ? (
                  <CheckIcon
                    aria-hidden
                    className="size-3.5 text-success-foreground"
                  />
                ) : (
                  <CopyIcon aria-hidden className="size-3.5" />
                )}
                {meetingCode}
              </button>
            ) : (
              <span className="px-2 font-mono">{meetingCode}</span>
            )}
            <span className="truncate">
              {host && host.id !== me.id
                ? interpolate(t.hostedBy, { name: firstName(host.name) })
                : t.hostedByYou}
            </span>
          </div>
          {left ? (
            <div className="flex-1" />
          ) : (
            <div
              aria-label={t.controls}
              className="mx-auto flex items-center gap-2 @4xl:mx-0"
              role="toolbar"
            >
              {onToggleMic ? (
                <DeviceSplit
                  devices={devices?.microphones}
                  kind="microphone"
                  label={t.microphone}
                  onSelect={onSelectDevice}
                  t={t}
                >
                  <ControlButton
                    className={me.muted ? undefined : "bg-transparent"}
                    label={me.muted ? t.unmute : t.mute}
                    onClick={toggleMic}
                    pressed={Boolean(me.muted)}
                    shortcut="M"
                    tone={me.muted ? "off" : "default"}
                  >
                    {me.muted ? <MicOffIcon /> : <MicIcon />}
                  </ControlButton>
                </DeviceSplit>
              ) : null}
              {onToggleCamera ? (
                <DeviceSplit
                  devices={devices?.cameras}
                  kind="camera"
                  label={t.camera}
                  onSelect={onSelectDevice}
                  t={t}
                >
                  <ControlButton
                    className={me.cameraOff ? undefined : "bg-transparent"}
                    label={me.cameraOff ? t.cameraOn : t.cameraOff}
                    onClick={toggleCam}
                    pressed={Boolean(me.cameraOff)}
                    shortcut="V"
                    tone={me.cameraOff ? "off" : "default"}
                  >
                    {me.cameraOff ? <VideoOffIcon /> : <VideoIcon />}
                  </ControlButton>
                </DeviceSplit>
              ) : null}
              {onToggleShare ? (
                <ControlButton
                  className="hidden @md:flex"
                  label={sharing ? t.stopPresenting : t.present}
                  onClick={toggleShare}
                  pressed={sharing}
                  tone={sharing ? "on" : "default"}
                >
                  <MonitorUpIcon />
                </ControlButton>
              ) : null}
              {onReact ? (
                <Popover onOpenChange={setReactOpen} open={reactOpen}>
                  <PopoverTrigger
                    aria-label={t.react}
                    className={cn(
                      "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-popup-open:bg-accent [&_svg]:size-4.5",
                      press
                    )}
                  >
                    <SmilePlusIcon />
                  </PopoverTrigger>
                  <PopoverContent
                    className={cn(
                      "w-auto rounded-full p-1 before:rounded-full",
                      menuPop
                    )}
                    side="top"
                    sideOffset={10}
                  >
                    <fieldset className="m-0 flex min-w-0 items-center gap-0.5 border-0 p-0 py-0.5">
                      <legend className="sr-only">{t.reactions}</legend>
                      {reactionChoices.map((emoji) => (
                        <button
                          aria-label={interpolate(t.reactWith, { emoji })}
                          className="flex size-9 cursor-pointer items-center justify-center rounded-full text-xl outline-none transition-[background-color,scale] duration-150 ease-out hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.92]"
                          key={emoji}
                          onClick={() => react(emoji)}
                          type="button"
                        >
                          {emoji}
                        </button>
                      ))}
                    </fieldset>
                  </PopoverContent>
                </Popover>
              ) : null}
              {onToggleHand ? (
                <ControlButton
                  className="hidden @md:flex"
                  label={me.hand ? t.lowerHand : t.raiseHand}
                  onClick={toggleHand}
                  pressed={Boolean(me.hand)}
                  tone={me.hand ? "on" : "default"}
                >
                  <HandIcon />
                </ControlButton>
              ) : null}
              <ControlButton
                badge={panel === "chat" ? 0 : unread}
                className="@4xl:hidden"
                label={t.chat}
                onClick={() => setPanel(panel === "chat" ? null : "chat")}
                pressed={panel === "chat"}
                tone={panel === "chat" ? "on" : "default"}
              >
                <MessageSquareIcon />
              </ControlButton>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t.more}
                  className={cn(
                    "flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary text-secondary-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-popup-open:bg-accent [&_svg]:size-4.5",
                    press
                  )}
                >
                  <EllipsisIcon />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  className={cn("w-52", menuPop)}
                  side="top"
                  sideOffset={10}
                >
                  {hasMenuItems ? (
                    <div className="@md:hidden">
                      {onToggleShare ? (
                        <DropdownMenuItem onClick={toggleShare}>
                          <MonitorUpIcon />{" "}
                          {sharing ? t.stopPresenting : t.present}
                        </DropdownMenuItem>
                      ) : null}
                      {onToggleHand ? (
                        <DropdownMenuItem onClick={toggleHand}>
                          <HandIcon /> {me.hand ? t.lowerHand : t.raiseHand}
                        </DropdownMenuItem>
                      ) : null}
                    </div>
                  ) : null}
                  <DropdownMenuItem onClick={() => setPanel("people")}>
                    <UsersIcon /> {t.people}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t.layout}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      onValueChange={(v) =>
                        setLayout(v as "grid" | "spotlight")
                      }
                      value={layout}
                    >
                      <DropdownMenuRadioItem value="grid">
                        {t.grid}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="spotlight">
                        {t.spotlight}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              {onLeave ? (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        aria-label={t.leaveCall}
                        className={cn(
                          "ms-1 flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-destructive px-3.5 font-medium text-white outline-none hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background @md:px-4",
                          press
                        )}
                        onClick={leave}
                        type="button"
                      />
                    }
                  >
                    <PhoneOffIcon aria-hidden className="size-4.5" />
                    <span className="hidden @md:inline">{t.leave}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8}>
                    {t.leaveCall}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          )}
          <div className="hidden flex-1 items-center justify-end gap-2 @4xl:flex">
            {left ? null : (
              <>
                <ControlButton
                  badge={panel === "chat" ? 0 : unread}
                  label={t.chat}
                  onClick={() => setPanel(panel === "chat" ? null : "chat")}
                  pressed={panel === "chat"}
                  tone={panel === "chat" ? "on" : "default"}
                >
                  <MessageSquareIcon />
                </ControlButton>
                <ControlButton
                  label={t.people}
                  onClick={() => setPanel(panel === "people" ? null : "people")}
                  pressed={panel === "people"}
                  tone={panel === "people" ? "on" : "default"}
                >
                  <UsersIcon />
                </ControlButton>
              </>
            )}
          </div>
        </footer>

        <Sheet
          onOpenChange={(open) => !open && setPanel(null)}
          open={!wide && Boolean(panel) && !left}
        >
          <SheetContent
            className="h-[calc(100%-4rem)] gap-0 rounded-t-2xl p-0"
            showCloseButton={false}
            side="bottom"
          >
            <SheetTitle className="sr-only">
              {panel === "chat" ? t.chat : t.people}
            </SheetTitle>
            {panelTabs}
            {panelBody}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
}

export function VideoCall(props: VideoCallProps) {
  return (
    <ScreenBoundary name="VideoCall">
      <VideoCallScreen {...props} />
    </ScreenBoundary>
  );
}
