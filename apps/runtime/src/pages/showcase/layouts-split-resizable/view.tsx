// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Badge } from "@wirefront/ui/badge";
import { Button } from "@wirefront/ui/button";
import { cn } from "@wirefront/ui/lib/utils";
import { PaneResizer } from "@wirefront/ui/wirefront/pane-resizer";
import { ScreenBoundary } from "@wirefront/ui/wirefront/boundary";
import { interpolate, useMessages } from "@wirefront/ui/wirefront/provider";
import { GripVerticalIcon, RotateCcwIcon } from "lucide-react";
import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("splitPanes.<key>"). */
export const SPLIT_PANES_MESSAGES = {
  resize: "Resize panes",
  ratio: "{start}% / {end}%",
  reset: "Reset",
  show: "Show",
};

export interface SplitPanesProps {
  /** The two panes, side by side from md up. */
  start: ReactNode;
  end: ReactNode;
  /** Names for the panes; phones switch between them with these. */
  startLabel: string;
  endLabel: string;
  /** The top bar's left side, e.g. a file path and toolbar. */
  title?: ReactNode;
  /** Where the split starts, as the start pane's share in percent. */
  defaultStartPct?: number;
  /** Neither pane gets narrower than this. */
  minPanePx?: number;
  /** Called when the split changes. */
  onSplitChange?: (startPct: number) => void;
  className?: string;
}

const DEFAULT_MIN_PX = 280;

/** Two resizable panes from md up; one at a time, picked from a switch, on phones. */
function SplitPanesScreen({ start, end, startLabel, endLabel, title, defaultStartPct = 50, minPanePx = DEFAULT_MIN_PX, onSplitChange, className }: SplitPanesProps) {
  const t = useMessages("splitPanes", SPLIT_PANES_MESSAGES);
  const id = useId();
  const [pct, setPct] = useState(defaultStartPct);
  const [dragging, setDragging] = useState(false);
  const [mobile, setMobile] = useState<"start" | "end">("start");
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Each pane keeps at least minPanePx; percentages alone collapse panes on narrow screens.
  const minPct = width > 0 ? Math.min(50, Math.max(15, (minPanePx / width) * 100)) : 15;
  const set = (next: number) => {
    setPct(next);
    onSplitChange?.(next);
  };
  const shown = Math.round(pct);

  return (
    <div className={cn("flex h-svh flex-col overflow-hidden bg-background text-foreground", dragging && "cursor-col-resize select-none", className)}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-border/60 border-b px-2 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">{title}</div>
        {/* Split ratio + reset only matter when the split is visible (md+). */}
        <div className="ms-auto hidden shrink-0 items-center gap-2 md:flex">
          <Badge className="font-mono text-[10px] tracking-wider" variant="outline">
            {interpolate(t.ratio, { start: shown, end: 100 - shown })}
          </Badge>
          <Button disabled={shown === Math.round(defaultStartPct)} onClick={() => set(defaultStartPct)} size="xs" variant="ghost">
            <RotateCcwIcon />
            {t.reset}
          </Button>
        </div>
      </header>

      {/* Below md the panes are shown one at a time. */}
      <RadioGroup aria-label={t.show} className="flex shrink-0 gap-1 border-border/60 border-b p-1.5 md:hidden" onValueChange={(v) => setMobile(v as "start" | "end")} value={mobile}>
        {(["start", "end"] as const).map((pane) => (
          <Radio.Root
            className="min-h-10 flex-1 cursor-pointer rounded-md font-mono text-muted-foreground text-xs outline-none transition-colors hover:bg-foreground/4 focus-visible:ring-2 focus-visible:ring-ring data-checked:bg-foreground/8 data-checked:text-foreground"
            key={pane}
            value={pane}
          >
            {pane === "start" ? startLabel : endLabel}
          </Radio.Root>
        ))}
      </RadioGroup>

      <div className="relative flex min-h-0 flex-1 overflow-hidden" ref={containerRef} style={{ "--start": `${pct}%` } as CSSProperties}>
        <section
          aria-label={startLabel}
          className={cn("min-w-0 flex-col overflow-hidden bg-foreground/2 md:flex md:w-(--start) md:shrink-0 md:border-border/60 md:border-e", mobile === "start" ? "flex w-full" : "hidden")}
          id={`${id}-start`}
        >
          {start}
        </section>
        <PaneResizer
          className={cn("group relative z-10 -mx-1.5 hidden w-3 shrink-0 items-center justify-center md:flex", dragging ? "bg-foreground/10" : "hover:bg-foreground/6 focus-visible:bg-foreground/8")}
          controls={`${id}-start`}
          fromDrag={(startPct, grownPx) => (width > 0 ? startPct + (grownPx / width) * 100 : startPct)}
          label={t.resize}
          largeStep={20}
          max={100 - minPct}
          min={minPct}
          onChange={set}
          onDraggingChange={setDragging}
          onReset={() => set(defaultStartPct)}
          side="start"
          step={5}
          value={pct}
        >
          <span aria-hidden className="pointer-events-none flex h-10 w-3 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100">
            <GripVerticalIcon className="size-3 text-muted-foreground" />
          </span>
        </PaneResizer>
        <section aria-label={endLabel} className={cn("min-w-0 flex-1 flex-col overflow-hidden bg-background md:flex", mobile === "end" ? "flex" : "hidden", dragging && "pointer-events-none")}>
          {end}
        </section>
      </div>
    </div>
  );
}

export function SplitPanes(props: SplitPanesProps) {
  return (
    <ScreenBoundary name="SplitPanes">
      <SplitPanesScreen {...props} />
    </ScreenBoundary>
  );
}
