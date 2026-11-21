/* oxlint-disable react/no-array-index-key -- Segment indices are stable for static text content. */
"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  AnimatePresence,
  motion,
  stagger,
  useInView,
  useReducedMotion,
} from "motion/react";
import type {
  TargetAndTransition,
  Transition,
  UseInViewOptions,
  Variant,
  Variants,
} from "motion/react";
import React, { memo, useMemo, useRef } from "react";
import type { ComponentPropsWithoutRef, JSX } from "react";

export type TextEffectPreset =
  | "blur"
  | "fade-in-blur"
  | "scale"
  | "fade"
  | "slide";

export type TextEffectPer = "word" | "char" | "line";

export interface TextEffectProps extends ComponentPropsWithoutRef<"div"> {
  as?: keyof JSX.IntrinsicElements;
  children: string;
  className?: string;
  containerTransition?: Transition;
  delay?: number;
  onAnimationComplete?: () => void;
  onAnimationStart?: () => void;
  /**
   * When `scrollTrigger` is enabled, fire the reveal only once.
   * @default true
   */
  once?: boolean;
  per?: TextEffectPer;
  preset?: TextEffectPreset;
  /**
   * When `true`, reveal only after the element enters the viewport.
   * @default false
   */
  scrollTrigger?: boolean;
  segmentTransition?: Transition;
  segmentWrapperClassName?: string;
  speedReveal?: number;
  speedSegment?: number;
  style?: React.CSSProperties;
  /**
   * When `true`, animates to the visible state. When `false`, holds the hidden
   * state. Ignored when `scrollTrigger` is enabled.
   * @default true
   */
  trigger?: boolean;
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  /**
   * Intersection margin used when `scrollTrigger` is enabled.
   * @default "0px 0px -10% 0px"
   */
  viewportMargin?: UseInViewOptions["margin"];
}

const defaultStaggerTimes: Record<TextEffectPer, number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
};

const defaultContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: stagger(0.05),
    },
  },
  exit: {
    transition: { delayChildren: stagger(0.05, { from: "last" }) },
  },
};

const WHITESPACE_SPLIT_RE = /(?<space>\s+)/u;

const presetVariants: Record<
  TextEffectPreset,
  { container: Variants; item: Variants }
> = {
  blur: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: "blur(12px)" },
      visible: { opacity: 1, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(12px)" },
    },
  },
  "fade-in-blur": {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20, filter: "blur(12px)" },
      visible: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, y: 20, filter: "blur(12px)" },
    },
  },
  scale: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
};

const AnimationComponent = memo(
  ({
    segment,
    variants,
    per,
    segmentWrapperClassName,
  }: {
    segment: string;
    variants: Variants;
    per: TextEffectPer;
    segmentWrapperClassName?: string;
  }) => {
    let content: React.ReactNode;

    if (per === "line") {
      content = (
        <motion.span className="block" variants={variants}>
          {segment}
        </motion.span>
      );
    } else if (per === "word") {
      content = (
        <motion.span
          aria-hidden="true"
          className="inline-block whitespace-pre"
          variants={variants}
        >
          {segment}
        </motion.span>
      );
    } else if (segment.trim() === "") {
      content = <span className="inline-block whitespace-pre">{segment}</span>;
    } else {
      content = (
        <span className="inline-block whitespace-nowrap">
          {segment.split("").map((char, charIndex) => (
            <motion.span
              aria-hidden="true"
              className="inline-block whitespace-pre will-change-[opacity,filter,transform]"
              key={`${segment}-${charIndex}`}
              variants={variants}
            >
              {char}
            </motion.span>
          ))}
        </span>
      );
    }

    if (!segmentWrapperClassName) {
      return content;
    }

    const defaultWrapperClassName = per === "line" ? "block" : "inline-block";

    return (
      <span className={cn(defaultWrapperClassName, segmentWrapperClassName)}>
        {content}
      </span>
    );
  }
);
AnimationComponent.displayName = "AnimationComponent";

const splitText = (text: string, per: TextEffectPer) => {
  if (per === "line") {
    return text.split("\n");
  }

  return text.split(WHITESPACE_SPLIT_RE);
};

const hasTransition = (
  variant?: Variant
): variant is TargetAndTransition & { transition?: Transition } => {
  if (!variant) {
    return false;
  }

  return typeof variant === "object" && "transition" in variant;
};

const createVariantsWithTransition = (
  baseVariants: Variants,
  transition?: Transition & { exit?: Transition }
): Variants => {
  if (!transition) {
    return baseVariants;
  }

  const { exit, ...mainTransition } = transition;

  const visibleTransition = hasTransition(baseVariants.visible)
    ? { ...baseVariants.visible.transition, ...mainTransition }
    : { ...mainTransition };

  const exitTransition = hasTransition(baseVariants.exit)
    ? { ...baseVariants.exit.transition, ...mainTransition, ...exit }
    : { ...mainTransition, ...exit };

  return {
    ...baseVariants,
    visible: {
      ...baseVariants.visible,
      transition: visibleTransition,
    },
    exit: {
      ...baseVariants.exit,
      transition: exitTransition,
    },
  };
};

export const blurRevealItemVariants = ({
  blur = 4,
  yOffset = 0,
}: {
  blur?: number;
  yOffset?: number;
} = {}): Variants => ({
  hidden: { opacity: 0, y: yOffset, filter: `blur(${blur}px)` },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: yOffset, filter: `blur(${blur}px)` },
});

export const TextEffect = ({
  children,
  per = "word",
  as = "p",
  variants,
  className,
  preset = "fade",
  delay = 0,
  speedReveal = 1,
  speedSegment = 1,
  scrollTrigger = false,
  once = true,
  viewportMargin = "0px 0px -10% 0px",
  trigger = true,
  onAnimationComplete,
  onAnimationStart,
  segmentWrapperClassName,
  containerTransition,
  segmentTransition,
  style,
}: TextEffectProps) => {
  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(scrollRef, {
    margin: viewportMargin,
    once,
  });
  const shouldReveal = scrollTrigger ? isInView : trigger;
  const segments = useMemo(() => splitText(children, per), [children, per]);
  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;

  const computedVariants = useMemo(() => {
    const baseVariants = presetVariants[preset];
    const interval = defaultStaggerTimes[per] / speedReveal;
    const baseDuration = 0.3 / speedSegment;

    const fallbackContainer = variants?.container ?? baseVariants.container;
    const fallbackItem = variants?.item ?? baseVariants.item;

    const visibleVariant = variants?.container?.visible;
    const customDelay = hasTransition(visibleVariant)
      ? visibleVariant.transition?.delayChildren
      : undefined;
    const startDelay = typeof customDelay === "number" ? customDelay : delay;

    return {
      container: createVariantsWithTransition(fallbackContainer, {
        delayChildren: stagger(interval, { startDelay }),
        ...containerTransition,
        // Segments leave in reverse order.
        exit: {
          delayChildren: stagger(interval, { startDelay, from: "last" }),
        },
      }),
      item: createVariantsWithTransition(fallbackItem, {
        duration: baseDuration,
        ...segmentTransition,
      }),
    };
  }, [
    containerTransition,
    delay,
    per,
    preset,
    segmentTransition,
    speedReveal,
    speedSegment,
    variants?.container,
    variants?.item,
  ]);

  if (prefersReducedMotion) {
    const Tag = as;

    return (
      <Tag className={cn("leading-relaxed", className)} style={style}>
        {children}
      </Tag>
    );
  }

  return (
    <AnimatePresence mode="popLayout">
      <div
        ref={scrollTrigger ? scrollRef : undefined}
        style={scrollTrigger ? undefined : { display: "contents" }}
      >
        <MotionTag
          animate={shouldReveal ? "visible" : "hidden"}
          className={cn("leading-relaxed", className)}
          exit="exit"
          initial="hidden"
          key={children}
          onAnimationComplete={onAnimationComplete}
          onAnimationStart={onAnimationStart}
          style={style}
          variants={computedVariants.container}
        >
          {per === "line" ? null : <span className="sr-only">{children}</span>}
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}-${segment}`}
              per={per}
              segment={segment}
              segmentWrapperClassName={segmentWrapperClassName}
              variants={computedVariants.item}
            />
          ))}
        </MotionTag>
      </div>
    </AnimatePresence>
  );
};
