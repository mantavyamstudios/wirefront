import { nextPaint } from "@/lib/wait";

export const HOME_SCROLL_READY_EVENT = "site:home-scroll-ready";
export const DEMO_SCROLL_READY_EVENT = "site:demo-scroll-ready";

export const dispatchHomeScrollReady = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(HOME_SCROLL_READY_EVENT));
};

export const isWindowScroller = (scroller: Element | Window): boolean =>
  scroller === window ||
  scroller === document.documentElement ||
  scroller === document.body;

const getScrollerReadyEvent = (scroller: Element | Window): string | null => {
  if (!(scroller instanceof HTMLElement)) {
    return null;
  }

  if (scroller.id === "demo-page") {
    return DEMO_SCROLL_READY_EVENT;
  }

  if (scroller.id === "home-page") {
    return HOME_SCROLL_READY_EVENT;
  }

  return null;
};

/** Resolves on `event`, or after `ms` if it never fires (the layout is used as it is then). */
const readyOrTimeout = (event: string, ms: number): Promise<void> => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  window.addEventListener(event, () => resolve(), { once: true });
  window.setTimeout(resolve, ms);
  return promise;
};

/** Wait for Lenis scrollerProxy (demo/home) or layout before pinning. */
export const waitForScrollerReady = async (
  scroller: Element | Window
): Promise<void> => {
  if (isWindowScroller(scroller)) {
    await nextPaint();
    return;
  }

  const readyEvent = getScrollerReadyEvent(scroller);

  if (!readyEvent) {
    await nextPaint();
    return;
  }

  await Promise.all([nextPaint(), readyOrTimeout(readyEvent, 300)]);

  await nextPaint();
};

export const observeWindowResize = (onResize: () => void): (() => void) => {
  let frameId = 0;

  const handleResize = () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(onResize);
  };

  window.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("resize", handleResize);
  };
};
