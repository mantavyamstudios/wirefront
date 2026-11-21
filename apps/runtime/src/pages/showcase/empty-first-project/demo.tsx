// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { FirstProject } from "./view";

export function EmptyFirstProjectShowcasePage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-border/60 border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-foreground" />
            <span className="uppercase tracking-[0.2em]">Workspace</span>
            <span className="text-muted-foreground">/ mantavyam</span>
          </div>
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Day 1</div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl items-center px-6 py-16 lg:py-24">
        <FirstProject onCreateProject={() => {}} onImport={() => {}} />
      </main>
    </div>
  );
}
