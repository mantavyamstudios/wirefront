// SPDX-License-Identifier: MIT
// shadcn/ui (base-nova style) © 2023 shadcn — https://ui.shadcn.com · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
