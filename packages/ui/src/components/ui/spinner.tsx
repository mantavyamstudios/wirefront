// SPDX-License-Identifier: AGPL-3.0-only
// coss ui © Cal.com, Inc. — https://coss.com/ui · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { Loader2Icon } from "lucide-react";
import type React from "react";
import { cn } from "../../lib/utils";

export function Spinner({
  className,
  ...props
}: React.ComponentProps<typeof Loader2Icon>): React.ReactElement {
  return (
    <Loader2Icon
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}
