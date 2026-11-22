// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
"use client";

import { Separator } from "@wirefront/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@wirefront/ui/tooltip";
import { cn } from "@wirefront/ui/lib/utils";
import { useMessages } from "@wirefront/ui/wirefront/provider";
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Every string on the screen; override any of them with WirefrontProvider `messages` ("selectionToolbar.<key>"). */
export const SELECTION_TOOLBAR_MESSAGES = {
  toolbar: "Formatting",
};

export interface SelectionAction {
  id: string;
  label: string;
  icon: ReactNode;
  /** Start a new group: a divider goes before it. */
  group?: boolean;
}

export interface SelectionToolbarProps {
  /** The text people select, e.g. your editor's content. */
  children: ReactNode;
  actions: SelectionAction[];
  /** Called with the action and the selected text. The selection stays put. */
  onAction: (
    id: string,
    selection: { text: string; range: Range | null }
  ) => void;
  /** Show the toolbar above the content without a selection (e.g. for a help tour or touch hint). */
  forceOpen?: boolean;
  className?: string;
}

type Anchor = { top: number; bottom: number; centerX: number };
type Position = { top: number; left: number; placement: "above" | "below" };
const GAP = 8;
const EDGE = 8;
// SSR-safe layout effect.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export function SelectionToolbar({
  children,
  actions,
  onAction,
  forceOpen,
  className,
}: SelectionToolbarProps) {
  const t = useMessages("selectionToolbar", SELECTION_TOOLBAR_MESSAGES);
  const contentRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);
  const pointerDown = useRef(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [pos, setPos] = useState<Position | null>(null);

  // Anchor in viewport coordinates (the toolbar is position: fixed).
  const measure = useCallback(() => {
    if (forceOpen) {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect)
        setAnchor({
          top: rect.top,
          bottom: rect.top,
          centerX: rect.left + rect.width / 2,
        });
      return;
    }
    const range = rangeRef.current;
    if (!range) return;
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    setAnchor({
      top: rect.top,
      bottom: rect.bottom,
      centerX: rect.left + rect.width / 2,
    });
  }, [forceOpen]);

  useEffect(() => {
    if (forceOpen) measure();
    const clear = () => {
      rangeRef.current = null;
      if (!forceOpen) setAnchor(null);
    };
    const read = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return clear();
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const node =
        container.nodeType === Node.TEXT_NODE
          ? container.parentElement
          : (container as Element);
      if (!node || !contentRef.current?.contains(node)) return clear();
      rangeRef.current = range;
      if (!forceOpen) measure();
    };
    // Mouse: show after the drag ends. Touch and keyboard: selection handles
    // only fire `selectionchange`, so read it whenever no pointer is held down.
    const onPointerDown = (e: PointerEvent) => {
      pointerDown.current = true;
      const target = e.target as Node;
      if (
        !contentRef.current?.contains(target) &&
        !toolbarRef.current?.contains(target)
      )
        clear();
    };
    const onPointerUp = () => {
      pointerDown.current = false;
      window.setTimeout(read, 0);
    };
    const onSelectionChange = () => {
      if (!pointerDown.current) read();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("selectionchange", onSelectionChange);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("selectionchange", onSelectionChange);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [forceOpen, measure]);

  // Place the toolbar once its size is known: clamp to the viewport edges and
  // flip below the selection when there's no room above. On touch screens it
  // always goes below, because the OS selection menu sits above.
  useIsoLayoutEffect(() => {
    const el = toolbarRef.current;
    if (!anchor || !el) {
      setPos(null);
      return;
    }
    const { width, height } = el.getBoundingClientRect();
    const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const fitsAbove = anchor.top - height - GAP >= EDGE;
    const placement = !coarse && fitsAbove ? "above" : "below";
    const top =
      placement === "above" ? anchor.top - height - GAP : anchor.bottom + GAP;
    const left = Math.max(
      EDGE,
      Math.min(window.innerWidth - width - EDGE, anchor.centerX - width / 2)
    );
    setPos({ top, left, placement });
  }, [anchor]);

  return (
    <div className={cn("relative", className)}>
      <div ref={contentRef}>{children}</div>
      {anchor ? (
        <div
          aria-label={t.toolbar}
          className={cn(
            "fixed z-50 inline-flex max-w-[calc(100vw-16px)] flex-wrap items-center justify-center gap-1 rounded-2xl border border-border bg-card px-1 py-1 shadow-lg transition-opacity duration-150 motion-reduce:transition-none sm:rounded-full",
            pos ? "opacity-100" : "pointer-events-none opacity-0"
          )}
          data-placement={pos?.placement}
          // Keep the text selection when pressing toolbar buttons.
          onPointerDown={(e) => e.preventDefault()}
          ref={toolbarRef}
          role="toolbar"
          style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0 }}
        >
          {actions.map((a, i) => (
            <Fragment key={a.id}>
              {a.group && i > 0 ? (
                <Separator className="h-4" orientation="vertical" />
              ) : null}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      aria-label={a.label}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 pointer-coarse:size-10 [&_svg]:size-4"
                      onClick={() =>
                        onAction(a.id, {
                          text: rangeRef.current?.toString() ?? "",
                          range: rangeRef.current,
                        })
                      }
                      type="button"
                    >
                      {a.icon}
                    </button>
                  }
                />
                <TooltipContent>{a.label}</TooltipContent>
              </Tooltip>
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  );
}
