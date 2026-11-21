"use client";

import { cn } from "@workspace/ui/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import type { HTMLMotionProps, Transition } from "motion/react";
import type * as React from "react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getStrictContext } from "@/registry/lib/get-strict-context";
import { Slot } from "@/registry/primitives/animate/slot";
import type { WithAsChild } from "@/registry/primitives/animate/slot";
import {
  Highlight,
  HighlightItem,
} from "@/registry/primitives/effects/highlight";
import type {
  HighlightItemProps,
  HighlightProps,
} from "@/registry/primitives/effects/highlight";

interface TabsStateContextType {
  activeValue: string;
}

interface TabsPrewarmContextType {
  prewarmedValues: Set<string>;
}

interface TabsActionsContextType {
  handleValueChange: (value: string) => void;
  prewarmValue: (value: string) => void;
  registerTrigger: (value: string, node: HTMLElement | null) => void;
}

interface TabsContextType
  extends
    TabsStateContextType,
    TabsPrewarmContextType,
    TabsActionsContextType {}

const [TabsStateProvider, useTabsState] =
  getStrictContext<TabsStateContextType>("TabsStateContext");

const [TabsPrewarmProvider, useTabsPrewarm] =
  getStrictContext<TabsPrewarmContextType>("TabsPrewarmContext");

const [TabsActionsProvider, useTabsActions] =
  getStrictContext<TabsActionsContextType>("TabsActionsContext");

const useTabs = (): TabsContextType => {
  const state = useTabsState();
  const prewarm = useTabsPrewarm();
  const actions = useTabsActions();

  return {
    ...state,
    ...prewarm,
    ...actions,
  };
};

type BaseTabsProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
};

type UnControlledTabsProps = BaseTabsProps & {
  defaultValue?: string;
  value?: never;
  onValueChange?: never;
};

type ControlledTabsProps = BaseTabsProps & {
  value: string;
  onValueChange?: (value: string) => void;
  defaultValue?: never;
};

type TabsProps = UnControlledTabsProps | ControlledTabsProps;

const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  ...props
}: TabsProps) => {
  const [activeValue, setActiveValue] = useState<string | undefined>(
    defaultValue
  );
  const [prewarmedValues, setPrewarmedValues] = useState<Set<string>>(
    () => new Set()
  );
  const triggersRef = useRef(new Map<string, HTMLElement>());
  const initialSet = useRef(false);
  const isControlled = value !== undefined;

  const prewarmValue = useCallback((val: string) => {
    setPrewarmedValues((prev) => {
      if (prev.has(val)) {
        return prev;
      }
      return new Set([...prev, val]);
    });
  }, []);

  const registerTrigger = useCallback(
    (val: string, node: HTMLElement | null) => {
      if (node) {
        triggersRef.current.set(val, node);
        // Uncontrolled with no default: the first trigger to register is active.
        if (!isControlled && !initialSet.current) {
          initialSet.current = true;
          setActiveValue((prev) => prev ?? val);
        }
      } else {
        triggersRef.current.delete(val);
      }
    },
    [isControlled]
  );

  const handleValueChange = useCallback(
    (val: string) => {
      setPrewarmedValues(new Set());
      if (isControlled) {
        onValueChange?.(val);
      } else {
        setActiveValue(val);
      }
    },
    [isControlled, onValueChange]
  );

  const stateContextValue = useMemo(
    () => ({ activeValue: (value ?? activeValue) as string }),
    [value, activeValue]
  );

  const prewarmContextValue = useMemo(
    () => ({ prewarmedValues }),
    [prewarmedValues]
  );

  const actionsContextValue = useMemo(
    () => ({
      handleValueChange,
      prewarmValue,
      registerTrigger,
    }),
    [handleValueChange, prewarmValue, registerTrigger]
  );

  return (
    <TabsStateProvider value={stateContextValue}>
      <TabsPrewarmProvider value={prewarmContextValue}>
        <TabsActionsProvider value={actionsContextValue}>
          <div data-slot="tabs" {...props}>
            {children}
          </div>
        </TabsActionsProvider>
      </TabsPrewarmProvider>
    </TabsStateProvider>
  );
};

type TabsHighlightProps = Omit<HighlightProps, "value"> & {
  containerClassName?: string;
};

const TABS_HIGHLIGHT_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 25,
} as const;

const TabsHighlight = ({
  transition = TABS_HIGHLIGHT_DEFAULT_TRANSITION,
  ...props
}: TabsHighlightProps) => {
  const { activeValue } = useTabsState();

  return (
    <Highlight
      {...(props.mode === "parent" ? { "data-slot": "tabs-highlight" } : {})}
      transition={transition}
      value={activeValue}
      {...props}
    />
  );
};

type TabsListProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
};

const TabsList = (props: TabsListProps) => (
  <div data-slot="tabs-list" role="tablist" {...props} />
);

type TabsHighlightItemProps = HighlightItemProps & {
  value: string;
};

const TabsHighlightItem = (props: TabsHighlightItemProps) => (
  <HighlightItem data-slot="tabs-highlight-item" {...props} />
);

type TabsTriggerProps = WithAsChild<
  {
    value: string;
    children: React.ReactNode;
  } & HTMLMotionProps<"button">
>;

const TabsTrigger = ({
  ref,
  value,
  asChild = false,
  onMouseEnter,
  onFocus,
  ...props
}: TabsTriggerProps) => {
  const { activeValue } = useTabsState();
  const { handleValueChange, registerTrigger, prewarmValue } = useTabsActions();

  const localRef = useRef<HTMLButtonElement | null>(null);
  useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

  useEffect(() => {
    registerTrigger(value, localRef.current);
    return () => registerTrigger(value, null);
  }, [value, registerTrigger]);

  const Component = asChild ? Slot : motion.button;

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    prewarmValue?.(value);
    onMouseEnter?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLButtonElement>) => {
    prewarmValue?.(value);
    onFocus?.(e);
  };

  return (
    <Component
      data-slot="tabs-trigger"
      data-state={activeValue === value ? "active" : "inactive"}
      onClick={() => handleValueChange(value)}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      ref={localRef}
      role="tab"
      {...props}
    />
  );
};

type TabsContentsProps = HTMLMotionProps<"div"> & {
  children: React.ReactNode;
  transition?: Transition;
  /**
   * Whether to lazily mount tabs only when active or prewarmed.
   * Inactive tabs won't render their subtree until first visited.
   * @default true
   */
  lazyMount?: boolean;
  /**
   * Whether to keep previously visited tabs mounted in the DOM.
   * If false, tabs are unmounted when leaving (after animation completes).
   * @default true
   */
  keepMounted?: boolean;
  /**
   * Whether to animate container height when switching tabs.
   * @default true
   */
  animateHeight?: boolean;
};

const TABS_CONTENTS_DEFAULT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  bounce: 0,
  restDelta: 0.01,
} as const;

const TabsContents = ({
  children,
  transition = TABS_CONTENTS_DEFAULT_TRANSITION,
  lazyMount = true,
  keepMounted = true,
  animateHeight = true,
  onAnimationComplete,
  ...props
}: TabsContentsProps) => {
  const { activeValue } = useTabsState();
  const { prewarmedValues } = useTabsPrewarm();
  const prefersReducedMotion = useReducedMotion();
  const childrenArray = Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    (child): child is React.ReactElement<{ value: string }> =>
      isValidElement(child) &&
      typeof child.props === "object" &&
      child.props !== null &&
      "value" in child.props &&
      child.props.value === activeValue
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  // `instant` while growing from nothing on the first measure, so mounting doesn't animate.
  const [size, setSize] = useState({ height: 0, instant: true });

  // Animating from the tab that was active before, until the slide completes.
  const [animatingFrom, setAnimatingFrom] = useState<number | null>(null);
  const [lastActiveIndex, setLastActiveIndex] = useState(activeIndex);
  const [visitedIndices, setVisitedIndices] = useState<Set<number>>(
    () => new Set(activeIndex === -1 ? [0] : [activeIndex])
  );
  if (lastActiveIndex !== activeIndex) {
    setLastActiveIndex(activeIndex);
    setAnimatingFrom(lastActiveIndex);
    if (activeIndex !== -1 && !visitedIndices.has(activeIndex)) {
      setVisitedIndices(new Set([...visitedIndices, activeIndex]));
    }
  }
  const effectiveAnimatingFrom = animatingFrom;

  const measure = useCallback((index: number) => {
    const pane = itemRefs.current[index];
    const container = containerRef.current;
    if (!(pane && container)) {
      return 0;
    }

    const base = pane.getBoundingClientRect().height || 0;

    const cs = getComputedStyle(container);
    const isBorderBox = cs.boxSizing === "border-box";
    // Computed lengths are always in px ("12px").
    const px = (value: string) => Number(value.replace(/px$/u, "")) || 0;
    const paddingY = px(cs.paddingTop) + px(cs.paddingBottom);
    const borderY = px(cs.borderTopWidth) + px(cs.borderBottomWidth);

    let total = base + (isBorderBox ? paddingY + borderY : 0);

    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    total = Math.ceil(total * dpr) / dpr;

    return total;
  }, []);

  // The observer reports the active pane's size before the first paint, then on every change.
  useLayoutEffect(() => {
    const pane = itemRefs.current[activeIndex];
    if (!(animateHeight && pane)) {
      return;
    }
    const ro = new ResizeObserver(() => {
      const next = measure(activeIndex);
      if (next <= 0) {
        return;
      }
      setSize((prev) =>
        Math.abs(prev.height - next) > 0.5
          ? { height: next, instant: prev.height === 0 }
          : prev
      );
    });
    ro.observe(pane);
    return () => ro.disconnect();
  }, [activeIndex, animateHeight, measure]);

  const contentsTransition = prefersReducedMotion
    ? { duration: 0 }
    : transition;

  const heightTransition: Transition =
    prefersReducedMotion || size.instant || !animateHeight
      ? { duration: 0 }
      : ((transition as { height?: Transition })?.height ?? {
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        });

  const handleAnimationComplete: HTMLMotionProps<"div">["onAnimationComplete"] =
    (definition) => {
      setAnimatingFrom(null);
      onAnimationComplete?.(definition);
    };

  return (
    <motion.div
      animate={{ height: animateHeight ? size.height || "auto" : "auto" }}
      data-slot="tabs-contents"
      initial={false}
      ref={containerRef}
      style={{ overflow: "hidden" }}
      transition={heightTransition}
      {...props}
    >
      <motion.div
        animate={{ x: `${activeIndex * -100}%` }}
        className="-mx-2 flex items-start"
        initial={{ x: `${activeIndex * -100}%` }}
        onAnimationComplete={handleAnimationComplete}
        style={{ willChange: "transform" }}
        transition={contentsTransition}
      >
        {childrenArray.map((child, index) => {
          const tabKey = isValidElement(child)
            ? (child.key ?? `tab-pane-${index}`)
            : `tab-pane-${index}`;

          const isVisible =
            index === activeIndex || index === effectiveAnimatingFrom;

          const tabValue =
            isValidElement(child) &&
            typeof child.props === "object" &&
            child.props !== null &&
            "value" in child.props
              ? String(child.props.value)
              : undefined;

          const isPrewarmed =
            tabValue !== undefined && prewarmedValues?.has(tabValue);

          const shouldMount =
            !lazyMount ||
            index === activeIndex ||
            index === effectiveAnimatingFrom ||
            (keepMounted && visitedIndices.has(index)) ||
            isPrewarmed;

          return (
            <div
              className={cn(
                "w-full shrink-0 px-2",
                !isVisible && "h-0 overflow-hidden"
              )}
              key={tabKey}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
            >
              {shouldMount ? child : null}
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

type TabsContentProps = WithAsChild<
  {
    value: string;
    children: React.ReactNode;
  } & HTMLMotionProps<"div">
>;

const TabsContent = ({
  ref,
  value,
  style,
  asChild = false,
  ...props
}: TabsContentProps) => {
  const { activeValue } = useTabsState();
  const isActive = activeValue === value;

  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      data-slot="tabs-content"
      data-state={isActive ? "active" : "inactive"}
      inert={!isActive}
      ref={ref}
      role="tabpanel"
      style={style}
      {...props}
    />
  );
};

export {
  Tabs,
  type TabsActionsContextType,
  TabsContent,
  type TabsContentProps,
  TabsContents,
  type TabsContentsProps,
  type TabsContextType,
  TabsHighlight,
  TabsHighlightItem,
  type TabsHighlightItemProps,
  type TabsHighlightProps,
  TabsList,
  type TabsListProps,
  type TabsPrewarmContextType,
  type TabsProps,
  type TabsStateContextType,
  TabsTrigger,
  type TabsTriggerProps,
  useTabs,
  useTabsActions,
  useTabsPrewarm,
  useTabsState,
};
