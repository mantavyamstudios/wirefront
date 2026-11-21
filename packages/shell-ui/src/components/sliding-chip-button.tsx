"use client";

import { cn } from "@workspace/ui/lib/utils";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import { useState, useSyncExternalStore } from "react";
import type {
  ComponentPropsWithoutRef,
  FocusEvent,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";

const DEFAULT_EASE = [0.77, 0, 0.175, 1] as const;
const DEFAULT_DURATION = 0.7;

const LABEL_OFFSET_BY_SIZE = {
  sm: { default: -30, lg: -36 },
  default: { default: -38, lg: -46 },
  lg: { default: -44, lg: -52 },
} as const;

const slidingChipButtonVariants = cva(
  "inline-flex min-w-0 shrink-0 cursor-pointer items-center justify-center font-mono whitespace-nowrap uppercase outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        accent: "focus-visible:ring-accent-pro/50",
        inverted: "focus-visible:ring-foreground/30",
        outline: "focus-visible:ring-border",
        ghost: "focus-visible:ring-muted-foreground/30",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "default",
    },
  }
);

const slidingChipButtonChipVariants = cva(
  "pointer-events-none flex items-center justify-center will-change-transform",
  {
    variants: {
      variant: {
        accent: "bg-[rgba(251,70,13)] text-neutral-950",
        inverted: "bg-foreground text-background",
        outline: "border-foreground text-foreground border bg-transparent",
        ghost: "bg-muted text-foreground",
      },
      size: {
        sm: "size-7",
        default: "size-8 lg:size-10",
        lg: "size-10 lg:size-12",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "default",
    },
  }
);

const slidingChipButtonLabelVariants = cva(
  "pointer-events-none flex items-center justify-center will-change-transform",
  {
    variants: {
      variant: {
        accent: "bg-[rgba(251,70,13)] text-neutral-950",
        inverted: "bg-foreground text-background",
        outline: "border-foreground text-foreground border bg-transparent",
        ghost: "bg-muted text-foreground",
      },
      size: {
        sm: "h-7 px-2",
        default: "h-8 flex-1 px-2 lg:h-10 lg:px-3",
        lg: "h-10 flex-1 px-3 lg:h-12 lg:px-4",
      },
    },
    defaultVariants: {
      variant: "accent",
      size: "default",
    },
  }
);

const slidingChipButtonGroupVariants = cva(
  "pointer-events-none relative flex w-full items-center",
  {
    variants: {
      size: {
        sm: "gap-1",
        default: "gap-1.5",
        lg: "gap-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

type SlidingChipButtonSize = NonNullable<
  VariantProps<typeof slidingChipButtonVariants>["size"]
>;

const SlidingChipButtonPlusIcon = ({ className }: { className?: string }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 12 12">
    <path
      d="M6 1v10M1 6h10"
      stroke="currentColor"
      strokeLinecap="square"
      strokeWidth="1.5"
    />
  </svg>
);

const getLinkLabel = (
  children: string | undefined,
  label: string | undefined
): string => {
  if (typeof children === "string") {
    return children;
  }

  return label ?? "";
};

const LARGE_SCREEN_QUERY = "(min-width: 1024px)";

const subscribeLargeScreen = (onChange: () => void) => {
  const mediaQuery = window.matchMedia(LARGE_SCREEN_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
};

const useResponsiveLabelOffset = (
  size: SlidingChipButtonSize,
  labelOffset?: number,
  labelOffsetLg?: number
): number => {
  const offsets = LABEL_OFFSET_BY_SIZE[size ?? "default"];
  const baseOffset = labelOffset ?? offsets.default;
  const largeOffset = labelOffsetLg ?? offsets.lg;
  const isLarge = useSyncExternalStore(
    subscribeLargeScreen,
    () => window.matchMedia(LARGE_SCREEN_QUERY).matches,
    () => false
  );

  // An explicit base offset with no large one applies at every size.
  if (labelOffsetLg === undefined && labelOffset !== undefined) {
    return labelOffset;
  }
  return isLarge ? largeOffset : baseOffset;
};

const resolveMotionTransition = (
  shouldReduceMotion: boolean | null,
  duration: number,
  ease: readonly [number, number, number, number]
): Transition => {
  if (shouldReduceMotion) {
    return { duration: 0 };
  }

  return { duration, ease };
};

type SlidingChipButtonBaseProps = Omit<
  ComponentPropsWithoutRef<"a">,
  "children"
> &
  VariantProps<typeof slidingChipButtonVariants> & {
    /** Alternative to string `children` for demos and controlled previews. */
    label?: string;
    /** Custom label content inside the center chip. `label` is still used for aria-label. */
    labelSlot?: ReactNode;
    /**
     * Animation duration in seconds.
     * @default 0.7
     */
    duration?: number;
    /**
     * Cubic-bezier easing values.
     * @default [0.77, 0, 0.175, 1]
     */
    ease?: readonly [number, number, number, number];
    /** Label x-offset at rest (mobile / default breakpoint). */
    labelOffset?: number;
    /** Label x-offset at rest on `lg` breakpoint and up. */
    labelOffsetLg?: number;
    /** Rest rotation for the leading chip (degrees). @default -45 */
    startChipRestRotate?: number;
    /** Active rotation for the leading chip (degrees). @default 0 */
    startChipActiveRotate?: number;
    /** Rest rotation for the trailing chip (degrees). @default 0 */
    endChipRestRotate?: number;
    /** Active rotation for the trailing chip (degrees). @default -45 */
    endChipActiveRotate?: number;
    /** Rest scale for both chips. @default 0 for start, 1 for end */
    startChipRestScale?: number;
    startChipActiveScale?: number;
    endChipRestScale?: number;
    endChipActiveScale?: number;
    /** Custom icon for both chips. */
    icon?: ReactNode;
    /** Override the leading chip icon. */
    startIcon?: ReactNode;
    /** Override the trailing chip icon. */
    endIcon?: ReactNode;
    /** Class names merged onto the motion group wrapper. */
    groupClassName?: string;
    /** Class names merged onto both chips and the label chip. */
    chipClassName?: string;
    /** Class names merged onto the label chip only. */
    labelClassName?: string;
    /** Class names merged onto the leading chip only. */
    startChipClassName?: string;
    /** Class names merged onto the trailing chip only. */
    endChipClassName?: string;
    /** Class names merged onto chip icons. */
    iconClassName?: string;
  };

export type SlidingChipButtonProps = SlidingChipButtonBaseProps & {
  /** The link text; `label` is used when this is empty. */
  children?: string;
  /** Renders a `<button>` with these props in place of the link. */
  buttonProps?: ComponentPropsWithoutRef<"button">;
};

interface SlidingChipButtonAnimatedContentProps {
  chipClassName?: string;
  duration: number;
  ease: readonly [number, number, number, number];
  endChipActiveRotate: number;
  endChipActiveScale: number;
  endChipClassName?: string;
  endChipRestRotate: number;
  endChipRestScale: number;
  endIcon?: ReactNode;
  groupClassName?: string;
  icon?: ReactNode;
  iconClassName?: string;
  isActive: boolean;
  label: string;
  labelClassName?: string;
  labelOffset: number;
  /** Custom label content. Falls back to `label` when omitted. */
  labelSlot?: ReactNode;
  size: SlidingChipButtonSize;
  startChipActiveRotate: number;
  startChipActiveScale: number;
  startChipClassName?: string;
  startChipRestRotate: number;
  startChipRestScale: number;
  startIcon?: ReactNode;
  variant: NonNullable<SlidingChipButtonProps["variant"]>;
}

const SlidingChipButtonAnimatedContent = ({
  variant = "accent",
  size = "default",
  label,
  labelSlot,
  labelOffset,
  isActive,
  duration,
  ease,
  icon,
  startIcon,
  endIcon,
  groupClassName,
  chipClassName,
  labelClassName,
  startChipClassName,
  endChipClassName,
  iconClassName,
  startChipRestRotate,
  startChipActiveRotate,
  startChipRestScale,
  startChipActiveScale,
  endChipRestRotate,
  endChipActiveRotate,
  endChipRestScale,
  endChipActiveScale,
}: SlidingChipButtonAnimatedContentProps) => {
  const shouldReduceMotion = useReducedMotion();
  const motionTransition = resolveMotionTransition(
    shouldReduceMotion,
    duration,
    ease
  );

  const resolvedStartIcon = startIcon ?? icon ?? (
    <SlidingChipButtonPlusIcon className={cn("size-[0.75em]", iconClassName)} />
  );
  const resolvedEndIcon = endIcon ?? icon ?? (
    <SlidingChipButtonPlusIcon className={cn("size-[0.75em]", iconClassName)} />
  );

  const startChipVariants: Variants = {
    rest: { rotate: startChipRestRotate, scale: startChipRestScale },
    hover: { rotate: startChipActiveRotate, scale: startChipActiveScale },
  };

  const endChipVariants: Variants = {
    rest: { rotate: endChipRestRotate, scale: endChipRestScale },
    hover: { rotate: endChipActiveRotate, scale: endChipActiveScale },
  };

  return (
    <motion.span
      animate={isActive ? "hover" : "rest"}
      className={cn(slidingChipButtonGroupVariants({ size }), groupClassName)}
      initial={false}
    >
      <motion.span
        className={cn(
          slidingChipButtonChipVariants({ variant, size }),
          chipClassName,
          startChipClassName
        )}
        style={{ transformOrigin: "left center" }}
        transition={motionTransition}
        variants={startChipVariants}
      >
        {resolvedStartIcon}
      </motion.span>

      <motion.span
        animate={isActive ? { x: 0 } : { x: labelOffset }}
        className={cn(
          slidingChipButtonLabelVariants({ variant, size }),
          chipClassName,
          labelClassName
        )}
        initial={false}
        transition={motionTransition}
      >
        {labelSlot ?? label}
      </motion.span>

      <motion.span
        className={cn(
          slidingChipButtonChipVariants({ variant, size }),
          "absolute right-0 z-10",
          chipClassName,
          endChipClassName
        )}
        style={{ transformOrigin: "right center" }}
        transition={motionTransition}
        variants={endChipVariants}
      >
        {resolvedEndIcon}
      </motion.span>
    </motion.span>
  );
};

const SlidingChipButton = ({
  variant = "accent",
  size = "default",
  duration = DEFAULT_DURATION,
  ease = DEFAULT_EASE,
  label,
  labelSlot,
  children,
  className,
  groupClassName,
  chipClassName,
  labelClassName,
  startChipClassName,
  endChipClassName,
  iconClassName,
  labelOffset,
  labelOffsetLg,
  startChipRestRotate = -45,
  startChipActiveRotate = 0,
  startChipRestScale = 0,
  startChipActiveScale = 1,
  endChipRestRotate = 0,
  endChipActiveRotate = -45,
  endChipRestScale = 1,
  endChipActiveScale = 0,
  icon,
  startIcon,
  endIcon,
  href,
  ref,
  buttonProps,
  "aria-label": ariaLabel,
  onBlur,
  onFocus,
  onMouseEnter,
  onMouseLeave,
  ...props
}: SlidingChipButtonProps & {
  ref?: Ref<HTMLAnchorElement>;
}) => {
  const text = getLinkLabel(children, label);
  const resolvedSize = size ?? "default";
  const resolvedLabelOffset = useResponsiveLabelOffset(
    resolvedSize,
    labelOffset,
    labelOffsetLg
  );
  const [isActive, setIsActive] = useState(false);
  const rootClassName = cn(
    slidingChipButtonVariants({ variant, size, className })
  );

  const animatedContent = (
    <SlidingChipButtonAnimatedContent
      chipClassName={chipClassName}
      duration={duration}
      ease={ease}
      endChipActiveRotate={endChipActiveRotate}
      endChipActiveScale={endChipActiveScale}
      endChipClassName={endChipClassName}
      endChipRestRotate={endChipRestRotate}
      endChipRestScale={endChipRestScale}
      endIcon={endIcon}
      groupClassName={groupClassName}
      icon={icon}
      iconClassName={iconClassName}
      isActive={isActive}
      label={text}
      labelClassName={labelClassName}
      labelOffset={resolvedLabelOffset}
      labelSlot={labelSlot}
      size={resolvedSize}
      startChipActiveRotate={startChipActiveRotate}
      startChipActiveScale={startChipActiveScale}
      startChipClassName={startChipClassName}
      startChipRestRotate={startChipRestRotate}
      startChipRestScale={startChipRestScale}
      startIcon={startIcon}
      variant={variant ?? "accent"}
    />
  );

  const interactionHandlers = {
    onBlur: (event: FocusEvent<HTMLElement>) => {
      onBlur?.(event as FocusEvent<HTMLAnchorElement>);
      setIsActive(false);
    },
    onFocus: (event: FocusEvent<HTMLElement>) => {
      onFocus?.(event as FocusEvent<HTMLAnchorElement>);
      setIsActive(true);
    },
    onMouseEnter: (event: MouseEvent<HTMLElement>) => {
      onMouseEnter?.(event as MouseEvent<HTMLAnchorElement>);
      setIsActive(true);
    },
    onMouseLeave: (event: MouseEvent<HTMLElement>) => {
      onMouseLeave?.(event as MouseEvent<HTMLAnchorElement>);
      setIsActive(false);
    },
  };

  if (buttonProps) {
    const { className: buttonClassName, ...buttonRest } = buttonProps;
    return (
      <button
        aria-label={ariaLabel ?? (text || undefined)}
        className={cn(buttonClassName, rootClassName)}
        type="button"
        {...buttonRest}
        {...interactionHandlers}
      >
        {animatedContent}
      </button>
    );
  }

  return (
    <a
      aria-label={ariaLabel ?? (text || undefined)}
      className={rootClassName}
      href={href}
      ref={ref}
      {...interactionHandlers}
      {...props}
    >
      {animatedContent}
    </a>
  );
};

export {
  SlidingChipButton,
  SlidingChipButtonPlusIcon,
  slidingChipButtonChipVariants,
  slidingChipButtonGroupVariants,
  slidingChipButtonLabelVariants,
  slidingChipButtonVariants,
};

export type SlidingChipButtonVariant = NonNullable<
  SlidingChipButtonProps["variant"]
>;
