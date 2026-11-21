// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { type CSSProperties, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { SpotlightStep } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("spotlightTour.<key>"). */
export const SPOTLIGHT_TOUR_MESSAGES = {
  progress: "Step {n} of {total}",
  close: "Close tour",
  back: "Back",
  next: "Next",
  done: "Done",
};

export interface SpotlightTourProps {
  steps: SpotlightStep[];
  /** Whether the tour is showing. */
  open: boolean;
  /** Called when it ends: true if they reached the last step, false if they closed it. */
  onClose: (finished: boolean) => void;
}

const PAD = 6; // breathing room around the highlighted element
const GAP = 12; // distance between target and card
const CARD_W = 320;
type Rect = { x: number; y: number; w: number; h: number };

/** Measures the step's target in viewport coordinates and follows scroll, resize and layout changes. */
function useTargetRect(target: string | null) {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!target) return setRect(null);
    const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
    if (!el) return setRect(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    let raf = 0;
    const measure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement);
    window.addEventListener("scroll", measure, { passive: true, capture: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", measure, { capture: true });
      window.removeEventListener("resize", measure);
    };
  }, [target]);
  return rect;
}

// The spotlight follows the real target at every breakpoint. sm+: the card sits below (or above)
// the target, clamped to the viewport. Phones: the card is a bottom sheet.
function SpotlightTourScreen({ steps, open, onClose }: SpotlightTourProps) {
  const t = useMessages("spotlightTour", SPOTLIGHT_TOUR_MESSAGES);
  const uid = useId().replace(/[^\w-]/g, "");
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);
  const current = open ? steps[step] : undefined;
  const rect = useTargetRect(current?.target ?? null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: 16, top: 16 });
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!rect || !card) return;
    const ch = card.offsetHeight;
    const below = rect.y + rect.h + PAD + GAP;
    const top = below + ch < window.innerHeight - 16 ? below : Math.max(16, rect.y - PAD - GAP - ch);
    const left = Math.min(Math.max(16, rect.x - PAD), window.innerWidth - CARD_W - 16);
    setPos({ left, top });
  }, [rect]);
  // Move focus into the card on every step so screen readers read it.
  useEffect(() => {
    if (current) cardRef.current?.focus({ preventScroll: true });
  }, [current]);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  if (!current || !rect) return null;
  const last = step === steps.length - 1;

  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 h-full w-full">
        <defs>
          <mask id={`${uid}-mask`}>
            <rect fill="white" height="100%" width="100%" />
            <rect fill="black" height={rect.h + PAD * 2} rx="10" width={rect.w + PAD * 2} x={rect.x - PAD} y={rect.y - PAD} />
          </mask>
        </defs>
        <rect className="fill-black/55 dark:fill-black/70" height="100%" mask={`url(#${uid}-mask)`} width="100%" />
      </svg>
      <div aria-hidden className="pointer-events-none fixed z-40 rounded-[10px] ring-2 ring-foreground motion-safe:transition-all motion-safe:duration-300" style={{ left: rect.x - PAD, top: rect.y - PAD, width: rect.w + PAD * 2, height: rect.h + PAD * 2 }}>
        <span className="absolute inset-0 rounded-[10px] ring-1 ring-foreground/40 motion-safe:animate-pulse" style={{ animationDuration: "2s" }} />
      </div>
      <div
        aria-describedby={`${uid}-body`}
        aria-labelledby={`${uid}-title`}
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-border/70 bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none sm:inset-s-(--x) sm:top-(--y) sm:inset-x-auto sm:bottom-auto sm:w-80 sm:rounded-xl sm:pb-4 motion-safe:sm:transition-[left,top] motion-safe:sm:duration-300"
        ref={cardRef}
        role="dialog"
        style={{ "--x": `${pos.left}px`, "--y": `${pos.top}px` } as CSSProperties}
        tabIndex={-1}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{interpolate(t.progress, { n: step + 1, total: steps.length })}</div>
            <h3 className="mt-1 font-heading text-base" id={`${uid}-title`}>
              {current.title}
              {current.kbd ? <kbd className="ms-2 rounded border border-border/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground pointer-coarse:hidden">{current.kbd}</kbd> : null}
            </h3>
          </div>
          <button
            aria-label={t.close}
            className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-10"
            onClick={() => onClose(false)}
            type="button"
          >
            <XIcon aria-hidden className="size-3.5" />
          </button>
        </div>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed sm:text-xs" id={`${uid}-body`}>
          {current.body}
        </p>
        <div className="mt-3 flex items-center justify-between border-border/60 border-t pt-3">
          <div aria-hidden className="flex items-center gap-1">
            {steps.map((s, i) => (
              <span className={cn("h-1.5 rounded-full transition-all", i === step ? "w-5 bg-foreground" : i < step ? "w-1.5 bg-foreground/60" : "w-1.5 bg-foreground/15")} key={s.id} />
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button disabled={step === 0} onClick={() => setStep((s) => Math.max(s - 1, 0))} size="sm" type="button" variant="ghost">
              {t.back}
            </Button>
            <Button onClick={() => (last ? onClose(true) : setStep((s) => s + 1))} size="sm" type="button">
              {last ? t.done : t.next}
              {last ? null : <ArrowRightIcon aria-hidden className="rtl:rotate-180" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export function SpotlightTour(props: SpotlightTourProps) {
  return (
    <ScreenBoundary name="SpotlightTour">
      <SpotlightTourScreen {...props} />
    </ScreenBoundary>
  );
}
