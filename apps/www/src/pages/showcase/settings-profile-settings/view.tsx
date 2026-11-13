// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Includes MIT-licensed code © 2026 Sean Brydon (devl.dev) · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@wirefront/ui/dialog";
import { Input } from "@wirefront/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@wirefront/ui/input-group";
import { cn } from "@wirefront/ui/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@wirefront/ui/select";
import { Slider } from "@wirefront/ui/slider";
import { Spinner } from "@wirefront/ui/spinner";
import { Textarea } from "@wirefront/ui/textarea";
import { useAction } from "@wirefront/ui/wirefront/action";
import { interpolate, useMessages, useWirefront } from "@wirefront/ui/wirefront/provider";
import type { Action } from "@wirefront/ui/wirefront/types";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { CheckIcon, MoveIcon, PaletteIcon, RotateCcwIcon, XIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";

import type { AvatarCrop, AvatarPalette, Profile, ProfileZone } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("profileSettings.<key>"). */
export const PROFILE_SETTINGS_MESSAGES = {
  title: "Profile",
  subtitle: "Manage how you appear to your team across {product}.",
  picture: "Profile picture",
  changePicture: "Change",
  removePicture: "Remove",
  pictureHint: "Pick a colour and frame it.",
  edited: "Edited",
  fullName: "Full name",
  fullNameHelp: "Visible to your team.",
  publicName: "Public name",
  publicNameHelp: "Shown on comments and mentions.",
  username: "Username",
  usernameHelp: "Your profile link and @mention handle.",
  usernameShort: "Use at least 3 characters.",
  usernameLong: "Keep it to 24 characters or fewer.",
  usernameChars: "Use lowercase letters, numbers and hyphens.",
  usernameEdges: "Start and end with a letter or number.",
  usernameCurrent: "This is your current username.",
  usernameChecking: "Checking availability…",
  usernameAvailable: "Available",
  usernameTaken: "Taken",
  usernameTakenTry: "Taken, try",
  email: "Email",
  emailHelp: "Used for sign-in and notifications.",
  emailHelpChanged: "We’ll send a link to confirm the new address.",
  change: "Change",
  unverified: "Unverified",
  verified: "Verified",
  bio: "Bio",
  bioHelp: "A sentence or two about what you work on.",
  bioPlaceholder: "What you work on, what you’re into.",
  timeZone: "Time zone",
  timeZoneDescription: "Teammates see your local time on your profile and in mentions.",
  itsBefore: "It’s",
  itsAfter: "for you",
  sameAsBrowser: "same as your browser",
  aheadOfBrowser: "{span} ahead of your browser",
  behindBrowser: "{span} behind your browser",
  blockName: "Add your full name",
  blockUsername: "Fix your username",
  blockTaken: "That username is taken",
  blockChecking: "Checking username…",
  blockCheckFailed: "Couldn’t check the username. Try another or wait a moment.",
  blockEmail: "Enter a valid email",
  blockBio: "Bio is too long",
  unsavedShort: "Unsaved changes",
  unsavedLong: "You have unsaved changes",
  discard: "Discard",
  save: "Save",
  saved: "Profile saved",
  cropTitle: "Adjust picture",
  cropDescription: "Drag to reposition, then zoom to frame it.",
  cropStage: "Picture framing. Drag or use the arrow keys to move, plus and minus to zoom.",
  cropRole: "picture framer",
  cropStyle: "Colour",
  zoom: "Zoom",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  reset: "Reset",
  cancel: "Cancel",
  apply: "Apply",
};

type Messages = typeof PROFILE_SETTINGS_MESSAGES;

export interface ProfileSettingsProps {
  /** The saved profile. */
  profile: Profile;
  /** Time zones the user can pick from (IANA ids with a city name). */
  timeZones: ProfileZone[];
  /** Your profile URL host, shown before the username, e.g. "acme.app". */
  domain: string;
  /** Your product's name, used in the copy. */
  product: string;
  /**
   * Save the edited profile. Resolve with nothing on success; resolve with
   * fail(message, { username?, email? }) or throw to show what went wrong.
   */
  onSave: Action<Profile>;
  /** Check a new username; resolve with whether it's free and, if not, a few suggestions. */
  checkUsername: (username: string) => Promise<{ available: boolean; suggestions?: string[] }>;
  /** Longest bio allowed. */
  bioLimit?: number;
  className?: string;
}

type UsernameStatus = "current" | "checking" | "available" | "taken" | "invalid";

const easeOut = [0.23, 1, 0.32, 1] as const;
const press = "transition-[background-color,color,box-shadow,scale] duration-150 ease-out motion-safe:active:scale-[0.97]";
const stageSpan = 136;
const zoomRange = [1, 2.4] as const;
const artBleed = 1.3;

const palettes: Record<AvatarPalette, { label: string; stops: [string, string, string]; swatch: string }> = {
  dusk: {
    label: "Dusk",
    stops: ["text-category-8-foreground", "text-category-5-foreground", "text-category-3"],
    swatch: "from-category-8 via-category-5 to-category-3/35",
  },
  tide: {
    label: "Tide",
    stops: ["text-category-1-foreground", "text-category-6", "text-category-2"],
    swatch: "from-category-1-strong via-category-6/60 to-category-2/20",
  },
  ember: {
    label: "Ember",
    stops: ["text-category-4-foreground", "text-category-7-foreground", "text-category-3"],
    swatch: "from-category-4-strong via-category-7 to-category-3/35",
  },
  moss: {
    label: "Moss",
    stops: ["text-category-2-foreground", "text-category-2-foreground", "text-category-2"],
    swatch: "from-category-2-strong via-category-2 to-category-2/35",
  },
};



function useReducedMotionSafe() {
  const prefers = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && Boolean(prefers);
}

function useSafeId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0]).toUpperCase();
}

function clampCrop(crop: AvatarCrop): AvatarCrop {
  const zoom = Math.max(zoomRange[0], Math.min(zoomRange[1], crop.zoom));
  const limit = 50 * (zoom * artBleed - 1);
  const clamp = (v: number) => Math.max(-limit, Math.min(limit, v));
  return { ...crop, zoom, x: clamp(crop.x), y: clamp(crop.y) };
}

function artTransform(crop: AvatarCrop) {
  return `translate(${50 + crop.x} ${50 + crop.y}) scale(${crop.zoom * artBleed}) translate(-50 -50)`;
}

function sameCrop(a: AvatarCrop | null, b: AvatarCrop | null) {
  if (!a || !b) return a === b;
  return a.palette === b.palette && a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

function validateUsername(value: string, t: Messages): string | null {
  if (value.length < 3) return t.usernameShort;
  if (value.length > 24) return t.usernameLong;
  if (!/^[a-z0-9-]+$/.test(value)) return t.usernameChars;
  if (/^-|-$/.test(value)) return t.usernameEdges;
  return null;
}


function offsetMinutes(timeZone: string, date: Date) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = part?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function formatOffset(minutes: number) {
  if (minutes === 0) return "UTC";
  const abs = Math.abs(minutes);
  const m = abs % 60;
  return `UTC${minutes > 0 ? "+" : "−"}${Math.floor(abs / 60)}${m ? `:${String(m).padStart(2, "0")}` : ""}`;
}

function formatDiff(minutes: number, t: Messages) {
  if (minutes === 0) return t.sameAsBrowser;
  const abs = Math.abs(minutes);
  const m = abs % 60;
  const span = `${Math.floor(abs / 60)}h${m ? ` ${m}m` : ""}`;
  return interpolate(minutes > 0 ? t.aheadOfBrowser : t.behindBrowser, { span });
}

function AvatarArt({ palette, initials, uid }: { palette: AvatarPalette; initials: string; uid: string }) {
  const p = palettes[palette];
  return (
    <>
      <defs>
        <linearGradient id={`${uid}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop className={p.stops[0]} offset="0" stopColor="currentColor" />
          <stop className={p.stops[1]} offset="1" stopColor="currentColor" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop className={p.stops[2]} offset="0" stopColor="currentColor" stopOpacity="0.9" />
          <stop className={p.stops[2]} offset="1" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect fill={`url(#${uid}-bg)`} height="100" width="100" />
      <circle cx="68" cy="30" fill={`url(#${uid}-glow)`} r="30" />
      <circle className={p.stops[2]} cx="68" cy="30" fill="currentColor" r="8" />
      <path d="M0 66 Q 20 54 42 63 T 100 56 V100 H0Z" fill="black" fillOpacity="0.14" />
      <path d="M0 80 Q 28 68 56 78 T 100 72 V100 H0Z" fill="black" fillOpacity="0.2" />
      <text
        dominantBaseline="central"
        fill="white"
        fontSize="22"
        fontWeight="600"
        letterSpacing="-0.4"
        textAnchor="middle"
        x="50"
        y="50"
      >
        {initials}
      </text>
    </>
  );
}

function ProfileAvatar({ crop, initials, className }: { crop: AvatarCrop | null; initials: string; className?: string }) {
  const uid = useSafeId();
  if (!crop) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border bg-muted font-medium text-muted-foreground [container-type:size]",
          className,
        )}
      >
        <span className="text-[38cqh] leading-none">{initials}</span>
      </span>
    );
  }
  return (
    <svg aria-hidden className={cn("shrink-0", className)} viewBox="0 0 100 100">
      <clipPath id={`${uid}-clip`}>
        <circle cx="50" cy="50" r="50" />
      </clipPath>
      <g clipPath={`url(#${uid}-clip)`}>
        <g transform={artTransform(crop)}>
          <AvatarArt initials={initials} palette={crop.palette} uid={uid} />
        </g>
      </g>
      <circle cx="50" cy="50" fill="none" r="49.5" stroke="black" strokeOpacity="0.08" />
    </svg>
  );
}

function CropStage({
  crop,
  initials,
  label,
  roleDescription,
  onChange,
}: {
  crop: AvatarCrop;
  initials: string;
  label: string;
  roleDescription: string;
  onChange: (crop: AvatarCrop) => void;
}) {
  const uid = useSafeId();
  const ref = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const thirds = [100 / 3, 200 / 3];

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y };
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const start = drag.current;
    const el = ref.current;
    if (!start || !el) return;
    const k = stageSpan / el.clientWidth;
    onChange(clampCrop({ ...crop, x: start.x + (e.clientX - start.px) * k, y: start.y + (e.clientY - start.py) * k }));
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.shiftKey ? 8 : 2;
    const moves: Record<string, [number, number, number]> = {
      ArrowLeft: [-step, 0, 0],
      ArrowRight: [step, 0, 0],
      ArrowUp: [0, -step, 0],
      ArrowDown: [0, step, 0],
      "+": [0, 0, 0.1],
      "=": [0, 0, 0.1],
      "-": [0, 0, -0.1],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    onChange(clampCrop({ ...crop, x: crop.x + move[0], y: crop.y + move[1], zoom: crop.zoom + move[2] }));
  };

  return (
    <button
      aria-label={label}
      className="relative aspect-square w-full cursor-grab touch-none select-none overflow-hidden rounded-xl bg-muted outline-none ring-ring/24 focus-visible:ring-[3px] active:cursor-grabbing"
      onKeyDown={onKeyDown}
      onLostPointerCapture={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      aria-roledescription={roleDescription}
      ref={ref}
      type="button"
    >
      <svg aria-hidden className="size-full" viewBox="-18 -18 136 136">
        <clipPath id={`${uid}-circle`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
        <g transform={artTransform(crop)}>
          <AvatarArt initials={initials} palette={crop.palette} uid={uid} />
        </g>
        <path
          className="fill-popover/72"
          d="M-18 -18 H118 V118 H-18Z M50 0 A50 50 0 1 0 50 100 A50 50 0 1 0 50 0Z"
          fillRule="evenodd"
        />
        <g
          className="transition-opacity duration-150 ease-out"
          clipPath={`url(#${uid}-circle)`}
          opacity={dragging ? 1 : 0}
          stroke="white"
          strokeOpacity="0.55"
          strokeWidth="0.35"
        >
          {thirds.map((t) => (
            <g key={t}>
              <line x1={t} x2={t} y1="0" y2="100" />
              <line x1="0" x2="100" y1={t} y2={t} />
            </g>
          ))}
        </g>
        <circle cx="50" cy="50" fill="none" r="50" stroke="white" strokeOpacity="0.9" strokeWidth="0.6" />
      </svg>
      <span
        className={cn(
          "pointer-events-none absolute bottom-2.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-popover/88 px-2.5 py-1 font-medium text-foreground text-xs shadow-xs/5 backdrop-blur-sm transition-opacity duration-150",
          dragging ? "opacity-0" : "opacity-100",
        )}
      >
        <MoveIcon className="size-3" />
        Drag to reposition
      </span>
    </button>
  );
}

function CropDialog({
  open,
  initial,
  initials,
  onOpenChange,
  onApply,
  t,
}: {
  open: boolean;
  initial: AvatarCrop;
  initials: string;
  onOpenChange: (open: boolean) => void;
  onApply: (crop: AvatarCrop) => void;
  t: Messages;
}) {
  const zoomId = useId();
  const [crop, setCrop] = useState(initial);
  const initialRef = useRef(initial);
  initialRef.current = initial;
  useEffect(() => {
    if (open) setCrop(initialRef.current);
  }, [open]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">{t.cropTitle}</DialogTitle>
          <DialogDescription>{t.cropDescription}</DialogDescription>
        </DialogHeader>
        <div className="-mx-4 min-h-0 min-w-0 overflow-y-auto px-4 flex flex-col gap-5">
          <div className="mx-auto w-full max-w-64">
            <CropStage crop={crop} initials={initials} label={t.cropStage} onChange={setCrop} roleDescription={t.cropRole} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              aria-label={t.zoomOut}
              className={press}
              disabled={crop.zoom <= zoomRange[0]}
              onClick={() => setCrop((c) => clampCrop({ ...c, zoom: c.zoom - 0.2 }))}
              size="icon-sm"
              variant="ghost"
            >
              <ZoomOutIcon />
            </Button>
            <span className="sr-only" id={zoomId}>
              {t.zoom}
            </span>
            <Slider
              aria-labelledby={zoomId}
              max={zoomRange[1]}
              min={zoomRange[0]}
              onValueChange={(v) => setCrop((c) => clampCrop({ ...c, zoom: Array.isArray(v) ? v[0] : v }))}
              step={0.01}
              value={crop.zoom}
            />
            <Button
              aria-label={t.zoomIn}
              className={press}
              disabled={crop.zoom >= zoomRange[1]}
              onClick={() => setCrop((c) => clampCrop({ ...c, zoom: c.zoom + 0.2 }))}
              size="icon-sm"
              variant="ghost"
            >
              <ZoomInIcon />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-sm" id={`${zoomId}-style`}>
              {t.cropStyle}
            </span>
            <RadioGroup
              aria-labelledby={`${zoomId}-style`}
              className="flex gap-2"
              onValueChange={(value) => setCrop((c) => ({ ...c, palette: value as AvatarPalette }))}
              value={crop.palette}
            >
              {(Object.keys(palettes) as AvatarPalette[]).map((key) => {
                const active = crop.palette === key;
                return (
                  <Radio.Root
                    aria-label={palettes[key].label}
                    className={cn(
                      "relative size-10 rounded-lg bg-gradient-to-br outline-none ring-offset-2 ring-offset-popover focus-visible:ring-2 focus-visible:ring-ring",
                      press,
                      palettes[key].swatch,
                      active && "ring-2 ring-foreground",
                    )}
                    key={key}
                    value={key}
                  >
                    {active ? (
                      <span className="absolute inset-0 flex items-center justify-center text-white">
                        <CheckIcon className="size-4" strokeWidth={2.5} />
                      </span>
                    ) : null}
                  </Radio.Root>
                );
              })}
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button
            className={cn(press, "sm:me-auto")}
            disabled={crop.zoom === 1 && crop.x === 0 && crop.y === 0}
            onClick={() => setCrop((c) => ({ ...c, x: 0, y: 0, zoom: 1 }))}
            variant="ghost"
          >
            <RotateCcwIcon />
            {t.reset}
          </Button>
          <Button className={press} onClick={() => onOpenChange(false)} variant="outline">
            {t.cancel}
          </Button>
          <Button
            className={press}
            onClick={() => {
              onApply(crop);
              onOpenChange(false);
            }}
          >
            {t.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useUnwrappedAngle(angle: number | null) {
  const reduce = useReducedMotionSafe();
  const mv = useMotionValue(0);
  const last = useRef<number | null>(null);
  useEffect(() => {
    if (angle === null) return;
    if (last.current === null || reduce) {
      last.current = angle;
      mv.set(angle);
      return;
    }
    const delta = ((((angle - last.current) % 360) + 540) % 360) - 180;
    last.current += delta;
    const controls = animate(mv, last.current, { type: "spring", stiffness: 140, damping: 18 });
    return () => controls.stop();
  }, [angle, reduce, mv]);
  return mv;
}

function MiniClock({ hours, minutes }: { hours: number | null; minutes: number | null }) {
  const ready = hours !== null && minutes !== null;
  const hour = useUnwrappedAngle(ready ? (hours % 12) * 30 + minutes * 0.5 : null);
  const minute = useUnwrappedAngle(ready ? minutes * 6 : null);
  const night = ready && (hours < 7 || hours >= 19);
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full border shadow-xs/5 transition-colors duration-300",
        night ? "border-category-8-strong bg-category-8-strong text-category-8" : "bg-background text-foreground",
      )}
    >
      <motion.span
        className={cn(
          "absolute bottom-1/2 start-[calc(50%-1px)] h-2 w-0.5 origin-bottom rounded-full bg-current transition-opacity",
          ready ? "opacity-100" : "opacity-0",
        )}
        style={{ rotate: hour }}
      />
      <motion.span
        className={cn(
          "absolute bottom-1/2 start-[calc(50%-0.75px)] h-3 w-[1.5px] origin-bottom rounded-full bg-current transition-opacity",
          ready ? "opacity-100" : "opacity-0",
        )}
        style={{ rotate: minute }}
      />
      <span className="absolute size-1 rounded-full bg-current" />
    </span>
  );
}

function DirtyDot({ show, label }: { show: boolean; label: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span
          animate={{ opacity: 1, scale: 1 }}
          aria-label={label}
          className="size-1.5 rounded-full bg-warning"
          exit={{ opacity: 0, scale: 0.5 }}
          initial={{ opacity: 0, scale: 0.5 }}
          role="img"
          transition={{ duration: 0.16, ease: easeOut }}
        />
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  help,
  htmlFor,
  dirty,
  edited,
  aside,
  children,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  dirty?: boolean;
  edited: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-2">
            <label className="font-medium text-sm" htmlFor={htmlFor}>
              {label}
            </label>
            <DirtyDot label={edited} show={Boolean(dirty)} />
          </span>
          {help && <span className="text-pretty text-muted-foreground text-xs">{help}</span>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-medium text-sm">{title}</h2>
      {description && <p className="text-pretty text-muted-foreground text-sm">{description}</p>}
      {children}
    </section>
  );
}


function UsernameStatusLine({
  status,
  message,
  suggestions,
  onPick,
  id,
  t,
}: {
  status: UsernameStatus;
  message: string | null;
  suggestions: string[];
  onPick: (value: string) => void;
  id: string;
  t: Messages;
}) {
  const reduce = useReducedMotionSafe();
  const content: Record<UsernameStatus, ReactNode> = {
    current: <span className="text-muted-foreground">{t.usernameCurrent}</span>,
    checking: <span className="text-muted-foreground">{t.usernameChecking}</span>,
    available: (
      <span className="flex items-center gap-1 text-success-foreground">
        <CheckIcon className="size-3.5" />
        {t.usernameAvailable}
      </span>
    ),
    taken: (
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-destructive-foreground">
        <span>{suggestions.length ? t.usernameTakenTry : t.usernameTaken}</span>
        {suggestions.map((s, i) => (
          <motion.button
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "inline-flex h-6 items-center rounded-md border bg-background px-1.5 font-mono text-foreground text-xs outline-none ring-ring/24 hover:bg-accent focus-visible:ring-[3px]",
              press,
            )}
            initial={{ opacity: 0, y: reduce ? 0 : 3 }}
            key={s}
            onClick={() => onPick(s)}
            transition={{ duration: 0.18, ease: easeOut, delay: reduce ? 0 : 0.03 + i * 0.03 }}
            type="button"
          >
            {s}
          </motion.button>
        ))}
      </span>
    ),
    invalid: <span className="text-destructive-foreground">{message}</span>,
  };
  return (
    <div aria-live="polite" className="relative min-h-6 text-xs" id={id}>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex min-h-6 items-center"
          exit={{ opacity: 0, y: reduce ? 0 : -3 }}
          initial={{ opacity: 0, y: reduce ? 0 : 3 }}
          key={status === "invalid" ? `invalid-${message}` : status}
          transition={{ duration: 0.16, ease: easeOut }}
        >
          {content[status]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProfileSettingsScreen({
  profile,
  timeZones: zones,
  domain,
  product,
  onSave,
  checkUsername,
  bioLimit = 160,
  className,
}: ProfileSettingsProps) {
  const t = useMessages("profileSettings", PROFILE_SETTINGS_MESSAGES);
  const { now } = useWirefront();
  const uid = useSafeId();
  const reduce = useReducedMotionSafe();
  const [baseline, setBaseline] = useState(profile);
  const [draft, setDraft] = useState(profile);
  const [cropOpen, setCropOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [checked, setChecked] = useState<{ value: string; taken: boolean; suggestions: string[] } | null>(null);
  const [offsets, setOffsets] = useState<Record<string, number> | null>(null);
  const [localOffset, setLocalOffset] = useState<number | null>(null);
  const [clock, setClock] = useState<{ time: string; day: string; hours: number; minutes: number } | null>(null);
  const [saved, setSaved] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const usernameError = draft.username === baseline.username ? null : validateUsername(draft.username, t);

  // Ask the backend once typing pauses; ignore answers for an older username.
  useEffect(() => {
    if (draft.username === baseline.username || validateUsername(draft.username, t)) return;
    if (checked?.value === draft.username) return;
    const value = draft.username;
    let current = true;
    setCheckFailed(false);
    const timer = setTimeout(() => {
      checkUsername(value).then(
        (result) => current && setChecked({ value, taken: !result.available, suggestions: result.suggestions ?? [] }),
        () => current && setCheckFailed(true),
      );
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [draft.username, baseline.username, checked, checkUsername, t]);

  const save = useAction(onSave, {
    onSuccess: (_, snapshot) => {
      setBaseline(snapshot);
      setEditingEmail(false);
      setChecked(null);
      setSaved(true);
    },
  });
  const saving = save.isPending();

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    const at = now();
    setOffsets(Object.fromEntries(zones.map((z) => [z.id, offsetMinutes(z.id, at)])));
    setLocalOffset(-at.getTimezoneOffset());
  }, [zones, now]);

  useEffect(() => {
    const tick = () => {
      const at = now();
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: draft.timeZone,
        hour: "2-digit",
        minute: "2-digit",
        weekday: "short",
        hourCycle: "h23",
      }).formatToParts(at);
      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
      const hours = Number(get("hour")) % 24;
      const minutes = Number(get("minute"));
      setClock({ time: `${get("hour")}:${get("minute")}`, day: get("weekday"), hours, minutes });
    };
    tick();
    const interval = setInterval(tick, 15000);
    return () => clearInterval(interval);
  }, [draft.timeZone, now]);

  useEffect(() => {
    if (editingEmail) emailRef.current?.focus();
  }, [editingEmail]);

  const usernameStatus: UsernameStatus =
    draft.username === baseline.username
      ? "current"
      : usernameError
        ? "invalid"
        : checked?.value === draft.username
          ? checked.taken
            ? "taken"
            : "available"
          : "checking";

  const dirty = {
    avatar: !sameCrop(draft.avatar, baseline.avatar),
    fullName: draft.fullName !== baseline.fullName,
    publicName: draft.publicName !== baseline.publicName,
    username: draft.username !== baseline.username,
    email: draft.email !== baseline.email,
    bio: draft.bio !== baseline.bio,
    timeZone: draft.timeZone !== baseline.timeZone,
  };
  const dirtyCount = Object.values(dirty).filter(Boolean).length;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const blocker = !draft.fullName.trim()
    ? t.blockName
    : usernameStatus === "invalid"
      ? t.blockUsername
      : usernameStatus === "taken"
        ? t.blockTaken
        : usernameStatus === "checking"
          ? checkFailed
            ? t.blockCheckFailed
            : t.blockChecking
          : !emailValid
            ? t.blockEmail
            : draft.bio.length > bioLimit
              ? t.blockBio
              : null;

  const zone = zones.find((z) => z.id === draft.timeZone) ?? zones[0];
  const zoneOffset = offsets?.[zone.id] ?? null;
  const suggestions = usernameStatus === "taken" ? (checked?.suggestions ?? []) : [];
  const initials = initialsOf(draft.fullName || baseline.fullName);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const bioLeft = bioLimit - draft.bio.length;

  const discard = () => {
    setDraft(baseline);
    setEditingEmail(false);
  };

  const submit = () => {
    if (blocker || saving) return;
    void save.run(draft);
  };

  const ids = {
    fullName: `${uid}-full`,
    publicName: `${uid}-public`,
    username: `${uid}-username`,
    email: `${uid}-email`,
    bio: `${uid}-bio`,
    zone: `${uid}-zone`,
  };
  const barVisible = dirtyCount > 0 || saved;

  return (
    <div className={cn("relative mx-auto w-full max-w-2xl px-6 py-10 md:px-10", className)}>
        <h1 className="font-semibold text-2xl tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted-foreground text-sm">{interpolate(t.subtitle, { product })}</p>

        <section className="mt-10 flex items-center gap-4">
          <ProfileAvatar className="size-16" crop={draft.avatar} initials={initials} />
          <div className="flex min-w-0 flex-col gap-2">
            <span className="flex items-center gap-2">
              <span className="font-medium text-sm">{t.picture}</span>
              <DirtyDot label={t.edited} show={dirty.avatar} />
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Button className={press} onClick={() => setCropOpen(true)} size="sm" variant="outline">
                <PaletteIcon />
                {t.changePicture}
              </Button>
              <Button className={press} disabled={!draft.avatar} onClick={() => set("avatar", null)} size="sm" variant="ghost">
                {t.removePicture}
              </Button>
            </div>
            <span className="text-muted-foreground text-xs">{t.pictureHint}</span>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field dirty={dirty.fullName} edited={t.edited} help={t.fullNameHelp} htmlFor={ids.fullName} label={t.fullName}>
              <Input
                aria-invalid={!draft.fullName.trim() || undefined}
                autoComplete="name"
                id={ids.fullName}
                maxLength={48}
                onChange={(e) => set("fullName", e.target.value)}
                value={draft.fullName}
               />
            </Field>
            <Field dirty={dirty.publicName} edited={t.edited} help={t.publicNameHelp} htmlFor={ids.publicName} label={t.publicName}>
              <Input
                autoComplete="nickname"
                id={ids.publicName}
                maxLength={32}
                onChange={(e) => set("publicName", e.target.value)}
                placeholder={draft.fullName.split(" ")[0]}
                value={draft.publicName}
               />
            </Field>
          </div>

          <Field dirty={dirty.username} edited={t.edited} help={t.usernameHelp} htmlFor={ids.username} label={t.username}>
            <div className="flex flex-col gap-1">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{domain}/</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  aria-describedby={`${ids.username}-status`}
                  aria-invalid={usernameStatus === "taken" || usernameStatus === "invalid" || undefined}
                  autoCapitalize="none"
                  autoComplete="off"
                  className="ps-0.5!"
                  id={ids.username}
                  maxLength={28}
                  onChange={(e) => set("username", e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  spellCheck={false}
                  value={draft.username}
                />
                <InputGroupAddon align="inline-end">
                  <span className="relative flex size-4 items-center justify-center">
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                        exit={{ opacity: 0, scale: 0.8 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        key={usernameStatus}
                        transition={{ duration: 0.15, ease: easeOut }}
                      >
                        {usernameStatus === "checking" && <Spinner className="size-4 text-muted-foreground" />}
                        {usernameStatus === "available" && <CheckIcon className="size-4 text-success-foreground" />}
                        {(usernameStatus === "taken" || usernameStatus === "invalid") && (
                          <XIcon className="size-4 text-destructive-foreground" />
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                </InputGroupAddon>
              </InputGroup>
              <UsernameStatusLine
                id={`${ids.username}-status`}
                message={usernameError}
                onPick={(value) => set("username", value)}
                status={usernameStatus}
                suggestions={suggestions}
                t={t}
              />
            </div>
          </Field>

          <Field
            aside={
              !editingEmail && (
                <Button className={cn(press, "-me-2")} onClick={() => setEditingEmail(true)} size="xs" variant="ghost">
                  {t.change}
                </Button>
              )
            }
            dirty={dirty.email}
            edited={t.edited}
            help={dirty.email ? t.emailHelpChanged : t.emailHelp}
            htmlFor={ids.email}
            label={t.email}
          >
            <InputGroup>
              <InputGroupInput
                aria-invalid={!emailValid || undefined}
                autoComplete="email"
                id={ids.email}
                onChange={(e) => set("email", e.target.value.trim())}
                readOnly={!editingEmail}
                ref={emailRef}
                type="email"
                value={draft.email}
              />
              <InputGroupAddon align="inline-end">
                <AnimatePresence initial={false} mode="popLayout">
                  {dirty.email ? (
                    <motion.span
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      key="pending"
                      transition={{ duration: 0.15, ease: easeOut }}
                    >
                      <Badge className="bg-warning/8 text-warning-foreground dark:bg-warning/16" variant="secondary">
                        {t.unverified}
                      </Badge>
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      key="verified"
                      transition={{ duration: 0.15, ease: easeOut }}
                    >
                      <Badge variant="secondary" className="bg-success/8 text-success-foreground dark:bg-success/16">
                        <CheckIcon />
                        {t.verified}
                      </Badge>
                    </motion.span>
                  )}
                </AnimatePresence>
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <Field
            aside={
              <span
                className={cn(
                  "text-xs tabular-nums transition-colors",
                  bioLeft < 0 ? "text-destructive-foreground" : bioLeft <= 20 ? "text-warning-foreground" : "text-muted-foreground",
                )}
                id={`${ids.bio}-count`}
              >
                {draft.bio.length}/{bioLimit}
              </span>
            }
            dirty={dirty.bio}
            edited={t.edited}
            help={t.bioHelp}
            htmlFor={ids.bio}
            label={t.bio}
          >
            <Textarea
              aria-describedby={`${ids.bio}-count`}
              aria-invalid={bioLeft < 0 || undefined}
              className="**:[textarea]:resize-none"
              id={ids.bio}
              onChange={(e) => set("bio", e.target.value)}
              placeholder={t.bioPlaceholder}
              value={draft.bio}
            />
          </Field>
        </div>

        <Section description={t.timeZoneDescription} title={t.timeZone}>
          <div className="mt-3 rounded-xl border bg-card">
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <MiniClock hours={clock?.hours ?? null} minutes={clock?.minutes ?? null} />
                <div className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-2 text-sm">
                    <span>
                      {t.itsBefore} <span className="font-medium tabular-nums">{clock?.time ?? "––:––"}</span> {t.itsAfter}
                    </span>
                    <DirtyDot label={t.edited} show={dirty.timeZone} />
                  </span>
                  <span className="truncate text-muted-foreground text-xs tabular-nums">
                    {clock?.day ?? ""}
                    {zoneOffset !== null && ` · ${formatOffset(zoneOffset)}`}
                    {zoneOffset !== null && localOffset !== null && ` · ${formatDiff(zoneOffset - localOffset, t)}`}
                  </span>
                </div>
              </div>
              <Select
                items={zones.map((z) => ({ value: z.id, label: z.city }))}
                onValueChange={(value) => value && set("timeZone", value as string)}
                value={draft.timeZone}
              >
                <SelectTrigger aria-label={t.timeZone} className="sm:w-48" id={ids.zone} size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      <span className="flex w-full items-center justify-between gap-4">
                        {z.city}
                        <span className="font-mono text-muted-foreground text-xs tabular-nums">
                          {offsets ? formatOffset(offsets[z.id] ?? 0) : ""}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Section>
        {save.error ? (
          <p className="mt-6 text-destructive-foreground text-sm" role="alert">
            {save.error}
          </p>
        ) : null}
          <AnimatePresence>
            {barVisible && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-none sticky bottom-4 z-20 mt-6 flex justify-center"
                exit={{ opacity: 0, y: reduce ? 0 : 16 }}
                initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 480, damping: 34 }}
              >
                <div className="pointer-events-auto flex w-full max-w-xl items-center gap-2 rounded-xl border bg-popover py-2 ps-4 pe-2 shadow-lg/5">
                  <AnimatePresence initial={false} mode="popLayout">
                    {saved && dirtyCount === 0 ? (
                      <motion.span
                        animate={{ opacity: 1, y: 0 }}
                        aria-live="polite"
                        className="flex min-h-8 flex-1 items-center gap-2 font-medium text-sm"
                        exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                        initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                        key="saved"
                        transition={{ duration: 0.18, ease: easeOut }}
                      >
                        <CheckIcon className="size-4 text-success-foreground" />
                        {t.saved}
                      </motion.span>
                    ) : (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className="flex min-w-0 flex-1 items-center gap-2"
                        exit={{ opacity: 0, y: reduce ? 0 : -6 }}
                        initial={{ opacity: 0, y: reduce ? 0 : 6 }}
                        key="dirty"
                        transition={{ duration: 0.18, ease: easeOut }}
                      >
                        <span aria-live="polite" className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium text-sm">
                            <span className="sm:hidden">{t.unsavedShort}</span>
                            <span className="hidden sm:inline">{t.unsavedLong}</span>
                          </span>
                          {blocker && !saving && <span className="truncate text-warning-foreground text-xs">{blocker}</span>}
                        </span>
                        <Button className={press} disabled={saving} onClick={discard} size="sm" variant="ghost">
                          {t.discard}
                        </Button>
                        <Button aria-busy={saving} className={cn(press, "min-w-14")} disabled={Boolean(blocker) || saving} onClick={submit} size="sm">
                          {saving ? <Spinner data-icon="inline-start" /> : null}
                          {t.save}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        

      <CropDialog
        initial={draft.avatar ?? { palette: "dusk", x: 0, y: 0, zoom: 1 }}
        initials={initials}
        onApply={(crop) => set("avatar", crop)}
        onOpenChange={setCropOpen}
        open={cropOpen}
        t={t}
      />
    </div>
  );
}

export function ProfileSettings(props: ProfileSettingsProps) {
  return (
    <ScreenBoundary name="ProfileSettings">
      <ProfileSettingsScreen {...props} />
    </ScreenBoundary>
  );
}
