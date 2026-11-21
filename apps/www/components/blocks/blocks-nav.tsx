"use client";

import {
  Sidebar001,
  Sidebar001Content,
  Sidebar001Group,
  Sidebar001Item,
  Sidebar001Section,
} from "@workspace/ui/components/sidebar-001";
import { cn } from "@workspace/ui/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import { isRecentlyReleased } from "@/lib/docs/is-recently-released";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import { BlocksNavHoverPreview } from "./blocks-nav-hover-preview";
import { blocksDesktopSidebarScrollInsetClassName } from "./blocks-preview-classes";
import { useBlocksSection } from "./blocks-section-context";
import { useBlocksHoverPreview } from "./use-blocks-hover-preview";

interface ComponentPageBlocksNavProps {
  className?: string;
  items: ComponentGalleryItem[];
  onNavigate?: () => void;
}

function isBlocksItemActive(pathname: string, item: ComponentGalleryItem) {
  return (
    pathname === item.href ||
    pathname === `/blocks/${item.slug}` ||
    pathname === `/components/${item.slug}`
  );
}

export function ComponentPageBlocksNav({
  className,
  items,
  onNavigate,
}: ComponentPageBlocksNavProps) {
  const pathname = usePathname();
  const section = useBlocksSection();
  const sortedItems = useMemo(
    () => [...items].toSorted((a, b) => a.slug.localeCompare(b.slug)),
    [items]
  );
  const {
    clearHoverPreview,
    hoverPosition,
    hoverPreview,
    onItemPointerEnter,
    onItemPointerLeave,
    onItemPointerMove,
  } = useBlocksHoverPreview(sortedItems);

  // Reset flyout when navigating to another component page.
  useEffect(() => {
    if (pathname) {
      clearHoverPreview();
    }
  }, [pathname, clearHoverPreview]);

  const isAllComponentsActive =
    pathname === section.basePath ||
    (section.basePath === "/blocks" && pathname === "/components");

  return (
    <>
      <Sidebar001
        className={cn("flex min-h-0 flex-1 flex-col bg-transparent", className)}
        defaultEffectsEnabled
        defaultWidth={320}
        maxWidth={320}
        minWidth={320}
      >
        <Sidebar001Content
          className={cn(
            "min-h-0 flex-1 px-3",
            blocksDesktopSidebarScrollInsetClassName
          )}
        >
          <Sidebar001Section>
            <Sidebar001Item
              href={section.basePath}
              isActive={isAllComponentsActive}
              itemKey="all-components"
              label={section.allLabel}
              onClick={onNavigate}
              onItemPointerLeave={onItemPointerLeave}
            />
            {section.groups
              ? null
              : sortedItems.map((item, index) => (
                  <Sidebar001Item
                    href={item.href}
                    isActive={isBlocksItemActive(pathname, item)}
                    isNew={isRecentlyReleased(item.releaseDate)}
                    itemKey={item.slug}
                    key={item.slug}
                    label={`${String(index + 1).padStart(2, "0")} ${item.title}`}
                    onClick={() => {
                      clearHoverPreview();
                      onNavigate?.();
                    }}
                    onItemPointerEnter={(event) => {
                      onItemPointerEnter(item, event);
                    }}
                    onItemPointerLeave={onItemPointerLeave}
                    onItemPointerMove={onItemPointerMove}
                  />
                ))}
          </Sidebar001Section>
          {section.groups?.map((group) => {
            const groupItems = items.filter(
              (item) => item.category === group.id
            );
            if (groupItems.length === 0) {
              return null;
            }
            return (
              <Sidebar001Group
                defaultOpen
                key={group.id}
                label={
                  <span className="flex items-center gap-2">
                    {group.title}
                    <span className="text-foreground/30 text-xs tabular-nums">
                      {groupItems.length}
                    </span>
                  </span>
                }
              >
                {groupItems.map((item) => (
                  <Sidebar001Item
                    href={item.href}
                    isActive={isBlocksItemActive(pathname, item)}
                    isNew={isRecentlyReleased(item.releaseDate)}
                    itemKey={item.slug}
                    key={item.slug}
                    label={item.title}
                    onClick={() => {
                      clearHoverPreview();
                      onNavigate?.();
                    }}
                    onItemPointerEnter={(event) => {
                      onItemPointerEnter(item, event);
                    }}
                    onItemPointerLeave={onItemPointerLeave}
                    onItemPointerMove={onItemPointerMove}
                  />
                ))}
              </Sidebar001Group>
            );
          })}
        </Sidebar001Content>
      </Sidebar001>

      <BlocksNavHoverPreview position={hoverPosition} preview={hoverPreview} />
    </>
  );
}
