"use client";

// Hover Expand — Unlumen UI (https://ui.unlumen.com/components/hover-expand),
// installed from its registry. Local additions, both optional: `href` (row
// links to it) and `media` (custom node revealed instead of `image`, without
// the dark overlay, keeping the label in the current text colour).

import { cn } from "@workspace/ui/lib/utils";
import { motion } from "motion/react";
import Image from "next/image";
import * as React from "react";

import Link from "@/components/site-link";

export interface HoverExpandItem {
  /** Short descriptor shown when expanded. */
  description?: string;
  /** Makes the row a link. */
  href?: string;
  /** Image revealed on hover (ignored when `media` is set). */
  image?: string;
  imageAlt?: string;
  label: string;
  /** Custom content revealed on hover instead of `image`. */
  media?: React.ReactNode;
  /** e.g. country, year, category */
  sublabel?: string;
}

export interface HoverExpandProps {
  className?: string;
  /**
   * Row height when collapsed, in pixels.
   * @default 68
   */
  collapsedHeight?: number;
  /**
   * Row height when expanded, in pixels.
   * @default 320
   */
  expandedHeight?: number;
  items: HoverExpandItem[];
}

function RowShell({
  children,
  href,
}: {
  children: React.ReactNode;
  href?: string;
}) {
  return href ? (
    <Link className="block size-full" href={href}>
      {children}
    </Link>
  ) : (
    children
  );
}

export function HoverExpand({
  items,
  collapsedHeight = 68,
  expandedHeight = 320,
  className,
}: HoverExpandProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="w-full border-t border-current opacity-15" />

      {items.map((item, i) => {
        const isHovered = hoveredIndex === i;
        const isOtherHovered = hoveredIndex !== null && !isHovered;
        const custom = item.media !== undefined;
        const onImage = isHovered && !custom;

        return (
          <React.Fragment key={item.href ?? item.label}>
            <motion.div
              animate={{
                height: isHovered ? expandedHeight : collapsedHeight,
                opacity: isOtherHovered ? 0.38 : 1,
              }}
              className={cn(
                "relative w-full overflow-hidden",
                item.href ? "cursor-pointer" : "cursor-default"
              )}
              onFocus={() => setHoveredIndex(i)}
              onHoverEnd={() => setHoveredIndex(null)}
              onHoverStart={() => setHoveredIndex(i)}
              transition={{
                height: {
                  type: "spring",
                  stiffness: 280,
                  damping: 32,
                  mass: 0.9,
                },
                opacity: { duration: 0.22, ease: "easeOut" },
              }}
            >
              <RowShell href={item.href}>
                <motion.div
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 1.06,
                  }}
                  className="absolute inset-0 h-full w-full"
                  initial={false}
                  transition={{
                    opacity: { duration: 0.45, ease: [0.23, 1, 0.32, 1] },
                    scale: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
                  }}
                >
                  {custom ? (
                    item.media
                  ) : (
                    <>
                      {item.image ? (
                        <Image
                          alt={item.imageAlt ?? ""}
                          className="object-cover"
                          fill
                          sizes="100vw"
                          src={item.image}
                          unoptimized
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
                    </>
                  )}
                </motion.div>

                <div className="pointer-events-none absolute inset-0 flex items-end px-5 pb-4">
                  <div className="flex w-full items-end justify-between gap-4">
                    <div className="flex min-w-0 items-baseline gap-3">
                      <motion.span
                        animate={{
                          color: onImage ? "#ffffff" : "currentColor",
                          opacity: onImage ? 0.5 : 0.4,
                        }}
                        className="shrink-0 text-xs tabular-nums opacity-40"
                        transition={{ duration: 0.2 }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </motion.span>

                      <motion.span
                        animate={{
                          color: onImage ? "#ffffff" : "currentColor",
                        }}
                        className="truncate font-semibold tracking-tight"
                        style={{ fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)" }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.label}
                      </motion.span>

                      {item.description ? (
                        <motion.span
                          animate={{
                            opacity: isHovered ? 1 : 0,
                            x: isHovered ? 0 : -8,
                          }}
                          className={cn(
                            "hidden truncate text-sm sm:block",
                            custom ? "text-muted-foreground" : "text-white/70"
                          )}
                          initial={{ opacity: 0, x: -8 }}
                          transition={{
                            duration: 0.3,
                            delay: isHovered ? 0.12 : 0,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                        >
                          — {item.description}
                        </motion.span>
                      ) : null}
                    </div>

                    {item.sublabel ? (
                      <motion.span
                        animate={{
                          color: onImage
                            ? "rgba(255,255,255,0.55)"
                            : "currentColor",
                          opacity: onImage ? 1 : 0.45,
                        }}
                        className="shrink-0 text-xs tracking-widest uppercase"
                        transition={{ duration: 0.2 }}
                      >
                        {item.sublabel}
                      </motion.span>
                    ) : null}
                  </div>
                </div>
              </RowShell>
            </motion.div>

            <div className="w-full border-t border-current opacity-15" />
          </React.Fragment>
        );
      })}
    </div>
  );
}
