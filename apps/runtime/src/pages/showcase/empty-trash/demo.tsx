// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { EmptyTrash } from "./view";

export function EmptyTrashShowcasePage() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
          <a className="hover:text-foreground" href="#workspace">Workspace</a>
          <span aria-hidden>/</span>
          <a className="hover:text-foreground" href="#settings">Settings</a>
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-foreground">Trash</span>
        </nav>
        <EmptyTrash backHref="#projects" className="mt-6" retentionDays={30} />
      </div>
    </div>
  );
}
