"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** A computed CSS length ("12px", or "" when unset) as a number of pixels. */
const px = (value: string): number => Number(value.replace(/px$/u, "")) || 0;

interface AutoHeightOptions {
  includeParentBox?: boolean;
  includeSelfBox?: boolean;
}

const getBoxExtra = (element: HTMLElement): number => {
  const style = getComputedStyle(element);
  if (style.boxSizing !== "border-box") {
    return 0;
  }

  const padding = px(style.paddingTop) + px(style.paddingBottom);
  const border = px(style.borderTopWidth) + px(style.borderBottomWidth);

  return padding + border;
};

const DEFAULT_OPTIONS: AutoHeightOptions = {
  includeParentBox: true,
  includeSelfBox: false,
};

/**
 * Tracks an element's height with a ResizeObserver, which also reports the
 * first size as soon as it starts observing. New content that changes the
 * element's size is picked up the same way.
 */
export const useAutoHeight = <T extends HTMLElement = HTMLDivElement>(
  options: AutoHeightOptions = DEFAULT_OPTIONS
) => {
  const ref = useRef<T | null>(null);
  const rafRef = useRef<number | null>(null);
  const [height, setHeight] = useState(0);

  const scheduleHeight = useCallback((next: number) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setHeight(next);
    });
  }, []);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) {
      return 0;
    }

    const base = Math.max(
      el.getBoundingClientRect().height || 0,
      el.scrollHeight || 0
    );

    let extra = 0;

    if (options.includeParentBox && el.parentElement) {
      extra += getBoxExtra(el.parentElement);
    }

    if (options.includeSelfBox) {
      extra += getBoxExtra(el);
    }

    const dpr =
      typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
    return Math.ceil((base + extra) * dpr) / dpr;
  }, [options.includeParentBox, options.includeSelfBox]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const ro = new ResizeObserver(() => {
      scheduleHeight(measure());
    });

    ro.observe(el);
    if (options.includeParentBox && el.parentElement) {
      ro.observe(el.parentElement);
    }

    return () => {
      ro.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [measure, scheduleHeight, options.includeParentBox]);

  return { ref, height } as const;
};
