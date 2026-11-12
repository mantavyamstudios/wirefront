// SPDX-License-Identifier: AGPL-3.0-only
// coss ui © Cal.com, Inc. — https://coss.com/ui · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type React from "react";
import { cn } from "../../lib/utils";

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props): React.ReactElement {
  return (
    <SeparatorPrimitive
      className={cn(
        "shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px data-[orientation=vertical]:not-[[class^='h-']]:not-[[class*='_h-']]:self-stretch",
        className,
      )}
      data-slot="separator"
      orientation={orientation}
      {...props}
    />
  );
}

export { SeparatorPrimitive };
