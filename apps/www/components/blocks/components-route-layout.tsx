"use client";

import type { PageTree } from "fumadocs-core/server";
import { useSidebar } from "fumadocs-ui/provider";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { ComponentPageBlocksShell } from "@/components/blocks/blocks-shell";
import { ComponentsShell } from "@/components/blocks/components-shell";
import type { ComponentGalleryItem } from "@/lib/registry/types";

import { ComponentsGalleryLayout } from "./components-gallery-layout";

function releaseBlocksDocumentScroll() {
  document.documentElement.classList.remove("blocks-scroll-lock");
  document.body.style.removeProperty("overflow");
  delete document.documentElement.dataset.blocksMenuOpen;
}

const DEFAULT_GALLERY_PATHS = ["/screens"];

interface ComponentsRouteLayoutProps {
  children: ReactNode;
  /** Paths that render the gallery index layout. */
  galleryPaths?: string[];
  navItems: ComponentGalleryItem[];
  releaseDatesByUrl: Record<string, string>;
  tree: PageTree.Root;
}

export function ComponentsRouteLayout({
  children,
  galleryPaths = DEFAULT_GALLERY_PATHS,
  navItems,
  releaseDatesByUrl,
  tree,
}: ComponentsRouteLayoutProps) {
  const pathname = usePathname();
  const isGalleryIndex = galleryPaths.includes(pathname);
  const { setOpen: setSidebarOpen } = useSidebar();

  useEffect(
    () => () => {
      setSidebarOpen(false);
      releaseBlocksDocumentScroll();
    },
    [setSidebarOpen]
  );

  if (isGalleryIndex) {
    return (
      <ComponentsGalleryLayout
        releaseDatesByUrl={releaseDatesByUrl}
        tree={tree}
      >
        {children}
      </ComponentsGalleryLayout>
    );
  }

  return (
    <ComponentsShell>
      <ComponentPageBlocksShell navItems={navItems}>
        {children}
      </ComponentPageBlocksShell>
    </ComponentsShell>
  );
}
