// SPDX-License-Identifier: MIT
// shadcn/ui (base-nova style) © 2023 shadcn — https://ui.shadcn.com · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { cn } from "../../lib/utils"
import { Loader2Icon } from "lucide-react"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon data-slot="spinner" role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} {...props} />
  )
}

export { Spinner }
