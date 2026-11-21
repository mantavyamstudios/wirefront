// SPDX-License-Identifier: MIT
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the empty state in sample page chrome. Not shipped by the registry.
import { NoFiles } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function EmptyNoFilesShowcasePage() {
  return (
    <div className="min-h-svh bg-background px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div>
            <h1 className="font-heading text-xl">Files</h1>
            <p className="text-muted-foreground text-sm">All assets used across this project.</p>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.2em]">0 files · 0 KB</span>
        </header>
        <NoFiles accept="image/png,image/jpeg,application/pdf" onUpload={() => wait(1200)} />
      </div>
    </div>
  );
}
