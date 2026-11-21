"use client";

import {
  autoUpdate,
  FloatingArrow,
  FloatingPortal,
  flip,
  arrow as floatingArrow,
  offset as floatingOffset,
  shift,
  useFloating,
} from "@floating-ui/react";
import type { UseFloatingReturn } from "@floating-ui/react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import type { HTMLMotionProps, Transition } from "motion/react";
import type * as React from "react";
import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { getStrictContext } from "@/registry/lib/get-strict-context";
import { Slot } from "@/registry/primitives/animate/slot";
import type { WithAsChild } from "@/registry/primitives/animate/slot";

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

interface TooltipData {
  align: Align;
  alignOffset: number;
  contentAsChild: boolean;
  contentProps: HTMLMotionProps<"div">;
  id: string;
  rect: DOMRect;
  side: Side;
  sideOffset: number;
}

interface GlobalTooltipContextType {
  currentTooltip: TooltipData | null;
  globalId: string;
  hideImmediate: () => void;
  hideTooltip: () => void;
  referenceElRef: React.RefObject<HTMLElement | null>;
  setReferenceEl: (el: HTMLElement | null) => void;
  showTooltip: (data: TooltipData) => void;
  transition: Transition;
}

const [GlobalTooltipProvider, useGlobalTooltip] =
  getStrictContext<GlobalTooltipContextType>("GlobalTooltipProvider");

interface TooltipContextType {
  align: Align;
  alignOffset: number;
  asChild: boolean;
  id: string;
  props: HTMLMotionProps<"div">;
  setAsChild: React.Dispatch<React.SetStateAction<boolean>>;
  setProps: React.Dispatch<React.SetStateAction<HTMLMotionProps<"div">>>;
  side: Side;
  sideOffset: number;
}

const [LocalTooltipProvider, useTooltip] = getStrictContext<TooltipContextType>(
  "LocalTooltipProvider"
);

interface TooltipPosition {
  x: number;
  y: number;
}

const getResolvedSide = (placement: Side | `${Side}-${Align}`) => {
  if (placement.includes("-")) {
    return placement.split("-")[0] as Side;
  }
  return placement as Side;
};

const initialFromSide = (side: Side): Partial<Record<"x" | "y", number>> => {
  if (side === "top") {
    return { y: 15 };
  }
  if (side === "bottom") {
    return { y: -15 };
  }
  if (side === "left") {
    return { x: 15 };
  }
  return { x: -15 };
};

interface TooltipProviderProps {
  children: React.ReactNode;
  closeDelay?: number;
  id?: string;
  openDelay?: number;
  transition?: Transition;
}

const TOOLTIP_PROVIDER_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 35,
} as const;

const TooltipProvider = ({
  children,
  id,
  openDelay = 700,
  closeDelay = 300,
  transition = TOOLTIP_PROVIDER_DEFAULT_TRANSITION,
}: TooltipProviderProps) => {
  const globalId = useId();
  const [currentTooltip, setCurrentTooltip] = useState<TooltipData | null>(
    null
  );
  const timeoutRef = useRef<number | null>(null);
  const lastCloseTimeRef = useRef<number>(0);
  const referenceElRef = useRef<HTMLElement | null>(null);

  const showTooltip = useCallback(
    (data: TooltipData) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (currentTooltip !== null) {
        setCurrentTooltip(data);
        return;
      }
      const now = Date.now();
      const delay = now - lastCloseTimeRef.current < closeDelay ? 0 : openDelay;
      timeoutRef.current = window.setTimeout(
        () => setCurrentTooltip(data),
        delay
      );
    },
    [openDelay, closeDelay, currentTooltip]
  );

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setCurrentTooltip(null);
      lastCloseTimeRef.current = Date.now();
    }, closeDelay);
  }, [closeDelay]);

  const hideImmediate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setCurrentTooltip(null);
    lastCloseTimeRef.current = Date.now();
  }, []);

  const setReferenceEl = useCallback((el: HTMLElement | null) => {
    referenceElRef.current = el;
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideImmediate();
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", hideImmediate, true);
    window.addEventListener("resize", hideImmediate, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", hideImmediate, true);
      window.removeEventListener("resize", hideImmediate, true);
    };
  }, [hideImmediate]);

  return (
    <GlobalTooltipProvider
      value={{
        showTooltip,
        hideTooltip,
        hideImmediate,
        currentTooltip,
        transition,
        globalId: id ?? globalId,
        setReferenceEl,
        referenceElRef,
      }}
    >
      <LayoutGroup>{children}</LayoutGroup>
      <TooltipOverlay />
    </GlobalTooltipProvider>
  );
};

interface RenderedTooltipContextType {
  align: Align;
  open: boolean;
  side: Side;
}

const [RenderedTooltipProvider, useRenderedTooltip] =
  getStrictContext<RenderedTooltipContextType>("RenderedTooltipContext");

interface FloatingContextType {
  arrowElement: SVGSVGElement | null;
  setArrowElement: (element: SVGSVGElement | null) => void;
  context: UseFloatingReturn["context"];
}

const [FloatingProvider, useFloatingContext] =
  getStrictContext<FloatingContextType>("FloatingContext");

const MotionTooltipArrow = motion.create(FloatingArrow);

type TooltipArrowProps = Omit<
  React.ComponentProps<typeof MotionTooltipArrow>,
  "context"
> & {
  withTransition?: boolean;
};

const TooltipArrow = ({
  ref,
  withTransition = true,
  ...props
}: TooltipArrowProps) => {
  const { side, align, open } = useRenderedTooltip();
  const { context, arrowElement, setArrowElement } = useFloatingContext();
  const { transition, globalId } = useGlobalTooltip();
  useImperativeHandle(ref, () => arrowElement as SVGSVGElement, [arrowElement]);

  const deg = { top: 0, right: 90, bottom: 180, left: -90 }[side];

  return (
    <MotionTooltipArrow
      context={context}
      data-align={align}
      data-side={side}
      data-slot="tooltip-arrow"
      data-state={open ? "open" : "closed"}
      layoutId={withTransition ? `tooltip-arrow-${globalId}` : undefined}
      ref={setArrowElement}
      style={{ rotate: deg }}
      transition={withTransition ? transition : undefined}
      {...props}
    />
  );
};

type TooltipPortalProps = React.ComponentProps<typeof FloatingPortal>;

const TooltipPortal = (props: TooltipPortalProps) => (
  <FloatingPortal {...props} />
);

/** Placement and middleware for the shared tooltip showing `data`. */
const floatingOptions = (
  data: TooltipData | null,
  arrowElement: SVGSVGElement | null
) => {
  const side = data?.side ?? "top";
  const align = data?.align ?? "center";
  return {
    placement: align === "center" ? side : (`${side}-${align}` as const),
    whileElementsMounted: autoUpdate,
    middleware: [
      floatingOffset({
        mainAxis: data?.sideOffset ?? 0,
        crossAxis: data?.alignOffset ?? 0,
      }),
      flip(),
      shift({ padding: 8 }),
      floatingArrow({ element: arrowElement }),
    ],
  };
};

/** floating-ui reports no position until it has measured the tooltip. */
const isPlaced = (value: number | null | undefined): value is number =>
  value !== null && value !== undefined;

const TooltipOverlay = () => {
  const { currentTooltip, transition, globalId, referenceElRef } =
    useGlobalTooltip();

  const [rendered, setRendered] = useState<{
    data: TooltipData | null;
    open: boolean;
  }>({ data: null, open: false });

  // State, not a ref: floating-ui reads the arrow element while rendering.
  const [arrowElement, setArrowElement] = useState<SVGSVGElement | null>(null);

  const {
    refs: { setFloating, setReference },
    x,
    y,
    strategy,
    context,
    update,
  } = useFloating(floatingOptions(rendered.data, arrowElement));

  // Keeps the last tooltip's data while it animates out.
  const [lastTooltip, setLastTooltip] = useState<typeof currentTooltip | null>(
    null
  );
  if (lastTooltip !== currentTooltip) {
    setLastTooltip(currentTooltip);
    if (currentTooltip) {
      setRendered({ data: currentTooltip, open: true });
    } else if (rendered.data) {
      setRendered({ ...rendered, open: false });
    }
  }

  // Re-anchors the shared tooltip to each new trigger as the cursor moves between elements.
  useLayoutEffect(() => {
    if (rendered.data && referenceElRef.current) {
      setReference(referenceElRef.current);
      update();
    }
  }, [referenceElRef, setReference, update, rendered.data]);

  const ready = isPlaced(x) && isPlaced(y);
  const Component = rendered.data?.contentAsChild ? Slot : motion.div;
  const resolvedSide = getResolvedSide(context.placement);

  return (
    <AnimatePresence mode="wait">
      {rendered.data && ready && (
        <TooltipPortal>
          <div
            data-align={rendered.data.align}
            data-side={resolvedSide}
            data-slot="tooltip-overlay"
            data-state={rendered.open ? "open" : "closed"}
            ref={setFloating}
            style={{
              position: strategy,
              top: 0,
              left: 0,
              zIndex: 50,
              transform: `translate3d(${x ?? 0}px, ${y ?? 0}px, 0)`,
            }}
          >
            <FloatingProvider
              value={{ context, arrowElement, setArrowElement }}
            >
              <RenderedTooltipProvider
                value={{
                  side: resolvedSide,
                  align: rendered.data.align,
                  open: rendered.open,
                }}
              >
                <Component
                  animate={
                    rendered.open
                      ? { opacity: 1, scale: 1, x: 0, y: 0 }
                      : {
                          opacity: 0,
                          scale: 0,
                          ...initialFromSide(rendered.data.side),
                        }
                  }
                  data-align={rendered.data.align}
                  data-side={resolvedSide}
                  data-slot="tooltip-content"
                  data-state={rendered.open ? "open" : "closed"}
                  exit={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0,
                    ...initialFromSide(rendered.data.side),
                  }}
                  layoutId={`tooltip-content-${globalId}`}
                  onAnimationComplete={() => {
                    if (!rendered.open) {
                      setRendered({ data: null, open: false });
                    }
                  }}
                  transition={transition}
                  {...rendered.data.contentProps}
                  style={{
                    position: "relative",
                    ...rendered.data.contentProps?.style,
                  }}
                />
              </RenderedTooltipProvider>
            </FloatingProvider>
          </div>
        </TooltipPortal>
      )}
    </AnimatePresence>
  );
};

interface TooltipProps {
  align?: Align;
  alignOffset?: number;
  children: React.ReactNode;
  side?: Side;
  sideOffset?: number;
}

const Tooltip = ({
  children,
  side = "top",
  sideOffset = 0,
  align = "center",
  alignOffset = 0,
}: TooltipProps) => {
  const id = useId();
  const [props, setProps] = useState<HTMLMotionProps<"div">>({});
  const [asChild, setAsChild] = useState(false);

  return (
    <LocalTooltipProvider
      value={{
        props,
        setProps,
        asChild,
        setAsChild,
        side,
        sideOffset,
        align,
        alignOffset,
        id,
      }}
    >
      {children}
    </LocalTooltipProvider>
  );
};

type TooltipContentProps = WithAsChild<HTMLMotionProps<"div">>;

const shallowEqualWithoutChildren = (
  a?: HTMLMotionProps<"div">,
  b?: HTMLMotionProps<"div">
) => {
  if (a === b) {
    return true;
  }
  if (!(a && b)) {
    return false;
  }
  const keysA = Object.keys(a).filter((k) => k !== "children");
  const keysB = Object.keys(b).filter((k) => k !== "children");
  if (keysA.length !== keysB.length) {
    return false;
  }
  for (const k of keysA) {
    // @ts-expect-error index
    if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
};

const TooltipContent = ({ asChild = false, ...props }: TooltipContentProps) => {
  const { setProps, setAsChild } = useTooltip();
  const lastPropsRef = useRef<HTMLMotionProps<"div"> | undefined>(undefined);

  useEffect(() => {
    if (!shallowEqualWithoutChildren(lastPropsRef.current, props)) {
      lastPropsRef.current = props;
      setProps(props);
    }
  }, [props, setProps]);

  useEffect(() => {
    setAsChild(asChild);
  }, [asChild, setAsChild]);

  return null;
};

type TooltipTriggerProps = WithAsChild<HTMLMotionProps<"div">>;

const TooltipTrigger = ({
  ref,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onPointerDown,
  asChild = false,
  ...props
}: TooltipTriggerProps) => {
  const {
    props: contentProps,
    asChild: contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
  } = useTooltip();
  const {
    showTooltip,
    hideTooltip,
    hideImmediate,
    currentTooltip,
    setReferenceEl,
  } = useGlobalTooltip();

  const triggerRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => triggerRef.current as HTMLDivElement);

  const suppressNextFocusRef = useRef(false);

  const handleOpen = useCallback(() => {
    if (!triggerRef.current) {
      return;
    }
    setReferenceEl(triggerRef.current);
    const rect = triggerRef.current.getBoundingClientRect();
    showTooltip({
      contentProps,
      contentAsChild,
      rect,
      side,
      sideOffset,
      align,
      alignOffset,
      id,
    });
  }, [
    showTooltip,
    setReferenceEl,
    contentProps,
    contentAsChild,
    side,
    sideOffset,
    align,
    alignOffset,
    id,
  ]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      if (currentTooltip?.id === id) {
        suppressNextFocusRef.current = true;
        hideImmediate();
        queueMicrotask(() => {
          suppressNextFocusRef.current = false;
        });
      }
    },
    [onPointerDown, currentTooltip?.id, id, hideImmediate]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseEnter?.(e);
      handleOpen();
    },
    [handleOpen, onMouseEnter]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      onMouseLeave?.(e);
      hideTooltip();
    },
    [hideTooltip, onMouseLeave]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onFocus?.(e);
      if (suppressNextFocusRef.current) {
        return;
      }
      handleOpen();
    },
    [handleOpen, onFocus]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLDivElement>) => {
      onBlur?.(e);
      hideTooltip();
    },
    [hideTooltip, onBlur]
  );

  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      data-align={align}
      data-side={side}
      data-slot="tooltip-trigger"
      data-state={currentTooltip?.id === id ? "open" : "closed"}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      ref={triggerRef}
      {...props}
    />
  );
};

export {
  type GlobalTooltipContextType,
  Tooltip,
  TooltipArrow,
  type TooltipArrowProps,
  TooltipContent,
  type TooltipContentProps,
  type TooltipContextType,
  type TooltipPosition,
  type TooltipProps,
  TooltipProvider,
  type TooltipProviderProps,
  TooltipTrigger,
  type TooltipTriggerProps,
  useGlobalTooltip,
  useTooltip,
};
