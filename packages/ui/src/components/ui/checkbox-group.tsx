// SPDX-License-Identifier: AGPL-3.0-only
// coss ui © Cal.com, Inc. — https://coss.com/ui · see https://github.com/mantavyamstudios/wirefront/blob/main/NOTICE.md
"use client";

import { CheckboxGroup as CheckboxGroupPrimitive } from "@base-ui/react/checkbox-group";
import type React from "react";
import { cn } from "../../lib/utils";

export function CheckboxGroup({
  className,
  ...props
}: CheckboxGroupPrimitive.Props): React.ReactElement {
  return (
    <CheckboxGroupPrimitive
      className={cn("flex flex-col items-start gap-3", className)}
      {...props}
    />
  );
}

export { CheckboxGroupPrimitive };
