// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

/**
 * A scrollable region keyboard users can reach: wide tables, code and panes
 * that scroll sideways or both ways. Built directly on Base UI's ScrollArea
 * (whose viewport is focusable), styled like shadcn's. It doesn't use
 * shadcn's scroll-area: that file only shows a vertical bar, and its unused
 * React import fails the typecheck of shadcn's own Vite and TanStack Start
 * templates.
 *
 *   <ScrollRegion aria-label="Retention by cohort" orientation="horizontal">
 *     <table>…</table>
 *   </ScrollRegion>
 */
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "../lib/utils";

function Bar({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      className="flex touch-none select-none p-px transition-colors data-horizontal:h-2.5 data-vertical:h-full data-vertical:w-2.5 data-horizontal:flex-col data-horizontal:border-t data-vertical:border-l data-horizontal:border-t-transparent data-vertical:border-l-transparent"
      data-orientation={orientation}
      orientation={orientation}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export function ScrollRegion({
  className,
  children,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  /** Which scrollbars to show. */
  orientation?: "vertical" | "horizontal" | "both";
}) {
  return (
    <ScrollAreaPrimitive.Root className={cn("relative", className)} data-slot="scroll-region" {...props}>
      <ScrollAreaPrimitive.Viewport className="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {children}
      </ScrollAreaPrimitive.Viewport>
      {orientation !== "horizontal" ? <Bar orientation="vertical" /> : null}
      {orientation !== "vertical" ? <Bar orientation="horizontal" /> : null}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
