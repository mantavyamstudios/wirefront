import { cn } from "@workspace/ui/lib/utils";
import { div as MotionDiv } from "motion/react-client";
import type * as React from "react";

import {
  TooltipArrow as TooltipArrowPrimitive,
  TooltipContent as TooltipContentPrimitive,
  Tooltip as TooltipPrimitive,
  TooltipProvider as TooltipProviderPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
} from "@/registry/primitives/animate/tooltip";
import type {
  TooltipContentProps as TooltipContentPrimitiveProps,
  TooltipProps as TooltipPrimitiveProps,
  TooltipProviderProps as TooltipProviderPrimitiveProps,
  TooltipTriggerProps as TooltipTriggerPrimitiveProps,
} from "@/registry/primitives/animate/tooltip";

type TooltipProviderProps = TooltipProviderPrimitiveProps;

const TooltipProvider = ({
  openDelay = 300,
  ...props
}: TooltipProviderProps) => (
  <TooltipProviderPrimitive openDelay={openDelay} {...props} />
);

type TooltipProps = TooltipPrimitiveProps;

const Tooltip = ({ sideOffset = 10, ...props }: TooltipProps) => (
  <TooltipPrimitive sideOffset={sideOffset} {...props} />
);

type TooltipTriggerProps = TooltipTriggerPrimitiveProps;

const TooltipTrigger = ({ ...props }: TooltipTriggerProps) => (
  <TooltipTriggerPrimitive {...props} />
);

type TooltipContentProps = Omit<TooltipContentPrimitiveProps, "asChild"> & {
  children: React.ReactNode;
  layout?: boolean | "position" | "size" | "preserve-aspect";
};

const TooltipContent = ({
  className,
  children,
  layout = "preserve-aspect",
  ...props
}: TooltipContentProps) => (
  <TooltipContentPrimitive
    className={cn(
      "bg-primary text-primary-foreground z-50 w-fit rounded-md",
      className
    )}
    {...props}
  >
    <MotionDiv className="overflow-hidden px-3 py-1.5 text-xs text-balance">
      <MotionDiv layout={layout}>{children}</MotionDiv>
    </MotionDiv>
    <TooltipArrowPrimitive
      className="fill-primary size-3 data-[side='bottom']:translate-y-px data-[side='left']:-translate-x-px data-[side='right']:translate-x-px data-[side='top']:-translate-y-px"
      tipRadius={2}
    />
  </TooltipContentPrimitive>
);

export {
  Tooltip,
  TooltipContent,
  type TooltipContentProps,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipTrigger,
  type TooltipTriggerProps,
};
