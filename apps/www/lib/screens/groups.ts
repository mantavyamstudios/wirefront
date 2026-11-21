// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
/**
 * The six higher-level groups the kinds (catalogue categories) sit in.
 * A screen's address is /{group}/{kind}/{screen}. Every kind belongs to
 * exactly one group; scripts/screens-manifest.mts --check holds that.
 */
export interface ScreenGroup {
  /** Kind slugs (catalogue category slugs), in display order. */
  kinds: string[];
  meaning: string;
  slug: string;
  title: string;
}

export const SCREEN_GROUPS: ScreenGroup[] = [
  {
    slug: "shells",
    title: "Shells",
    meaning: "App frames and navigation",
    kinds: ["layouts"],
  },
  {
    slug: "accounts",
    title: "Accounts",
    meaning: "Identity, access, plan",
    kinds: ["auth", "settings", "profile", "pricing"],
  },
  {
    slug: "data",
    title: "Data",
    meaning: "Reading and slicing numbers",
    kinds: ["dashboards", "tables", "charts", "filters"],
  },
  {
    slug: "activity",
    title: "Activity",
    meaning: "Things happening over time or between people",
    kinds: ["cards", "timelines", "calendars", "threads"],
  },
  {
    slug: "interaction",
    title: "Interaction",
    meaning: "How the UI asks, confirms, warns and guides",
    kinds: ["forms", "modals", "toasts", "tours", "empty-states"],
  },
  {
    slug: "products",
    title: "Products",
    meaning: "Whole apps built from the pieces above",
    kinds: ["apps", "ai", "dev-tools", "personal", "commerce"],
  },
];
