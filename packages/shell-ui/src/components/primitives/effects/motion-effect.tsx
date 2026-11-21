"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import type {
  HTMLMotionProps,
  Transition,
  UseInViewOptions,
  Variant,
} from "motion/react";
import type * as React from "react";
import { useImperativeHandle, useRef } from "react";

type MotionEffectProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  className?: string;
  transition?: Transition;
  delay?: number;
  inView?: boolean;
  inViewMargin?: UseInViewOptions["margin"];
  inViewOnce?: boolean;
  blur?: string | boolean;
  slide?:
    | {
        direction?: "up" | "down" | "left" | "right";
        offset?: number;
      }
    | boolean;
  fade?: { initialOpacity?: number; opacity?: number } | boolean;
  zoom?:
    | {
        initialScale?: number;
        scale?: number;
      }
    | boolean;
};

const MOTION_EFFECT_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 20,
} as const;

type EffectOptions = Pick<
  MotionEffectProps,
  "blur" | "fade" | "slide" | "zoom"
>;
interface VariantPair {
  hidden: Variant;
  visible: Variant;
}

const slideVariants = (slide: MotionEffectProps["slide"]): VariantPair => {
  if (!slide) {
    return { hidden: {}, visible: {} };
  }
  const offset = typeof slide === "boolean" ? 100 : (slide.offset ?? 100);
  const direction =
    typeof slide === "boolean" ? "left" : (slide.direction ?? "left");
  const axis = direction === "up" || direction === "down" ? "y" : "x";
  return {
    hidden: {
      [axis]: direction === "left" || direction === "up" ? -offset : offset,
    },
    visible: { [axis]: 0 },
  };
};

const fadeVariants = (fade: MotionEffectProps["fade"]): VariantPair => {
  if (!fade) {
    return { hidden: {}, visible: {} };
  }
  return typeof fade === "boolean"
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: fade.initialOpacity ?? 0 },
        visible: { opacity: fade.opacity ?? 1 },
      };
};

const zoomVariants = (zoom: MotionEffectProps["zoom"]): VariantPair => {
  if (!zoom) {
    return { hidden: {}, visible: {} };
  }
  return typeof zoom === "boolean"
    ? { hidden: { scale: 0.5 }, visible: { scale: 1 } }
    : {
        hidden: { scale: zoom.initialScale ?? 0.5 },
        visible: { scale: zoom.scale ?? 1 },
      };
};

const blurVariants = (blur: MotionEffectProps["blur"]): VariantPair => {
  if (!blur) {
    return { hidden: {}, visible: {} };
  }
  return {
    hidden: {
      filter: typeof blur === "boolean" ? "blur(10px)" : `blur(${blur})`,
    },
    visible: { filter: "blur(0px)" },
  };
};

/** The hidden and visible states for the chosen effects, combined. */
const buildVariants = ({
  blur,
  fade,
  slide,
  zoom,
}: EffectOptions): VariantPair => {
  const parts = [
    slideVariants(slide),
    fadeVariants(fade),
    zoomVariants(zoom),
    blurVariants(blur),
  ];
  return {
    hidden: Object.assign({}, ...parts.map((part) => part.hidden)),
    visible: Object.assign({}, ...parts.map((part) => part.visible)),
  };
};

const MotionEffect = ({
  ref,
  children,
  className,
  transition = MOTION_EFFECT_DEFAULT_TRANSITION,
  delay = 0,
  inView = false,
  inViewMargin = "0px",
  inViewOnce = true,
  blur = false,
  slide = false,
  fade = false,
  zoom = false,
  ...props
}: MotionEffectProps) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(
    ref as React.Ref<HTMLDivElement>,
    () => localRef.current as HTMLDivElement
  );

  const inViewResult = useInView(localRef, {
    once: inViewOnce,
    margin: inViewMargin,
  });
  const isInView = !inView || inViewResult;

  const { hidden: hiddenVariant, visible: visibleVariant } = buildVariants({
    blur,
    fade,
    slide,
    zoom,
  });

  return (
    <AnimatePresence>
      <motion.div
        animate={isInView ? "visible" : "hidden"}
        className={className}
        data-slot="motion-effect"
        exit="hidden"
        initial="hidden"
        ref={localRef}
        transition={{
          ...transition,
          delay: (transition?.delay ?? 0) + delay,
        }}
        variants={{
          hidden: hiddenVariant,
          visible: visibleVariant,
        }}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export { MotionEffect, type MotionEffectProps };
export default MotionEffect;
