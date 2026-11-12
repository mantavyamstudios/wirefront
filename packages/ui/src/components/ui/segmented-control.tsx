// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client"

import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const segmentedControlVariants = cva(
  "group/segmented m-0 inline-flex w-fit min-w-0 items-center gap-0.5 rounded-lg border-0 bg-muted p-0.5 text-muted-foreground",
  {
    variants: {
      size: {
        sm: "h-8",
        default: "h-9",
        lg: "h-10",
      },
    },
    defaultVariants: { size: "default" },
  },
)

/**
 * A row of mutually exclusive options. The screen owns the state: mark the
 * active item with `aria-pressed`/`data-pressed` (toggle buttons) or
 * `role="radio"` + `aria-checked`/`data-checked` inside `role="radiogroup"`.
 */
function SegmentedControl({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"fieldset"> & VariantProps<typeof segmentedControlVariants>) {
  return (
    <fieldset
      data-slot="segmented-control"
      data-size={size}
      className={cn(segmentedControlVariants({ size }), className)}
      {...props}
    />
  )
}

function SegmentedControlItem({ className, type = "button", ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex h-full items-center justify-center gap-1.5 rounded-md px-2.5 text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 group-data-[size=sm]/segmented:px-2 group-data-[size=sm]/segmented:text-xs data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm data-checked:bg-background data-checked:text-foreground data-checked:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

export { SegmentedControl, SegmentedControlItem, segmentedControlVariants }
