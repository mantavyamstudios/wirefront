"use client";

import { motion } from "motion/react";
import type {
  HTMLMotionProps,
  TargetAndTransition,
  Transition,
} from "motion/react";
import type * as React from "react";

import { useAutoHeight } from "@/registry/hooks/use-auto-height";
import { Slot } from "@/registry/primitives/animate/slot";
import type { WithAsChild } from "@/registry/primitives/animate/slot";

type AutoHeightProps = WithAsChild<
  {
    children: React.ReactNode;
    animate?: TargetAndTransition;
    transition?: Transition;
  } & Omit<HTMLMotionProps<"div">, "animate">
>;

const AUTO_HEIGHT_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  bounce: 0,
  restDelta: 0.01,
} as const;

const AutoHeight = ({
  children,
  transition = AUTO_HEIGHT_DEFAULT_TRANSITION,
  style,
  animate,
  asChild = false,
  ...props
}: AutoHeightProps) => {
  const { ref, height } = useAutoHeight<HTMLDivElement>();

  const Comp = asChild ? Slot : motion.div;

  return (
    <Comp
      animate={{ height: height || "auto", ...animate }}
      style={{ overflow: "hidden", ...style }}
      transition={transition}
      {...props}
    >
      <div ref={ref}>{children}</div>
    </Comp>
  );
};

export { AutoHeight, type AutoHeightProps };
