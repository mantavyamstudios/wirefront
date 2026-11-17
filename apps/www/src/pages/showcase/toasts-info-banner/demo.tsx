// SPDX-License-Identifier: AGPL-3.0-only
// Wirefront © 2026 Mantavyam Studios — https://github.com/mantavyamstudios/wirefront
// Showcase only: the banner above a placeholder app.
// Not shipped by the registry; builders render SystemBanner at the top of their layout.
import * as fixtures from "./fixtures";
import { SystemBanner } from "./view";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ToastsInfoBannerShowcasePage() {
  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground">
      <SystemBanner announcement={fixtures.getAnnouncement} onDismiss={() => wait(200)} />
      {/* flex-1 instead of a fixed height: the banner's height varies once it wraps. */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-border/60 border-e bg-foreground/[0.02] p-4 max-md:hidden">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Workspace</div>
          <div className="mt-1 font-medium text-sm">Acme inc.</div>
          <ul className="mt-6 space-y-1.5 text-muted-foreground text-sm">
            <li className="text-foreground">● Home</li>
            <li>○ Inbox</li>
            <li>○ Projects</li>
            <li>○ People</li>
          </ul>
        </aside>
        <main className="p-4 sm:p-6 lg:p-10">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em]">Overview</div>
          <h1 className="mt-1 font-heading text-2xl sm:text-3xl">Welcome back</h1>
          <p className="mt-2 max-w-md text-muted-foreground text-sm">A typical landing pane sits underneath. The banner is sticky and adapts to the scroll position.</p>
          <div aria-hidden className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
            <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
            <div className="h-24 rounded-xl border border-border/60 bg-background/40" />
          </div>
        </main>
      </div>
    </div>
  );
}
