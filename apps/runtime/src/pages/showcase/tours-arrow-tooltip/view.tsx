// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Popover } from "@base-ui/react/popover";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { TooltipStep } from "./schema";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("tooltipTour.<key>"). */
export const TOOLTIP_TOUR_MESSAGES = {
  progress: "Tip · {n} / {total}",
  close: "Close tips",
  back: "Back",
  next: "Next",
  done: "Done",
};

export interface TooltipTourProps {
  steps: TooltipStep[];
  /** Whether the tips are showing. */
  open: boolean;
  /** Called when they end: true if they reached the last tip, false if closed. */
  onClose: (finished: boolean) => void;
  /** Called with the current step's target (or null), e.g. to highlight it. */
  onStepChange?: (target: string | null) => void;
}

// A non-modal Popover anchored to the real target, so Base UI handles placement: right of the
// target when there's room, flipping or dropping below it on narrow screens. The arrow follows.
function TooltipTourScreen({ steps, open, onClose, onStepChange }: TooltipTourProps) {
  const t = useMessages("tooltipTour", TOOLTIP_TOUR_MESSAGES);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);
  const current = open ? steps[step] : undefined;
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => {
    onStepChange?.(current?.target ?? null);
    if (!current) return setAnchor(null);
    const el = document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`);
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    setAnchor(el);
  }, [current, onStepChange]);
  const last = step === steps.length - 1;

  return (
    <Popover.Root
      modal={false}
      onOpenChange={(next, details) => {
        // A tour shouldn't vanish on a stray tap outside; Esc still closes.
        if (!next && details.reason !== "outside-press") onClose(false);
      }}
      open={Boolean(current && anchor)}
    >
      <Popover.Portal>
        <Popover.Positioner align="center" anchor={anchor} className="z-40" collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "end" }} collisionPadding={16} side="right" sideOffset={12}>
          <Popover.Popup
            className="w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-foreground p-4 text-background shadow-2xl outline-none motion-safe:transition-[opacity,scale] data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            initialFocus={false}
          >
            <Popover.Arrow className="size-3 rotate-45 rounded-[2px] bg-foreground data-[side=bottom]:-top-1.5 data-[side=left]:-end-1.5 data-[side=right]:-start-1.5 data-[side=top]:-bottom-1.5" />
            {current ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-60">{interpolate(t.progress, { n: step + 1, total: steps.length })}</div>
                    <Popover.Title className="mt-1 font-medium text-sm">{current.title}</Popover.Title>
                  </div>
                  <Popover.Close aria-label={t.close} className="-me-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-md opacity-60 outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-background pointer-coarse:size-10">
                    <XIcon aria-hidden className="size-3.5" />
                  </Popover.Close>
                </div>
                <Popover.Description className="mt-2 text-xs leading-relaxed opacity-80">{current.body}</Popover.Description>
                <div className="mt-3 flex items-center justify-between border-background/15 border-t pt-3">
                  <div aria-hidden className="flex items-center gap-1">
                    {steps.map((s, i) => (
                      <span className={cn("h-1 rounded-full transition-all", i === step ? "w-4 bg-background" : i < step ? "w-1 bg-background/60" : "w-1 bg-background/20")} key={s.id} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button className="text-background/80 hover:bg-background/10 hover:text-background" disabled={step === 0} onClick={() => setStep((s) => Math.max(s - 1, 0))} size="sm" type="button" variant="ghost">
                      {t.back}
                    </Button>
                    <Button className="bg-background text-foreground hover:bg-background/90" onClick={() => (last ? onClose(true) : setStep((s) => s + 1))} size="sm" type="button">
                      {last ? t.done : t.next}
                      {last ? null : <ArrowRightIcon aria-hidden className="rtl:rotate-180" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function TooltipTour(props: TooltipTourProps) {
  return (
    <ScreenBoundary name="TooltipTour">
      <TooltipTourScreen {...props} />
    </ScreenBoundary>
  );
}
