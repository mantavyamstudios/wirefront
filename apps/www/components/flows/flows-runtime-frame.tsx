"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import type { Ref } from "react";

import { BlocksPreviewLoadingOverlay } from "@/components/blocks/blocks-preview-loading";
import { playTapOnControl } from "@/lib/sound";
import {
  Tabs,
  TabsHighlight,
  TabsHighlightItem,
  TabsList,
  TabsTrigger,
} from "@/registry/primitives/animate/tabs";

import {
  FLOW_DEVICE_ORDER,
  FLOW_DEVICES,
  FlowDeviceChrome,
  orientDevice,
} from "./flows-device";
import type { FlowDevice, FlowDeviceSpec } from "./flows-device";

const PADDING = 32;
/** Minimum room for the panel's own preview toolbar (top, desktop). */
const TOP_SPACE = 76;
/** Minimum gap under the device switcher. */
const SWITCHER_OFFSET = 20;
/** Switcher (40px) plus the gap above it. */
const SWITCHER_SPACE = 64;
/** Clear space kept between the shell's floating controls and our content. */
const CHROME_GAP = 12;
/** A sideways phone or small tablet: too short for a portrait device. */
const LANDSCAPE_QUERY = "(orientation: landscape) and (max-height: 600px)";
/** the shell's stacked header row (`min-h-14`); the switcher centres in it. */
const HEADER_ROW = 48;

/**
 * Where the shell's floating controls sit over this stage, in stage pixels, as
 * they would be with the page scrolled to the top. Anything fixed-position
 * that the user can press counts: the stacked header (sidebar button, theme
 * and preview toolbar), the "Documentation" pill and the floating "Ask AI"
 * button. Measuring them keeps the device and switcher clear at any
 * viewport size, banner height or orientation, without hard-coded offsets.
 */
/** A control over the top edge of the stage, in stage pixels. */
interface TopControl {
  bottom: number;
  left: number;
  right: number;
}

interface Chrome {
  bottom: number;
  top: number;
  /** The preview's own controls (toolbar, sidebar button) along the top. */
  topControls: TopControl[];
  /**
   * The free gap between the shell's fixed header controls (left of centre
   * and right of centre), in stage pixels. The switcher centres in it when it
   * moves into the header.
   */
  headerGap: { left: number; right: number };
}

function measureChrome(stage: HTMLElement): Chrome {
  const root = document.querySelector("[data-blocks-scroll-root]");
  const scrolled = window.scrollY + (root?.scrollTop ?? 0);
  const rect = stage.getBoundingClientRect();
  const stageTop = rect.top + scrolled;
  const stageBottom = stageTop + rect.height;
  let top = 0;
  let bottom = 0;
  const topControls: TopControl[] = [];
  let gapLeft = 0;
  let gapRight = rect.width;

  for (const el of document.querySelectorAll<HTMLElement>(
    "button, a, [role=tab]"
  )) {
    if (stage.contains(el)) {
      continue;
    }
    const box = el.getBoundingClientRect();
    const visible =
      box.width > 0 &&
      box.height > 0 &&
      box.height < 120 &&
      box.bottom > 0 &&
      box.top < window.innerHeight &&
      box.right > rect.left &&
      box.left < rect.right;
    if (!visible) {
      continue;
    }
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || Number(style.opacity) < 0.05) {
      continue;
    }
    // Covered controls aren't chrome: with the docs column collapsed, its
    // sticky table of contents still sits underneath the expanded preview.
    const hit = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2
    );
    if (!(hit && (el.contains(hit) || hit.contains(el)))) {
      continue;
    }
    if (!isFixed(el)) {
      // In-panel controls along the top edge: the device may rise beside
      // them, but never under them.
      if (box.top < rect.top + TOP_SPACE) {
        topControls.push({
          left: Math.round(box.left - rect.left),
          right: Math.round(box.right - rect.left),
          bottom: Math.round(box.bottom - rect.top),
        });
      }
      continue;
    }
    if (box.top + box.height / 2 < window.innerHeight / 2) {
      // Top chrome: how far down into the stage it reaches.
      top = Math.max(top, box.bottom - stageTop + CHROME_GAP);
      const middle = box.left + box.width / 2 - rect.left;
      if (middle < rect.width / 2) {
        gapLeft = Math.max(gapLeft, box.right - rect.left);
      } else {
        gapRight = Math.min(gapRight, box.left - rect.left);
      }
    } else {
      // Bottom chrome: how far up from the stage's bottom edge it reaches.
      bottom = Math.max(bottom, stageBottom - box.top + CHROME_GAP);
    }
  }
  return {
    top: Math.round(top),
    bottom: Math.round(bottom),
    topControls,
    headerGap: { left: Math.round(gapLeft), right: Math.round(gapRight) },
  };
}

function isFixed(el: HTMLElement): boolean {
  for (
    let node: HTMLElement | null = el;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const position = getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      return true;
    }
  }
  return false;
}
const EASE = [0.32, 0.72, 0, 1] as const;
/** How long after a host-driven switch/reset a focus jump into the iframe is undone. */
const FOCUS_GUARD_MS = 1500;

export interface FlowsRuntimeHandle {
  reset: () => void;
}

interface FlowsRuntimeFrameProps {
  categorySlug: string;
  /** Iframe src for the first subflow; never changes afterwards. */
  initialSrc: string;
  ref?: Ref<FlowsRuntimeHandle>;
  subflowSlug: string;
}

/**
 * One persistent Flutter runtime iframe (see `apps/runtime/lib/main_embed.dart`).
 * The engine boots once; later subflow, theme, device and reset changes are
 * sent over postMessage, so switching subflows never reloads the iframe.
 */
export function FlowsRuntimeFrame({
  categorySlug,
  initialSrc,
  ref,
  subflowSlug,
}: FlowsRuntimeFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const shownRef = useRef<string | null>(null);
  // Set only after the message listener below is attached: a cached runtime
  // can boot and post `flow:ready` before hydration, and that signal would be
  // lost if the iframe came with the server-rendered HTML.
  const [src, setSrc] = useState<string | undefined>(undefined);
  const firstSrc = useRef(withDevice(initialSrc, FLOW_DEVICES.phone));
  const [ready, setReady] = useState(false);
  const [device, setDevice] = useState<FlowDevice>("phone");
  const [stage, animateStage] = useAnimate();
  const prefersReducedMotion = useReducedMotion();
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [chrome, setChrome] = useState<Chrome>({
    top: 0,
    bottom: 0,
    topControls: [],
    headerGap: { left: 0, right: 0 },
  });
  // Phones / small tablets held sideways: turn the device to match.
  const [landscape, setLandscape] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(LANDSCAPE_QUERY);
    const update = () => setLandscape(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const { resolvedTheme } = useTheme();

  const post = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(
      message,
      window.location.origin
    );
  }, []);

  // Restarting the demo (switch / reset) makes Flutter take keyboard focus,
  // which would silence the page's own shortcuts (⌘J, Esc, ⌘K). Hand focus
  // back to whatever had it, unless the user was already inside the demo.
  const focusGuard = useRef<{ restore: Element | null; until: number }>({
    restore: null,
    until: 0,
  });
  const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const restartDemo = useCallback(
    (message: Record<string, unknown>) => {
      const active = document.activeElement;
      if (active !== iframeRef.current) {
        focusGuard.current = {
          restore: active,
          until: Date.now() + FOCUS_GUARD_MS,
        };
      }
      post(message);
    },
    [post]
  );

  // oxlint-disable-next-line react-doctor/effect-needs-cleanup -- the timer lives in focusTimer and is cleared in this effect's cleanup.
  useEffect(() => {
    function onWindowBlur() {
      // activeElement updates after the blur event; check on the next task.
      clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => {
        const { restore, until } = focusGuard.current;
        if (
          Date.now() > until ||
          document.activeElement !== iframeRef.current
        ) {
          return;
        }
        focusGuard.current.until = 0;
        if (restore instanceof HTMLElement && restore.isConnected) {
          restore.focus({ preventScroll: true });
        } else {
          iframeRef.current?.blur();
        }
      }, 0);
    }
    window.addEventListener("blur", onWindowBlur);
    return () => {
      clearTimeout(focusTimer.current);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({ reset: () => restartDemo({ type: "flow:reset" }) }),
    [restartDemo]
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow
      ) {
        return;
      }
      const data = event.data as {
        flow?: string;
        message?: string;
        sub?: string;
        type?: string;
      };
      if (data?.type === "flow:ready") {
        shownRef.current = `${data.flow}/${data.sub}`;
        setReady(true);
      } else if (data?.type === "flow:error") {
        console.warn("[flows runtime]", data.message);
      }
    }
    window.addEventListener("message", onMessage);
    setSrc(firstSrc.current);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Subflow switches: tell the running engine instead of reloading the iframe.
  useEffect(() => {
    const target = `${categorySlug}/${subflowSlug}`;
    if (ready && shownRef.current !== target) {
      shownRef.current = target;
      restartDemo({
        type: "flow:navigate",
        flow: categorySlug,
        sub: subflowSlug,
      });
    }
  }, [categorySlug, subflowSlug, ready, restartDemo]);

  useEffect(() => {
    if (ready && resolvedTheme) {
      post({
        type: "flow:theme",
        mode: resolvedTheme === "dark" ? "dark" : "light",
      });
    }
  }, [ready, resolvedTheme, post]);

  useEffect(() => {
    if (ready) {
      const spec = FLOW_DEVICES[device];
      post({
        type: "flow:device",
        kind: spec.runtimeKind,
        safeTop: spec.safeArea.top,
        safeBottom: spec.safeArea.bottom,
      });
    }
  }, [ready, device, post]);

  // Crossfade the device swap; the iframe itself stays mounted.
  const switchDevice = useCallback(
    async (next: FlowDevice) => {
      if (next === device) {
        return;
      }
      if (prefersReducedMotion || !stage.current) {
        setDevice(next);
        return;
      }
      await animateStage(
        stage.current,
        { opacity: 0, filter: "blur(4px)" },
        { duration: 0.14, ease: "easeIn" }
      );
      setDevice(next);
      animateStage(
        stage.current,
        { opacity: 1, filter: "blur(0px)" },
        { duration: 0.32, ease: EASE }
      );
    },
    [animateStage, device, prefersReducedMotion, stage]
  );

  // oxlint-disable-next-line react-doctor/effect-needs-cleanup -- the settle timers are cleared in this effect's cleanup.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    const measure = () => {
      const next = measureChrome(el);
      setChrome((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    };
    // Layout changes (expanding the preview, collapsing the docs) animate;
    // measure again once they have settled.
    let settleAfterResize: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
      measure();
      clearTimeout(settleAfterResize);
      settleAfterResize = setTimeout(measure, 450);
    });
    observer.observe(el);
    window.addEventListener("resize", measure);
    // the shell's floating controls mount (portals) and animate in after hydration.
    const settle = [setTimeout(measure, 400), setTimeout(measure, 1200)];
    return () => {
      observer.disconnect();
      clearTimeout(settleAfterResize);
      window.removeEventListener("resize", measure);
      for (const timer of settle) {
        clearTimeout(timer);
      }
    };
  }, []);

  const spec = orientDevice(FLOW_DEVICES[device], landscape);
  // Sideways phone under the shell's stacked header: height is scarce, so the
  // switcher sits in the header's free middle instead of its own row.
  const switcherInHeader = landscape && chrome.top > 0;
  const switcherBottom = Math.max(SWITCHER_OFFSET, chrome.bottom);
  const bottomSpace = switcherInHeader
    ? switcherBottom
    : switcherBottom + SWITCHER_SPACE;
  const fit = (top: number) => {
    const height = box.height - top - bottomSpace;
    const fitScale =
      box.width > 0
        ? Math.min(
            (box.width - PADDING * 2) / spec.frame.width,
            height / spec.frame.height,
            1
          )
        : 0;
    const left = (box.width - spec.frame.width * fitScale) / 2;
    return { top, height, scale: fitScale, left, right: box.width - left };
  };
  // Take the full height when the device clears the preview's top controls
  // (they sit in the corners); otherwise keep the toolbar row free.
  const compact = fit(Math.max(PADDING, chrome.top));
  const clearsControls = chrome.topControls.every(
    (control) =>
      control.bottom + CHROME_GAP <= compact.top ||
      control.right + CHROME_GAP <= compact.left ||
      control.left - CHROME_GAP >= compact.right
  );
  const layout = clearsControls
    ? compact
    : fit(Math.max(TOP_SPACE, chrome.top));
  const topSpace = layout.top;
  const availableHeight = layout.height;
  const { scale } = layout;

  return (
    <div
      className="bg-background relative size-full overflow-hidden"
      ref={containerRef}
    >
      {/* Canvas: faint dot grid in the shell's border colour, fading at the edges. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [mask-image:radial-gradient(ellipse_at_center,black_35%,transparent_78%)] [background-size:18px_18px]"
      />

      <div className="absolute inset-0" ref={stage}>
        <div
          className="absolute left-1/2 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            width: spec.frame.width,
            height: spec.frame.height,
            top: topSpace + availableHeight / 2,
            transform: `translate(-50%, -50%) scale(${Math.max(scale, 0)})`,
            visibility: scale > 0 ? "visible" : "hidden",
          }}
        >
          <FlowDeviceChrome device={device} landscape={landscape} />
          <div
            className="absolute overflow-hidden bg-black"
            style={{
              left: spec.screen.left,
              top: spec.screen.top,
              width: spec.screen.width,
              height: spec.screen.height,
              borderRadius: spec.screen.radius,
            }}
          >
            {/* oxlint-disable-next-line react/iframe-missing-sandbox -- Our own same-origin Flutter build. It needs scripts and its own origin (assets, storage, the bridge's origin check), and a sandbox allowing both isolates nothing, so none is set. */}
            <iframe
              allow="camera; microphone; geolocation; autoplay; clipboard-write"
              className="bg-background absolute left-0 block border-0"
              ref={iframeRef}
              src={src}
              style={{
                top: spec.viewport.top,
                width: spec.viewport.width,
                height: spec.viewport.height,
              }}
              title="Flutter flow preview"
            />
            {!ready && <BlocksPreviewLoadingOverlay className="rounded-none" />}
          </div>
        </div>
      </div>

      <div
        className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3"
        onClickCapture={playTapOnControl}
        style={
          switcherInHeader
            ? {
                top: Math.max(8, chrome.top - CHROME_GAP - HEADER_ROW),
                // Centre in the gap between the header's controls, not the
                // viewport: the toolbar on the right is wider than the
                // sidebar button on the left.
                left: (chrome.headerGap.left + chrome.headerGap.right) / 2,
              }
            : { bottom: switcherBottom }
        }
      >
        <Tabs
          onValueChange={(value) => {
            switchDevice(value as FlowDevice);
          }}
          value={device}
        >
          <TabsHighlight className="bg-background dark:bg-foreground/10 absolute inset-0 rounded-lg shadow-sm">
            <TabsList className="bg-muted relative flex h-10 shrink-0 items-center rounded-xl p-1">
              {FLOW_DEVICE_ORDER.map((id) => {
                const { Icon, label, model } = FLOW_DEVICES[id];
                return (
                  <TabsHighlightItem className="h-full" key={id} value={id}>
                    <TabsTrigger
                      aria-label={`${label} view (${model})`}
                      className="data-[state=active]:text-foreground data-[state=inactive]:text-foreground/45 relative z-10 flex h-full w-10 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 focus-visible:outline-none"
                      title={`${label} · ${model}`}
                      value={id}
                    >
                      <Icon className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsHighlightItem>
                );
              })}
            </TabsList>
          </TabsHighlight>
        </Tabs>
        <p
          className={
            switcherInHeader
              ? "hidden"
              : "text-muted-foreground text-xs whitespace-nowrap max-sm:hidden"
          }
        >
          <span className="text-foreground/80 font-medium">{spec.model}</span>
          <span className="tabular-nums">
            {" "}
            · {spec.viewport.width} × {spec.viewport.height}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Adds the device's runtime kind + safe area to the runtime URL. */
function withDevice(url: string, spec: FlowDeviceSpec): string {
  const params = new URLSearchParams({
    device: spec.runtimeKind,
    safeTop: String(spec.safeArea.top),
    safeBottom: String(spec.safeArea.bottom),
  });
  return `${url}&${params.toString()}`;
}
