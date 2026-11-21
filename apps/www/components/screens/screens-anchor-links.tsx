"use client";

import { useEffect } from "react";

import { usePageTransition } from "@/components/page-transition/page-transition-provider";

const SCREENS_PATH = "/screens";
const MIN_DURATION_MS = 450;
const MAX_DURATION_MS = 1100;

/** Category the visitor clicked on another page; `/screens` scrolls to it on arrival. */
let pendingSection: string | null = null;

/** Returns (and clears) the category a cross-page link asked `/screens` to show. */
export const consumePendingScreensSection = (): string | null => {
  const section = pendingSection;
  pendingSection = null;
  return section;
};

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3;

const scrollParent = (element: HTMLElement): HTMLElement | null => {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      return node;
    }
  }
  return null;
};

/**
 * Ease-out scroll to a `/screens` category heading, honouring its
 * `scroll-margin-top`. Instant under reduced motion; a wheel, touch or key
 * press hands control back to the visitor.
 */
export const smoothScrollToSection = (id: string): void => {
  const target = document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
  if (!target) {
    return;
  }

  const scroller = scrollParent(target);
  const margin =
    Number(getComputedStyle(target).scrollMarginTop.replace(/px$/u, "")) || 0;
  const viewportTop = scroller ? scroller.getBoundingClientRect().top : 0;
  const from = scroller ? scroller.scrollTop : window.scrollY;
  const to = Math.max(
    0,
    from + target.getBoundingClientRect().top - viewportTop - margin
  );
  const setTop = (top: number) => {
    if (scroller) {
      scroller.scrollTop = top;
    } else {
      window.scrollTo({ top });
    }
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTop(to);
    return;
  }

  const distance = Math.abs(to - from);
  const duration = Math.min(
    MAX_DURATION_MS,
    Math.max(MIN_DURATION_MS, 300 + distance * 0.12)
  );
  const userEvents = ["wheel", "touchstart", "keydown", "pointerdown"];
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const name of userEvents) {
      window.removeEventListener(name, stop);
    }
  };
  for (const name of userEvents) {
    window.addEventListener(name, stop, { passive: true });
  }

  const start = performance.now();
  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    setTop(from + (to - from) * easeOutCubic(progress));
    if (progress < 1) {
      frame = requestAnimationFrame(step);
    } else {
      stop();
    }
  };
  frame = requestAnimationFrame(step);
};

/** The `/screens` category a plain left click on `anchor` should glide to. */
const screensSectionOf = (event: MouseEvent): string | null => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return null;
  }
  const anchor = (event.target as Element | null)?.closest?.("a[href]");
  if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") {
    return null;
  }
  const url = new URL(anchor.href);
  if (
    url.origin !== window.location.origin ||
    url.pathname !== SCREENS_PATH ||
    url.hash.length < 2
  ) {
    return null;
  }
  return url.hash.slice(1);
};

/**
 * Category links (`/screens#<category>`) anywhere on the site glide to their
 * heading instead of cutting to it. Listens on `window` in the capture phase
 * so it runs before Next.js `<Link>` and the footer/landing click handlers,
 * which all skip events that are already default-prevented.
 */
export const ScreensAnchorLinks = () => {
  const { transitionTo } = usePageTransition();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const section = screensSectionOf(event);
      if (!section) {
        return;
      }
      event.preventDefault();

      if (window.location.pathname === SCREENS_PATH) {
        window.history.pushState(null, "", `#${section}`);
        smoothScrollToSection(section);
        return;
      }

      // Land at the top of `/screens`, then glide down once it has settled.
      pendingSection = section;
      transitionTo(SCREENS_PATH).catch(() => {
        pendingSection = null;
      });
    };

    window.addEventListener("click", onClick, { capture: true });
    return () =>
      window.removeEventListener("click", onClick, { capture: true });
  }, [transitionTo]);

  return null;
};
