"use client";

import { cn } from "@workspace/ui/lib/utils";
import type { ComponentProps } from "react";
import {
  Group as ResizablePanelGroupPrimitive,
  Panel as ResizablePanelPrimitive,
  Separator as ResizableSeparatorPrimitive,
} from "react-resizable-panels";

const ResizablePanelGroup = ({
  className,
  ...props
}: ComponentProps<typeof ResizablePanelGroupPrimitive>) => (
  <ResizablePanelGroupPrimitive
    className={cn(
      "flex h-full w-full aria-[orientation=vertical]:flex-col",
      className
    )}
    data-slot="resizable-panel-group"
    {...props}
  />
);

const ResizablePanel = ({
  ...props
}: ComponentProps<typeof ResizablePanelPrimitive>) => (
  <ResizablePanelPrimitive data-slot="resizable-panel" {...props} />
);

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: ComponentProps<typeof ResizableSeparatorPrimitive> & {
  withHandle?: boolean;
}) => (
  <ResizableSeparatorPrimitive
    className={cn(
      "bg-border ring-offset-background focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:outline-hidden aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-1 aria-[orientation=horizontal]:after:w-full aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2 [&[aria-orientation=horizontal]>div]:rotate-90",
      className
    )}
    data-slot="resizable-handle"
    {...props}
  >
    {withHandle && (
      <div className="bg-border z-10 flex h-6 w-1 shrink-0 rounded-lg" />
    )}
  </ResizableSeparatorPrimitive>
);

export { ResizableHandle, ResizablePanel, ResizablePanelGroup };
