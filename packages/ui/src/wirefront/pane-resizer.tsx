// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * A vertical divider that resizes the pane beside it: the WAI-ARIA window
 * splitter. It takes focus, so keyboard users resize with the arrow keys
 * (Shift for bigger steps), Home and End jump to the smallest and largest
 * size, and Enter or a double-click resets. Pointer drags cover mouse, touch
 * and pen. Arrow keys and drags follow the reading direction (RTL too).
 *
 *   <PaneResizer
 *     controls="code-pane" label="Resize panes" side="start"
 *     value={width} min={280} max={720} onChange={setWidth}
 *     fromDrag={(start, grownPx) => start + grownPx} onReset={() => setWidth(480)}
 *   />
 *
 * The controlled pane sits on the `side` of the divider. `fromDrag` turns the
 * pixels the pane has grown by since the drag started into a new value, so the
 * value can be pixels, a percentage or anything else.
 */
import { type KeyboardEvent, type PointerEvent, type ReactNode, useRef } from "react";

import { cn } from "../lib/utils";

export interface PaneResizerProps {
  /** What the divider resizes, e.g. "Resize panes". */
  label: string;
  /** The id of the pane it resizes. */
  controls?: string;
  /** Which side of the divider the resized pane is on. */
  side: "start" | "end";
  value: number;
  min: number;
  max: number;
  /** Arrow-key step; Shift uses `largeStep`. In the value's units. */
  step?: number;
  largeStep?: number;
  /** The new value, already kept within min…max. */
  onChange: (value: number) => void;
  /** Turn pixels grown since the drag started into a value. */
  fromDrag: (startValue: number, grownPx: number) => number;
  /** Enter and double-click call this. */
  onReset?: () => void;
  onDraggingChange?: (dragging: boolean) => void;
  className?: string;
  /** The visible grip. */
  children?: ReactNode;
}

export function PaneResizer({
  label,
  controls,
  side,
  value,
  min,
  max,
  step = 16,
  largeStep = 64,
  onChange,
  fromDrag,
  onReset,
  onDraggingChange,
  className,
  children,
}: PaneResizerProps) {
  const drag = useRef<{ x: number; value: number; rtl: boolean } | null>(null);
  const clamp = (v: number) => Math.min(Math.max(v, min), max);
  const isRtl = (el: Element) => getComputedStyle(el).direction === "rtl";
  // +1 when moving toward the reading end grows the pane (it sits at the start).
  const growth = (rtl: boolean) => (side === "start" ? 1 : -1) * (rtl ? -1 : 1);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, value, rtl: isRtl(e.currentTarget) };
    onDraggingChange?.(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    onChange(clamp(fromDrag(d.value, (e.clientX - d.x) * growth(d.rtl))));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    onDraggingChange?.(false);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const amount = e.shiftKey ? largeStep : step;
    const sign = growth(isRtl(e.currentTarget));
    if (e.key === "ArrowRight") onChange(clamp(value + amount * sign));
    else if (e.key === "ArrowLeft") onChange(clamp(value - amount * sign));
    else if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
    else if (e.key === "Enter" && onReset) onReset();
    else return;
    e.preventDefault();
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA window splitter; <hr> can't take focus or keyboard input. Approved exception, D-017 (the one shared splitter).
    <div
      aria-controls={controls}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemax={Math.round(max)}
      aria-valuemin={Math.round(min)}
      aria-valuenow={Math.round(value)}
      className={cn("cursor-col-resize touch-none outline-none", className)}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="separator"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
