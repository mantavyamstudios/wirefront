"use client";

import { createContext, useContext } from "react";

/**
 * Which catalogue the shared blocks shell (sidebar nav, breadcrumb) is
 * rendering. Defaults to Blocks, so existing `/blocks` pages need no provider.
 */
export interface BlocksSection {
  /** Sidebar "all items" label. */
  allLabel: string;
  /** Gallery index route, e.g. `/blocks`. */
  basePath: string;
  /**
   * Group the sidebar into collapsible sections, in this order, by each
   * item's `category`. Omit for a flat list (Blocks).
   */
  groups?: { id: string; title: string }[];
  /** Breadcrumb root label. */
  label: string;
}

const BLOCKS_SECTION: BlocksSection = {
  allLabel: "All Blocks",
  basePath: "/blocks",
  label: "Blocks",
};

const BlocksSectionContext = createContext<BlocksSection>(BLOCKS_SECTION);

export const BlocksSectionProvider = BlocksSectionContext.Provider;

export function useBlocksSection(): BlocksSection {
  return useContext(BlocksSectionContext);
}
