"use client";

import { cn } from "@workspace/ui/lib/utils";
import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

const Label = ({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) => (
  <LabelPrimitive.Root
    className={cn(
      "text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    data-slot="label"
    {...props}
  />
);

export { Label };
