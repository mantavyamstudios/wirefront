"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useActiveAnchor } from "fumadocs-core/toc";
import { TOCProvider, useTOCItems } from "fumadocs-ui/components/layout/toc";
import { buttonVariants } from "fumadocs-ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "fumadocs-ui/components/ui/popover";
import { PageTOCPopoverItems } from "fumadocs-ui/layouts/docs/page";
import { useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { ComponentProps } from "react";

import {
  useHeaderTocItems,
  usePublishHeaderToc,
} from "@/components/docs/docs-toc-header-slot";
import type { HeaderTocItem } from "@/components/docs/docs-toc-header-slot";

const RING_SIZE = 20;
const RING_STROKE = 1.75;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const HASH_PREFIX_REGEX = /^#/u;
const CLICK_OVERRIDE_MS = 800;

const clamp = (value: number, min: number, max: number) => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const TocProgressRing = ({
  progress,
  className,
  ...props
}: ComponentProps<"svg"> & {
  /** 0–1 fill amount of the ring. */
  progress: number;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const normalized = clamp(progress, 0, 1);
  const offset = RING_CIRCUMFERENCE * (1 - normalized);
  const circleProps = {
    cx: RING_SIZE / 2,
    cy: RING_SIZE / 2,
    fill: "none" as const,
    r: RING_RADIUS,
    strokeWidth: RING_STROKE,
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
      {...props}
    >
      <circle {...circleProps} className="stroke-current/25" />
      <circle
        {...circleProps}
        className={
          prefersReducedMotion || progress <= 0
            ? undefined
            : "transition-[stroke-dashoffset] duration-200"
        }
        stroke="currentColor"
        strokeDasharray={RING_CIRCUMFERENCE}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
    </svg>
  );
};

const scrollChildIntoView = (
  scroller: HTMLElement,
  target: HTMLElement,
  behavior: ScrollBehavior = "auto"
) => {
  if (scroller.clientHeight === 0) {
    return false;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (scrollerRect.height === 0 || targetRect.height === 0) {
    return false;
  }

  const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
  if (maxScrollTop <= 0) {
    return true;
  }

  const targetCenter = targetRect.top + targetRect.height / 2;
  const scrollerCenter = scrollerRect.top + scrollerRect.height / 2;
  const nextScrollTop = clamp(
    scroller.scrollTop + (targetCenter - scrollerCenter),
    0,
    maxScrollTop
  );
  scroller.scrollTo({ top: nextScrollTop, behavior });
  return true;
};

/** The page's scroll position and sizes, with fallbacks for older engines. */
const readPageScroll = () => {
  const scrollElement = document.scrollingElement || document.documentElement;
  return {
    scrollTop: scrollElement.scrollTop || window.scrollY || 0,
    viewportHeight: window.innerHeight || scrollElement.clientHeight || 0,
    scrollHeight: scrollElement.scrollHeight || document.body.scrollHeight || 0,
  };
};

/** The headings on the page that the table of contents links to, in order. */
const findHeadings = (tocItems: HeaderTocItem[]) => {
  const headings: { id: string; element: HTMLElement }[] = [];
  for (const item of tocItems) {
    const id = item.url.slice(1);
    const el = id ? document.querySelector<HTMLElement>(`#${id}`) : null;
    if (el) {
      headings.push({ id, element: el });
    }
  }
  return headings;
};

const findActiveHeadingId = (tocItems: HeaderTocItem[]): string | undefined => {
  if (tocItems.length === 0 || typeof document === "undefined") {
    return;
  }

  const { scrollTop, viewportHeight, scrollHeight } = readPageScroll();
  const headings = findHeadings(tocItems);

  if (headings.length === 0) {
    return;
  }

  if (scrollTop <= 10) {
    return headings[0]?.id;
  }

  // Only consider bottom-of-page if page has real scrollable overflow and user has scrolled down
  const isScrollable = scrollHeight > viewportHeight + 100;
  if (
    isScrollable &&
    scrollTop > 50 &&
    scrollTop + viewportHeight >= scrollHeight - 80
  ) {
    return headings.at(-1)?.id;
  }

  const threshold = 140;
  let activeId = headings[0]?.id;

  for (const { id, element } of headings) {
    const rect = element.getBoundingClientRect();
    if (rect.top <= threshold) {
      activeId = id;
    } else {
      break;
    }
  }

  return activeId;
};

const scrollActiveDocsItem = (
  scroller: HTMLElement,
  href: string | null,
  id: string | undefined,
  behavior: ScrollBehavior
): boolean => {
  const links = scroller.querySelectorAll<HTMLAnchorElement>("a");
  let target: HTMLAnchorElement | null = null;

  for (const link of links) {
    const linkHref = link.getAttribute("href");
    if (
      (href && linkHref === href) ||
      (id && (link.hash === `#${id}` || linkHref === `#${id}`))
    ) {
      target = link;
      break;
    }
  }

  if (!target) {
    target = scroller.querySelector<HTMLAnchorElement>('a[data-active="true"]');
  }

  return target ? scrollChildIntoView(scroller, target, behavior) : false;
};

const HeaderTocPopover = () => {
  const items = useTOCItems();
  const active = useActiveAnchor();
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const [fallbackActiveId, setFallbackActiveId] = useState<string>();
  const [clickedId, setClickedId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [openPathname, setOpenPathname] = useState(pathname);
  const contentRef = useRef<HTMLDivElement>(null);

  const enabled = items.length > 0;

  if (pathname !== openPathname) {
    setOpenPathname(pathname);
    setOpen(false);
    setFallbackActiveId(undefined);
    setClickedId(undefined);
  }

  useLayoutEffect(() => {
    if (!enabled) {
      return;
    }

    const updateActive = () => {
      setFallbackActiveId(findActiveHeadingId(items));
    };

    updateActive();
    const frame = requestAnimationFrame(updateActive);
    const timer = setTimeout(updateActive, 100);

    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
    };
  }, [enabled, items]);

  // A clicked heading overrides the scroll position until it's reached, or for a moment.
  const reachedClickedId =
    Boolean(clickedId) &&
    (active === clickedId || fallbackActiveId === clickedId);
  if (reachedClickedId) {
    setClickedId(undefined);
  }
  useEffect(() => {
    if (!clickedId) {
      return;
    }
    const timer = setTimeout(() => {
      setClickedId(undefined);
    }, CLICK_OVERRIDE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [clickedId]);

  // A clicked heading wins, then the scroll position, then the observer's pick.
  const currentActiveId = [clickedId, fallbackActiveId, active].find(
    (id) => Boolean(id) && items.some((item) => id === item.url.slice(1))
  );

  const selectedIndex =
    enabled && currentActiveId
      ? items.findIndex((item) => currentActiveId === item.url.slice(1))
      : -1;
  const progress =
    enabled && selectedIndex >= 0
      ? (selectedIndex + 1) / Math.max(1, items.length)
      : 0;
  const activeHref =
    enabled && selectedIndex >= 0 ? items[selectedIndex]?.url : null;

  // Scrolls the list to the current heading, read fresh on each attempt.
  const scrollToActive = useEffectEvent((scroller: HTMLElement) =>
    scrollActiveDocsItem(
      scroller,
      activeHref,
      currentActiveId,
      prefersReducedMotion ? "auto" : "smooth"
    )
  );

  // Scroll ONCE when popover opens without re-triggering during background scrolls
  useEffect(() => {
    if (!open) {
      return;
    }

    let frameId: number;
    let attempts = 0;
    const maxAttempts = 12;
    const tryScroll = () => {
      attempts += 1;
      const content = contentRef.current;
      const scroller = content?.querySelector<HTMLElement>(
        "[data-docs-toc-scroller]"
      );
      const done = scroller ? scrollToActive(scroller) : false;

      if (!done && attempts < maxAttempts) {
        frameId = requestAnimationFrame(tryScroll);
      }
    };

    frameId = requestAnimationFrame(tryScroll);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [open]);

  return (
    <Popover
      onOpenChange={(nextOpen) => {
        if (enabled) {
          setOpen(nextOpen);
        }
      }}
      open={enabled && open}
    >
      <PopoverTrigger
        aria-label="On this page"
        className={cn(
          buttonVariants({
            color: "ghost",
            size: "icon-sm",
            className:
              "relative z-10 size-6! shrink-0 p-0! text-fd-muted-foreground transition-opacity duration-200 motion-reduce:transition-none [&_svg]:size-5!",
          }),
          enabled ? open && "text-fd-foreground" : "cursor-default opacity-35"
        )}
        disabled={!enabled}
      >
        <TocProgressRing progress={progress} />
      </PopoverTrigger>
      {enabled ? (
        <PopoverContent
          align="end"
          className="flex max-h-[min(24rem,var(--radix-popover-content-available-height))] w-72 flex-col overflow-hidden p-1 xl:hidden"
          collisionPadding={12}
          onClick={(event) => {
            if (event.target instanceof Element) {
              const anchor = event.target.closest("a");
              if (anchor) {
                const hash = anchor.hash
                  ? anchor.hash.slice(1)
                  : anchor.getAttribute("href")?.replace(HASH_PREFIX_REGEX, "");
                if (hash) {
                  setClickedId(hash);
                }
                setOpen(false);
              }
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
          }}
          ref={contentRef}
          side="bottom"
          sideOffset={8}
        >
          <PageTOCPopoverItems
            className="min-h-0 flex-1 scrollbar-thin! overflow-y-auto overscroll-contain"
            data-docs-toc-scroller=""
            variant="clerk"
          />
        </PopoverContent>
      ) : null}
    </Popover>
  );
};

/** Always-visible navbar TOC. Empty pages keep a disabled ring instead of unmounting. */
export const NavHeaderToc = () => {
  const items = useHeaderTocItems();

  return (
    <TOCProvider toc={items}>
      <div className="ms-2 flex shrink-0 items-center justify-center md:ms-3 xl:hidden">
        <HeaderTocPopover />
      </div>
    </TOCProvider>
  );
};

/** Publishes this page's TOC into the navbar chrome. Renders nothing itself. */
export const DocsHeaderToc = () => {
  const items = useTOCItems();
  usePublishHeaderToc(items);
  return null;
};
