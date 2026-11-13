// SPDX-License-Identifier: MIT
// shadcn/ui (base-nova style) © 2023 shadcn — https://ui.shadcn.com · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { cn } from "../../lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
