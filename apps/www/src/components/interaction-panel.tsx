// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import {
  ArrowLeftIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CircleCheckIcon,
  CodeIcon,
  EyeIcon,
  InboxIcon,
  LoaderIcon,
  LockIcon,
  MonitorIcon,
  MoonIcon,
  PaletteIcon,
  RotateCwIcon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
  ShuffleIcon,
  SmartphoneIcon,
  SunIcon,
  TabletIcon,
  TriangleAlertIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import type { ScreenState } from "@/lib/showcase-state";
import { cn } from "@wirefront/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@wirefront/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@wirefront/ui/tooltip";
import { useTheme } from "@wirefront/ui/theme-provider";
import { PALETTES } from "@wirefront/ui/themes";
import { playGoo, setSoundEnabled, useSoundEnabled } from "@/lib/sound";

export type Device = "desktop" | "tablet" | "mobile";

/**
 * Real devices, sized by their browser (CSS-pixel) viewport in portrait.
 * The iframe renders at exactly this size, so the design's breakpoints behave
 * as they would on the device, then the whole device is scaled to fit.
 */
export const DEVICES = {
  // 1752 × 2800 panel at devicePixelRatio 2.
  tablet: { name: "Galaxy Tab S7+", w: 876, h: 1400, bezel: 16, radius: 18, camera: false },
  // 1080 × 2316 (FHD+) panel at devicePixelRatio 2.8125.
  mobile: { name: "Galaxy S23 Ultra", w: 384, h: 824, bezel: 9, radius: 14, camera: true },
} as const;

/** Message the panel sends to a device-width preview iframe so it follows theme changes live. */
export interface ThemeSyncMessage {
  type: "wirefront:theme";
  theme: "light" | "dark";
  palette: string;
}

interface SegmentItem<T extends string> {
  value: T;
  label: string;
  icon: ReactNode;
  text?: boolean;
  shortcut?: string;
}

function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
  className,
}: {
  label: string;
  items: SegmentItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();
  const reduce = useReducedMotion();
  return (
    <LayoutGroup id={id}>
      <div aria-label={label} className={cn("flex items-center gap-0.5", className)} role="radiogroup">
        {items.map((item, index) => {
          const active = item.value === value;
          const button = (
            <button
              aria-checked={active}
              aria-label={item.text ? undefined : item.label}
              className={cn(
                "relative flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                item.text ? "px-3.5" : "w-9",
                active ? "text-background" : "text-muted-foreground hover:text-foreground",
                "[&_svg]:size-4 [&_svg]:shrink-0",
              )}
              onClick={() => {
                if (!active) playGoo(index);
                onChange(item.value);
              }}
              role="radio"
              type="button"
            >
              {active && (
                <motion.span
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-foreground"
                  layoutId="indicator"
                  transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0.18, duration: 0.4 }}
                />
              )}
              {item.icon}
              {item.text && <span>{item.label}</span>}
            </button>
          );
          if (!item.shortcut && item.text)
            return (
              <span className="contents" key={item.value}>
                {button}
              </span>
            );
          return <PanelTooltip key={item.value} label={item.label} shortcut={item.shortcut} trigger={button} />;
        })}
      </div>
    </LayoutGroup>
  );
}

function PanelTooltip({ label, shortcut, trigger }: { label: string; shortcut?: string; trigger: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipContent className="font-sans" side="top" sideOffset={10}>
        {label}
        {shortcut && <span className="ms-2 font-mono text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Animates a run of panel controls open and shut (width + fade). */
function Collapse({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          animate={{ width: "auto", opacity: 1 }}
          className={cn("flex shrink-0 items-center overflow-clip [overflow-clip-margin:4px]", className)}
          exit={{ width: 0, opacity: 0 }}
          initial={{ width: 0, opacity: 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Divider({ className }: { className?: string }) {
  return <span aria-hidden className={cn("mx-1.5 h-6 w-px shrink-0 bg-border", className)} />;
}

const iconButton =
  "relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4";

function NavButton({
  label,
  shortcut,
  onClick,
  children,
  className,
  pressed,
  step = 2,
}: {
  step?: number;
  label: string;
  shortcut: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  pressed?: boolean;
}) {
  return (
    <PanelTooltip
      label={label}
      shortcut={shortcut}
      trigger={
        <button
          aria-keyshortcuts={shortcut}
          aria-label={label}
          aria-pressed={pressed}
          className={cn(iconButton, "aria-pressed:bg-foreground aria-pressed:text-background", className)}
          onClick={() => {
            playGoo(step);
            onClick();
          }}
          type="button"
        >
          {children}
        </button>
      }
    />
  );
}

function SoundToggle() {
  const enabled = useSoundEnabled();
  return (
    <PanelTooltip
      label={enabled ? "Mute sounds" : "Turn on sounds"}
      trigger={
        <button
          aria-label={enabled ? "Mute interface sounds" : "Turn on interface sounds"}
          aria-pressed={enabled}
          className={iconButton}
          onClick={() => {
            setSoundEnabled(!enabled);
            if (!enabled) playGoo(4);
          }}
          type="button"
        >
          {enabled ? <Volume2Icon /> : <VolumeXIcon />}
        </button>
      }
    />
  );
}

function PalettePicker() {
  const { palette, setPalette } = useTheme();
  const current = PALETTES[palette];
  return (
    <Popover>
      <PanelTooltip
        label="Palette"
        trigger={
          <PopoverTrigger
            aria-label={`Palette: ${current.name}`}
            onClick={() => playGoo(3)}
            className={cn(iconButton, "data-popup-open:bg-accent data-popup-open:text-foreground")}
          >
            <PaletteIcon />
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-background"
              style={{ background: current.swatch[0] }}
            />
          </PopoverTrigger>
        }
      />
      <PopoverContent className="w-56 font-sans" side="top" sideOffset={12}>
        <p className="mb-2 font-mono text-[11px] text-muted-foreground uppercase tracking-widest">Palette</p>
        <div aria-label="Palette" className="flex flex-col gap-0.5" role="radiogroup">
          {Object.values(PALETTES).map((p, index) => {
            const active = p.id === palette;
            return (
              <button
                aria-checked={active}
                className="flex h-8 cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                key={p.id}
                onClick={() => {
                  if (!active) playGoo(index);
                  setPalette(p.id);
                }}
                role="radio"
                type="button"
              >
                <span className="flex shrink-0 -space-x-1" aria-hidden>
                  <span className="size-3.5 rounded-full ring-2 ring-popover" style={{ background: p.swatch[0] }} />
                  <span className="size-3.5 rounded-full ring-2 ring-popover" style={{ background: p.swatch[1] }} />
                </span>
                <span className="flex-1">{p.name}</span>
                {active && <CheckIcon aria-hidden className="size-4 text-foreground" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const STATE_LABEL: Record<ScreenState, string> = {
  ready: "Ready",
  loading: "Loading",
  empty: "Empty",
  error: "Error",
  forbidden: "No access",
};

const STATE_ICON: Record<ScreenState, ReactNode> = {
  ready: <CircleCheckIcon />,
  loading: <LoaderIcon />,
  empty: <InboxIcon />,
  error: <TriangleAlertIcon />,
  forbidden: <LockIcon />,
};

export function InteractionPanel({
  codeOpen,
  onCodeOpenChange,
  device,
  onDeviceChange,
  onReplay,
  landscape,
  onLandscapeChange,
  onBack,
  onBrowse,
  onGroup,
  onRandom,
  hidden,
  states = [],
  screenState = "ready",
  onScreenStateChange,
}: {
  onBack: () => void;
  onBrowse: (delta: 1 | -1) => void;
  onGroup: (delta: 1 | -1) => void;
  onRandom: () => void;
  codeOpen: boolean;
  onCodeOpenChange: (open: boolean) => void;
  device: Device;
  onDeviceChange: (device: Device) => void;
  onReplay: () => void;
  landscape: boolean;
  onLandscapeChange: (landscape: boolean) => void;
  hidden?: boolean;
  /** States the design renders; the State control shows when there are two or more. */
  states?: readonly ScreenState[];
  screenState?: ScreenState;
  onScreenStateChange?: (state: ScreenState) => void;
}) {
  const reduce = useReducedMotion();
  const { resolved, setPreference } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const replayIcon = useRef<HTMLSpanElement>(null);

  return (
    <TooltipProvider delay={300}>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-3 font-sans transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          hidden && "translate-y-24 opacity-0",
        )}
        inert={hidden}
      >
        <div
          aria-label="Preview controls"
          className="pointer-events-auto flex max-w-full items-center overflow-x-auto rounded-full border bg-background/80 p-1 shadow-lg/10 backdrop-blur-xl [scrollbar-width:none]"
          role="toolbar"
        >
          <Collapse show={!codeOpen}>
            <NavButton label="All designs" onClick={onBack} shortcut="Esc" step={0}>
              <ArrowLeftIcon />
            </NavButton>
            <Divider />
            <NavButton label="Previous design" onClick={() => onBrowse(-1)} shortcut="←" step={1}>
              <ChevronLeftIcon />
            </NavButton>
            <NavButton label="Next design" onClick={() => onBrowse(1)} shortcut="→" step={2}>
              <ChevronRightIcon />
            </NavButton>
            <NavButton
              className="hidden sm:flex"
              label="Previous group"
              onClick={() => onGroup(-1)}
              shortcut="↑"
              step={3}
            >
              <ChevronUpIcon />
            </NavButton>
            <NavButton className="hidden sm:flex" label="Next group" onClick={() => onGroup(1)} shortcut="↓" step={4}>
              <ChevronDownIcon />
            </NavButton>
            <NavButton label="Random design" onClick={onRandom} shortcut="R" step={6}>
              <ShuffleIcon />
            </NavButton>
            <Divider />
          </Collapse>
          {/* Phones get single icon toggles so the whole panel fits without scrolling. */}
          <Collapse className="sm:hidden" show={!codeOpen}>
            <NavButton
              label={codeOpen ? "Show preview" : "Show code"}
              onClick={() => onCodeOpenChange(!codeOpen)}
              pressed={codeOpen}
              shortcut="C"
            >
              <CodeIcon />
            </NavButton>
            <NavButton
              label={mounted && resolved === "dark" ? "Switch to light" : "Switch to dark"}
              onClick={() => setPreference(resolved === "dark" ? "light" : "dark")}
              shortcut="T"
            >
              {mounted && resolved === "dark" ? <MoonIcon /> : <SunIcon />}
            </NavButton>
          </Collapse>
          <Segmented
            className={codeOpen ? "flex" : "hidden sm:flex"}
            items={[
              { value: "preview", label: "Preview", icon: <EyeIcon />, text: true },
              { value: "code", label: "Code", icon: <CodeIcon />, text: true, shortcut: "C" },
            ]}
            label="View"
            onChange={(v) => onCodeOpenChange(v === "code")}
            value={codeOpen ? "code" : "preview"}
          />
          <Collapse show={!codeOpen}>
            <Divider className="hidden sm:block" />
            <Segmented
              className="hidden sm:flex"
              items={[
                { value: "light", label: "Light", icon: <SunIcon />, shortcut: "T" },
                { value: "dark", label: "Dark", icon: <MoonIcon />, shortcut: "T" },
              ]}
              label="Theme"
              onChange={(v) => setPreference(v)}
              value={mounted ? resolved : "dark"}
            />
            <Divider className="hidden sm:block" />
            <Segmented
              className="hidden sm:flex"
              items={[
                { value: "desktop", label: "Desktop", icon: <MonitorIcon /> },
                {
                  value: "tablet",
                  label: `${DEVICES.tablet.name} · ${DEVICES.tablet.w} × ${DEVICES.tablet.h}`,
                  icon: <TabletIcon />,
                },
                {
                  value: "mobile",
                  label: `${DEVICES.mobile.name} · ${DEVICES.mobile.w} × ${DEVICES.mobile.h}`,
                  icon: <SmartphoneIcon />,
                },
              ]}
              label="Preview device"
              onChange={onDeviceChange}
              value={device}
            />
            <AnimatePresence initial={false}>
              {device !== "desktop" && (
                <motion.span
                  animate={{ width: "auto", opacity: 1 }}
                  className="hidden items-center overflow-clip [overflow-clip-margin:4px] sm:flex"
                  exit={{ width: 0, opacity: 0 }}
                  initial={{ width: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Divider />
                  <Segmented
                    items={[
                      { value: "portrait", label: "Portrait", icon: <RectangleVerticalIcon />, shortcut: "O" },
                      { value: "landscape", label: "Landscape", icon: <RectangleHorizontalIcon />, shortcut: "O" },
                    ]}
                    label="Orientation"
                    onChange={(v) => onLandscapeChange(v === "landscape")}
                    value={landscape ? "landscape" : "portrait"}
                  />
                </motion.span>
              )}
            </AnimatePresence>
            {states.length > 1 && onScreenStateChange ? (
              <>
                <Divider />
                <Segmented
                  items={states.map((s) => ({ value: s, label: STATE_LABEL[s], icon: STATE_ICON[s], shortcut: "S" }))}
                  label="Screen state"
                  onChange={onScreenStateChange}
                  value={screenState}
                />
              </>
            ) : null}
            <Divider />
            <SoundToggle />
            <PalettePicker />
            <PanelTooltip
              label="Replay"
              trigger={
                <button
                  aria-label="Replay preview"
                  className={iconButton}
                  onClick={() => {
                    replayIcon.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
                      duration: 500,
                      easing: "cubic-bezier(0.23, 1, 0.32, 1)",
                    });
                    playGoo(5);
                    onReplay();
                  }}
                  type="button"
                >
                  <span className="flex" ref={replayIcon}>
                    <RotateCwIcon />
                  </span>
                </button>
              }
            />
          </Collapse>
        </div>
      </div>
    </TooltipProvider>
  );
}

function useViewport() {
  const [size, setSize] = useState(() =>
    typeof window === "undefined" ? { w: 1440, h: 900 } : { w: window.innerWidth, h: window.innerHeight },
  );
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

const STAGE_EASE = [0.23, 1, 0.32, 1] as const;
const STAGE_TOP = 24;
const CAPTION_SPACE = 28;

/**
 * Loads the design in an iframe at the device's real viewport size, inside a
 * bezel, scaled down to fit. Entering, it starts full-bleed (matching the
 * in-page design it replaces) and morphs into the device once the iframe has
 * loaded; switching device or rotating morphs the same frame; leaving, it
 * grows back out.
 */
export function DeviceStage({
  src,
  device,
  landscape,
  reloadKey,
  onReady,
}: {
  src: string;
  device: Exclude<Device, "desktop">;
  landscape: boolean;
  reloadKey: number;
  onReady: () => void;
}) {
  const { resolved, palette } = useTheme();
  const frame = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();
  const vp = useViewport();

  const sync = () => {
    const message: ThemeSyncMessage = { type: "wirefront:theme", theme: resolved, palette };
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  };
  useEffect(sync, [resolved, palette]);

  const spec = DEVICES[device];
  const w = landscape ? spec.h : spec.w;
  const h = landscape ? spec.w : spec.h;
  const outerW = w + spec.bezel * 2;
  const outerH = h + spec.bezel * 2;
  const bottom = vp.w >= 768 ? 112 : 88;
  const availW = vp.w - 32;
  const availH = vp.h - STAGE_TOP - bottom - CAPTION_SPACE;
  const scale = Math.max(0.1, Math.min(1, availW / outerW, availH / outerH));
  const frameW = outerW * scale;
  const frameH = outerH * scale;
  const top = STAGE_TOP + Math.max(0, (availH - frameH) / 2);

  // Geometry is always the framed device. Never scale the iframe up to fill
  // the screen: a 384px page blown up to 1440px reads as a big zoom. Entering
  // and leaving crossfade instead; device/orientation switches morph the frame.
  const geometry = {
    top,
    left: (vp.w - frameW) / 2,
    width: frameW,
    height: frameH,
    padding: spec.bezel * scale,
    borderRadius: (spec.radius + spec.bezel) * scale,
  };
  const shell = { ...geometry, opacity: loaded ? 1 : 0, scale: loaded ? 1 : 0.96 };
  const shellInitial = { ...geometry, opacity: 0, scale: 0.96 };
  const screen = { width: w * scale, height: h * scale, borderRadius: spec.radius * scale };
  // Size and scale move together so the page never pops larger mid-switch.
  const content = { scale, width: w, height: h };
  const transition = reduce ? { duration: 0 } : { duration: 0.5, ease: STAGE_EASE };
  const exitTransition = reduce ? { duration: 0 } : { duration: 0.28, ease: STAGE_EASE };
  const cameraSize = Math.max(4, 11 * scale);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <motion.div
        animate={{ opacity: loaded ? 1 : 0 }}
        className="absolute inset-0 bg-background bg-linear-to-b from-muted to-muted"
        exit={{ opacity: 0, transition: exitTransition }}
        initial={{ opacity: 0 }}
        transition={transition}
      />
      <motion.div
        animate={shell}
        className="pointer-events-auto absolute bg-neutral-900 shadow-2xl/20 ring-1 ring-black/40 dark:bg-neutral-950 dark:ring-white/12"
        exit={{ opacity: 0, scale: 0.97, transition: exitTransition }}
        initial={shellInitial}
        style={{ visibility: loaded ? "visible" : "hidden" }}
        transition={transition}
      >
        <motion.div
          animate={screen}
          className="relative overflow-hidden bg-background"
          initial={screen}
          transition={transition}
        >
          <motion.iframe
            animate={content}
            className="block origin-top-left border-0"
            initial={content}
            key={reloadKey}
            onLoad={() => {
              sync();
              setLoaded(true);
              onReady();
            }}
            ref={frame}
            src={src}
            title={`${spec.name} preview`}
            transition={transition}
          />
          {spec.camera && (
            <motion.span
              animate={{ opacity: loaded ? 1 : 0 }}
              aria-hidden
              className="pointer-events-none absolute rounded-full bg-neutral-950 ring-1 ring-white/10"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              style={
                landscape
                  ? { left: 10 * scale, top: "50%", width: cameraSize, height: cameraSize, translateY: "-50%" }
                  : { top: 10 * scale, left: "50%", width: cameraSize, height: cameraSize, translateX: "-50%" }
              }
              transition={transition}
            />
          )}
        </motion.div>
      </motion.div>
      <motion.p
        animate={{ opacity: loaded ? 1 : 0, top: top + frameH + 10 }}
        className="absolute inset-x-0 text-center font-mono text-[11px] text-muted-foreground"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0, top: top + frameH + 10 }}
        transition={transition}
      >
        {spec.name} · {w} × {h}
        {scale < 1 && <span className="opacity-60"> · {Math.round(scale * 100)}%</span>}
      </motion.p>
    </div>
  );
}
