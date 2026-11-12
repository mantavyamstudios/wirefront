// SPDX-License-Identifier: MIT
// shadcn/ui (base-nova style) © 2023 shadcn — https://ui.shadcn.com · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client"

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"
import { cn } from "../../lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
