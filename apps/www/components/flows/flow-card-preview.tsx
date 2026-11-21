"use client";

import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** Two captured screens of a flow and where screen 1 was tapped (0–1). */
export interface FlowCardMedia {
  screens: string[];
  tap?: { x: number; y: number };
}

// Layout from the measured box, after Mobbin's flow cards: each screen is
// 28.8% of the width (≈ 1.1× the height on a 16:9 card); screen 1 leaves
// white space at the top and runs off the bottom, screen 2 is lifted so its
// top is clipped and it leaves the same space at the bottom. The pair is
// centred with the connector in the gap, so a wide box (the list view's
// full-width rows) works as well as a 16:9 card.
const SCREEN_WIDTH = 0.288; // of the box width
const SCREEN_ASPECT = 824 / 384;
const EDGE_GAP = 0.125; // of the box height
const PAIR_GAP = 0.1875; // of the box width
const CONNECTOR_END_Y = 0.27; // of the box height, on screen 2's left edge
// In very wide boxes, width-based sizing would make screens many times the
// box height and show only a sliver of each; cap them (16:9 cards ≈ 1.1×).
const MAX_SCREEN_HEIGHT = 1.6; // of the box height

interface Box {
  height: number;
  width: number;
}

interface Placement {
  left: number;
  top: number;
}

function layout(box: Box, pair: boolean) {
  const width = Math.min(
    box.width * SCREEN_WIDTH,
    (box.height * MAX_SCREEN_HEIGHT) / SCREEN_ASPECT
  );
  const height = width * SCREEN_ASPECT;
  const edge = box.height * EDGE_GAP;
  const gap = box.width * PAIR_GAP;
  const first: Placement = pair
    ? { left: (box.width - gap) / 2 - width, top: edge }
    : { left: (box.width - width) / 2, top: edge };
  const second: Placement = {
    left: (box.width + gap) / 2,
    top: box.height - edge - height,
  };
  return { first, height, second, width };
}

function Screen({
  active,
  lift,
  placement,
  src,
  width,
}: {
  active: boolean;
  lift: number;
  placement: Placement;
  src: string;
  width: number;
}) {
  return (
    <div
      className={cn(
        "absolute overflow-hidden rounded-[10px] border-[3px] border-zinc-900 bg-zinc-900 shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)] ring-1 ring-black/5 dark:border-zinc-800 dark:ring-white/10",
        "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none"
      )}
      style={{
        left: placement.left,
        top: placement.top,
        width,
        aspectRatio: "384 / 824",
        transform: active ? `translateY(${lift}%)` : undefined,
      }}
    >
      <Image
        alt=""
        aria-hidden
        className="size-full object-cover object-top"
        draggable={false}
        height={824}
        sizes="(max-width: 640px) 34vw, 20vw"
        src={src}
        width={384}
      />
    </div>
  );
}

/**
 * Mobbin-style flow card: the first screen, the screen its primary action
 * leads to, and a connector from the tapped row. Built in markup (not a baked
 * image), so it follows the theme and stays sharp at any size and aspect.
 */
export function FlowCardPreview({
  active,
  media,
}: {
  active: boolean;
  media: FlowCardMedia;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      setBox({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const [first, second] = media.screens;
  const pair = Boolean(second);
  const place = box && box.width > 0 ? layout(box, pair) : null;

  return (
    <div className="absolute inset-0 overflow-hidden" ref={ref}>
      {place && first ? (
        <Screen
          active={active}
          lift={pair ? -1.5 : -2}
          placement={place.first}
          src={first}
          width={place.width}
        />
      ) : null}
      {place && box && second ? (
        <>
          <Screen
            active={active}
            lift={2}
            placement={place.second}
            src={second}
            width={place.width}
          />
          <Connector box={box} place={place} tapY={media.tap?.y} />
        </>
      ) : null}
    </div>
  );
}

/** From screen 1's right edge at the tapped row to screen 2's left edge. */
function Connector({
  box,
  place,
  tapY = 0.45,
}: {
  box: Box;
  place: ReturnType<typeof layout>;
  tapY?: number;
}) {
  const unit = box.width / 1600; // stroke and marker sizes scale with the box
  const startX = place.first.left + place.width;
  const startY = Math.min(
    Math.max(place.first.top + tapY * place.height, box.height * 0.22),
    box.height * 0.93
  );
  const endX = place.second.left - 18 * unit;
  const endY = box.height * CONNECTOR_END_Y;
  const curve = (endX - startX) * 0.55;
  const diamond = 26 * unit;

  return (
    <svg
      aria-hidden
      className="text-foreground/30 pointer-events-none absolute inset-0 size-full"
      viewBox={`0 0 ${box.width} ${box.height}`}
    >
      <path
        d={`M ${startX} ${startY} C ${startX + curve} ${startY}, ${endX - curve} ${endY}, ${endX} ${endY}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={Math.max(1.5, 6 * unit)}
      />
      <path
        d={`M ${endX - 4 * unit} ${endY - 20 * unit} L ${endX + 22 * unit} ${endY} L ${endX - 4 * unit} ${endY + 20 * unit} Z`}
        fill="currentColor"
      />
      <rect
        className="fill-background"
        height={diamond}
        stroke="currentColor"
        strokeWidth={Math.max(1.25, 5 * unit)}
        transform={`rotate(45 ${startX} ${startY})`}
        width={diamond}
        x={startX - diamond / 2}
        y={startY - diamond / 2}
      />
    </svg>
  );
}
