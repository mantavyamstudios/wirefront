// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
import type { CategorySlug } from "@/lib/designs";
import { readinessOf } from "@/lib/readiness";

/**
 * "Ready to wire" when the screen meets the definition of done in
 * SCREEN-CONTRACT.md (data and actions as props, states, tests); "Preview"
 * when it is still a static design.
 */
export function ReadinessBadge({ category, design }: { category: CategorySlug; design: string }) {
  const ready = readinessOf(category, design) === "ready";
  return (
    <span
      className={
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] " +
        (ready ? "bg-success/12 text-success-foreground" : "text-muted-foreground ring-1 ring-border ring-inset")
      }
      data-readiness={ready ? "ready" : "preview"}
    >
      {ready ? "Ready to wire" : "Preview"}
    </span>
  );
}
