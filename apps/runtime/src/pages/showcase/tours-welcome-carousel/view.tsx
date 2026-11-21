// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Button } from "@wirefront/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@wirefront/ui/dialog";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import type { TourStep } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("welcomeTour.<key>"). */
export const WELCOME_TOUR_MESSAGES = {
  goTo: "Go to step {n}",
  skip: "Skip",
  back: "Back",
  next: "Next",
  done: "Get started",
};

export interface WelcomeTourProps {
  steps: TourStep[];
  /** An icon per step id; a sparkle is used for steps without one. */
  icons?: Record<string, ReactNode>;
  /** Controlled open state; leave both out to open on mount. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called when the tour closes: true if they reached the end, false if they skipped. */
  onComplete?: (finished: boolean) => void;
}

// A real Dialog (focus trap, Esc, scroll lock). Swipe left/right on touch, or use ←/→ on a
// keyboard, to move between steps. On phones it becomes a bottom sheet.
function WelcomeTourScreen({ steps, icons = {}, open, defaultOpen = true, onOpenChange, onComplete }: WelcomeTourProps) {
  const t = useMessages("welcomeTour", WELCOME_TOUR_MESSAGES);
  const [step, setStep] = useState(0);
  const [isOpen, setIsOpen] = useState(open ?? defaultOpen);
  useEffect(() => {
    if (open !== undefined) setIsOpen(open);
  }, [open]);
  const last = step === steps.length - 1;
  const current = steps[step];
  const go = (d: number) => setStep((s) => Math.min(Math.max(s + d, 0), steps.length - 1));
  const finished = useRef(false);
  const swipeRef = useRef<HTMLDivElement>(null);
  const goRef = useRef(go);
  goRef.current = go;
  // Touch swipes move between steps; the listeners read the latest step through a ref.
  useEffect(() => {
    const el = swipeRef.current;
    if (!el) return;
    let startX: number | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") startX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 48) goRef.current(dx < 0 ? 1 : -1);
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  });
  const change = (next: boolean) => {
    setIsOpen(next);
    onOpenChange?.(next);
    if (next) {
      setStep(0);
      finished.current = false;
    } else onComplete?.(finished.current);
  };
  if (!current) return null;

  return (
    <Dialog onOpenChange={change} open={isOpen}>
      <DialogContent
        className="overflow-hidden p-0 sm:max-w-md"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        showCloseButton={false}
      >
        <div className="touch-pan-y select-none" ref={swipeRef}>
          <div className="relative h-36 max-h-[30svh] overflow-hidden bg-linear-to-br from-primary/30 via-primary/10 to-background sm:h-44">
            <div
              aria-hidden
              className="absolute inset-0 opacity-50"
              style={{ backgroundImage: "radial-gradient(circle at 20% 30%, color-mix(in srgb, var(--primary) 50%, transparent), transparent 50%), radial-gradient(circle at 80% 70%, color-mix(in srgb, var(--primary) 30%, transparent), transparent 50%)" }}
            />
            <div className="relative flex h-full items-center justify-center">
              <div aria-hidden className="flex size-16 items-center justify-center rounded-2xl bg-background/85 shadow-lg ring-1 ring-border/60 backdrop-blur sm:size-20 [&_svg]:size-8 sm:[&_svg]:size-9">
                {icons[current.id] ?? <SparklesIcon />}
              </div>
            </div>
          </div>
          <div aria-live="polite" className="px-5 py-5 sm:px-6 sm:py-6">
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">{current.badge}</div>
            <DialogTitle className="mt-1 font-heading text-xl sm:text-2xl">{current.title}</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground text-sm leading-relaxed">{current.body}</DialogDescription>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 border-border/60 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 sm:pb-3">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <button
                aria-current={i === step ? "step" : undefined}
                aria-label={interpolate(t.goTo, { n: i + 1 })}
                // 24×32 hit area around a small visual dot.
                className="group grid h-8 min-w-6 place-items-center rounded px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:h-10"
                key={s.id}
                onClick={() => setStep(i)}
                type="button"
              >
                <span className={cn("block h-1.5 rounded-full transition-all", i === step ? "w-6 bg-foreground" : "w-1.5 bg-foreground/20 group-hover:bg-foreground/40")} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step === 0 ? (
              <DialogClose render={<Button size="sm" type="button" variant="ghost" />}>{t.skip}</DialogClose>
            ) : (
              <Button onClick={() => go(-1)} size="sm" type="button" variant="ghost">
                {t.back}
              </Button>
            )}
            {last ? (
              <DialogClose
                onClick={() => {
                  finished.current = true;
                }}
                render={<Button size="sm" type="button" />}
              >
                {t.done}
                <ArrowRightIcon aria-hidden className="rtl:rotate-180" />
              </DialogClose>
            ) : (
              <Button onClick={() => go(1)} size="sm" type="button">
                {t.next}
                <ArrowRightIcon aria-hidden className="rtl:rotate-180" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WelcomeTour(props: WelcomeTourProps) {
  return (
    <ScreenBoundary name="WelcomeTour">
      <WelcomeTourScreen {...props} />
    </ScreenBoundary>
  );
}
