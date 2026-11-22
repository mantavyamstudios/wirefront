// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the tree with sample docs and a placeholder page.
// Not shipped by the registry; builders pass their own tree and render pages as children.
import { StickyNoteIcon } from "lucide-react";
import * as fixtures from "./fixtures";
import { DocsTreeShell } from "./view";

export function SidebarsDocsTreeShowcasePage() {
  return (
    <DocsTreeShell
      activeId="events-projector"
      defaultExpanded={["getting-started"]}
      onNewPage={() => {}}
      onSearch={() => {}}
      tree={fixtures.getDocsTree}
    >
      <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-6 text-muted-foreground md:min-h-svh">
        <div className="text-center">
          <StickyNoteIcon className="mx-auto size-6 opacity-40" />
          <p className="mt-3 text-sm">Selected · Projectors</p>
        </div>
      </div>
    </DocsTreeShell>
  );
}
