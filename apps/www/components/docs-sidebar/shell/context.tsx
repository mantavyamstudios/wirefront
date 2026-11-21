"use client";

import { AnimatePresence, motion } from "motion/react";
import type * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const EFFECTS_STORAGE_KEY = "docs-shell-motion-effects";

const EffectsContext = createContext<{ enabled: boolean; toggle: () => void }>({
  enabled: true,
  toggle: () => {
    // Outside the provider there is nothing to update.
  },
});

export const DocsShellEffectsProvider = ({
  children,
  defaultEnabled = true,
}: {
  children: React.ReactNode;
  defaultEnabled?: boolean;
}) => {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return defaultEnabled;
    }
    const stored = localStorage.getItem(EFFECTS_STORAGE_KEY);
    return stored === null ? defaultEnabled : stored === "true";
  });

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(EFFECTS_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ enabled, toggle }), [enabled, toggle]);
  return (
    <EffectsContext.Provider value={value}>{children}</EffectsContext.Provider>
  );
};

export const useDocsShellEffects = () => useContext(EffectsContext);

export interface DocsShellHoverRect {
  height: number;
  left: number;
  top: number;
}

const HoverContext = createContext<{
  hovered: string | null;
  hoverRect: DocsShellHoverRect | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  setHovered: (id: string | null, rect?: DocsShellHoverRect | null) => void;
}>({
  hovered: null,
  hoverRect: null,
  containerRef: { current: null },
  setHovered: () => {
    // Outside the provider there is nothing to update.
  },
});

export const DocsShellHoverProvider = ({
  children,
  containerRef,
}: {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverRect, setHoverRect] = useState<DocsShellHoverRect | null>(null);

  const setHovered = useCallback(
    (id: string | null, rect?: DocsShellHoverRect | null) => {
      setHoveredId(id);
      setHoverRect(rect ?? null);
    },
    []
  );

  const value = useMemo(
    () => ({ hovered: hoveredId, hoverRect, containerRef, setHovered }),
    [hoveredId, hoverRect, containerRef, setHovered]
  );

  return (
    <HoverContext.Provider value={value}>{children}</HoverContext.Provider>
  );
};

export const useDocsShellHover = () => useContext(HoverContext);

export const DocsShellHoverHighlight = () => {
  const { hoverRect, hovered } = useDocsShellHover();
  const { enabled } = useDocsShellEffects();

  return (
    <AnimatePresence>
      {enabled && hovered && hoverRect && (
        <motion.div
          animate={{
            top: hoverRect.top + 2,
            height: hoverRect.height - 4,
            left: hoverRect.left,
            opacity: 1,
          }}
          className="bg-accent/50 pointer-events-none absolute z-0 rounded-md"
          exit={{ opacity: 0 }}
          initial={false}
          key="docs-shell-hover-bg"
          style={{ right: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </AnimatePresence>
  );
};
