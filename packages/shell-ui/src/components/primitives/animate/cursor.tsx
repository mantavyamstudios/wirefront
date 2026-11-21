"use client";

import { Slot } from "@workspace/ui/components/primitives/animate/slot";
import type { WithAsChild } from "@workspace/ui/components/primitives/animate/slot";
import { getStrictContext } from "@workspace/ui/lib/get-strict-context";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import type { HTMLMotionProps, SpringOptions } from "motion/react";
import type * as React from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

interface CursorContextType {
  active: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  cursorPos: { x: number; y: number };
  cursorRef: React.RefObject<HTMLDivElement | null>;
  global: boolean;
}

const [LocalCursorProvider, useCursor] =
  getStrictContext<CursorContextType>("CursorContext");

interface CursorProviderProps {
  children: React.ReactNode;
  global?: boolean;
}

const CursorProvider = ({ children, global = false }: CursorProviderProps) => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = "__cursor_none_style__";
    if (document.querySelector(`#${id}`)) {
      return;
    }

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .animate-ui-cursor-none, .animate-ui-cursor-none * { cursor: none !important; }
    `;
    document.head.append(style);
  }, []);

  useEffect(() => {
    if (!global) {
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setActive(true);
    };

    const handlePointerOut = (e: PointerEvent | MouseEvent) => {
      if (e instanceof PointerEvent && e.relatedTarget === null) {
        setActive(false);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setActive(false);
      }
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerout", handlePointerOut, {
      passive: true,
    });
    window.addEventListener("mouseout", handlePointerOut, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("mouseout", handlePointerOut);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [global]);

  useEffect(() => {
    if (global) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const parent = container.parentElement;
    if (!parent) {
      return;
    }

    if (getComputedStyle(parent).position === "static") {
      parent.style.position = "relative";
    }

    const handlePointerMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setActive(true);
    };

    const handlePointerOut = (e: PointerEvent | MouseEvent) => {
      if (
        e.relatedTarget === null ||
        !(parent as Node).contains(e.relatedTarget as Node)
      ) {
        setActive(false);
      }
    };

    parent.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    parent.addEventListener("pointerout", handlePointerOut, {
      passive: true,
    });
    parent.addEventListener("mouseout", handlePointerOut, { passive: true });

    return () => {
      parent.removeEventListener("pointermove", handlePointerMove);
      parent.removeEventListener("pointerout", handlePointerOut);
      parent.removeEventListener("mouseout", handlePointerOut);
    };
  }, [global]);

  return (
    <LocalCursorProvider
      value={{ cursorPos, active, global, containerRef, cursorRef }}
    >
      {children}
    </LocalCursorProvider>
  );
};

type CursorContainerProps = WithAsChild<HTMLMotionProps<"div">>;

const CursorContainer = ({
  ref,
  asChild = false,
  ...props
}: CursorContainerProps) => {
  const { containerRef, global, active } = useCursor();
  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

  const Component = asChild ? Slot : motion.div;

  return (
    <Component
      data-active={active}
      data-global={global}
      data-slot="cursor-container"
      ref={containerRef}
      {...props}
    />
  );
};

type CursorProps = WithAsChild<
  HTMLMotionProps<"div"> & {
    children: React.ReactNode;
  }
>;

const Cursor = ({ ref, asChild = false, style, ...props }: CursorProps) => {
  const { cursorPos, active, containerRef, cursorRef, global } = useCursor();
  useImperativeHandle(ref, () => cursorRef.current as HTMLDivElement);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    const target = global
      ? document.documentElement
      : containerRef.current?.parentElement;

    if (!target) {
      return;
    }

    target.classList.toggle("animate-ui-cursor-none", active);

    return () => {
      target.classList.remove("animate-ui-cursor-none");
    };
  }, [active, global, containerRef]);

  useEffect(() => {
    x.set(cursorPos.x);
    y.set(cursorPos.y);
  }, [cursorPos, x, y]);

  const Component = asChild ? Slot : motion.div;

  return (
    <AnimatePresence>
      {active && (
        <Component
          animate={{ scale: 1, opacity: 1 }}
          data-active={active}
          data-global={global}
          data-slot="cursor"
          exit={{ scale: 0, opacity: 0 }}
          initial={{ scale: 0, opacity: 0 }}
          ref={cursorRef}
          style={{
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
            zIndex: 9999,
            position: global ? "fixed" : "absolute",
            top: y,
            left: x,
            ...style,
          }}
          {...props}
        />
      )}
    </AnimatePresence>
  );
};

type CursorFollowSide = "top" | "right" | "bottom" | "left";
type CursorFollowAlign = "start" | "center" | "end";

type CursorFollowProps = WithAsChild<
  Omit<HTMLMotionProps<"div">, "transition"> & {
    side?: CursorFollowSide;
    sideOffset?: number;
    align?: CursorFollowAlign;
    alignOffset?: number;
    transition?: SpringOptions;
    children: React.ReactNode;
  }
>;

const CURSOR_FOLLOW_DEFAULT_TRANSITION = {
  stiffness: 500,
  damping: 50,
  bounce: 0,
} as const;

/** Where along one edge the follower sits: start, centre or end. */
const alongEdge = (
  align: CursorFollowAlign,
  length: number,
  alignOffset: number
): number => {
  if (align === "start") {
    return length + alignOffset;
  }
  if (align === "center") {
    return length / 2;
  }
  return -alignOffset;
};

/** The follower's offset from the cursor for the given side and alignment. */
const followOffset = (
  side: CursorFollowSide,
  align: CursorFollowAlign,
  width: number,
  height: number,
  sideOffset: number,
  alignOffset: number
): { x: number; y: number } => {
  switch (side) {
    case "top": {
      return {
        x: alongEdge(align, width, alignOffset),
        y: height + sideOffset,
      };
    }
    case "bottom": {
      return { x: alongEdge(align, width, alignOffset), y: -sideOffset };
    }
    case "left": {
      return {
        x: width + sideOffset,
        y: alongEdge(align, height, alignOffset),
      };
    }
    default: {
      return { x: -sideOffset, y: alongEdge(align, height, alignOffset) };
    }
  }
};

const CursorFollow = ({
  ref,
  asChild = false,
  side = "bottom",
  sideOffset = 0,
  align = "end",
  alignOffset = 0,
  style,
  transition = CURSOR_FOLLOW_DEFAULT_TRANSITION,
  ...props
}: CursorFollowProps) => {
  const { cursorPos, active, cursorRef, global } = useCursor();
  const cursorFollowRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => cursorFollowRef.current as HTMLDivElement);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, transition);
  const springY = useSpring(y, transition);

  const calculateOffset = useCallback(() => {
    const rect = cursorFollowRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 0;
    const height = rect?.height ?? 0;

    return followOffset(side, align, width, height, sideOffset, alignOffset);
  }, [side, align, sideOffset, alignOffset]);

  useEffect(() => {
    const offset = calculateOffset();
    const cursorRect = cursorRef.current?.getBoundingClientRect();
    const cursorWidth = cursorRect?.width ?? 20;
    const cursorHeight = cursorRect?.height ?? 20;

    x.set(cursorPos.x - offset.x + cursorWidth / 2);
    y.set(cursorPos.y - offset.y + cursorHeight / 2);
  }, [calculateOffset, cursorPos, cursorRef, x, y]);

  const Component = asChild ? Slot : motion.div;

  return (
    <AnimatePresence>
      {active && (
        <Component
          animate={{ scale: 1, opacity: 1 }}
          data-active={active}
          data-global={global}
          data-slot="cursor-follow"
          exit={{ scale: 0, opacity: 0 }}
          initial={{ scale: 0, opacity: 0 }}
          ref={cursorFollowRef}
          style={{
            transform: "translate(-50%,-50%)",
            pointerEvents: "none",
            zIndex: 9998,
            position: global ? "fixed" : "absolute",
            top: springY,
            left: springX,
            ...style,
          }}
          {...props}
        />
      )}
    </AnimatePresence>
  );
};

export {
  Cursor,
  CursorContainer,
  type CursorContainerProps,
  type CursorContextType,
  CursorFollow,
  type CursorFollowAlign,
  type CursorFollowProps,
  type CursorFollowSide,
  type CursorProps,
  CursorProvider,
  type CursorProviderProps,
  useCursor,
};
